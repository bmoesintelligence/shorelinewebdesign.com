/**
 * Generates the whole favicon set from Bryan's icon SVGs.
 *
 *   node scripts/build-favicons.js
 *
 * TWO sources, because the tab and the app icons have incompatible constraints.
 *
 *   TAB ICONS  favicon.svg, favicon.ico, favicon-96x96.png
 *              from swd_icon_black_blue.svg - transparent, no tile, recoloured.
 *
 *   APP ICONS  apple-touch-icon.png, web-app-manifest-{192,512}.png
 *              from swd_logo_white_black_bg.svg - opaque navy tile.
 *
 * Why they can't share artwork:
 *
 *   A tab icon sits directly on browser chrome, which may be white or near
 *   black, and the brand navy #1b2a38 measures 14.6:1 against white but 1.10:1
 *   against Chrome's #202124 - invisible. A tile fixes that but reads heavy in
 *   a dark tab, so the tab icons stay transparent and are recoloured instead
 *   (see the note above `tab` below).
 *
 *   App icons cannot be transparent at all. iOS composites the touch icon onto
 *   its own tile and renders a transparent one as a solid black square, and
 *   site.webmanifest declares purpose:"maskable", so Android crops to a circle
 *   or squircle and needs both opacity and a safe margin. Measured: the
 *   white-on-navy variant leaves a 12.3% margin and survives the crop; the
 *   tan-background variant leaves 1.5% and would lose its outer ring, which is
 *   why that one is unused.
 *
 * Everything is rendered from vector at each size, never downscaled from a
 * larger raster.
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

    // ── the tab icon: transparent, and LIFTED off the brand navy ─────────────
    // Colours here are not the logo's. They can't be: measured against a white
    // tab strip and Chrome's dark one (#202124), the brand navy #1b2a38 scores
    // 14.6:1 and 1.10:1 - invisible in dark Chrome. The wave blue #2E4865 only
    // reaches 1.71:1. Lifting to #3f6c9b / #6b98c2 clears 3:1 on BOTH, which is
    // the minimum for a non-text graphic, while keeping the two-tone depth of
    // Bryan's artwork.
    //
    // A tile was tried first and works, but reads heavy in a dark tab. This is
    // the trade: a slightly off-brand blue that is always legible, versus exact
    // brand colour that vanishes for every dark-mode user.
    //
    // The viewBox is also tightened to the artwork (the export has padding), so
    // the mark fills the 16-32px box instead of floating in it.
    const tab = Buffer.from(
        fs.readFileSync(path.join(SRC, "swd_icon_black_blue.svg")).toString()
            .replace(/viewBox="[^"]*"/, 'viewBox="7.6 32.15 154.7 154.7"')
            .replace(/width="\d+"\s+height="\d+"/, "")
            .replaceAll('fill="black"', 'fill="#3f6c9b"')
            .replace(/fill="#2E4865"/gi, 'fill="#6b98c2"')
    );

    // ── the tile: only where opacity is REQUIRED ─────────────────────────────
    // iOS composites the touch icon onto its own tile, so a transparent one
    // renders as a solid black square. The manifest icons declare
    // purpose:"maskable", so they get cropped to a circle or squircle and need
    // both opacity and a safe margin.
    const tile = load("swd_logo_white_black_bg.svg", [
        ['fill="black"', `fill="${INK}"`],
        ['fill="white"', `fill="${WARM}"`],
    ]);

    const written = [];
    const note = (f) => written.push([f, fs.statSync(path.join(OUT, f)).size]);

    // ── scalable tab icon ────────────────────────────────────────────────────
    // Worth knowing if you ever try to make this theme-adaptive: a
    // prefers-color-scheme block inside favicon.svg does NOT work in Chrome.
    // Two reasons, both verified in a real browser:
    //
    //   1. Chrome never loads favicon.svg here. favicon-96x96.png is declared
    //      first in base.html and a size-matched raster wins over a vector.
    //   2. Chrome's support for prefers-color-scheme inside a favicon is
    //      unreliable anyway. Firefox honours it; Chrome largely does not.
    //
    // Recolouring for contrast, as done above, is the approach that actually
    // survives contact with a browser.
    fs.writeFileSync(path.join(OUT, "favicon.svg"), tab);
    note("favicon.svg");

    // ── raster tab icons, each rendered from the vector, never downscaled ────
    const clear = { r: 0, g: 0, b: 0, alpha: 0 };
    for (const size of [96]) {
        await sharp(tab).resize(size, size, { fit: "contain", background: clear })
            .png({ compressionLevel: 9 }).toFile(path.join(OUT, `favicon-${size}x${size}.png`));
        note(`favicon-${size}x${size}.png`);
    }

    // ── favicon.ico: 16 / 32 / 48 in one container ───────────────────────────
    const icoParts = [];
    for (const size of [16, 32, 48]) {
        const data = await sharp(tab)
            .resize(size, size, { fit: "contain", background: clear })
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
