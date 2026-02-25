# Consolidated Code Review Task List

**Prepared by:** Tech Lead (consolidation of 3 independent reviews)
**Date:** 2026-02-24
**Agents:** 1 = Architecture & Modularity, 2 = Performance & Efficiency, 3 = Readability & Responsiveness

---

## CRITICAL Priority

### T1 -- `sharp` not declared in package.json
- **Flagged by:** 1, 2, 3
- **Description:** The build script (`scripts/build-projects.js`) imports `sharp` for image orientation detection, but `sharp` is not listed in `package.json` dependencies. It works only because Astro pulls it in as a transitive dependency. If Astro drops sharp or changes versions, the build will crash with no explanation. Add `sharp` as an explicit dependency.
- **Files affected:** `package.json`, `scripts/build-projects.js`
- **Mobile impact:** No (build-time only)

### T2 -- Build script has no top-level error handling
- **Flagged by:** 1, 3
- **Description:** `buildAll()` is called with no `.catch()`. An unhandled promise rejection will crash the process with a confusing stack trace. Additionally, `findPhoto(aboutDir)` crashes if the about directory does not exist, and there is no validation that referenced media files actually exist on disk (broken images can ship silently). Add `.catch()` on `buildAll()`, guard against missing directories, and validate media file existence.
- **Files affected:** `scripts/build-projects.js`
- **Mobile impact:** No (build-time only)

### T3 -- WCAG color contrast failures across the site
- **Flagged by:** 3 (verified via source)
- **Description:** Multiple text colors fail WCAG AA minimum contrast (4.5:1 for normal text). `.about-subheading` uses `#767676` at `opacity: 0.5`, yielding approximately 2.08:1 contrast -- a severe failure. `.talk-name` and `.friend-project-tag` use `#888` on white (3.54:1). These affect real users with low vision. All low-contrast text colors must be darkened to meet at least 4.5:1.
- **Files affected:** `src/styles/app.css` (lines 44, 55, 81, 86, 182, 401, 536, 540, 545, 558, 561)
- **Mobile impact:** Yes (affects all viewports equally)

### T4 -- No `<h1>` heading on any page
- **Flagged by:** 3 (verified: zero `<h1>` tags in codebase)
- **Description:** No page has a `<h1>` element. This violates HTML heading hierarchy, harms SEO, and makes screen reader navigation significantly harder. Each page should have exactly one `<h1>` appropriate to its content. Timeline year dividers are `<div>` elements and should also be proper headings (`<h2>` or `<h3>`).
- **Files affected:** `src/pages/index.astro`, `src/pages/works/index.astro`, `src/pages/works/[slug].astro`, `src/pages/friends.astro`, `src/pages/about.astro`
- **Mobile impact:** Yes (accessibility affects all devices)

### T5 -- Sidebar layout breaks between 600px and 900px
- **Flagged by:** 1, 3
- **Description:** There are only two breakpoints (900px and 600px). Between those, the 270px fixed sidebar leaves as little as 330-430px for main content on smaller tablets. At 768px iPad portrait the content area is only 498px. A tablet breakpoint (roughly 768px) is needed, likely collapsing the sidebar or reducing its width.
- **Files affected:** `src/styles/app.css`
- **Mobile impact:** Yes (directly affects tablet experience)

---

## HIGH Priority

### T6 -- Hero parallax cards overflow and are unusable on mobile
- **Flagged by:** 1, 2, 3
- **Description:** 14 cards with hardcoded absolute positions at percentages like `left: 78%` and `top: 72-74%` overflow on small screens. At 375px width, cards overflow by approximately 118px and are clipped. At 320px, overlap is extreme and bottom rows are invisible. Touch-based parallax also competes with scroll gestures. The hero needs a fundamentally different layout at mobile sizes (fewer cards, repositioned grid, or a simpler fallback).
- **Files affected:** `src/components/HeroParallax.astro`, `src/styles/app.css`
- **Mobile impact:** Yes (this is the primary mobile issue)

### T7 -- Parallax card titles invisible on touch devices
- **Flagged by:** 1, 3
- **Description:** Card titles are only revealed on `:hover`. There is no `@media (hover: none)` fallback, so on phones and tablets the titles are permanently invisible. Users cannot discover what projects the hero cards link to.
- **Files affected:** `src/components/HeroParallax.astro`
- **Mobile impact:** Yes

