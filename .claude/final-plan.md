# Final Implementation Plan

**Author:** Senior Staff Engineer (synthesis of Paths A, B, C)
**Date:** 2026-02-24
**User context:** "specifically things are breaking in mobile so pay extra attention to that"

---

## Executive Summary

The site's mobile experience is fundamentally broken in three ways: the hero parallax overflows and clips cards on any screen under ~900px effective width, the sidebar consumes too much space on tablets (600-900px), and social links are completely unreachable on phones. This plan fixes all mobile/tablet layout failures first, then layers on accessibility and build reliability fixes. We address 20 of 30 tasks in 5 batches, prioritizing mobile impact above all else.

---

## What We're NOT Doing (and why)

| Task | Reason for deferral |
|------|---------------------|
| **T9 -- WebP/AVIF + srcset** | Requires a full image pipeline overhaul. The existing `optimize-images.js` is broken (converts PNG to JPG losing transparency). This is a standalone project. |
| **T10 -- width/height on all images** | Requires either build-time dimension detection for every image or hardcoded values that may be wrong. The project thumbnails already have parent containers with explicit dimensions and `object-fit: cover`, so CLS is limited. Revisit when T9 is tackled. |
| **T13 -- Split monolithic app.css** | 714 lines is not large. Astro inlines it. High regression risk, zero user-visible impact. |
| **T14 -- rAF-throttle parallax handler** | We are disabling parallax JS on mobile entirely (see T6 fix). On desktop, 14 transform updates per mousemove is negligible on modern browsers. Not worth the code churn. |
| **T17 -- Data-driven hardcoded values** | The `mentionNames` set, `linkifyBio`, and logo strip all work correctly and change infrequently. Abstraction for abstraction's sake. |
| **T18 -- CSS custom properties** | Nice refactor, but doing it alongside major responsive layout changes increases merge risk and debugging difficulty. Do this in a separate pass after responsive fixes are stable. |
| **T22 -- Fisher-Yates shuffle** | The visual difference between a biased and unbiased shuffle of 14 cards is imperceptible. Zero user impact. |
| **T24 -- Parallel sharp calls** | Build takes under 3 seconds with ~20 projects. Premature optimization. |
| **T25 -- Stale CLAUDE.md** | Low priority. Only affects AI tooling, not users. Can be updated at the end of any future PR. |
| **T28 -- box-shadow paint cost** | Desktop hover only. Modern GPUs handle this without jank. |

---

## Implementation Plan

### Batch 1: Build Reliability (Complexity: S)

Zero-risk, zero-visual-change foundation work. Everything else depends on a working build.

**What:**

1. **T1 -- Add `sharp` to package.json.**
   In `package.json`, add `"sharp": "^0.33.0"` to `dependencies`. The build script already `import sharp from 'sharp'` at line 3 of `build-projects.js` but relies on Astro pulling it in transitively.

2. **T2 -- Add `.catch()` to `buildAll()` + guard about directory.**
   In `scripts/build-projects.js`:
   - Change line 309 from `buildAll()` to:
     ```js
     buildAll().catch(err => {
       console.error('Build failed:', err.message || err)
       process.exit(1)
     })
     ```
   - Before line 258 (`if (fs.existsSync(aboutInfoPath))`), add a guard: wrap the `findPhoto(aboutDir)` call (line 259) inside the existing `fs.existsSync(aboutInfoPath)` check -- it already is, but `findPhoto(aboutDir)` at line 259 calls `fs.readdirSync(aboutDir)` which throws if `aboutDir` itself does not exist. Add `fs.existsSync(aboutDir)` guard around lines 258-301.

3. **T30 -- Strip UTF-8 BOM in parseInfo and parseFriendInfo.**
   In `scripts/build-projects.js`, in both `parseInfo` (line 44) and `parseFriendInfo` (line 72), change:
   ```js
   const text = fs.readFileSync(filePath, 'utf-8')
   ```
   to:
   ```js
   const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '')
   ```
   Also apply the same to the about info.txt reading at line 273.

