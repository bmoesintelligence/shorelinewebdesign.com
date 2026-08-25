/**
 * Generates the brand images for the off-site business profiles.
 *
 *   node scripts/build-social.js
 *
 * Output goes to design/social/, NOT src/assets/. These are uploads, not page
 * assets - nothing here is ever requested by a browser visiting the site, and
 * src/assets/ is passthrough-copied, so a 1640x856 cover parked there would
 * deploy to every visitor for nothing. Same reasoning as design/logo/.
 *
 * WHY PLAYWRIGHT AND NOT SHARP+SVG
 * The site's three typefaces are self-hosted woff2 and are not installed on the
 * machine, so librsvg (what sharp uses for SVG text) would silently substitute
 * whatever font fontconfig hands it. Rendering real HTML in the same Chromium
 * the site is tuned against means the type on a cover is literally the type on
 * the site. The fonts are inlined as data URIs so there is no network or path
 * dependency at render time.
 *
 * THE COVER CROPS ARE THE WHOLE PROBLEM
 * Facebook does not show what you upload. A 1640x856 cover is scaled to width
 * on desktop (820x312 visible, so the top and bottom 116 source px are cut) and
 * scaled to height on mobile (640x360 visible, so ~59 source px are cut off
 * each side). The intersection - the middle 1522x624 - is the only region every
 * visitor sees, and the avatar sits over the bottom left. Everything that has
 * to be read lives inside SAFE (below), and previews/ renders both crops so
 * that claim can be checked rather than trusted.
 *
 * WHAT IS DELIBERATELY ABSENT: rating badges, review counts, client logos and
 * anything else that implies proof. There are no reviews yet. The same rule
 * that emptied the site's #reviews section applies harder off-site, where the
 * image travels without its context.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { chromium } = require("playwright-core");

/**
 * Everything is laid out on a DESIGN grid (the platform's nominal size, e.g.
 * 1640x856 for a Facebook cover) and rendered at 2x, then resampled down to the
 * upload size. Two separate reasons, and neither is optional:
 *
 *  1. SUPERSAMPLING. Headless Chromium rasterises text with grayscale
 *     antialiasing. Rendering at 2x and resampling with lanczos gives the type
 *     back the weight and edge definition a 1x screenshot loses.
 *
 *  2. FACEBOOK'S NOMINAL SIZE IS TOO SMALL FOR ITS OWN LAYOUT. Their published
 *     1640x856 dates from a narrower page. Measured on the live page, the cover
 *     renders about 1874px wide, so a 1640 file is UPSCALED 1.14x and then
 *     JPEG-encoded - which is exactly what soft type looks like. Uploading at
 *     2048 (Facebook's max derivative width, so nothing above it is kept) means
 *     they only ever scale down, and the resample is ours rather than theirs.
 *
 * The design grid is what SAFE and every offset are expressed in, so changing
 * an upload size below never invalidates the crop maths.
 */
const SCALE = 2;

const OUT = "design/social";
const PREV = path.join(OUT, "previews");
const FONTS = "src/assets/fonts";
const IMAGES = "src/assets/images";

// Playwright's own download, shared with the screenshot pipeline. Not a
// dependency of the site, so it is looked up rather than resolved from
// node_modules; if it is missing the script says so instead of throwing.
const CHROME = path.join(
    process.env.HOME,
    "Library/Caches/ms-playwright/chromium-1178/chrome-mac/Chromium.app/Contents/MacOS/Chromium"
);

// ── palette ──────────────────────────────────────────────────────────────────
// Straight from root.less. Two of these differ from the light-mode site on
// purpose, and both are the dark-surface values the site already uses:
// --logoWave lifts to #7ba6c9 on navy, and coral as large text on navy is
// --coralAccent's dark value #de644b. #c2452e on #1b2a38 measures 2.8:1.
const INK = "#1b2a38";
const SAND = "#e3dcc9";
const WARM = "#faf7ef";
const RAIN = "#b8c4c9";
const PUGET = "#366375";
const CORAL_ON_SAND = "#963320"; // --coralText light
const CORAL_ON_NAVY = "#de644b"; // --coralAccent dark
const WAVE_ON_SAND = "#2e4865";
const WAVE_ON_NAVY = "#7ba6c9";