### T8 -- 14 hero images loaded eagerly
- **Flagged by:** 1, 2
- **Description:** All 14 hero card images use `loading="eager"`. Many cards are positioned below the fold (e.g., `top: 72-74%`). Only the cards initially visible should be eager; the rest should be `loading="lazy"`. This is one of the largest page-weight wins available.
- **Files affected:** `src/components/HeroParallax.astro`
- **Mobile impact:** Yes (especially on cellular connections)

### T9 -- No WebP/AVIF images and no responsive srcset
- **Flagged by:** 2
- **Description:** Every image is served as its original PNG or JPG with no modern format alternatives. There are zero WebP or AVIF files. Additionally, no `<img>` uses `srcset`/`sizes`, so mobile devices download full-resolution images for thumbnails displayed at 200px or less. Together these represent potentially 50-80% bandwidth savings. The `optimize-images.js` script exists but is not wired into the build pipeline and currently converts all PNGs to JPG (losing transparency).
- **Files affected:** All `<img>` tags across pages, `scripts/optimize-images.js`, `package.json` (scripts)
- **Mobile impact:** Yes (major bandwidth impact on mobile)

### T10 -- No width/height attributes on images (CLS)
- **Flagged by:** 2 (verified: no `<img>` tags have width/height)
- **Description:** Zero `<img>` elements specify `width` and `height` attributes. The browser cannot reserve space before images load, causing Cumulative Layout Shift (CLS). This is a Core Web Vitals metric that directly affects perceived quality and search ranking. Every `<img>` should have intrinsic dimensions specified.
- **Files affected:** All `.astro` files that render images (works, friends, about, hero)
- **Mobile impact:** Yes (CLS is often worse on slower mobile connections)

### T11 -- Google Fonts loaded synchronously (render-blocking)
- **Flagged by:** 2
- **Description:** `Layout.astro` line 32 loads Montserrat via a standard `<link rel="stylesheet">`, which blocks rendering until the font CSS is downloaded. Should use `<link rel="preload" as="style">` with an `onload` swap, or self-host the font files to eliminate the external round-trip entirely.
- **Files affected:** `src/layouts/Layout.astro`
- **Mobile impact:** Yes (slower connections see longer blank-screen time)

### T12 -- Dead code: HeroKaleidoscope and HeroSlideshow components
- **Flagged by:** 1, 2, 3
- **Description:** `HeroKaleidoscope.astro` (197 lines) and `HeroSlideshow.astro` (183 lines) are never imported anywhere. The Kaleidoscope component also has a `setInterval` that is never cleared (memory leak if activated) and the Slideshow has an infinite `requestAnimationFrame` loop. These approximately 380 lines of dead code should be removed. The hero event-switching system that supports them is also dead code.
- **Files affected:** `src/components/HeroKaleidoscope.astro`, `src/components/HeroSlideshow.astro`
- **Mobile impact:** No (code is never loaded, but removal reduces maintenance burden)

---

## MEDIUM Priority

### T13 -- Monolithic app.css loaded on every page
- **Flagged by:** 1, 2
- **Description:** All 714 lines of `app.css` are inlined into every page via `Layout.astro`'s global style import. The about page ships works/timeline styles; the works page ships friends/about styles. Page-specific styles should be moved into scoped `<style>` blocks within their respective `.astro` pages. This also reduces risk of class name collisions (generic names like `.content`, `.placeholder`).
- **Files affected:** `src/styles/app.css`, `src/layouts/Layout.astro`, all page files
- **Mobile impact:** Yes (reduces CSS payload per page)

### T14 -- Parallax mousemove handler not throttled with requestAnimationFrame
- **Flagged by:** 2
- **Description:** The mousemove handler in `HeroParallax.astro` updates transforms on 14 cards on every mouse event (potentially 60-120 times per second). It also reads `--depth` CSS custom properties via `getPropertyValue` on each card per event instead of caching them. Should throttle with `requestAnimationFrame` and cache depth values at initialization.
- **Files affected:** `src/components/HeroParallax.astro`
- **Mobile impact:** Yes (touch events fire at high frequency too)

### T15 -- Social links inaccessible on mobile
- **Flagged by:** 3
- **Description:** The sidebar social icons (Instagram, LinkedIn, Substack) are hidden when the sidebar collapses to a bottom bar on mobile. There is no alternative way to access them. Social links should be available somewhere in the mobile UI -- either in the bottom nav, in a footer, or on the about page.
- **Files affected:** `src/styles/app.css`, potentially `src/layouts/Layout.astro` or `src/pages/about.astro`
- **Mobile impact:** Yes

