/**
 * Encoder settings for the Sharp Images plugin, in ONE place.
 *
 * Used as `{% getUrl "..." | resize({...}) | avif(codec.avif) %}`.
 *
 * WHY THIS FILE EXISTS
 * The plugin takes no global quality option - it only has urlPath, outputDir,
 * cacheStrategy and autoRotate. Quality is an argument to the per-call-site
 * filter, so without somewhere central to keep it, the number would have to be
 * typed at all 40-odd `| avif` calls and would drift the first time one was
 * added. `src/config/plugins/images.js` is NOT the place for it; that object is
 * passed to the plugin, which would ignore a `quality` key silently.
 *
 * WHY 55 / EFFORT 6, MEASURED NOT GUESSED
 * The plugin's default is avif quality 75, effort 4, which produced files
 * BIGGER than the webp fallback at every width - and `<source type="image/avif">`
 * is listed first, so every browser that supports avif was downloading the
 * larger of the two files. Measured against the real source images at the real
 * rendered widths, comparing bytes and visible error (RMSE after compositing
 * onto the warm sand, since raw RGB under transparent pixels is undefined and
 * makes the codecs look further apart than they are):
 *
 *   hero-scene @1183   webp q80 138.5 KB / 4.38     avif q75 162.9 KB / 2.36
 *                                                   avif q55  85.9 KB / 3.66
 *   hero-scene @640    webp q80  55.6 KB / 4.77     avif q55  38.9 KB / 3.63
 *   headshot @800      webp q80  22.2 KB / 1.84     avif q55  13.6 KB / 1.77
 *   van-dusen @900     webp q80  23.1 KB / 1.90     avif q55  15.8 KB / 1.85
 *
 * 55 is the floor, not a round number: at q50 the photo and screenshot cases
 * cross over and become visibly WORSE than the webp fallback they are supposed
 * to improve on, which would make serving avif first actively wrong. At 55
 * every case is both smaller and cleaner than webp.
 *
 * Effort 6 rather than the default 4 buys a few more percent for build time
 * only. That is nearly free here: netlify.toml caches `.cache` and
 * `public/assets/images`, so encoding runs on changed images, not every deploy.
 *
 * WEBP IS DELIBERATELY LEFT ALONE at the plugin's q80/e4. It is the fallback
 * for browsers without avif (and the numbers above show it is a reasonable
 * one); re-tuning it would change bytes for the minority while adding a second
 * variable to any future measurement.
 */
module.exports = {
    avif: { quality: 55, effort: 6 },
};