const b64 = (p) => fs.readFileSync(p).toString("base64");
const font = (f) => `url(data:font/woff2;base64,${b64(path.join(FONTS, f))}) format("woff2")`;
const png = (f) => `data:image/png;base64,${b64(path.join(IMAGES, f))}`;

/**
 * The wordmark, recoloured per surface.
 *
 * logo-wordmark.svg is the literal-colour build (see scripts/build-logo.js) and
 * is the correct source for anything rasterised: no stylesheet reaches it here,
 * exactly as with the favicons and the share card. Its paths are, in order,
 * SHORELINE / WEB DESIGN / the arc / two waves, so each can be addressed
 * separately - which is what lets WEB DESIGN go coral the way it does on the
 * share card while the rest of the lockup follows the background.
 */
const WORDMARK = fs.readFileSync("src/assets/svgs/logo-wordmark.svg").toString();
const WORD_PATHS = [...WORDMARK.matchAll(/<path\b[^>]*\/>/g)].map((m) => m[0]);
const WORD_VIEWBOX = WORDMARK.match(/viewBox="([^"]+)"/)[1];

function wordmark({ type, accent, arc, waves }) {
    const fills = [type, accent, arc, waves, waves];
    const paths = WORD_PATHS.map((p, i) => p.replace(/fill="[^"]*"/, `fill="${fills[i]}"`));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WORD_VIEWBOX}" role="img" aria-label="Shoreline Web Design">${paths.join("")}</svg>`;
}

/**
 * The mark on its own - arc plus the two waves, no type.
 *
 * The bounds are MEASURED, not read off the file. The wordmark's viewBox is
 * tight to the whole lockup, so slicing three paths out of it and keeping that
 * viewBox would leave the mark floating in a mostly-empty box, off centre by
 * hundreds of units. Same alpha-bounds measurement build-logo.js does, for the
 * same reason.
 */
async function buildMark({ arc, waves }) {
    const paths = [WORD_PATHS[2], WORD_PATHS[3], WORD_PATHS[4]]
        .map((p, i) => p.replace(/fill="[^"]*"/, `fill="${i === 0 ? arc : waves}"`));
    const loose = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WORD_VIEWBOX}" width="1800">${paths.join("")}</svg>`;

    const { data, info } = await sharp(Buffer.from(loose)).ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    let x1 = Infinity, y1 = Infinity, x2 = -1, y2 = -1;
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            if (data[(y * info.width + x) * 4 + 3] > 10) {
                if (x < x1) x1 = x; if (x > x2) x2 = x;
                if (y < y1) y1 = y; if (y > y2) y2 = y;
            }
        }
    }
    const [vx, vy, vw] = WORD_VIEWBOX.split(" ").map(Number);
    const s = vw / info.width; // user units per rendered px
    const box = [vx + x1 * s, vy + y1 * s, (x2 - x1) * s, (y2 - y1) * s];
    return {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map((n) => n.toFixed(1)).join(" ")}" role="img" aria-label="Shoreline Web Design">${paths.join("")}</svg>`,
        ratio: box[2] / box[3],
    };
}