**Files:** `package.json`, `scripts/build-projects.js`
**Verification:** Run `npm install && npm run build`. Build must succeed with no errors. Temporarily rename `public/about/` and verify the build does not crash (it should warn gracefully or skip).
**Mobile impact:** No

---

### Batch 2: Mobile Layout -- Sidebar and Navigation (Complexity: M)

This is the highest-impact structural change. Moving the sidebar collapse breakpoint from 600px to 768px gives tablets the full-width content area and fixes the 600-900px dead zone.

**What:**

5. **T5 -- Move sidebar collapse from 600px to 768px.**

   In `src/styles/app.css`, create a new `@media (max-width: 768px)` block and move the sidebar/layout/content rules OUT of the 600px block into it. The 600px block keeps only content-specific sizing rules.

   New 768px block (insert before the existing 600px block, after the 900px block):

   ```css
   @media (max-width: 768px) {
     .layout {
       flex-direction: column;
     }

     .sidebar {
       position: fixed;
       top: auto;
       bottom: 0;
       left: 0;
       width: 100%;
       height: auto;
       flex-direction: row;
       justify-content: space-around;
       padding: 0.6rem 0.5rem;
       padding-bottom: calc(0.6rem + env(safe-area-inset-bottom));
       border-right: none;
       border-top: 1px solid #ddd;
     }

     .nav-item {
       font-size: 1rem;
       padding: 0.3rem 0.5rem;
     }

     .content {
       margin-left: 0;
       padding: 1.2rem 1rem 4rem;
     }

     .home-section {
       flex-direction: column-reverse;
       gap: 1.5rem;
       min-height: auto;
     }

     .home-text {
       width: 100%;
     }

     .about-intro {
       flex-direction: column;
     }

     .about-photo {
       width: 100%;
       max-width: 200px;
       height: 200px;
       align-self: auto;
     }

     .about-photo-placeholder {
       width: 100%;
       max-width: 200px;
       height: 200px;
     }

     .two-col {
       grid-template-columns: 1fr;
       gap: 1.5rem;
     }

     .friends-grid {
       grid-template-columns: 1fr;
     }

     .divya-intro,
     .artist-statement,
     .project-detail-desc {
       max-width: 100%;
     }

     .video-wrapper {
       max-width: 100%;
     }

     .project-media {
       max-width: 100%;
     }

     .project-media-img,
     .project-media-video {
       width: 100%;
     }
   }
   ```

   Then the **existing 600px block** is reduced to only these remaining rules:

   ```css
   @media (max-width: 600px) {
     .sidebar-socials {
       display: none;
     }

     .hero-container {
       width: 100%;
       height: 60vh;
       min-height: 300px;
       max-height: 500px;
     }

     .project-thumb {
       width: 100%;
       height: auto;
       aspect-ratio: 4 / 3;
     }

     .timeline-year {
       font-size: 2.2rem;
     }
   }
   ```

   Wait -- the `.sidebar-socials { display: none }` should NOT stay at 600px because the sidebar collapses at 768px now. Move it to 768px block. But we will un-hide social links in T15 below, so for now, add `.sidebar-socials { display: none; }` to the 768px block.

   Actually, the clean approach: move `.sidebar-socials { display: none; }` to the 768px block (since the sidebar is now a bottom bar at 768px and there is no room for social icons in the compact bottom bar). Then T15 will handle making them accessible elsewhere.

   **Important nuance:** The 900px tablet breakpoint currently adjusts `.project-thumb` to 300x225 and `.content` padding to 2rem. These rules stay as-is. At 769-900px, the sidebar is still visible (270px wide), content gets the 2rem padding, and thumbnails are 300x225. At 768px and below, the sidebar collapses and content gets the full width. This is clean.

