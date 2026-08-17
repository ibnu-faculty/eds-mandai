# Re:Nue Homepage — AEM Edge Delivery Services (EDS) blocks

> ## ⚠️ Ported into eds-mandai — read this first
>
> This document is the **original README of the standalone `renue-eds`
> project**, kept for its block-by-block notes and design-token provenance.
> Everything below describes that project's own layout. The code now lives in
> this Mandai repo, and the merge changed the following. Where the two
> disagree, this box wins.
>
> **Blocks are namespaced `renue-*`.** Mandai already had `header`, `footer`,
> and `hero` blocks, so every Re:Nue block was renamed to keep both brands
> side by side:
>
> | was | now |
> | --- | --- |
> | `accordion` | `renue-accordion` |
> | `cta` | `renue-cta` |
> | `footer` | `renue-footer` |
> | `header` | `renue-header` |
> | `hero` | `renue-hero` |
> | `pillar` | `renue-pillar` |
> | `signup-form` | `renue-signup-form` |
> | `stats` | `renue-stats` |
>
> **The three child blocks no longer exist as blocks.** `accordion-item`,
> `hero-slide`, and `stat-item` had their own `blocks/` folders in the original
> project, and the containers looked for them with
> `querySelectorAll(':scope > .hero-slide')`. That does not work: a repeatable
> child declared with the `core/franklin/components/block/v1/block/item`
> resource type is rendered by xwalk as a **plain row inside the parent block,
> with no class of its own**. The original selectors therefore matched nothing,
> the child JS never ran, and Hero/Stats/Accordion rendered with no items.
>
> They now follow this repo's convention (see
> `blocks/feature-carousel/feature-carousel.js`): the item logic lives in the
> parent as a `buildSlide(row)` / `buildStat(row)` / `buildItem(row)` function,
> the item CSS was merged into the parent's stylesheet, the child folders were
> deleted, and `moveInstrumentation()` carries the `data-aue-*` attributes onto
> the generated elements so every field stays click-to-edit. The item
> *definitions and models* remain in the parent's `_renue-*.json` — Universal
> Editor needs them to offer "Re:Nue Hero Slide" etc. as addable children.
>
> **The markup contract**, verified against real authored output:
>
> ```html
> <div class="renue-hero">
>   <div><div>autoplayInterval</div></div>                 <!-- container field: one row each -->
>   <div><div>img</div><div>eyebrow</div><div>heading</div><div>cta</div></div>  <!-- one item -->
>   <div><div>img</div><div>eyebrow</div><div>heading</div><div>cta</div></div>  <!-- one item -->
> </div>
> ```
>
> A block's own fields are **one row each**; a repeatable item is **one row with
> one cell per field**. `drafts/renue-homepage.html` documents this and is the
> fixture to test against — the original project's fixture used classed child
> divs, which is why the blocks looked correct locally but rendered empty in
> Universal Editor.
>
> CSS class names were renamed to match, so the BEM roots are now the block
> names: `.site-header__*` → `.renue-header__*`, `.hero-masthead__*` →
> `.renue-hero__*`, `.values-accordion__*` → `.renue-accordion__*`,
> `.cta-banner__*` → `.renue-cta__*`, `.pillar-banner__*` →
> `.renue-pillar__*`, `.stats-banner__*` → `.renue-stats__*`,
> `.community-signup__*` → `.renue-signup-form__*`. The shared `.btn` is now
> `.renue-btn` (`.renue-btn--white` / `.renue-btn--dark`), and `.sr-only` is
> `.renue-sr-only`.
>
> **`renue-header` and `renue-footer` are in-page blocks, not site chrome.**
> The `<header>` and `<footer>` elements on every page belong to Mandai's own
> `blocks/header` and `blocks/footer`. The Re:Nue versions are authorable
> blocks you place inside a section in `main`. Their Experience Fragment path
> falls back to the brand-scoped page metadata **`renue-nav`** / **`renue-footer`**
> (not the bare `nav` / `footer` keys, which are Mandai's) and then to
> `/xf/header` / `/xf/footer`.
>
> **Design tokens are namespaced and loaded on demand.** Every custom property
> is now `--renue-*`, and they live in `styles/renue-styles.css` together with
> `.renue-btn`. That file plus `styles/renue-fonts.css` is loaded by
> `loadRenueTheme()` from the block JS, so a Mandai page with no Re:Nue block
> never downloads them. Mandai's `styles/styles.css`, `styles/fonts.css`,
> `head.html`, and `scripts/scripts.js` were **not** modified — Re:Nue's own
> global reset, `body` typography, and section/block-status rules were dropped
> because Mandai's `styles.css` already owns them. `renue-fonts.css` maps the
> `Renue Poppins` family onto the Poppins `.woff2` files this repo already
> ships; no font files were added.
>
> **`scripts/aem.js` was not touched.** Two helpers the Re:Nue blocks relied
> on do not exist in this repo's newer `aem.js`, so they were ported into
> **`scripts/renue.js`** instead: `optimizePicture()` (rewrites an existing
> `<picture>` in place) and `loadPlainFragment()` (fetches a fragment *without*
> the block decoration that `blocks/fragment/fragment.js` always applies).
>
> **The `cta` / `ctaText` model fields are now a collapsible pair.** Re:Nue's
> models used `ctaText` + `ctaLink`, which trips `xwalk/no-orphan-collapsible-fields`
> and inflated the cell count. They are now `cta` (the `aem-content` link) +
> `ctaText`, matching this repo's convention — which means they render as **one
> cell** holding `<a href>Label</a>`, and the block JS reads the label off the
> anchor. `announcementText` → `announcement` and `consentText` → `consent` for
> the same reason. `renue-pillar` and `renue-signup-form` legitimately need 5
> cells and are listed in the `xwalk/max-cells` overrides in `.eslintrc.js`.
>
> **Files moved:** `xf/*.plain.html` → `drafts/xf/`; `preview/homepage-fixture.html`
> → `drafts/renue-homepage.html` (rewritten for the changes above — serve with
> `npx -y @adobe/aem-cli up --html-folder drafts` and open
> `/drafts/renue-homepage`); `assets/img/` → `assets/renue/img/`;
> `preview/*.png` → `docs/renue/`. The old `tools/build-json.js` was **not**
> ported — this repo aggregates block models with `npm run build:json`
> (`merge-json-cli` over `models/_component-*.json`), which globs
> `blocks/*/_*.json` and therefore picks up the Re:Nue partials automatically.
>
> **Not addressed by the port:** the Re:Nue models have no image `alt` fields,
> and `.renue-accordion__title`, `.renue-footer__brand`,
> `.renue-footer__copyright`, `.renue-pillar__content` and
> `.renue-signup-form__content` are emitted but unstyled. Both gaps exist in
> the original project too.

Universal Editor / AEM Sites-authored EDS implementation of the Re:Nue
Homepage. Content is authored through AEM Sites component dialogs (Universal
Editor), **not** document-based (Word/Google Docs) authoring — every block
below has a `_<name>.json` model that becomes its dialog fields once built
into `component-models.json`.

Scope: **Homepage only.** "Thrift with us – Our stores", "Donate" and
"Legal" pages are intentionally not built yet.

This project is the EDS/Universal-Editor twin of the static component
library in `../renue-project/` — see "Mapping to the static build" at the
bottom for how each block corresponds to that HTML/CSS.

## 1. Project structure

```
renue-eds/
├── blocks/                  one folder per block: <name>.js, <name>.css, _<name>.json
├── scripts/
│   ├── aem.js               core EDS helpers (buildBlock, decorateBlocks, loadBlock,
│   │                        loadFragment, optimizePicture, loadSections, ...)
│   ├── scripts.js           page bootstrap (loadEager → loadLazy → loadDelayed)
│   └── delayed.js           non-critical, delayed work
├── styles/
│   ├── styles.css           design tokens + global reset + section/block rules
│   ├── fonts.css            @font-face declarations
│   └── lazy-styles.css      non-critical CSS loaded in loadLazy
├── xf/
│   ├── header.plain.html    Experience Fragment reference content — header/nav
│   └── footer.plain.html    Experience Fragment reference content — footer
├── tools/
│   └── build-json.js        merges every block's _<name>.json into the 3 root files
├── component-definition.json   ← generated by build-json.js (component picker)
├── component-models.json       ← generated by build-json.js (dialog fields)
├── component-filters.json      ← generated by build-json.js (allowed children)
├── head.html
├── assets/img/              placeholder images
└── preview/                 local-only fixture + verification screenshots
```

Whenever a block's `_<name>.json` changes, regenerate the three root JSON
files:

```
node tools/build-json.js
```

## 2. Block markup convention

Every block, once authored in Universal Editor and rendered by AEM, comes
down to the standard EDS block table shape:

```
<div class="section">
  <div class="BLOCKNAME">
    <div><div>field 1 value</div></div>
    <div><div>field 2 value</div></div>
    ...
  </div>
</div>
```

- The outer `<div class="section">` is a page section (unchanged EDS
  convention).
- The block `<div class="BLOCKNAME">` is a **direct child** of the section
  — `scripts/aem.js`'s `decorateBlocks()` looks for exactly this
  (`div.section > div`), not one level deeper.
- Each row (`<div>`) is one field, **in the exact order** the block's
  `_<name>.json` lists them. A block's `decorate(block)` function destructures
  `block.children` positionally, so field order must not change without also
  updating the JS.
- Container blocks (`stats`, `accordion`) additionally contain repeatable
  child blocks as extra direct-child `<div>`s carrying their own class name
  (`renue-stat-item`, `renue-accordion-item`) — see §4.

`preview/homepage-fixture.html` is a complete worked example of this markup
for the whole Homepage (header through footer) and is the fastest way to see
the contract for every block at once. It is a local-only test fixture, not
part of the deployed site.

## 3. Component dialogs (Universal Editor field reference)

This is the field-by-field authoring reference per block — the equivalent of
an AEM classic `cq:dialog.xml`, expressed as this block's contribution to
`component-models.json`.

### header
| Field | Type | Required | Notes |
|---|---|---|---|
| xfPath | aem-content (path picker) | | Path to the header Experience Fragment, e.g. `/content/dam/renue/xf/header`. See §5. |
| announcementText | text | | Text shown in the dismissible announcement bar above the nav. |

### footer
| Field | Type | Required | Notes |
|---|---|---|---|
| xfPath | aem-content (path picker) | | Path to the footer Experience Fragment. See §5. |

### hero (container) + renue-hero-slide (repeatable child)
Hero is a **carousel container** — see §4 for the container/child pattern
and §10 for where the carousel mechanics came from.

`hero` fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| autoplayInterval | number | | Milliseconds between auto-advance; `0` or empty disables autoplay (recommended default). |

`renue-hero-slide` fields (one instance per slide):
| Field | Type | Required | Notes |
|---|---|---|---|
| image | reference (image picker) | | Slide background image. |
| eyebrow | text | | Small label above the heading, e.g. "re:nue®". |
| heading | text | ✓ | Headline, e.g. "Give. Thrift. Uplift." |
| ctaText | text | | Button label, e.g. "Donate your items". |
| ctaLink | aem-content (path picker) | | Button destination. |

Only **one** `renue-hero-slide` is confirmed content today (from Figma). Authoring
a second `renue-hero-slide` automatically turns on the prev/next buttons and
pagination dots — no code change needed; `hero.js` checks the slide count at
render time. The first slide's heading renders as an `<h1>`; every
subsequent slide uses `<h2>` so a multi-slide hero never produces more than
one `<h1>` on the page.

Allowed children filter: `hero` only accepts `renue-hero-slide` children.

### stats (container) + renue-stat-item (repeatable child)
`stats` fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| copy | richtext | | Description paragraph next to the stat list. |
| ctaText | text | | Button label, e.g. "About Re:Nue". |
| ctaLink | aem-content (path picker) | | Button destination. |

`renue-stat-item` fields (one instance per stat tile):
| Field | Type | Required | Notes |
|---|---|---|---|
| icon | text | | Emoji or icon token, e.g. `:store:`. |
| label | text | ✓ | e.g. "Stores". |
| value | number | ✓ | Numeric value the counter animates up to, e.g. `10000`. |
| suffix | text | | e.g. "+". |

Allowed children filter (`component-filters.json`): `stats` only accepts
`renue-stat-item` children.

### pillar
| Field | Type | Required | Notes |
|---|---|---|---|
| eyebrow | text | | e.g. "Re:Nue pillars:". |
| heading | text | ✓ | e.g. "Store". |
| copy | richtext | | Body paragraph. |
| ctaText | text | | Button label, e.g. "Donate your items". |
| ctaLink | aem-content (path picker) | | Button destination. |
| image | reference (image picker) | | Supporting image. |

### accordion (container) + renue-accordion-item (repeatable child)
`accordion` fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| heading | text | ✓ | e.g. "Our values". |
| subheading | text | | e.g. "Guiding principles behind everything we do". |

`renue-accordion-item` fields (one instance per value):
| Field | Type | Required | Notes |
|---|---|---|---|
| accentColor | select (Blue / Red / Gold) | | Controls the icon accent color. |
| title | text | ✓ | e.g. "Purposeful". |
| body | richtext | | Expanded body copy. |
| openByDefault | boolean | | Only one item should be `true`; the block enforces single-open behavior at runtime regardless. |

Allowed children filter: `accordion` only accepts `renue-accordion-item` children.

### cta
| Field | Type | Required | Notes |
|---|---|---|---|
| image | reference (image picker) | | Full-bleed background image. |
| heading | text | ✓ | e.g. "Questions on your mind?" |
| ctaText | text | | Button label, e.g. "See our FAQs". |
| ctaLink | aem-content (path picker) | | Button destination. |

### signup-form
| Field | Type | Required | Notes |
|---|---|---|---|
| image | reference (image picker) | | Side image. |
| heading | text | ✓ | e.g. "Be part of the community". |
| copy | richtext | | Intro paragraph. |
| consentText | richtext | | Legal/consent copy shown next to the checkbox; falls back to the default Salvation Army Data Protection Policy text if left empty. |
| submitLabel | text | | Button label; defaults to "Join now" if empty. |

Note: the actual input fields (full name, email/mobile radio, contact value,
consent checkbox) are **not** author-editable — they're fixed product
requirements hardcoded in `signup-form.js`. The submit handler currently only
logs `FormData` to the console (`// TODO: wire to the real CRM endpoint`) —
swap in the real HubSpot (or equivalent) integration before launch.

## 4. Container / child component pattern

`stats`/`renue-stat-item`, `accordion`/`renue-accordion-item`, and `hero`/`renue-hero-slide`
all follow the same pattern, used wherever the design has a repeatable inner
component inside a fixed outer shell:

1. The container's own fields (e.g. `stats.copy`, `stats.ctaText`) are
   authored as the container block's own rows, in field order, same as any
   other block.
2. Each repeatable entry is authored as a **child component** — a nested
   block placed inside the container in Universal Editor. It shows up in the
   DOM as an extra direct-child `<div class="renue-stat-item">` (or
   `renue-accordion-item`) inside the container block, carrying its own rows in
   its own field order.
3. `component-filters.json` restricts what can be dropped inside the
   container (`stats` → only `renue-stat-item`, `accordion` → only
   `renue-accordion-item`).
4. **Important implementation detail:** the generic top-level
   `decorateBlocks()` scan in `scripts/aem.js` only decorates direct
   children of a `.section` — it never reaches a block nested inside another
   block. So each container's own `decorate()` (`stats.js`, `accordion.js`)
   explicitly imports `decorateBlock`/`loadBlock` from `scripts/aem.js` and
   calls them on its own child elements before folding them into the final
   markup. If you add a new container/child pair, copy this pattern —
   forgetting it means the child's CSS/JS silently never loads.
5. Child blocks (`renue-stat-item.js`, `renue-accordion-item.js`) are otherwise normal
   blocks: same field-order contract, own CSS file, own `decorate(block)`
   export. They're marked in `tools/build-json.js`'s `CHILD_ONLY` set so
   they're excluded from the top-level "add a new section" component
   picker — they should only ever be inserted inside their parent
   container.

## 5. Experience Fragment wiring (header/footer) — fully dynamic, no hardcoded fallback

Per project requirement, header and footer content is **not** hardcoded
anywhere in the block code — it's sourced live from an AEM Experience
Fragment (XF) so both can be edited once in Author and reflected everywhere.
There is deliberately **no** baked-in fallback markup: if the fetch fails,
the block renders empty and logs a console error, rather than quietly
substituting old hardcoded copy that could drift out of sync with the real
XF content.

**Path resolution**, in order:
1. The block's own authored `xfPath` field (`aem-content` path picker), e.g.
   `/content/dam/renue/xf/header`.
2. Page-level metadata — `<meta name="nav" content="...">` for the header,
   `<meta name="footer" content="...">` for the footer — the same
   convention `aem-block-collection`'s header/footer blocks use, letting a
   whole site (or a whole page template, combined with §7's
   `decorateTemplateAndTheme`) share one XF path without authoring it on
   every single page's Header/Footer component instance.
3. A project default (`/xf/header`, `/xf/footer`) so local preview and early
   development work before either of the above is set up.

**Fetch + decorate contract:** both blocks call the shared `loadFragment()`
helper in `scripts/aem.js` (adapted from `aem-block-collection`'s
`blocks/fragment/fragment.js`):

```js
const fragment = await loadFragment(xfPath);
if (fragment) navBar.append(...fragment.childNodes);
```

`loadFragment()` fetches `${xfPath}.plain.html` — EDS serves any AEM path's
plain content at `<path>.plain.html`, the same contract used for regular
pages — then, unlike a plain `innerHTML` swap, it **recursively decorates
and loads any blocks the fragment itself contains**. This matters because a
real Experience Fragment authored in Universal Editor can itself be built
out of block components (e.g. a "social-links" block dropped inside the
footer XF); without this, that block would sit inert in the DOM instead of
rendering. It also rebases any `./media_...`-relative asset paths the
fragment's own images use, so they resolve correctly once inlined into a
page fetched from a different path.

One caveat, and it's why footer.js explicitly opts out
(`loadFragment(xfPath, { decorateContent: false })`): the recursive
decoration treats any direct-child `<div>` as a candidate block-table
section. That's correct for real Universal Editor block content, but the
footer's own layout (`.renue-footer__top`, `.renue-footer__col`, etc. in
`xf/footer.plain.html`) uses bare `<div>`s purely for CSS layout, not as
authored blocks — running the decoration pass on it would misidentify those
layout divs as blocks and attempt (and fail) to `import()` a nonexistent
`/blocks/renue-footer__top/...` module. The header's XF content doesn't hit
this (its top-level elements are `<a>`/`<button>`/`<nav>`, not `<div>`), so
it uses the default (`decorateContent: true`). If the footer XF is ever
redesigned to genuinely hold nested block content, flip that flag back on.