// ── shared page chrome ───────────────────────────────────────────────────────
const CSS = `
@font-face{font-family:Sora;font-weight:600;font-display:block;src:${font("sora-v17-latin-600.woff2")}}
@font-face{font-family:Sora;font-weight:700;font-display:block;src:${font("sora-v17-latin-700.woff2")}}
@font-face{font-family:Sora;font-weight:800;font-display:block;src:${font("sora-v17-latin-800.woff2")}}
@font-face{font-family:Inter;font-weight:400;font-display:block;src:${font("inter-v20-latin-regular.woff2")}}
@font-face{font-family:Inter;font-weight:500;font-display:block;src:${font("inter-v20-latin-500.woff2")}}
@font-face{font-family:"IBM Plex Mono";font-weight:500;font-display:block;src:${font("ibm-plex-mono-v20-latin-500.woff2")}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
.card{position:relative;width:100%;height:100%;overflow:hidden;display:flex}
.card svg{display:block;width:100%;height:100%}
.mark{display:block}
.wm{display:block}
.h{font-family:Sora,sans-serif;font-weight:600;letter-spacing:-.02em}
.m{font-family:"IBM Plex Mono",monospace;font-weight:500;text-transform:uppercase}
.scene{position:absolute;pointer-events:none}
.scene>img{display:block;width:100%;height:100%}
.scene .ferry{position:absolute;width:28%;height:auto}
/* Night bloom, lifted verbatim from root.less. The filter chain is a
   highlight isolator, not a blur: brightness+contrast crush everything below
   the lamps to black so the screen blend has nothing but the warm lights left
   to bloom, then blur spreads them and the trailing brightness boosts them
   back after the crush. Without the crush, screen lifts the blue water too
   and halos the whole tile. */
.bloom{position:absolute;top:0;left:0;filter:brightness(0.82) contrast(2.2) blur(104px) saturate(0.1) brightness(1.7);mix-blend-mode:screen;opacity:.9}
/* Dialled back from root.less's opacity .9. Live, this layer pulses between
   .72 and 1 and is read in motion, so a hot frame passes; held still at cover
   size it flares the hull into a yellow smear and the boat stops being a boat.
   .58 keeps the lamps spilling onto the water and leaves the deck readable. */
.ferry-bloom{filter:blur(16px) brightness(1.35) saturate(1.5);mix-blend-mode:screen;opacity:.58}
`;

/**
 * A cover's readable content must sit inside this box, in source pixels on the
 * 1640x856 canvas - the intersection of Facebook's desktop and mobile crops.
 * Everything outside it is bleed: it may or may not be shown, so it can carry
 * illustration but never a word.
 */
const SAFE = { x: 59, y: 116, w: 1522, h: 624 };
const safeCenterY = SAFE.y + SAFE.h / 2; // 428 - the true vertical centre

