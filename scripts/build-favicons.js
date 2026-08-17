/**
 * Generates the whole favicon set from Bryan's icon SVGs.
 *
 *   node scripts/build-favicons.js
 *
 * Sources (design/logo/), and why each is used where:
 *
 *   swd_icon_black_blue.svg      transparent, two-tone. Used for the tab icons
 *                                (favicon.svg, favicon.ico, favicon-96x96.png).
 *                                Transparent so it sits on whatever chrome the
 *                                browser paints, light or dark.
 *
 *   swd_logo_white_black_bg.svg  light mark on a solid tile. Used for
 *                                apple-touch-icon and the two manifest icons.
 *                                iOS composites the touch icon onto a tile and
 *                                a transparent one renders as a black box, so
 *                                it MUST be opaque.
 *
 *                                The manifest declares purpose:"maskable",
 *                                which lets Android crop to a circle or
 *                                squircle. That needs the content inside the
 *                                middle ~80%. Measured: this variant has a
 *                                12.3% margin and survives; the tan variant has
 *                                1.5% and would lose its outer ring, which is
 *                                why it is not used here.
 *
 * Colour normalisation: the exports use pure `black` and pure `white`. Both are
 * remapped to the site's tokens - inkNavy #1b2a38 and the warm off-white
 * #faf7ef - so the tab icon matches the site rather than sitting slightly
 * colder than everything around it.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = "design/logo";
const OUT = "src/assets/favicons";

const INK = "#1b2a38";
const WARM = "#faf7ef";

const load = (file, swaps) => {
    let s = fs.readFileSync(path.join(SRC, file)).toString();
    for (const [from, to] of swaps) s = s.replaceAll(from, to);
    return Buffer.from(s);
};

/**
 * Minimal .ico writer. sharp cannot emit ICO, and the format is simple enough
 * to build directly: a 6-byte header, one 16-byte directory entry per image,
 * then the image payloads. Modern .ico allows PNG payloads rather than raw DIBs,
 * which every browser since IE11 reads, so that is what this embeds.
 */
function buildIco(pngs) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);            // reserved
    header.writeUInt16LE(1, 2);            // 1 = icon
    header.writeUInt16LE(pngs.length, 4);  // image count

    const dir = [];
    let offset = 6 + pngs.length * 16;
    for (const { size, data } of pngs) {
        const e = Buffer.alloc(16);
        e.writeUInt8(size >= 256 ? 0 : size, 0);  // 0 means 256
        e.writeUInt8(size >= 256 ? 0 : size, 1);
        e.writeUInt8(0, 2);                       // palette count
        e.writeUInt8(0, 3);                       // reserved
        e.writeUInt16LE(1, 4);                    // colour planes
        e.writeUInt16LE(32, 6);                   // bits per pixel
        e.writeUInt32LE(data.length, 8);
        e.writeUInt32LE(offset, 12);
        offset += data.length;
        dir.push(e);
    }
    return Buffer.concat([header, ...dir, ...pngs.map((p) => p.data)]);
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });

    const tab = load("swd_icon_black_blue.svg", [['fill="black"', `fill="${INK}"`]]);
    const tile = load("swd_logo_white_black_bg.svg", [
        ['fill="black"', `fill="${INK}"`],
        ['fill="white"', `fill="${WARM}"`],
    ]);

    const written = [];
    const note = (f) => written.push([f, fs.statSync(path.join(OUT, f)).size]);

    // ── scalable tab icon, theme-adaptive ────────────────────────────────────
    // A flat navy mark on a transparent background all but disappears against a
    // dark browser tab strip, which is now a common default. Browsers honour
    // prefers-color-scheme INSIDE an SVG favicon, so the fills are swapped for
    // classes and the dark rule lightens them. Firefox, Chrome and Safari all
    // read this; anything that doesn't falls back to favicon.ico, which stays
    // navy - acceptable, since browsers old enough to lack SVG favicon support
    // also tend to have light chrome.
    const adaptive = tab.toString()
        .replace(new RegExp(`fill="${INK}"`, "g"), 'class="ink"')
        .replace(/fill="#2E4865"/gi, 'class="wave"')
        .replace(/<svg([^>]*)>/, `<svg$1>
  <style>
    .ink  { fill: ${INK}; }
    .wave { fill: #2e4865; }
    @media (prefers-color-scheme: dark) {
      .ink  { fill: ${WARM}; }
      .wave { fill: #7ba6c9; }
    }
  </style>`);
    fs.writeFileSync(path.join(OUT, "favicon.svg"), adaptive);
    note("favicon.svg");

    // ── raster tab icons, each rendered from the vector, never downscaled ────
    const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
    for (const size of [96]) {
        await sharp(tab).resize(size, size, { fit: "contain", background: transparent })
            .png({ compressionLevel: 9 }).toFile(path.join(OUT, `favicon-${size}x${size}.png`));
        note(`favicon-${size}x${size}.png`);
    }

    // ── favicon.ico: 16 / 32 / 48 in one container ───────────────────────────
    const icoParts = [];
    for (const size of [16, 32, 48]) {
        const data = await sharp(tab)
            .resize(size, size, { fit: "contain", background: transparent })
            .png({ compressionLevel: 9 }).toBuffer();
        icoParts.push({ size, data });
    }
    fs.writeFileSync(path.join(OUT, "favicon.ico"), buildIco(icoParts));
    note("favicon.ico");

    // ── opaque tiles ─────────────────────────────────────────────────────────
    // flatten() guarantees no alpha survives; iOS renders a transparent touch
    // icon as a solid black square.
    for (const [file, size] of [
        ["apple-touch-icon.png", 180],
        ["web-app-manifest-192x192.png", 192],
        ["web-app-manifest-512x512.png", 512],
    ]) {
        await sharp(tile).resize(size, size, { fit: "contain", background: INK })
            .flatten({ background: INK })
            .png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
        note(file);
    }

    for (const [f, bytes] of written) {
        console.log(`  ${f.padEnd(30)}${(bytes / 1024).toFixed(1)} KB`);
    }
})();