6. **T15 -- Make social links accessible on mobile.**

   In the 768px media query block (where `.sidebar-socials` is now `display: none`), instead of hiding them completely, re-display them inline in the bottom nav:

   ```css
   @media (max-width: 768px) {
     .sidebar-socials {
       display: flex;
       margin-top: 0;
       padding-top: 0;
       gap: 0.75rem;
     }

     .sidebar-socials svg {
       width: 16px;
       height: 16px;
     }
   }
   ```

   This keeps the social icons visible in the bottom bar alongside the 4 nav links. At 320px, that is 7 items across ~288px usable = ~41px per item. This is tight but workable with the smaller 16px icons. The nav items are text ("divya", "works", etc.) at 1rem, and the social icons are small SVGs. The `justify-content: space-around` on `.sidebar` distributes them.

   If testing reveals crowding at 320px, the fallback is to hide social icons at 600px and add them to the about page instead. But try the inline approach first.

7. **T19 -- Friends grid photo size on small screens.**

   Add to the 768px block:
   ```css
   .friend-photo {
     width: 120px;
   }
   ```

   Add a new block for very small screens:
   ```css
   @media (max-width: 400px) {
     .friend-photo {
       width: 100px;
     }
     .friend-card-top {
       gap: 1rem;
     }
   }
   ```

   At 320px with these changes: 288px effective - 100px photo - 16px gap = 172px for text. Much better than the current 104px.

8. **T26 -- Logo strip gap on mobile.**

   Add to the 768px block:
   ```css
   .logo-strip {
     gap: 1rem 1.5rem;
   }
   .logo-strip img {
     height: 32px;
   }
   ```

**Files:** `src/styles/app.css`
**Verification:** Test at these viewport widths using browser dev tools:
- 320px: Everything single-column, bottom nav visible with social icons, friend photos at 100px, logo strip wraps but not one-per-line
- 375px: Same, slightly more room
- 414px: Same
- 768px: Sidebar collapses to bottom bar (critical checkpoint -- verify no dead space)
- 769px: Sidebar is back as a left column at 270px
- 1024px: Full desktop layout
**Mobile impact:** Yes -- this is the core mobile structural fix

---

### Batch 3: Mobile Layout -- Hero Parallax (Complexity: M)

The hero is the first thing visitors see. On mobile it is broken -- cards overflow, titles are invisible, photos look harsh.

**What:**

9. **T6 -- Rework hero parallax for mobile.**

   **Decision: On mobile (768px and below), switch to a 2-column CSS grid of 6 cards. Disable parallax movement.**

   This is the pragmatic-but-correct approach. A percentage-based scatter cannot scale below ~900px effective width. A grid is deterministic and cannot overflow.

   In `src/components/HeroParallax.astro`, add to the `<style>` block:

   ```css
   @media (max-width: 768px) {
     .hero-parallax {
       display: grid !important;
       grid-template-columns: 1fr 1fr;
       gap: 0.5rem;
       height: auto !important;
       min-height: auto !important;
       max-height: none !important;
       overflow: visible;
     }

     .parallax-card {
       position: relative !important;
       left: auto !important;
       top: auto !important;
       transform: none !important;
       will-change: auto;
     }

     .parallax-card--portrait,
     .parallax-card--landscape {
       width: 100% !important;
       height: auto !important;
       aspect-ratio: 4 / 3;
     }

     .parallax-card:nth-child(n+7) {
       display: none;
     }
   }
   ```

   The `!important` declarations are necessary to override the inline `style` attributes that set `left`, `top`, `transform` values on each card. This is an acceptable use of `!important` because it is scoped to a media query overriding inline styles -- the standard pattern for responsive overrides of JS-set styles.

   In `src/styles/app.css`, update the `.hero-container` rules. In the existing 768px block (from Batch 2), add:

   ```css
   .hero-container {
     width: 100%;
     height: auto;
     min-height: auto;
     max-height: none;
     overflow: visible;
   }
   ```

   In `src/components/HeroParallax.astro`, update the `<script>` to skip parallax on mobile:

   Change the beginning of the event handler (after `const reducedMotion = ...`) to:
   ```js
   const isMobile = window.matchMedia('(max-width: 768px)').matches
   if (reducedMotion || isMobile) return
   ```

   This prevents the JS from attaching mousemove/touchmove listeners on mobile, eliminating the competing-with-scroll problem and avoiding wasted work.