// ── the cards ────────────────────────────────────────────────────────────────
async function cards() {
    const markNavySurface = await buildMark({ arc: WARM, waves: WAVE_ON_NAVY });
    const markSandSurface = await buildMark({ arc: INK, waves: WAVE_ON_SAND });

    const wmOnSand = wordmark({ type: INK, accent: CORAL_ON_SAND, arc: INK, waves: WAVE_ON_SAND });
    const wmOnNavy = wordmark({ type: WARM, accent: CORAL_ON_NAVY, arc: WARM, waves: WAVE_ON_NAVY });

    const TOWNS = "Shoreline · Richmond Beach · Edmonds · Lynnwood · Seattle";

    // Place, then price. Both are true and both are on the site - the hero's
    // topper is "Richmond Beach, WA" and $150/month all-in is the offer. A cover
    // is seen by people who have never heard of the business, so it answers
    // where and how much before it says anything else.
    const STAMP = "Richmond Beach, WA &nbsp;·&nbsp; $150/month, all in";

    // THE WHOLE DIAMOND FITS INSIDE THE VISIBLE BAND. An earlier pass ran the
    // scene to 690 and let it bleed off three edges, which looked good flat but
    // wrong in place: uploaded, the desktop crop took the top vertex and the
    // ferry's bow, so the tile read as clipped rather than as a window. At 545
    // it clears the 624-tall band top and bottom, and its right edge stops
    // inside the mobile crop too, so the same complete object shows everywhere.
    //
    // Shrinking it is also what buys the type its size - the left column gains
    // most of what the scene gives up. The two scenes are different aspects
    // (1.41 day, 1.36 night), so the widths differ; anchoring by RIGHT edge
    // rather than left keeps both stopping at the same place.
    const SCENE_H = 545;
    const SCENE_RIGHT = 80; // right edge at x=1560, inside the mobile crop's 1581

    /**
     * A diorama with the ferry berthed in it.
     *
     * THE NUMBERS ARE THE SITE'S, NOT NEW ONES. On the home page the ferry sits
     * in a box spanning the scene, so its offsets are percentages of the
     * artwork; root.less sets `--hull-w: 28%` and berths the boat with
     * `translate(6%, 50%)` in the hero slip and `translate(15%, 48%)` in the
     * service-area scene. Reproducing them as left/top on a wrapper sized to
     * the scene puts the hull on exactly the water it docks against live -
     * which matters more than it looks, because the isometric axis is 31.7°
     * and a boat a few percent off the slip reads as floating over the pier
     * rather than moored at it.
     *
     * The berth is the RESTING position - what root.less shows when the
     * scroll timeline is unsupported or motion is reduced. A cover is a still,
     * so the still frame of the animation is the correct one to use.
     *
     * The night pair also carries the two bloom layers, again straight from
     * root.less: the lit windows and the ferry's own lamps are what make the
     * night render read as evening rather than as a dimmed daytime tile. Only
     * the blur radii are rescaled, since those are absolute pixels tuned
     * against the size the scene renders at on the site.
     */
    const diorama = ({ scene, w, h, ferry, berth, night, place, size = SCENE_H }) => `
      <div class="scene" style="${place};height:${size}px;aspect-ratio:${w}/${h}">
        <img src="${png(scene)}" alt="">
        ${night ? `<img class="bloom" src="${png(scene)}" alt="">` : ""}
        <img class="ferry" src="${png(ferry)}" alt=""
             style="left:${berth[0]}%;top:${berth[1]}%">
        ${night ? `<img class="ferry ferry-bloom" src="${png(ferry)}" alt=""
             style="left:${berth[0]}%;top:${berth[1]}%">` : ""}
      </div>`;

    const HERO_BERTH = [6, 50];   // root.less: #hero .cs-ferry
    const AREA_BERTH = [15, 48];  // root.less: #service-area .cs-ferry

    /**
     * Covers A and C are one layout in two palettes, so they are built from one
     * function rather than two near-copies. They were copies for exactly one
     * revision before the type sizes drifted apart.
     *
     * Type is set against the 640px column the shrunken scene leaves. The
     * headline breaks after "websites" rather than after "for" - a line ending
     * on a preposition is a dangling line, and at 54px the longer break simply
     * does not fit.
     */
    const dioramaCover = ({ bg, wm, ink, stamp, scene, w, h, ferry, night }) => `
      <div class="card" style="background:${bg}">
        ${diorama({
            scene, w, h, ferry, berth: HERO_BERTH, night,
            place: `right:${SCENE_RIGHT}px;top:${safeCenterY - SCENE_H / 2}px`,
        })}
        <div style="position:absolute;left:110px;top:${safeCenterY}px;transform:translateY(-50%);width:640px">
          <div class="wm" style="width:452px;margin-bottom:40px">${wm}</div>
          <div class="h" style="font-size:54px;line-height:1.2;color:${ink}">
            Hand-coded websites<br>for small businesses.
          </div>
          <div class="m" style="font-size:21px;letter-spacing:.06em;color:${stamp};margin-top:34px">
            ${STAMP}
          </div>
        </div>
      </div>`;

    /**
     * Profile picture. Square, but every platform that uses it - Facebook,
     * LinkedIn, Instagram, Google Business Profile - renders it as a CIRCLE,
     * and a circle inscribed in a square only contains a centred square of
     * 70.7% of the side. The mark is set at 58% so it clears that with room
     * rather than touching it; the favicon tile's 12.3% margin was measured for
     * Android's maskable crop, which is gentler than a full circle.
     *
     * Two-tone rather than the flat white of the app icon: this renders at
     * 128px and up, where the arc/wave separation reads, instead of the 16px
     * where it turns to mud.
     */
    const profile = (bg, mark) => `
      <div class="card" style="background:${bg};align-items:center;justify-content:center">
        <div class="mark" style="width:58%">${mark}</div>
      </div>`;

    return [
        // ── profile picture ──────────────────────────────────────────────────
        {
            file: "profile-1024.png", w: 1024, h: 1024, out: 1024,
            html: profile(INK, markNavySurface.svg),
        },
        {
            file: "profile-sand-1024.png", w: 1024, h: 1024, out: 1024,
            html: profile(SAND, markSandSurface.svg),
        },

        // ── cover A: warm sand, type left, day diorama bleeding right ────────
        // The diorama is the one thing on this brand nobody else has, so the
        // first concept leads with it. It sits in the bleed on purpose: it is
        // cropped differently on every device and none of the crops lose a word.
        {
            file: "facebook-cover-a.png", w: 1640, h: 856, cover: true, out: 2048,
            html: dioramaCover({
                bg: SAND, wm: wmOnSand, ink: INK, stamp: CORAL_ON_SAND,
                scene: "hero-scene.png", w: 1183, h: 841, ferry: "ferry.png",
            }),
        },

        // ── cover B: navy band, typographic, centred ─────────────────────────
        // The safe option. No illustration to survive a crop, reads at 200px
        // wide in a search result, and is the closest thing to the share card
        // so a link preview and the page header look like one brand.
        {
            file: "facebook-cover-b.png", w: 1640, h: 856, cover: true, out: 2048,
            html: `
              <div class="card" style="background:${INK};align-items:center;justify-content:center">
                <div style="position:absolute;left:0;right:0;top:${safeCenterY}px;transform:translateY(-50%);text-align:center">
                  <div class="wm" style="width:600px;margin:0 auto 44px">${wmOnNavy}</div>
                  <div class="h" style="font-size:46px;line-height:1.25;color:${WARM}">
                    Hand-coded websites for small businesses.
                  </div>
                  <div class="m" style="font-size:19px;letter-spacing:.14em;color:${RAIN};margin-top:38px">
                    ${TOWNS}
                  </div>
                </div>
              </div>`,
        },

        // ── cover C: navy, type left, NIGHT diorama right ────────────────────
        // The night renders exist because the site has a dark mode, and they are
        // the only version of the scene that can sit on navy without a seam -
        // the day scene's warm ground would need a panel behind it.
        {
            file: "facebook-cover-c.png", w: 1640, h: 856, cover: true, out: 2048,
            html: dioramaCover({
                bg: INK, wm: wmOnNavy, ink: WARM, stamp: CORAL_ON_NAVY,
                scene: "hero-scene-night.png", w: 1200, h: 883,
                ferry: "ferry-night.png", night: true,
            }),
        },

        // ── LinkedIn company banner ──────────────────────────────────────────
        // 1128x191 is a 5.9:1 letterbox. A stacked lockup does not fit, so this
        // is the one place the wordmark sits beside a line rather than above it.
        {
            file: "linkedin-cover.png", w: 1128, h: 191,
            html: `
              <div class="card" style="background:${INK};align-items:center;padding:0 64px;gap:44px">
                <div class="wm" style="width:300px;flex:none">${wmOnNavy}</div>
                <div style="width:1px;height:64px;background:rgba(250,247,239,.18);flex:none"></div>
                <div>
                  <div class="h" style="font-size:26px;color:${WARM};line-height:1.3">Hand-coded websites for small businesses.</div>
                  <div class="m" style="font-size:13px;letter-spacing:.14em;color:${RAIN};margin-top:9px">${TOWNS}</div>
                </div>
              </div>`,
        },

        // ── Google Business Profile cover ────────────────────────────────────
        // 1024x576. Google crops this to a dozen shapes across Maps and Search
        // and gives no safe-area spec, so the content is kept well inside and
        // the illustration takes the edges.
        {
            file: "gbp-cover.png", w: 1024, h: 576,
            html: `
              <div class="card" style="background:${SAND}">
                ${diorama({
                    scene: "service-area-scene.png", w: 1115, h: 783,
                    ferry: "ferry.png", berth: AREA_BERTH,
                    place: "right:-40px;bottom:-70px", size: 464,
                })}
                <div style="position:absolute;left:78px;top:50%;transform:translateY(-50%);width:520px">
                  <div class="wm" style="width:330px;margin-bottom:28px">${wmOnSand}</div>
                  <div class="h" style="font-size:34px;line-height:1.25;color:${INK}">
                    Hand-coded websites for<br>small businesses.
                  </div>
                  <!-- Price only, no town. This canvas is 1024 wide and the full
                       stamp ran under the diorama's water, where coral on blue is
                       unreadable. Google already states the service area next to
                       the photo, so the location is the half that can go. -->
                  <div class="m" style="font-size:14px;letter-spacing:.07em;color:${CORAL_ON_SAND};margin-top:22px">
                    $150/month, all in
                  </div>
                </div>
              </div>`,
        },
    ];
}

