# shorelinewebdesign.com

Source for **[shorelinewebdesign.com](https://www.shorelinewebdesign.com)** — the site for
Shoreline Web Design, a one-person web shop building sites for small businesses around
Richmond Beach, Edmonds and the North Seattle area.

The site sells hand-coded, static websites, so it is built that way itself. No page builder,
no theme, no client-side framework. This repository is public because the claim should be
checkable.

## Stack

| | |
|---|---|
| **[Eleventy](https://www.11ty.dev)** | static site generator, Nunjucks templating |
| **LESS** | hand-written styles, compiled by a build event in `.eleventy.js` |
| **esbuild** | JS bundling and minification |
| **[Decap CMS](https://decapcms.org)** | git-backed editing for the blog, at `/admin/` |
| **[Netlify](https://www.netlify.com)** | build and hosting; forms handle the contact pages |

No runtime JavaScript framework. The JS that ships is a handful of small progressive
enhancements — navigation, an FAQ accordion, a theme toggle, a table-of-contents builder for
long-form pages.

## Running it locally

```bash
npm install
npm start          # dev server with hot reload
npm run build      # production build, minified, into public/
npm run preview    # production build, then serve it
```

`npx decap-server` alongside `npm start` runs the CMS against local files with no login.

## How it is laid out

```
src/
├── _data/          global data (client details, service area)
├── _includes/      layouts, shared sections, components
├── assets/
│   ├── less/       root.less (tokens, base, nav) + per-page sheets
│   ├── js/         one file per behaviour, auto-bundled
│   ├── fonts/      self-hosted woff2
│   └── images/
├── content/        pages and blog posts
└── admin/          Decap CMS config
```

`public/` is generated and gitignored. Edit `src/`.

Styles are split so each page loads only what it needs: `root.less` everywhere,
`critical.less` for the home page hero, then a per-page sheet. The three service pages share
one stylesheet rather than duplicating it.

## Notes on the build

- **Images** go through the Sharp plugin via a `getUrl` shortcode, which emits avif/webp/jpeg
  at the size each image actually renders. Flat-colour logos stay PNG, since lossy codecs
  smear hard edges.
- **Fonts** are self-hosted woff2, with only the two that render above the fold preloaded.
- **Structured data** is generated once in `components/schema.html` and included site-wide, so
  a new page cannot forget it. It is built from Nunjucks objects serialised with `| dump`
  rather than hand-written JSON, because hand-written JSON silently breaks when an optional
  field is absent and leaves a trailing comma.
- **Dark mode** is a toggle, remembered in `localStorage`. It deliberately does not follow the
  OS.
- **Scroll-driven animation** on the home page uses CSS `view()` timelines, so it costs no
  JavaScript.

18 pages. Every font, icon and script is served from the same origin, so **a visitor who
declines analytics makes no third-party requests at all and is sent no cookies.**

Google Analytics is **consent-gated, and the gate is real**: `gtag` appears in no page's
head. `assets/js/consent.js` injects it only after a visitor accepts, so declining means
Google is never contacted. The whole thing is switched by one field in `_data/client.js` —
empty means no banner, no script, no cookie. A pleasant side effect is that Lighthouse never
accepts, so audits measure the site as it is for anyone who says no.

(`/admin/` loads Decap from a CDN, but that route is for the site's own editing and is not
part of any visitor page.)

## Credit

Built on the **[CodeStitch Intermediate Website Kit (LESS)](https://github.com/CodeStitchOfficial/Intermediate-Website-Kit-LESS)**,
which supplied the Eleventy, LESS and Decap CMS scaffolding this started from. The kit is
CC0. Its history was squashed into this repository's initial commit rather than carried in,
so the commit log reflects this site's development rather than the kit's — but the
foundation is CodeStitch's work, and the layout, build pipeline and tooling choices here owe
a great deal to it.

Design, copy, illustration and everything after that first commit are mine.

## Licence

© Bryan Moore. All rights reserved.

Published so the "hand-coded" claim can be verified, not as a template. Please don't
redistribute it or ship it as your own. If something here is useful to you, ask — the answer
will usually be yes.