`xf/header.plain.html` and `xf/footer.plain.html` in this repo are reference
copies of the fragment content — for local preview and as a content
reference for whoever authors the real XFs in AEM Author. They are **not**
read from disk in production; production fetches from the real
Author-published XF path.

To wire this to a real AEM Author instance: create the two Experience
Fragments under `/content/experience-fragments/renue/...` (or wherever your
project convention places them) using the content in
`xf/header.plain.html` / `xf/footer.plain.html` as the starting point, then
either set each block's `xfPath` field to the fragment's path in Universal
Editor, or set the page-level `nav`/`footer` metadata once for the whole
site.

## 6. Image optimization

`optimizePicture()` in `scripts/aem.js` (adapted from
`aem-block-collection`'s `createOptimizedPicture`) rewrites a block's
`<picture>` to request responsive, webp-first sources from AEM's image
delivery service (`?width=&format=&optimize=medium` query convention) —
used in `renue-hero-slide`, `pillar`, `cta`, and `signup-form` wherever they
handle an authored image.

It's implemented as an **in-place mutation** rather than the original
helper's node-replacement approach: every block in this project moves the
author's original field elements (including the `<img>`) into its final
markup specifically so Universal Editor's `data-aue-*` instrumentation
survives and the image stays click-to-edit in the author UI (see the
"DOM-node-preservation" note repeated in each block's `decorate()`).
Replacing the `<picture>`/`<img>` nodes outright, as the original helper
does, would silently break that. `optimizePicture()` instead adds/rewrites
`<source>` children and the `<img>` `src` on the same node, so authorability
is unaffected.

## 7. Section loading + page templates

Two more patterns adapted from `aem-block-collection`'s core `scripts/aem.js`
(see §10):

- **Section-level hide-until-loaded.** `decorateSections()` now hides each
  section (`display: none`) as soon as it's tagged, and `loadSection()` /
  `loadSections()` reveal a section only once every block inside it has
  finished loading. This replaced a flatter "load every block on the page in
  one pass" approach, and avoids blocks popping in one at a time inside an
  already-visible section, or a slow block further down the page holding up
  sections above it. The Hero's section is a special case: it's revealed
  as soon as `waitForLCP()` resolves in `loadEager()`, since that's the LCP
  candidate and shouldn't wait on `loadLazy()`'s general pass.
- **`decorateTemplateAndTheme()`** reads `<meta name="template">` /
  `<meta name="theme">` page metadata and adds the corresponding classes to
  `<body>` (the fixture sets `<meta name="template" content="homepage">`,
  producing `body.homepage`). Not exercised by any block today — it's the
  mechanism to reach for once "Thrift with us – Our stores", "Donate", and
  "Legal" need page-type-specific CSS without forking block code.

## 8. Local verification

`preview/homepage-fixture.html` is a hand-authored stand-in for what
Universal Editor / AEM would render pre-decoration, using the exact markup
contract from §2. It's used purely to exercise the real
`scripts/scripts.js` → `scripts/aem.js` → block JS/CSS pipeline end-to-end
without a live AEM Author instance. To run it locally:

```
python3 -m http.server 8000
# open http://localhost:8000/preview/homepage-fixture.html
```

`preview/eds-preview-desktop.png` and `preview/eds-preview-mobile.png`
are verified screenshots of this fixture (desktop and 390px-wide mobile),
confirming the full pipeline — dynamically-fetched header/footer (no
hardcoded fallback), a working two-slide hero carousel (prev/next + dot
indicators, verified by scripting a click and confirming the active slide
advanced), responsive/webp `<picture>` sources, animated stat counters,
single-open accordion, CTA banner, signup form, and scalloped footer —
renders correctly with no console errors (aside from the harmless
favicon 404 every browser requests automatically).
`preview/eds-preview-desktop-slide2.png` additionally captures the carousel
after advancing to slide 2, confirming the click handler, active-dot state,
and heading/CTA swap all work.

## 9. Mapping to the static build (`../renue-project/`)

| EDS block | Static component (`renue-project/components/`) |
|---|---|
| header | renue-header |
| hero | renue-hero |
| stats + renue-stat-item | renue-stats |
| pillar | renue-pillar |
| accordion + renue-accordion-item | renue-accordion |
| cta | renue-cta |
| signup-form | renue-signup-form |
| footer | renue-footer |

Design tokens in `styles/styles.css` mirror `renue-project/tokens/tokens.css`
1:1, including the `[CONFIRMED]`/`[APPROX]` provenance notes on colors and
type — see that file's comments for which values still need sign-off from
whoever holds Figma Dev Mode access.

## 10. What was adopted from aem-block-collection

This project wasn't originally built from Adobe's official Block Collection
(https://www.aem.live/developer/block-collection) — it was built from the
Figma design plus general EDS/Universal Editor conventions. After a direct
comparison against the collection's real source
(https://github.com/adobe/aem-block-collection), the following was adopted
or adapted in:

| From aem-block-collection | Where it landed here | What changed |
|---|---|---|
| `blocks/fragment/fragment.js` `loadFragment()` | `scripts/aem.js` `loadFragment()` | Added a `decorateContent` opt-out (see §5) since not every fragment here is genuine block content. |
| `scripts/aem.js` `createOptimizedPicture()` | `scripts/aem.js` `optimizePicture()` | Rewritten to mutate the existing `<picture>`/`<img>` in place instead of replacing nodes, to preserve Universal Editor `data-aue-*` authorability (see §6). |
| `scripts/aem.js` `decorateBlock()` `-wrapper`/`-container` classes | `scripts/aem.js` `decorateBlock()` | Adopted as-is. |
| `scripts/aem.js` `loadSection()`/`loadSections()` (hide-until-loaded) | `scripts/aem.js` `loadSection()`/`loadSections()` | Adopted, with the Hero's section revealed early in `loadEager()` instead of waiting for the general `loadLazy()` pass, since it's the LCP block. |
| `scripts/aem.js` `decorateTemplateAndTheme()` | `scripts/aem.js` `decorateTemplateAndTheme()` | Adopted as-is (see §7). |
| `blocks/carousel/carousel.js` + `.css` (indicators, prev/next, `IntersectionObserver` active-slide tracking, scroll-snap track) | `blocks/renue-hero/hero.js` + `.css` | Reworked into the container/child pattern (`hero` + `renue-hero-slide`, see §3/§4) and restyled so each slide is a full-bleed image background with centered copy, matching the Figma hero, instead of the collection's side-by-side image/content layout. |
| `blocks/renue-accordion/accordion.js` (`<details>`/`<summary>`) | *(no change)* | This project's `renue-accordion-item.js` had already independently converged on the same `<details>`/`<summary>` structure — a useful sanity check, not an adoption. |
| `scripts/aem.js` `sampleRUM()` (real weighted-sampling RUM collector) | *(not adopted yet)* | Left as a stub — only meaningful once this project points at a real Helix/EDS org with RUM collection enabled. |
| `blocks/cards/cards.js` | *(not adopted yet)* | No current Homepage block needs a card grid; likely candidate base for a future "Our stores" listing page (out of current scope). |

Deliberately **not** adopted: the doc-authoring-oriented pieces of
`aem-block-collection`/`aem-boilerplate` (`buildAutoBlocks`, the `---`
section-splitting behavior in `decorateSections`, `wrapTextNodes`,
`readBlockConfig`) — those exist to make sense of Word/Google Docs content,
which this project explicitly does not use.

## 11. Known gaps / assumptions (carried over + new)

- Same visual-approximation caveats as the static build: font family
  (`Poppins`/`Plus Jakarta Sans` fallback) unconfirmed, some colors marked
  `[APPROX]`, placeholder images throughout, and 4 of 5 accordion items
  (Passionate/Caring/Authentic/Inclusive) have placeholder body copy pending
  the real text from Figma.
- The Hero carousel's second slide, used in `preview/homepage-fixture.html`
  to exercise the prev/next/indicator controls end to end, is
  fixture-only placeholder content (clearly labeled `[FIXTURE PLACEHOLDER]`)
  — only one slide is confirmed from Figma. Drop the second `renue-hero-slide` (or
  replace it with real content) before this goes live with only one
  confirmed slide's worth of copy.
- `xfPath` values in the fixture (`/xf/header`, `/xf/footer`) are dummy
  local paths — replace with real Author XF paths, or set the `nav`/`footer`
  page metadata, per §5 before go-live.
- `signup-form`'s submit handler is not wired to a real endpoint yet.
- `optimizePicture()`'s query-param convention (`?width=&format=&optimize=`)
  assumes AEM's own image delivery service; confirm this project's real
  asset delivery/DAM setup honors the same params before relying on it in
  production (locally, the params are harmlessly ignored by the plain
  static file server used for preview).
- `sampleRUM()` is still a stub (see §10) — wire up the real RUM
  collector once this points at a live Helix/EDS org.
- `component-definition.json` groups every block under a single "Re:Nue
  Blocks" group — split into multiple groups if the component picker gets
  crowded once other pages' blocks are added.
- Not built yet (per current scope): "Thrift with us – Our stores",
  "Donate", "Legal" pages, and the AEM Sites classic (HTL/`cq:dialog.xml`)
  adaptation.