// ── render ───────────────────────────────────────────────────────────────────
(async () => {
    if (!fs.existsSync(CHROME)) {
        console.error(`Chromium not found at:\n  ${CHROME}\nRun: npx playwright install chromium`);
        process.exit(1);
    }
    fs.mkdirSync(OUT, { recursive: true });
    fs.mkdirSync(PREV, { recursive: true });

    const list = await cards();
    const browser = await chromium.launch({ executablePath: CHROME });
    const written = [];

    for (const c of list) {
        const page = await browser.newPage({
            viewport: { width: c.w, height: c.h },
            deviceScaleFactor: SCALE,
        });
        await page.setContent(`<style>${CSS}</style>${c.html}`, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready); // else Sora renders as fallback
        const buf = await page.screenshot({ type: "png" });

        // Resampled from the 2x render, never from the design grid. lanczos3 is
        // sharp's sharpest kernel and the one worth having on type.
        const outW = c.out || c.w * SCALE;
        const outH = Math.round((outW * c.h) / c.w);
        await sharp(buf).resize(outW, outH, { kernel: "lanczos3" })
            .png({ compressionLevel: 9 }).toFile(path.join(OUT, c.file));
        written.push([c.file, `${outW}x${outH}`, fs.statSync(path.join(OUT, c.file)).size]);
        await page.close();

        // ── prove the crops, don't assume them ───────────────────────────────
        // Desktop scales to width and keeps the middle 624 source rows; mobile
        // scales to height and keeps the middle 1522 columns. Rendering both is
        // the only way to know a headline survives.
        if (c.cover) {
            const stem = c.file.replace(/\.png$/, "");
            const k = outW / c.w; // design grid -> upload pixels
            const px = (n) => Math.round(n * k);
            await sharp(path.join(OUT, c.file))
                .extract({ left: 0, top: px(SAFE.y), width: outW, height: px(SAFE.h) })
                .resize(820, 312).png().toFile(path.join(PREV, `${stem}-desktop.png`));
            await sharp(path.join(OUT, c.file))
                .extract({ left: px(SAFE.x), top: 0, width: outW - px(SAFE.x) * 2, height: outH })
                .resize(640, 360).png().toFile(path.join(PREV, `${stem}-mobile.png`));
        }
    }

    await browser.close();
    for (const [f, dim, bytes] of written) {
        console.log(`  ${f.padEnd(26)}${dim.padEnd(12)}${(bytes / 1024).toFixed(1)} KB`);
    }
    console.log(`\n  crop previews in ${PREV}/`);
})();
