/**
 * The site's own Lighthouse scores, in ONE place.
 *
 * Read by the home page's #speed scorecard. Nothing else consumes it yet.
 *
 * WHY THIS FILE EXISTS
 * #speed used to print three hand-typed figures in circles: "95+ pagespeed",
 * "<1s load time", "100% hand-coded". The first was a hedge (95+ on WHAT? the
 * real mobile score was 94, so the claim was arguably false), the second was
 * already made verbatim two sections above by #services card 02, and the third
 * is not a performance number at all. The section's own copy says "you can
 * check them yourself", so the numbers have to be the real ones, and real
 * numbers go stale. Keeping them here means a re-measurement is one edit in one
 * file rather than four hand-typed spans in the markup.
 *
 * ⚠ HOW TO UPDATE, AND WHEN
 * Re-run after anything that could move a score: a new section, a new image, a
 * font change, a script. Two ways:
 *
 *   1. pagespeed.web.dev, paste the home URL, run BOTH tabs (mobile/desktop).
 *   2. curl the API (no key needed, but the shared anonymous quota runs out):
 *      https://www.googleapis.com/pagespeedonline/v5/runPagespeed
 *        ?url=https%3A%2F%2Fwww.shorelinewebdesign.com%2F&strategy=mobile
 *        &category=performance&category=accessibility
 *        &category=best-practices&category=seo
 *
 * Then edit `measured` AND `measuredLabel` together, or the page prints new
 * numbers under an old date, which is worse than printing nothing.
 *
 * ⚠ MEASURE THE LIVE SITE, NOT A LOCAL BUILD. The scorecard is a claim about
 * what a visitor actually gets over the network from Netlify's CDN. A local
 * `npm run preview` has no CDN, no real latency and no compression negotiation,
 * and it scores higher for reasons the visitor never benefits from.
 *
 * ⚠ ONLY RECORD WHAT WAS ACTUALLY RUN. The four values below are the mobile
 * strategy, which is the harder of the two and the one most of this site's
 * visitors are (see #services card 01). `desktopPerformance` is a single number
 * on purpose: at the last measurement only the desktop PERFORMANCE score was
 * written down, so that is all the page is allowed to say about desktop. If a
 * future run captures all four, add them and widen the footnote then — do not
 * assume desktop matches mobile on the other three.
 *
 * ⚠ RE-MEASURED 2026-09-29, from Bryan's own PSI run on the live site after the
 * homepage redesign shipped. The launch-week figures (2026-08-13) were mobile
 * 94/95/100/100 and desktop 100; the page had been printing those through the
 * waterline nav, the wave dividers, the text-rise headings, the #services proof
 * trays and the homepage crossfade, and was understating itself by then -
 * mobile performance had gone 94 -> 95 and accessibility 95 -> 97.
 *
 * ⚠ THE MOBILE/DESKTOP SPLIT BELOW IS READ FROM TWO SCREENSHOTS, not from a
 * labelled API response - the anonymous PSI quota was exhausted, so the run
 * could not be repeated here. Both tabs reported accessibility 97, best
 * practices 100 and SEO 100; only performance differed, 95 against 100. The 95
 * is recorded as MOBILE and the 100 as desktop, because desktop scores at or
 * above mobile essentially always and that is how the launch-week pair fell.
 *
 * If that is backwards the page merely understates itself, which is the correct
 * direction for a number a visitor is invited to check. Swap them on the next
 * run that captures the tab labels.
 */

/* ⚠ TWO KEYS BELOW ARE NO LONGER RENDERED, as of 2026-09-25.
 * `measuredLabel` and `desktopPerformance` were printed by a provenance line
 * under the scorecard ("Google Lighthouse, mobile · measured 13 Aug 2026 ·
 * desktop scores 100 for performance"). Bryan replaced that line with the
 * five build facts, so the four scores are now UNDATED on the page.
 *
 * They are kept here rather than deleted because they are still the record of
 * WHEN and AGAINST WHAT the live numbers were taken, which is what you need in
 * order to know whether they are stale - and because restoring the line is then
 * a markup change only. Keep updating them on a re-measure.
 */

module.exports = {
    // ISO, for anyone diffing this file
    measured: "2026-09-29",
    // Not currently printed — see the note above. Keep it in step with `measured`.
    measuredLabel: "29 Sep 2026",

    /* PSI strategy=mobile. The `arc` on each gauge ring IS this number, so the
       ring can never disagree with the figure printed inside it. */
    mobile: {
        performance: 95,
        accessibility: 97,
        bestPractices: 100,
        seo: 100,
    },

    // PSI strategy=desktop, performance only — see the warning above.
    desktopPerformance: 100,

};