10. **T7 -- Show card titles on touch devices.**

    In `src/components/HeroParallax.astro` `<style>` block, add after the `.parallax-card:hover .parallax-card-title` rule:

    ```css
    @media (hover: none) {
      .parallax-card-title {
        opacity: 1;
        background: rgba(0, 0, 0, 0.6);
      }
    }
    ```

    This mirrors the existing pattern used for `.project-thumb-label` in `app.css` lines 244-256.

11. **T21 -- Remove `crisp-edges` from photographs.**

    In `src/components/HeroParallax.astro`, delete lines 85-86 from the `.parallax-card img` rule:
    ```css
    /* DELETE these two lines */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    ```

12. **T20 -- Make itch.io iframe responsive.**

    In `src/pages/works/[slug].astro`, change line 39 from:
    ```html
    <iframe src={project.itch} width="552" height="167" frameborder="0"></iframe>
    ```
    to:
    ```html
    <iframe src={project.itch} title={`${project.title} on itch.io`}></iframe>
    ```

    In `src/styles/app.css`, update the `.itch-embed iframe` rule (line 269-272) to:
    ```css
    .itch-embed iframe {
      border: none;
      width: 100%;
      height: 167px;
    }
    ```

    The `.itch-embed` container already has `max-width: 552px`, so on desktop the iframe will be 552px wide and 167px tall. On mobile it shrinks to fit. Adding the `title` attribute also improves accessibility.

**Files:** `src/components/HeroParallax.astro`, `src/styles/app.css`, `src/pages/works/[slug].astro`
**Verification:**
- 375px: Hero shows 6 cards in a 2x3 grid. No horizontal overflow. Card titles visible. No parallax movement on touch.
- 414px: Same, slightly larger cards.
- 768px: Grid layout. Verify the transition from grid (768px) to scatter (769px) is clean.
- 769px: Scatter layout with parallax active. Cards sized at the 900px breakpoint values (190x265 portrait, 270x180 landscape).
- 1024px+: Full desktop scatter with full-size cards.
- Test an itch.io project page at 320px -- iframe should not overflow.
**Mobile impact:** Yes -- fixes the primary mobile issue

---

### Batch 4: Accessibility and Quick Fixes (Complexity: S)

Non-layout fixes that affect all viewports.

**What:**

13. **T3 -- Fix WCAG color contrast.**

    All changes in `src/styles/app.css`:

    | Line | Selector | Current | New |
    |------|----------|---------|-----|
    | 44 | `.nav-item` | `#767676` | `#666` |
    | 55 | `.nav-item:visited` | `#767676` | `#666` |
    | 81 | `.sidebar-socials a` | `#767676` | `#666` |
    | 86 | `.sidebar-socials a:visited` | `#767676` | `#666` |
    | 401 | `.friend-project-tag` | `#888` | `#666` |
    | 536 | `.talk-name` | `#888` | `#666` |
    | 540 | `a.talk-name` | `#888` | `#666` |
    | 545 | `a.talk-name:visited` | `#888` | `#666` |
    | 558 | `.about-subheading` | `#767676` | keep `#767676` |
    | 561 | `.about-subheading` | `opacity: 0.5` | **DELETE this line** |

    Rationale for `#666`: contrast ratio on white = 5.74:1, comfortably passes WCAG AA (4.5:1). It is darker than `#767676` (4.65:1, borderline) and much darker than `#888` (3.54:1, fails). The visual change is subtle -- about 15% darker for nav items, 25% darker for tags/talk names.

    For `.about-subheading`, removing `opacity: 0.5` brings it from ~2.08:1 (severe failure) back to `#767676`'s native 4.65:1 (passes AA). The heading is small text (0.9rem), so it needs the 4.5:1 threshold.

    The `.timeline-year` at `#767676` is fine as-is: at 4rem/3rem/2.2rem it qualifies as "large text" under WCAG, which only needs 3:1 contrast. `#767676` at 4.65:1 passes easily.

