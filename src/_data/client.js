/**
 * Site-wide client details.
 *
 * `domain` is the important one: it drives the canonical tag and og:url in
 * layouts/base.html, the hostname on every sitemap.xml entry, and the Sitemap
 * line in robots.txt. It was the CodeStitch default (`https://www.example.com`)
 * until 2026-08-03, which meant all 16 URLs told Google their real home was
 * someone else's domain.
 *
 * WWW, NOT APEX, per ~/.claude/playbooks/website-launch.md ("pick the primary
 * host, usually www; the apex 301-redirects to it"). This has to match the
 * primary domain set in Netlify. If the two disagree, every canonical points at
 * a URL that 301s, which is worse than the placeholder was. Change both or
 * neither. On Netlify www is also the sturdier choice: the apex needs an A
 * record to a fixed IP, www is a CNAME that follows their infrastructure.
 *
 * Deliberately absent: phone, street address, zip, map link, socials. Shoreline
 * is one person working from home, so there is no business address to publish
 * and publishing a home one would be a bad idea. The only consumer of those
 * fields was the kit's home-schema.html, now replaced by
 * components/schema.html, which never emits a street address at all. For structured data this is a
 * service-area business: use `areaServed`, not a `PostalAddress` street.
 */ 
module.exports = {
    name: "Shoreline Web Design",

    // LIVE as of 2026-08-13. Porkbun email forwarding, hello@ -> the personal
    // Gmail. Verified in DNS: MX points at fwd1/fwd2.porkbun.com and there is an
    // SPF record (`include:_spf.porkbun.com`), which is what keeps forwarded mail
    // out of spam. It is FORWARDING, not a mailbox - replies come from the
    // personal address unless a send-as identity is set up in Gmail.
    email: "hello@shorelinewebdesign.com",

    // Not a mailing address - just the locality used in page titles
    // ("Work | Shoreline Web Design | Richmond Beach, WA") and later in the
    // LocalBusiness structured data.
    address: {
        city: "Richmond Beach",
        state: "WA",
        country: "US",
    },

    //! Include the protocol (https://) and NO trailing slash.
    domain: "https://www.shorelinewebdesign.com",

    // Analytics. Same guard discipline as `socials` below: an EMPTY STRING EMITS
    // NOTHING - no gtag script, no consent banner, no cookie. So this file is the
    // single switch, and there is never a placeholder ID sitting in the markup.
    //
    // ga4 is the Measurement ID from Google Analytics > Admin > Data Streams, in
    // the form "G-XXXXXXXXXX". Paste it and analytics turns on everywhere.
    //
    // ⚠ TURNING THIS ON IS NOT JUST A SCRIPT. GA4 sets cookies and sends Google
    // the visitor's IP, pages viewed and rough location, so it comes with:
    //   - the consent banner (components/consent.html + assets/js/consent.js),
    //     which is what actually loads gtag - nothing fires before Accept;
    //   - /privacy-policy/, which must describe it. That page's own header
    //     comment says it: a privacy policy that is merely out of date is a
    //     false statement about what you do with people's information.
    //   - README.md, which claims the public site makes no third-party requests
    //     and sets no cookies. True today; false the moment someone accepts.
    // All of those were updated in the same commit that added this field.
    analytics: {
        ga4: "G-YJDDSNZ9R6",
    },

    // Social / listing profiles. The footer renders an icon for each entry that
    // has a URL, and components/schema.html feeds the same list into the
    // business's `sameAs`, which is how Google ties this site to those profiles.
    //
    // ONLY FILL IN A PROFILE THAT EXISTS AND WILL BE KEPT ALIVE. An empty string
    // renders nothing at all, which is deliberate: a dead profile with three
    // connections and no activity undercuts the "this is a real business" pitch
    // more than an absent one does. Two live profiles beat five abandoned ones.
    //
    // Recommended order of setup:
    //   1. google    - Google Business Profile. Highest value by a distance:
    //                  it's the map pack, it's free, it's where REVIEWS live
    //                  (which is also the fix for having no testimonials), and
    //                  /services/seo/ sells GBP setup as a deliverable. Register
    //                  as a SERVICE-AREA business so the home address stays
    //                  private. Paste the profile's public URL here.
    //   2. linkedin  - where the "professional software engineer" credential
    //                  becomes verifiable rather than a claim on our own site.
    //   3. ONE of instagram / facebook, not both. Facebook for the Shoreline and
    //                  Richmond Beach neighbourhood groups; Instagram to show
    //                  before/afters of the free redesigns.
    //   4. github    - credibility for the "hand-coded, no page builder" claim,
    //                  but only if the profile is CURATED. A dentist in Edmonds
    //                  will never click it; a technical buyer will, and a wall
    //                  of abandoned repos argues against you.
    //   5. x         - lowest value on this list for a LOCAL service business.
    //                  Reach for small accounts is poor and the buyers aren't
    //                  there. Only worth it if you already post.
    //
    // Considered and deliberately NOT included: Nextdoor and Yelp. Both are
    // listing/review sites rather than social profiles, so this stays one kind
    // of thing. If either is ever wanted, note that Yelp's burst mark is in the
    // git history of components/socials.html but the Nextdoor one was only an
    // approximation - use their real brand asset, not a generic house glyph.
    socials: {
        // Google Business Profile, created 2026-08-03.
        //
        // `/g/11zdcz3557` is the KNOWLEDGE GRAPH ID - Google's permanent
        // identifier for this business as an entity. It is the stable part of
        // the URL and the reason this form is used instead of the share.google
        // short link that the Share button hands out: no redirect hop, on
        // google.com, and it can't rot.
        //
        // The URL copied out of the address bar also carried session tracking
        // (shem / shndl / kgs / utm_source). Those were stripped - they are
        // per-visit noise and have no business in a `sameAs` claim.
        google: "https://www.google.com/search?kgmid=/g/11zdcz3557",

        // GitHub profile, added 2026-08-13. Real and live. Backs the
        // "hand-coded, no page builder" claim - the repos are the receipts.
        github: "https://github.com/bmoesintelligence",

        // Unset profiles cost nothing while empty - the icon, the <li> and the
        // `sameAs` entry are each guarded, so an unset profile emits no markup
        // anywhere. NEVER park a placeholder URL here: these render as real
        // footer links AND as `sameAs` claims in the structured data, so a
        // dummy value is an outbound dead link on all 17 pages and a false
        // statement to Google about which profiles are this business.
        // (example.com placeholders sat here until 2026-08-13 and were doing
        // exactly that.) See the ordering note above for which to create next.

        // Decided 2026-08-13:
        //   linkedin  - PERSONAL profile, not a Company Page. The credential
        //               being verified is Bryan's, and a one-person shop's
        //               Company Page with single-digit followers is weaker
        //               proof than a real career history. Link Shoreline from
        //               the profile's Experience section instead.
        //   facebook  - CHOSEN over Instagram. The Shoreline / Richmond Beach
        //               neighbourhood groups are where the buyers actually
        //               are; Instagram needs a stream of before/afters that
        //               won't exist until the free-redesign gallery has work
        //               in it. Revisit then - but still only ONE of the two.
        //   instagram - deliberately not created. See above.
        //   x         - deliberately skipped. Lowest value on this list for a
        //               local service business: poor organic reach for small
        //               accounts and the buyers aren't on it.
        // Personal profile, added 2026-08-13. NO trailing slash - the `/` form
        // 301s and the bare form is a 200, and a `sameAs` should name the
        // destination rather than a redirect to it (same reasoning as the
        // stripped tracking params on the Google URL above).
        linkedin: "https://www.linkedin.com/in/bryanallenmoore",

        // Page (not a personal profile), created 2026-08-13. Verified public to
        // a logged-out crawler - og:title is "Shoreline Web Design" and the
        // og:description matches the site's own positioning.
        //
        // `shorelinewebdesign` was taken, hence the `wa` suffix. Keep the `www.`
        // form: the bare facebook.com host 301s to it.
        //
        // NO ADDRESS AND NO HOURS on this Page, deliberately. Facebook couples
        // opening hours to a physical address, and this is a service-area
        // business run from home - the same reason `address.street`, `phone` and
        // the map link are absent from this file and the GBP is registered as
        // service-area. A Page address is public, renders on a map, and is
        // scraped into data brokers within weeks, which is not undone by
        // deleting it later. Hours live as plain text in the Page bio instead.
        // Don't trade the address for a Page feature; none of them are worth it.
        facebook: "https://www.facebook.com/shorelinewebdesignwa",

        instagram: "",
        x: "",
    },

    // Passing the isProduction variable for use in HTML templates
    isProduction: process.env.ELEVENTY_ENV === "PROD",
};
