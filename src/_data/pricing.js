/**
 * What the work costs, in ONE place.
 *
 * WHY THIS FILE EXISTS
 * The two prices were hard-coded in 20 places across 6 files. CLAUDE.md's own
 * note on the last change reads "17 references were swept" and, for the hourly
 * rate, "both carry it so they can't diverge; change both together" - which is
 * a process fix for a structural problem, and processes are what fail at 11pm
 * eighteen months from now. The move from $100 to $150 on 2026-08-04 was a
 * manual sweep of every one of them. This is the same fix lighthouse.js is for
 * the Lighthouse scores: the number lives once, and a page that quotes it
 * cannot disagree with a page that quotes it.
 *
 * ⚠ A WRONG PRICE ON A PAGE IS NOT A TYPO, it is a quoted figure a prospect can
 * hold you to. That is the reason this is worth a data file and, say, the
 * town list is not.
 *
 * HOW TO CHANGE THE PRICE
 * Edit MONTHLY or HOURLY below. Everything derived updates with it. Then read
 * the two lists at the bottom of this comment, because they are NOT derived.
 *
 * ⚠ FOUR LITERALS ARE LEFT ON PURPOSE. Nothing here reaches them.
 *
 *   1. src/content/pages/web-design.html   - the `faqs:` answer "What does a
 *      website cost?"
 *   2. src/content/pages/free-redesign.html - the `faqs:` answer "What does it
 *      cost to have it built?"
 *
 *      Both are YAML front matter, which Eleventy does not run through
 *      Nunjucks, so `{{ pricing.x }}` in there would render as literal braces
 *      on the page. They could be moved into eleventyComputed, but `faqs:` is
 *      the single source for BOTH the visible accordion AND the FAQPage
 *      structured data on those pages, and relocating that block to interpolate
 *      one number each risks the schema for very little. Sweep them by hand.
 *
 *   3. src/content/pages/terms.html  - inside the scaffold's comment block
 *   4. src/content/pages/pricing.html - two dev comments
 *
 *      These are NOTES, not copy. #3 in particular records "set 2026-08-04" and
 *      is a history, so templating it would actively destroy what it is for.
 *      Leave them alone.
 *
 * ⚠ THE FEATURE LISTS ARE DELIBERATELY NOT HERE. The home teaser prints five
 * short items and /pricing/#tiers prints six longer ones - teaser versus
 * expanded, not a copy that drifted. Pulling them into one list would force
 * them to be the same thing, which is the opposite of what they are. Only the
 * prices are shared facts.
 *
 * ⚠ "ALL IN" IS LOAD-BEARING AND IT IS NOT A ROUNDING. Washington has charged
 * retail sales tax on custom website development since 1 Oct 2025. The client
 * pays MONTHLY and the tax comes out of it rather than being added at checkout,
 * which costs roughly $14 per client per month and is what makes the phrase
 * literally true. Do not add "+ tax" anywhere without changing /pricing/ first,
 * and see the WA tax note in CLAUDE.md before touching it.
 */

/* The two numbers. Everything below is derived from these. */
const MONTHLY = 150;
const HOURLY = 125;

module.exports = {
    // raw, for anything that needs to compute rather than print
    monthly: MONTHLY,
    hourly: HOURLY,

    /* The forms the copy actually uses. Four shapes, because the same price is
       a headline figure in a card, a rate in a sentence and a phrase in a meta
       description, and jamming one string into all three reads badly in at
       least two of them. */

    // "$150" — the bare figure, for the big card price beside a /mo span
    price: `$${MONTHLY}`,
    // "$150/month" — meta descriptions
    perMonth: `$${MONTHLY}/month`,
    // "$150 a month" — running prose
    aMonth: `$${MONTHLY} a month`,
    // "$125/hr" — the one-time tier's support rate
    hourlyRate: `$${HOURLY}/hr`,
};
