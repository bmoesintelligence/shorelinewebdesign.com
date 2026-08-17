/**
 * Generates the whole favicon set from Bryan's icon SVGs.
 *
 *   node scripts/build-favicons.js
 *
 * EVERY output comes from one source: design/logo/swd_logo_white_black_bg.svg,
 * the light mark on a solid tile. One artwork for the tab icon, the iOS touch
 * icon and the manifest icons, so the brand is identical everywhere it appears.
 *
 * Three separate constraints all pointed at the tile, and each was measured
 * rather than assumed:
 *
 *   1. CHROME'S DARK TAB STRIP. The transparent two-tone variant
 *      (swd_icon_black_blue.svg) is the prettier icon and was tried first, but
 *      #1b2a38 on #202124 is very nearly invisible. Rendering it against both
 *      chrome colours at 32px made that immediate.
 *
 *   2. iOS COMPOSITES THE TOUCH ICON onto a tile of its own, so a transparent
 *      one renders as a solid black square. It must be opaque regardless.
 *
 *   3. MASKABLE CROPPING. site.webmanifest declares purpose:"maskable", which
 *      lets Android crop to a circle or squircle, so the content has to sit
 *      inside the middle ~80%. Measured: this variant has a 12.3% margin and
 *      survives; the tan-background variant has 1.5% and would lose its outer
 *      ring, which is why it is not used.
 *
 * The tan tile (swd_logo_black_tan_bg.svg) also reads fine on both chromes and
 * is a one-line swap here if the navy ever feels too heavy in a tab - but it
 * would need padding added before it could serve as a maskable icon.
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

    // swd_icon_black_blue.svg (transparent, two-tone) is deliberately NOT used -
    // see the note on favicon.svg below for why the tile won.
    const tile = load("swd_logo_white_black_bg.svg", [
        ['fill="black"', `fill="${INK}"`],
        ['fill="white"', `fill="${WARM}"`],
    ]);

    const written = [];
    const note = (f) => written.push([f, fs.statSync(path.join(OUT, f)).size]);

    // ── scalable tab icon ────────────────────────────────────────────────────
    // The TILE, not the transparent mark.
    //
    // The transparent navy version was tried first and fails in the real world:
    // against Chrome's dark tab strip (#202124) a #1b2a38 mark is very nearly
    // invisible. The obvious fix - prefers-color-scheme inside the SVG - does
    // not save it either, for two compounding reasons:
    //
    //   1. Chrome picks favicon-96x96.png over favicon.svg, because a
    //      size-matched raster wins over a vector. The SVG is never consulted.
    //   2. Chrome's support for prefers-color-scheme inside a favicon is
    //      unreliable regardless. Firefox honours it; Chrome largely does not.
    //
    // A tile sidesteps all of it by carrying its own contrast rather than
    // borrowing the browser's, and it makes every icon in the set - tab,
    // touch icon, manifest - the same artwork. Verified against both a white
    // and a #202124 tab strip at 32px.
    fs.writeFileSync(path.join(OUT, "favicon.svg"), tile);
    note("favicon.svg");

    // ── raster tab icons, each rendered from the vector, never downscaled ────
    for (const size of [96]) {
        await sharp(tile).resize(size, size, { fit: "contain", background: INK })
            .flatten({ background: INK })
            .png({ compressionLevel: 9 }).toFile(path.join(OUT, `favicon-${size}x${size}.png`));
        note(`favicon-${size}x${size}.png`);
    }

    // ── favicon.ico: 16 / 32 / 48 in one container ───────────────────────────
    const icoParts = [];
    for (const size of [16, 32, 48]) {
        const data = await sharp(tile)
            .resize(size, size, { fit: "contain", background: INK })
            .flatten({ background: INK })
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