### T16 -- Press links render `<a>` tags even when URL is undefined
- **Flagged by:** 3
- **Description:** In `about.astro`, press items render as `<a>` elements regardless of whether `p.url` has a value. When undefined, this produces a link with no `href`, which is semantically incorrect and confusing for screen readers. Should conditionally render `<a>` only when a URL exists, falling back to `<span>`.
- **Files affected:** `src/pages/about.astro`
- **Mobile impact:** No

### T17 -- Hardcoded values that should be data-driven
- **Flagged by:** 1, 3
- **Description:** Several values are hardcoded that should come from data: (a) `mentionNames = new Set(['amrita-sukrity'])` in `friends.astro` should be a field in `info.txt`; (b) `linkifyBio()` hardcodes "Joyus Studio" string replacement; (c) the logo strip is entirely hardcoded HTML with no data source; (d) sidebar width `270px` is duplicated in `.sidebar` and `.content` margin-left with no shared variable.
- **Files affected:** `src/pages/friends.astro`, `scripts/build-projects.js`, `src/pages/about.astro`, `src/styles/app.css`
- **Mobile impact:** No

### T18 -- No CSS custom properties for design tokens
- **Flagged by:** 3
- **Description:** Colors like `#767676`, `#888`, link colors, and layout values like sidebar width are hardcoded throughout `app.css` with no CSS custom properties. Changes require find-and-replace across many locations. Define a `:root` block with design tokens for colors, spacing, and breakpoints.
- **Files affected:** `src/styles/app.css`
- **Mobile impact:** No (but simplifies responsive fixes)

### T19 -- Friends grid layout breaks on tablets
- **Flagged by:** 1, 3
- **Description:** The friends grid has no tablet breakpoint. Between 600px and 900px, the 2-column layout with 160px fixed photo width on a roughly 448px effective width creates a cramped layout. At 375px, 160px photo leaves only 159px for text. The photo size should be responsive or the grid should adapt.
- **Files affected:** `src/styles/app.css`
- **Mobile impact:** Yes

### T20 -- itch.io iframe not responsive
- **Flagged by:** 3
- **Description:** The itch.io embed iframe has hardcoded `width="552" height="167"` and uses the deprecated `frameborder="0"` attribute. On mobile screens narrower than 552px, the iframe overflows. Should use CSS-based responsive sizing (`width: 100%` with aspect-ratio or a wrapper).
- **Files affected:** `src/pages/works/[slug].astro`
- **Mobile impact:** Yes

### T21 -- `image-rendering: crisp-edges` applied to photographs
- **Flagged by:** 2
- **Description:** The CSS applies `image-rendering: crisp-edges` to photo elements. This rendering hint is designed for pixel art and makes photographs look harsh and pixelated, especially when scaled. Should be removed for photographic content.
- **Files affected:** `src/styles/app.css` or `src/components/HeroParallax.astro`
- **Mobile impact:** Yes (more visible at lower resolutions)

---

## LOW Priority

### T22 -- Biased shuffle algorithm
- **Flagged by:** 3
- **Description:** `HeroParallax.astro` uses `Math.random() - 0.5` for sorting, which produces a non-uniform distribution. Replace with a Fisher-Yates shuffle for correct randomization.
- **Files affected:** `src/components/HeroParallax.astro`
- **Mobile impact:** No

### T23 -- Dead code: `itchPageUrl` computed but unused
- **Flagged by:** 1, 3
- **Description:** In `[slug].astro`, `itchPageUrl` is computed from the itch embed URL but never rendered or used. Remove it.
- **Files affected:** `src/pages/works/[slug].astro`
- **Mobile impact:** No

### T24 -- Sequential sharp operations in build script
- **Flagged by:** 1, 2
- **Description:** Cover orientation detection runs `sharp` calls sequentially. At scale (100+ projects), this becomes a bottleneck. Could use `Promise.all()` with a concurrency limiter. Also mixes synchronous `fs.readFileSync` with async `sharp()` calls.
- **Files affected:** `scripts/build-projects.js`
- **Mobile impact:** No

### T25 -- Stale documentation in CLAUDE.md
- **Flagged by:** 1, 2
- **Description:** CLAUDE.md references `src/data/data.js` which does not exist (data is now in the build script and generated JSON files). Update documentation to reflect current architecture.
- **Files affected:** `CLAUDE.md`
- **Mobile impact:** No

