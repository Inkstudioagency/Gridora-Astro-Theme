# Gridora — AI Technology Astro Theme

Gridora is a modern AI technology theme for startups, automation tools and SaaS
platforms. It ships a marketing home page, an about page, a features page, a
contact page, a style guide, 404 and password pages, and two CMS-driven detail
templates for features and case studies.

Built with **Astro 7**. No UI framework and no build-time CSS pipeline — the
design ships as plain CSS, so the whole site is static HTML.

## Getting started

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview
```

The theme builds and runs out of the box. Content for the two collections comes
from the JSON snapshot in `src/data/`, so no CMS is required to develop or
deploy it.

## Project structure

```text
src/
├── components/     # Header, Footer, feature + case-study cards and collections
├── data/           # site.ts (site-wide meta) and the CMS content snapshot
├── layouts/
│   └── Layout.astro   # <head>, page chrome and the script stack
├── lib/
│   └── content.ts  # the only place pages read content from
├── pages/
│   ├── index.astro, about.astro, features.astro, contact.astro
│   ├── style-guide.astro, 404.astro, password.astro
│   ├── features/[slug].astro    # feature detail
│   └── portfolio/[slug].astro   # case-study detail
└── styles/
    ├── normalize.css, gridora-base.css, gridora-theme.css, vendor-lenis.css
    └── page-*.css               # per-page critical CSS
public/
├── images/         # theme images; images/cms/ holds the collection media
└── js/
    ├── vendor/                  # jQuery, GSAP + SplitText + ScrollTrigger, Lenis
    ├── gridora-interactions.js  # scroll and hover interaction runtime
    ├── gridora-animations.js    # title, button and counter animations
    └── gridora-lenis.js         # smooth scrolling, driven by the GSAP ticker
cms/                # optional Strapi backend - not needed to run the theme
```

Stylesheets are imported by `Layout.astro`, so Astro bundles and hashes them
into a single `/_astro/*.css` file. Every script is self-hosted; the only
third-party request is the Google Fonts stylesheet.

## Customising

| What | Where |
| --- | --- |
| Site title, description, share image | `src/data/site.ts` |
| Navigation and footer links | `src/components/Header.astro`, `src/components/Footer.astro` |
| Colours, type scale, spacing | `src/styles/gridora-theme.css` |
| Static section copy | the relevant file in `src/pages/` |
| Feature / case-study content | Strapi, or `src/data/*.json` |

Adding a page is a new `.astro` file in `src/pages/` that renders `Layout`.

## Content: Strapi (optional)

The two collections — **Features** and **Portfolio** — can be served from
Strapi. `src/lib/content.ts` fetches them at build time and silently falls back
to `src/data/*.json` whenever Strapi is not configured or not reachable, so a
missing CMS never breaks the build.

To connect one, copy `.env.example` to `.env`:

```sh
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your-read-only-api-token
```

A ready-to-run Strapi project with both content types, a seed script and the
Strapi MCP server enabled lives in [`cms/`](cms). See its README for setup.

## The password page

`/password` is a design template, not real protection. A static site cannot
check a password, so submitting the form just shows the error state. To actually
protect a page, use your host's access control (Netlify, Vercel and Cloudflare
Pages all provide one) or point the form at your own endpoint.

## Animations

`Layout.astro` loads the scripts in a fixed order: jQuery, GSAP and its plugins,
Lenis, then the interaction runtime and the animation setup. Keep that order —
GSAP has to exist before `gridora-animations.js` and `gridora-lenis.js` run.

Two details are easy to break when editing:

- Lenis is driven by `gsap.ticker` and pushes every scroll into
  `ScrollTrigger.update()`. Giving Lenis its own `requestAnimationFrame` loop
  desynchronises the two, and triggers below the fold stop firing while you
  scroll (they only appear after a reload).
- `gridora-animations.js` calls `ScrollTrigger.refresh()` after the fonts load,
  after each lazy image loads and whenever the body resizes. Without it, the
  growing page height leaves later triggers measured against a stale layout.

## Credits

Mona Sans is loaded from Google Fonts. Scroll and text animations use GSAP
(with SplitText and ScrollTrigger) and Lenis, all self-hosted in
`public/js/vendor/`.