14. **T4 -- Add `<h1>` headings to each page.**

    First, add a `.sr-only` utility class to `src/styles/global.css`:
    ```css
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    ```

    Then add `<h1>` to each page:

    - **`src/pages/index.astro`**: Inside the `<section>`, before `<div class="home-hero">`, add:
      ```html
      <h1 class="sr-only">Divya -- Artist Portfolio</h1>
      ```

    - **`src/pages/works/index.astro`**: Inside the `<section>`, before the timeline `<div>`, add:
      ```html
      <h1 class="sr-only">Works</h1>
      ```

    - **`src/pages/works/[slug].astro`**: Change line 32 from `<h2 class="project-detail-title">` to `<h1 class="project-detail-title">`. Update CSS if needed -- the `.project-detail-title` class already fully controls the styling, so the `<h1>` reset in `global.css` (`* { margin: 0 }`) covers the default margin. No visual change.

    - **`src/pages/friends.astro`**: Inside the `<section>`, before the `<h2>`, add:
      ```html
      <h1 class="sr-only">Friends</h1>
      ```

    - **`src/pages/about.astro`**: Inside the first `<section>`, before the photo, add:
      ```html
      <h1 class="sr-only">About</h1>
      ```

    Using `.sr-only` for most pages avoids any visual disruption. The project detail page promotes its existing visible `<h2>` to `<h1>`, which is the correct semantic choice.

15. **T16 -- Conditional press link rendering.**

    In `src/pages/about.astro`, change lines 87-89 from:
    ```jsx
    <li>
      <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a>
      {p.outlet && ` — ${p.outlet}`}{p.year ? `, ${p.year}` : ''}
    </li>
    ```
    to:
    ```jsx
    <li>
      {p.url ? (
        <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a>
      ) : (
        <span>{p.title}</span>
      )}
      {p.outlet && ` — ${p.outlet}`}{p.year ? `, ${p.year}` : ''}
    </li>
    ```

**Files:** `src/styles/app.css`, `src/styles/global.css`, `src/pages/index.astro`, `src/pages/works/index.astro`, `src/pages/works/[slug].astro`, `src/pages/friends.astro`, `src/pages/about.astro`
**Verification:** Run Lighthouse accessibility audit. Confirm all pages have exactly one `<h1>`. Test contrast with browser dev tools (inspect elements, check computed color). Visually confirm the color changes are subtle and consistent with the site's aesthetic. Confirm press items without URLs do not render as `<a>` tags.
**Mobile impact:** Yes (accessibility affects all devices; contrast is especially important on mobile in sunlight)

---

### Batch 5: Performance and Cleanup (Complexity: S)

Quick wins for load time and codebase hygiene.

**What:**

16. **T8 -- Lazy-load below-fold hero images.**

    In `src/components/HeroParallax.astro`, change the `positions` mapping (line 25-30) to include a loading strategy:
    ```js
    const positions = shuffled.map((p, i) => ({
      ...p,
      ...layouts[i],
      zIndex: Math.floor(layouts[i].depth * 10),
      isPortrait: p.coverOrientation === 'portrait',
      loading: i < 6 ? 'eager' : 'lazy',
    }))
    ```

    Then change line 41 from:
    ```html
    <img src={p.cover} alt={p.title} loading="eager" decoding="async" />
    ```
    to:
    ```html
    <img src={p.cover} alt={p.title} loading={p.loading} decoding="async" />
    ```

    Cards 0-5 (top rows, `top: 0-38%`) stay eager. Cards 6-13 (`top: 54-74%`, below the fold) load lazily. On mobile where we show only 6 cards in a grid, only the first 6 are rendered anyway.

