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

    // NOTE: this mailbox does not exist yet. The nav, the footer and the footer
    // CTA all already advertise it, so set up free email forwarding at Porkbun
    // (hello@ -> personal inbox) before launch, or anyone who writes in bounces.
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
    socials: {
        google: "",
        linkedin: "",
        instagram: "",
        facebook: "",
    },

    // Passing the isProduction variable for use in HTML templates
    isProduction: process.env.ELEVENTY_ENV === "PROD",
};