### T26 -- Logo strip spacing excessive on mobile
- **Flagged by:** 1, 3
- **Description:** The about page logo strip uses `3rem` column gap, which on a 375px screen causes logos to wrap to one per line. Reduce gap at mobile breakpoints.
- **Files affected:** `src/styles/app.css`
- **Mobile impact:** Yes

### T27 -- Content typo: "Vietman" should be "Vietnam"
- **Flagged by:** 3
- **Description:** A project in `public/projects/2024/` has "Vietman" instead of "Vietnam" in its `info.txt`.
- **Files affected:** `public/projects/2024/` (specific project info.txt)
- **Mobile impact:** No

### T28 -- `box-shadow` transition on parallax cards
- **Flagged by:** 2
- **Description:** Transitioning `box-shadow` triggers a paint operation every frame during hover. Could replace with a pseudo-element or `filter: drop-shadow()` for better compositing, though the real-world impact is minor on modern GPUs.
- **Files affected:** `src/components/HeroParallax.astro` or `src/styles/app.css`
- **Mobile impact:** No (hover not used on mobile)

### T29 -- Unused asset: hasgeek.png
- **Flagged by:** 2
- **Description:** `public/logos/hasgeek.png` (or similar path) is never referenced by any template. Remove to reduce deploy size.
- **Files affected:** `public/logos/`
- **Mobile impact:** No

### T30 -- UTF-8 BOM could break info.txt parsing on Windows
- **Flagged by:** 3
- **Description:** The `parseInfo` function does not strip UTF-8 BOM, which is common on Windows. The BOM would corrupt the first key on the first line. Add a BOM-stripping step.
- **Files affected:** `scripts/build-projects.js`
- **Mobile impact:** No

---

## Summary Matrix

| ID  | Title                                    | Priority | Agents | Mobile |
|-----|------------------------------------------|----------|--------|--------|
| T1  | sharp not in package.json                | Critical | 1,2,3  | No     |
| T2  | Build script error handling              | Critical | 1,3    | No     |
| T3  | WCAG color contrast failures             | Critical | 3      | Yes    |
| T4  | No h1 headings on any page              | Critical | 3      | Yes    |
| T5  | Sidebar breaks 600-900px                 | Critical | 1,3    | Yes    |
| T6  | Hero parallax overflow on mobile         | High     | 1,2,3  | Yes    |
| T7  | Card titles invisible on touch           | High     | 1,3    | Yes    |
| T8  | 14 hero images loaded eagerly            | High     | 1,2    | Yes    |
| T9  | No WebP/AVIF or srcset                   | High     | 2      | Yes    |
| T10 | No width/height on images (CLS)          | High     | 2      | Yes    |
| T11 | Google Fonts render-blocking             | High     | 2      | Yes    |
| T12 | Dead hero components (~380 lines)        | High     | 1,2,3  | No     |
| T13 | Monolithic app.css on every page         | Medium   | 1,2    | Yes    |
| T14 | mousemove not rAF-throttled              | Medium   | 2      | Yes    |
| T15 | Social links hidden on mobile            | Medium   | 3      | Yes    |
| T16 | Press links render without href check    | Medium   | 3      | No     |
| T17 | Hardcoded values should be data-driven   | Medium   | 1,3    | No     |
| T18 | No CSS custom properties / design tokens | Medium   | 3      | No     |
| T19 | Friends grid breaks on tablets           | Medium   | 1,3    | Yes    |
| T20 | itch.io iframe not responsive            | Medium   | 3      | Yes    |
| T21 | crisp-edges on photographs               | Medium   | 2      | Yes    |
| T22 | Biased shuffle algorithm                 | Low      | 3      | No     |
| T23 | itchPageUrl dead code                    | Low      | 1,3    | No     |
| T24 | Sequential sharp in build                | Low      | 1,2    | No     |
| T25 | Stale CLAUDE.md documentation            | Low      | 1,2    | No     |
| T26 | Logo strip spacing on mobile             | Low      | 1,3    | Yes    |
| T27 | Typo: "Vietman"                          | Low      | 3      | No     |
| T28 | box-shadow transition paint cost         | Low      | 2      | No     |
| T29 | Unused hasgeek.png asset                 | Low      | 2      | No     |
| T30 | UTF-8 BOM breaks Windows parsing         | Low      | 3      | No     |

**Totals:** 5 Critical, 7 High, 9 Medium, 9 Low -- 30 tasks.
**Mobile-impacting tasks:** 18 of 30.
**Cross-agent consensus (flagged by all 3):** T1, T6, T12.