17. **T11 -- Non-blocking Google Fonts.**

    In `src/layouts/Layout.astro`, change line 32 from:
    ```html
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet" />
    ```
    to:
    ```html
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'" />
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" /></noscript>
    ```

    The `display=swap` in the Google Fonts URL already handles FOUT (the browser shows system font until Montserrat loads). The preload pattern just prevents the CSS file itself from blocking initial render.

18. **T12 -- Delete dead hero components.**

    Delete these two files:
    - `src/components/HeroKaleidoscope.astro`
    - `src/components/HeroSlideshow.astro`

    These are never imported (confirmed: no import statements reference them). ~380 lines of dead code including a `setInterval` that never clears.

    Also simplify the hero activation system. In `src/pages/index.astro`, replace lines 27-29:
    ```js
    window.dispatchEvent(new CustomEvent('hero-activate', { detail: 'parallax' }))
    const el = document.querySelector('.hero-container') as HTMLElement
    if (el) el.hidden = false
    ```
    with:
    ```js
    const el = document.querySelector('.hero-container') as HTMLElement
    if (el) {
      el.hidden = false
      el.dispatchEvent(new CustomEvent('hero-activate', { detail: 'parallax' }))
    }
    ```

    Actually, the cleaner approach is to remove the event system entirely since there is now only one hero mode. In `src/components/HeroParallax.astro`, change line 133 from:
    ```js
    window.addEventListener('hero-activate', (e) => {
      if ((e as CustomEvent).detail !== 'parallax') return
    ```
    to a self-executing initialization:
    ```js
    document.addEventListener('DOMContentLoaded', () => {
    ```
    And remove the closing `})` for the old event listener, replacing with `})` for DOMContentLoaded.

    Then in `src/pages/index.astro`, simplify the script to:
    ```js
    const el = document.querySelector('.hero-container') as HTMLElement
    if (el) el.hidden = false
    ```

    And remove the `hidden` attribute from the hero container in `HeroParallax.astro` line 33 (change `hidden` to nothing). Then remove the un-hiding script from `index.astro` entirely.

    **Revised simpler approach:** Remove `hidden` from the `<div>` in `HeroParallax.astro`. Remove the event dispatch and hidden-toggle from `index.astro`. Change the script in `HeroParallax.astro` to initialize directly without the event listener wrapper. This eliminates the flash-of-hidden-content issue and the unnecessary event indirection.

19. **T23 -- Remove dead `itchPageUrl`.**

    In `src/pages/works/[slug].astro`, delete line 20:
    ```js
    const itchPageUrl = project.itch ? project.itch.replace('/embed/', '/') : ''
    ```

20. **T27 -- Fix "Vietman" typo.**

    In `public/projects/2024/(un)seen Vietman/info.txt`, change line 1 from:
    ```
    title: (un)seen Vietman
    ```
    to:
    ```
    title: (un)seen Vietnam
    ```

    Note: The folder name also contains the typo (`(un)seen Vietman`). Changing the folder name would change the generated slug and break any existing links. Only fix the title in `info.txt` for now. The folder name can be renamed in a future PR with a redirect.

21. **T29 -- Delete unused `hasgeek.png`.**

    Delete `public/logos/hasgeek.png`. Confirmed: zero references to "hasgeek" in any source file.

**Files:** `src/components/HeroParallax.astro`, `src/layouts/Layout.astro`, `src/pages/index.astro`, `src/pages/works/[slug].astro`, `public/projects/2024/(un)seen Vietman/info.txt`, `public/logos/hasgeek.png` (delete), `src/components/HeroKaleidoscope.astro` (delete), `src/components/HeroSlideshow.astro` (delete)
**Verification:** Run `npm run build` -- must succeed. Run `npm run dev` and verify:
- Home page hero appears without flash (no hidden/unhidden cycle)
- Hero images below fold lazy-load (check Network tab)
- Font loads without blocking initial paint (test on throttled 3G)
- Project title shows "Vietnam" not "Vietman"
- Itch.io embed pages still render correctly
**Mobile impact:** Yes (lazy loading saves significant bandwidth on cellular; font non-blocking reduces blank-screen time)

---

## Risk Mitigation

### Highest-Risk Change: Batch 2 (Sidebar Breakpoint Move)

**Risk:** Moving sidebar collapse from 600px to 768px means every CSS rule that previously relied on `margin-left: 0` at 601-768px will now be different. If any rule is left orphaned in the 600px block that depends on full-width content, it will break.

**Mitigation:**
- Audit every rule currently in the 600px block. Sidebar/layout/content structural rules go to 768px. Content-specific sizing rules (hero height, project thumbs, timeline font) can stay at 600px.
- Test the transition point exhaustively: 768px and 769px side by side.
- If the social icons crowd the bottom nav at 320px, fall back to hiding them and adding a social section on the about page instead.

### Second-Highest-Risk: Batch 3 (Hero Parallax Grid)

**Risk:** Using `!important` to override inline styles is a code smell, and the `nth-child(n+7)` selector hides cards based on DOM order which changes each page load (shuffle).

**Mitigation:**
- The `!important` is scoped to a single media query and only overrides inline styles -- this is the standard pattern and is fine.
- The shuffle randomizes which 6 cards appear on mobile, which is actually a feature: users see different projects each visit.
- Test that the grid renders cleanly with both portrait and landscape cards mixed (the `aspect-ratio: 4/3` normalizes them).
- The JS check `window.matchMedia('(max-width: 768px)')` prevents parallax logic from running on mobile, eliminating the touch-scroll conflict.

### Testing Checklist

Run after each batch is complete:

- [ ] `npm run build` succeeds without errors
- [ ] `npm run dev` starts and all pages render

After all batches:

- [ ] **320px viewport:** Bottom nav visible with all items, hero is a 2-column grid, no horizontal scrollbar on any page, friend photos at 100px, logo strip wraps reasonably
- [ ] **375px viewport:** Same as 320px but with more room
- [ ] **414px viewport:** Same
- [ ] **768px viewport:** Sidebar collapsed to bottom bar, content full-width, hero in grid mode, two-col sections collapsed to one column
- [ ] **769px viewport:** Sidebar visible on left at 270px, hero in scatter mode, parallax active on hover
- [ ] **900px viewport:** Tablet thumb sizes (300x225), content padding 2rem
- [ ] **1024px viewport:** Full desktop layout
- [ ] **1440px viewport:** Full desktop, no issues
- [ ] **Touch device (or emulated):** Card titles visible on hero, project thumb labels visible, no parallax movement, social icons in bottom nav
- [ ] **Lighthouse accessibility audit:** No heading warnings, no contrast failures
- [ ] **Lighthouse performance audit:** Improved LCP and reduced page weight vs baseline
- [ ] **Network tab (throttled 3G):** Font does not block paint, below-fold hero images lazy-load
- [ ] **Itch.io project page at 375px:** Iframe fits within viewport, no overflow

---

## Summary

| Batch | Tasks | Files | Mobile Impact | Complexity |
|-------|-------|-------|---------------|------------|
| 1: Build Reliability | T1, T2, T30 | 2 | No | S |
| 2: Sidebar + Nav | T5, T15, T19, T26 | 1 | **Yes** | M |
| 3: Hero Parallax | T6, T7, T21, T20 | 3 | **Yes** | M |
| 4: Accessibility | T3, T4, T16 | 7 | Yes | S |
| 5: Perf + Cleanup | T8, T11, T12, T23, T27, T29 | 8 + 3 deletions | Yes | S |

**Total: 20 tasks addressed. 10 deferred.** All 5 Critical items covered. 5 of 7 High items covered (T9 and T10 deferred as a paired future project). All mobile-breaking issues resolved.
