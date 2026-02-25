# Path C -- Mobile-First UX Specialist Proposal

**Author:** Implementation Engineer C
**Date:** 2026-02-24
**Focus:** Every responsive/mobile issue first, then everything else

---

## 1. Mobile Audit -- Every Specific Responsive Issue Found

I read every CSS rule, every media query, and every template. Below is a comprehensive list of responsive failures organized by the mental viewport widths: 320px, 375px, 414px, and 768px.

### 1.1 Hero Parallax Cards (SEVERE -- affects first impression)

**File:** `src/components/HeroParallax.astro`, `src/styles/app.css`

**At 320px viewport (smallest phones):**
- The `.content` has `margin-left: 0` and `padding: 1.2rem 1rem`. Effective hero container width: ~288px (320 - 32px padding).
- Hero container height is `60vh`, so on a typical 568px tall screen: ~341px.
- Cards at 600px breakpoint: landscape = 200x135px, portrait = 140x195px.
- A card positioned at `left: 78%` would start at 78% of 288px = ~225px. A 200px-wide landscape card would extend to 425px, overflowing by ~137px. The container has `overflow: hidden`, so it is clipped -- but the card is mostly invisible.
- Cards at `left: 72%` (index 11), `left: 65%` (index 2), `left: 60%` (index 8) also overflow significantly.
- Cards at `top: 74%` and `top: 72%` start at ~252px in a 341px container. A 195px portrait card extends to 447px -- again clipped off.
- At least 5-6 of the 14 cards are partially or fully invisible. The "scatter" layout assumes a container of ~600px+ width.

**At 375px viewport (iPhone SE, most common small phone):**
- Effective hero width: ~343px. Similar overflow issues. Card at `left: 78%` starts at ~268px; a 200px landscape card overflows by ~125px.
- Bottom-row cards at `top: 72-74%` still mostly clipped.

**At 414px viewport (iPhone 6/7/8 Plus):**
- Effective hero width: ~382px. Same pattern, slightly less extreme but right-side and bottom cards still clipped.

**At 768px viewport (iPad portrait, BEFORE sidebar collapses):**
- Sidebar is still 270px fixed (900px breakpoint not reached).
- Content area: 768 - 270 = 498px, minus padding (2rem = 32px each side) = ~434px effective hero width.
- Card sizes at 900px breakpoint: landscape 270x180, portrait 190x265.
- Card at `left: 78%` starts at ~339px. A 270px landscape card extends to 609px -- overflows by ~175px.
- This is arguably worse than phone because the sidebar eats so much space.

**Verdict:** The hero parallax is fundamentally broken below ~900px effective content width. The percentage-based scatter layout does not scale down.

### 1.2 Parallax Card Titles Invisible on Touch (SEVERE -- content unreachable)

**File:** `src/components/HeroParallax.astro` lines 89-105

- `.parallax-card-title` has `opacity: 0` and is only shown on `.parallax-card:hover`.
- There is NO `@media (hover: none)` rule for parallax card titles.
- Note: the works timeline DOES have a `@media (hover: none)` rule for `.project-thumb-label` (app.css line 244-256), showing a persistent bottom-bar label. The parallax hero was missed.
- On any touch device, users see the hero images but cannot discover what project each card links to. They would have to blindly tap.

### 1.3 Sidebar Layout at 600-900px (SIGNIFICANT -- tablet breakpoint gap)

**File:** `src/styles/app.css`

- Between 601px and 900px, the sidebar remains fixed at 270px.
- At 768px: content = 768 - 270 = 498px. With `padding: 2rem` = 32px each side, effective = 434px.
- At 601px: content = 601 - 270 = 331px. With `padding: 2rem`, effective = 267px. This is extremely cramped for any content.
- The 900px breakpoint only adjusts `project-thumb` size and content padding -- it does NOT touch the sidebar.
- There is no intermediate behavior (e.g., narrower sidebar, collapsible sidebar, or overlay sidebar).

### 1.4 Social Links Completely Hidden on Mobile

**File:** `src/styles/app.css` line 650-652

```css
.sidebar-socials {
  display: none;
}
```

- At `max-width: 600px`, social links vanish entirely. They are not present anywhere else in the layout.
- Instagram, LinkedIn, and Substack links become unreachable on mobile.
- The about page does NOT include social links either -- it has only an email link.

### 1.5 Friends Grid Cramped on Small Screens

**File:** `src/styles/app.css`

- At 600px and below, the grid goes to 1 column (good).
- But `.friend-photo` stays at `width: 160px` with `flex-shrink: 0`.
- At 320px: content padding = `1.2rem 1rem` = 16px each side. Effective width = 288px.
- Photo takes 160px + 1.5rem gap (24px) = 184px, leaving only 104px for `.friend-info` text. Names and descriptions are severely squished.
- At 375px: 343px effective, 343 - 184 = 159px for text. Still very tight for a name + description + project tags.

### 1.6 itch.io Iframe Overflow on Mobile

**File:** `src/pages/works/[slug].astro` line 39

```html
<iframe src={project.itch} width="552" height="167" frameborder="0"></iframe>
```

- The iframe has hardcoded `width="552"`. The wrapper `.itch-embed` has `max-width: 552px`.
- `.itch-embed iframe` has `width: 100%` in CSS, which should override the HTML attribute. But the HTML `width` attribute sets the intrinsic size used for aspect ratio calculation. The CSS `width: 100%` does override, but there is no `height` rule in CSS, so the `height="167"` HTML attribute persists. This means at 320px effective width (288px), the iframe will be 288px wide but still 167px tall, distorting the aspect ratio.
- Additionally, the `frameborder="0"` attribute is deprecated HTML. Should use CSS `border: none` (which is already set in `.itch-embed iframe`).

### 1.7 Logo Strip Wrapping Poorly on Mobile

**File:** `src/styles/app.css` lines 577-589

- `.logo-strip` uses `gap: 2rem 3rem` (row gap 2rem, column gap 3rem = 48px).
- At 320px (288px effective width): two logos of ~44px height (variable width, likely 80-150px each) plus 48px gap could easily exceed 288px, forcing one logo per line.
- 12 logos each on their own line with 2rem (32px) vertical gap = extremely long vertical strip.
- No breakpoint adjusts the gap or logo size for mobile.

### 1.8 Project Media Images Side-by-Side Issue

**File:** `src/styles/app.css` lines 324-330 and 709-712

- At desktop, `.project-media-img` is `width: calc(50% - 0.75rem)` -- two images per row.
- At mobile (600px breakpoint), it becomes `width: 100%` -- one image per row. This is correct.
- However, between 601px and 900px (the tablet gap), the sidebar takes 270px, leaving very little room for two side-by-side images. At 700px, effective content is 700 - 270 - 64 = 366px. Two images would be ~175px each. That is usable but tight.

### 1.9 About Photo Sizing

**File:** `src/styles/app.css` lines 654-669

- At mobile, `.about-photo` gets `width: 100%; max-width: 200px; height: 200px`. This is fine.
- But between 601-900px (tablet range), the `.about-intro` is still `flex-direction: row` with `.about-photo` at `width: 200px`. On a 400px effective content area, that leaves only ~168px (200px subtracted, plus gap) for the text column. The bio text would be very narrow.

### 1.10 Two-Column Layout on About Page

**File:** `src/styles/app.css` lines 549-553 and 671-674

- `.two-col` is `grid-template-columns: 1fr 1fr` at desktop.
- At 600px breakpoint: collapses to `1fr`. Good.
- But at 601-900px with the sidebar, the grid tries to fit two columns in ~400px effective space. Each column would be ~188px. Talk venue names and talk titles would overflow or break awkwardly.

### 1.11 Timeline Year Font Size

**File:** `src/styles/app.css`

- Desktop: `4rem` (64px) -- fine on wide screens.
- 900px: `3rem` (48px) -- fine.
- 600px: `2.2rem` (35.2px) -- fine for mobile.
- No issues here, this scales well.

### 1.12 Home Section Layout on Mobile

**File:** `src/styles/app.css` lines 633-641

- At 600px: `.home-section` goes to `column-reverse` with `gap: 1.5rem`. The `.home-text` goes `width: 100%`.
- This means the text appears first (visually) and the hero below it (because of `column-reverse` with the original DOM order being hero first, text second).
- Wait, the DOM order in `index.astro` is: `home-hero` (line 14) then `home-text` (line 17). With `column-reverse`, the visual order becomes: `home-text` on top, `home-hero` below. This puts the introduction text above the hero, which is reasonable on mobile.
- No immediate issue, but the hero is now pushed below and may be less impactful. Combined with the hero overflow issues, the mobile home page is weak.

### 1.13 Bottom Padding on Mobile Content

**File:** `src/styles/app.css` line 682

```css
.content {
  padding: 1.2rem 1rem 4rem;
}
```

- 4rem (64px) bottom padding to clear the fixed bottom nav bar. The bottom nav has `padding: 0.6rem 0.5rem` plus safe-area inset. For most phones, the nav bar is approximately 40-50px tall. 64px bottom padding should be enough, but it is tight for phones with large home indicators (iPhone X+, where safe-area-inset-bottom can be ~34px, making the nav bar ~54px). The 64px still clears it, so this is acceptable.

### 1.14 Touch Parallax Competes with Page Scroll

**File:** `src/components/HeroParallax.astro` lines 161-164

- The `touchmove` listener is registered with `{ passive: true }`, which means it does not call `preventDefault()`. This is correct -- it won't block scrolling.
- However, the parallax effect moves cards around while the user is trying to scroll, which can be visually disorienting. On mobile, where the hero is 60vh, the user will inevitably touch-scroll through the hero area.

### 1.15 Image-Rendering Crisp-Edges on Photos

**File:** `src/components/HeroParallax.astro` lines 85-86

```css
image-rendering: -webkit-optimize-contrast;
image-rendering: crisp-edges;
```

- Applied to ALL parallax card images. These are photographs, not pixel art. At mobile resolutions where images are scaled down (140x195 or 200x135), the crisp-edges rendering makes photographs look harsh and pixelated. This is more noticeable on lower-resolution mobile screens.

### 1.16 No Width/Height on Any Images (CLS on Mobile)

- Zero `<img>` elements across the entire codebase have `width` or `height` attributes.
- On slow mobile connections, images pop in and shift content around. This is particularly bad on:
  - Works timeline: project thumbnails load and push year labels and other cards around.
  - Friends page: friend photos load and shift the card layout.
  - About page: the about photo and all logos load and cause shifts.

### 1.17 All 14 Hero Images Loaded Eagerly

**File:** `src/components/HeroParallax.astro` line 41

```html
<img src={p.cover} alt={p.title} loading="eager" decoding="async" />
```

- Every single one of the 14 hero images uses `loading="eager"`. On mobile with a cellular connection, this means the browser attempts to download all 14 images immediately, many of which are clipped/invisible due to overflow. This is a significant bandwidth and load-time waste.

---

## 2. Which Tasks to DO -- Prioritized

### Tier 1: Mobile-Critical (Must Fix -- Broken UX)

| Order | Task ID | Description | Rationale |
|-------|---------|-------------|-----------|
| 1 | T6 | Hero parallax overflow on mobile | THE primary mobile issue. First thing visitors see is broken. |
| 2 | T7 | Card titles invisible on touch | Useless links without titles. Must pair with T6. |
| 3 | T5 | Sidebar layout breaks 600-900px | Tablet users get an unusable layout. Third most impactful. |
| 4 | T15 | Social links hidden on mobile | Content completely unreachable. Quick fix. |
| 5 | T20 | itch.io iframe not responsive | Content overflows on mobile. Quick fix. |
| 6 | T19 | Friends grid breaks on tablets/small mobile | Cramped to the point of illegibility at 320px. |

### Tier 2: Mobile-Important (Visible Quality Issues)

| Order | Task ID | Description | Rationale |
|-------|---------|-------------|-----------|
| 7 | T3 | WCAG color contrast failures | Affects all viewports. Accessibility requirement. |
| 8 | T10 | No width/height on images (CLS) | Worse on slow mobile. Core Web Vitals. |
| 9 | T8 | 14 hero images loaded eagerly | Major mobile bandwidth waste. |
| 10 | T21 | crisp-edges on photographs | Photographs look bad on mobile screens. Quick 2-line fix. |
| 11 | T26 | Logo strip spacing on mobile | Logos go one-per-line on small screens. Quick fix. |
| 12 | T14 | mousemove/touchmove not rAF-throttled | Touch events fire rapidly. Performance on low-end phones. |
| 13 | T11 | Google Fonts render-blocking | Longer blank screen on mobile connections. |

### Tier 3: Non-Mobile but Should Do

| Order | Task ID | Description | Rationale |
|-------|---------|-------------|-----------|
| 14 | T1 | sharp not in package.json | Critical build reliability. Trivial fix. |
| 15 | T2 | Build script error handling | Critical build reliability. |
| 16 | T4 | No h1 headings on any page | Accessibility/SEO. Affects all devices. |
| 17 | T12 | Dead hero components | ~380 lines of dead code. Clean removal. |
| 18 | T16 | Press links without href check | Accessibility fix. |
| 19 | T23 | itchPageUrl dead code | One-line removal. |
| 20 | T27 | Typo: "Vietman" | Content fix. One word. |
| 21 | T30 | UTF-8 BOM parsing | Windows build fix. |

---

## 3. Which Tasks to SKIP (with Rationale)

| Task ID | Title | Rationale for Skipping |
|---------|-------|----------------------|
| T9 | No WebP/AVIF or srcset | Large scope. Requires either Astro Image integration or a custom build pipeline for image optimization. The existing `optimize-images.js` is broken (converts PNG to JPG losing transparency). This is a full feature project, not a fix. Should be a separate PR. |
| T13 | Monolithic app.css on every page | Splitting CSS into per-page scoped styles is a structural refactor that touches every page file and the layout. High risk of breaking something, low actual benefit (714 lines is small; gzip makes the delta negligible). Do this later. |
| T17 | Hardcoded values should be data-driven | Refactoring concern, not a user-facing bug. The hardcoded `mentionNames` set, `linkifyBio`, and logo strip all work correctly. Prioritize fixing what is broken over what is inelegant. |
| T18 | No CSS custom properties | Design tokens are nice-to-have. We can introduce them incrementally when making the contrast fixes (T3), but a full `:root` variable system is scope creep. |
| T22 | Biased shuffle algorithm | The shuffle bias is statistically real but visually imperceptible. 14 items sorted with `Math.random() - 0.5` will still look random to any human visitor. |
| T24 | Sequential sharp in build | Build performance optimization. The current project count is small enough that this is not a problem. Optimize when it becomes a bottleneck. |
| T25 | Stale CLAUDE.md | Documentation should be updated, but it does not affect users. Do it at the end of any PR, not as a prioritized task. |
| T28 | box-shadow transition paint cost | Minor paint cost on desktop hover only. Mobile does not use hover. No real-world impact. |
| T29 | Unused hasgeek.png | One unused logo file. Deploy size impact is negligible (<100KB). Low priority cleanup. |

---

## 4. Proposed Implementation Order

The implementation is organized into logical batches. Each batch should be testable independently.

### Batch 1: Fix the Hero (T6 + T7 + T8 + T21)
These are interdependent. The hero needs a fundamentally different approach on mobile.

1. **T6 -- Rework hero parallax layout for mobile.** Reduce card count on small screens and switch to a grid-like arrangement instead of percentage-based scatter.
2. **T7 -- Show parallax card titles on touch devices.** Add `@media (hover: none)` rule mirroring what already exists for `.project-thumb-label`.
3. **T8 -- Lazy-load off-screen hero images.** Only the first ~6 cards should be `loading="eager"`; the rest should be `loading="lazy"`.
4. **T21 -- Remove crisp-edges from photographs.** Delete two CSS lines.

### Batch 2: Fix the Sidebar and Navigation (T5 + T15)
These are related -- both concern the nav/sidebar behavior.

5. **T5 -- Add tablet breakpoint for sidebar.** Collapse sidebar to bottom bar at 768px instead of 600px, or add an intermediate state.
6. **T15 -- Restore social links on mobile.** Either include them in the bottom nav or add them to the about page.

### Batch 3: Fix Page-Level Responsive Issues (T19 + T20 + T26)
Small targeted CSS fixes for individual pages.

7. **T19 -- Make friends grid responsive.** Reduce photo size at small widths.
8. **T20 -- Make itch.io iframe responsive.** Remove HTML width/height, use CSS aspect-ratio wrapper.
9. **T26 -- Reduce logo strip gap on mobile.** Adjust gap at small breakpoints.

### Batch 4: Accessibility and Performance (T3 + T10 + T14 + T11 + T4)
Cross-cutting quality improvements.

10. **T3 -- Fix color contrast.** Darken all low-contrast text colors.
11. **T10 -- Add width/height to images.** Requires knowing intrinsic dimensions or using aspect-ratio.
12. **T14 -- Throttle parallax handler with rAF.** JS change.
13. **T11 -- Make Google Fonts non-render-blocking.** Use `media="print" onload="this.media='all'"` pattern or preload.
14. **T4 -- Add h1 headings to pages.**

### Batch 5: Build and Cleanup (T1 + T2 + T12 + T16 + T23 + T27 + T30)
Non-mobile fixes batched together.

15. **T1 -- Add sharp to package.json.**
16. **T2 -- Add error handling to build script.**
17. **T12 -- Delete dead hero components.**
18. **T16 -- Fix press links without href.**
19. **T23 -- Remove dead itchPageUrl.**
20. **T27 -- Fix "Vietman" typo.**
21. **T30 -- Strip UTF-8 BOM in parser.**

---

## 5. Specific CSS Changes Proposed

### T6 -- Hero Parallax Mobile Rework

**Strategy:** On mobile (<= 600px), hide the percentage-scatter layout and show a simpler grid of cards. On tablet (601-768px), reduce card count and compress the scatter.

**Option A (Recommended): CSS-only responsive scatter with fewer cards**

In `src/components/HeroParallax.astro`, add data attributes to cards to control visibility:

```
Frontmatter: Add `index` to each card's data for CSS targeting.
```

In the `<style>` block of `HeroParallax.astro`:

```css
/* Hide cards beyond index 7 on tablet, beyond 5 on mobile */
@media (max-width: 900px) {
  .parallax-card:nth-child(n+9) {
    display: none;
  }
}

@media (max-width: 600px) {
  .parallax-card:nth-child(n+7) {
    display: none;
  }

  /* Override scatter positions for remaining 6 cards into a 2x3 grid */
  .parallax-card {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    will-change: auto;
  }

  .hero-parallax {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    overflow: visible;
  }

  .parallax-card--portrait,
  .parallax-card--landscape {
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
  }
}
```

Wait -- this conflicts with the inline `style` attributes that set `left`, `top`, etc. Inline styles have high specificity. We need `!important` to override them, or we need to restructure. The `!important` approach is pragmatic here since it is scoped to the mobile breakpoint only.

**Revised approach for mobile:**

In `src/components/HeroParallax.astro` `<style>`:

```css
@media (max-width: 600px) {
  .hero-parallax {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
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

Also in `src/styles/app.css`, update `.hero-container` at 600px:

```css
@media (max-width: 600px) {
  .hero-container {
    width: 100%;
    height: auto;
    min-height: auto;
    max-height: none;
    overflow: visible;
  }
}
```

**For the 601-900px range (tablet with sidebar):**

```css
@media (max-width: 900px) {
  .parallax-card:nth-child(n+10) {
    display: none;
  }
}
```

This reduces from 14 to 9 cards. The remaining cards with positions up to `left: 60%` and sizes of 270x180 (landscape) would still overflow at narrower widths, but less severely. Consider also clamping the positions:

```css
@media (max-width: 900px) {
  .parallax-card--landscape {
    width: 220px;
    height: 148px;
  }
  .parallax-card--portrait {
    width: 155px;
    height: 217px;
  }
}
```

### T7 -- Show Card Titles on Touch Devices

In `src/components/HeroParallax.astro` `<style>`, add after the hover rule:

```css
@media (hover: none) {
  .parallax-card-title {
    opacity: 1;
    background: rgba(0, 0, 0, 0.6);
    padding: 4px 6px;
  }
}
```

This mirrors the existing pattern used for `.project-thumb-label` in `app.css` line 244.

### T5 -- Sidebar Tablet Breakpoint

**Strategy:** Move the sidebar collapse from 600px to 768px. This ensures iPads in portrait mode get the bottom-bar nav.

In `src/styles/app.css`, change the mobile breakpoint from `600px` to `768px`:

Actually, this is too aggressive. A better approach: add a new breakpoint at 768px that reduces the sidebar width, then collapse at 600px as before.

**Option A: Narrower sidebar at 768px**

```css
@media (max-width: 900px) and (min-width: 601px) {
  .sidebar {
    width: 180px;
    padding: 1.5rem 1rem;
  }
  .nav-item {
    font-size: 1.5rem;
  }
  .content {
    margin-left: 180px;
  }
}
```

**Option B (Recommended): Collapse sidebar at 768px instead of 600px**

Move ALL the sidebar-collapse rules from the `@media (max-width: 600px)` block to `@media (max-width: 768px)`. Keep other page-specific mobile rules at 600px. This gives tablets the full-width content area while phones and small tablets get the bottom nav.

Specific changes in `src/styles/app.css`:

Move these rules from the 600px block to a new 768px block:

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

  .sidebar-socials {
    display: none;  /* Will be addressed in T15 */
  }

  .content {
    margin-left: 0;
    padding: 1.2rem 1rem 4rem;
  }
}
```

Then the 600px block retains only the content-specific rules (hero, friends, etc.) that need further mobile adjustment.

### T15 -- Social Links on Mobile

**Strategy:** Add social links to the bottom of every page as a footer, OR add them as icons in the bottom nav bar.

**Option A (Simplest): Add social links to the about page.**

In `src/pages/about.astro`, add a new section at the bottom with the social links. This at least makes them reachable.

**Option B (Better): Include social icons in the mobile bottom nav.**

In `src/layouts/Layout.astro`, the social links are inside `.sidebar`. On mobile, they are hidden with `display: none`. Instead, we could show them inline in the bottom bar:

```css
@media (max-width: 768px) {
  .sidebar-socials {
    display: flex;
    margin-top: 0;
    padding-top: 0;
    gap: 0.5rem;
  }
  .sidebar-socials svg {
    width: 16px;
    height: 16px;
  }
}
```

This keeps the existing HTML and just un-hides the socials in the bottom nav, placing them alongside the 4 nav links. The bottom bar uses `justify-content: space-around`, so the social icons would appear after the nav items. We may need to adjust spacing.

**Risk:** The bottom bar could get crowded with 4 nav items + 3 social icons = 7 tappable items. At 320px, that is ~45px per item, which is right at the 44px minimum tap target. This is acceptable but tight. Consider grouping the social icons closer together or making them slightly smaller.

### T19 -- Friends Grid Responsive Photo Size

In `src/styles/app.css`, add:

```css
@media (max-width: 768px) {
  .friend-photo {
    width: 120px;
  }
}

@media (max-width: 400px) {
  .friend-photo {
    width: 100px;
  }
  .friend-card-top {
    gap: 1rem;
  }
}
```

At 320px with these changes: effective width 288px, photo 100px + gap 16px = 116px used, leaving 172px for text. This is a significant improvement over the current 104px.

### T20 -- itch.io Iframe Responsive

In `src/pages/works/[slug].astro`, change:

```html
<!-- Before -->
<iframe src={project.itch} width="552" height="167" frameborder="0"></iframe>

<!-- After -->
<iframe src={project.itch} title={`${project.title} on itch.io`}></iframe>
```

Remove HTML `width`, `height`, and `frameborder` attributes. The CSS already handles sizing:

```css
.itch-embed { max-width: 552px; }
.itch-embed iframe { border: none; width: 100%; }
```

Add a fixed height since the iframe has no intrinsic aspect ratio:

```css
.itch-embed iframe {
  border: none;
  width: 100%;
  height: 167px;
}
```

### T26 -- Logo Strip Gap on Mobile

In `src/styles/app.css`, add within the mobile breakpoint:

```css
@media (max-width: 600px) {
  .logo-strip {
    gap: 1rem 1.5rem;
  }
  .logo-strip img {
    height: 32px;
  }
}
```

At 320px (288px effective): two logos at ~100px width + 24px gap = 224px. Three could fit in some cases. Much better than the current one-per-line situation.

### T3 -- Color Contrast Fixes

All changes in `src/styles/app.css`:

| Selector | Current | Proposed | WCAG Ratio |
|----------|---------|----------|------------|
| `.nav-item` | `#767676` | `#595959` | 7.0:1 (AA+AAA) |
| `.nav-item:visited` | `#767676` | `#595959` | 7.0:1 |
| `.sidebar-socials a` | `#767676` | `#595959` | 7.0:1 |
| `.sidebar-socials a:visited` | `#767676` | `#595959` | 7.0:1 |
| `.timeline-year` | `#767676` | `#767676` | 4.48:1 at 4rem is large text, so 3:1 minimum applies. **Passes as-is for large text.** |
| `.about-subheading` | `#767676` at `opacity: 0.5` | `#767676` at `opacity: 1.0` (or change to `#595959`) | Remove opacity or darken |
| `.talk-name` / `a.talk-name` | `#888` | `#595959` | 7.0:1 |
| `.friend-project-tag` | `#888` | `#595959` | 7.0:1 |

Note: `#767676` on white is exactly 4.48:1, which passes AA for normal text (4.5:1 threshold -- it is borderline). But with `opacity: 0.5`, the `.about-subheading` effective color becomes approximately `#bbb` which is ~2.08:1 -- a severe failure. The simplest fix is to remove the `opacity: 0.5`.

Proposed exact changes:

```css
/* Line 44: .nav-item */
color: #595959;

/* Line 55: .nav-item:visited */
color: #595959;

/* Line 81: .sidebar-socials a */
color: #595959;

/* Line 86: .sidebar-socials a:visited */
color: #595959;

/* Line 401: .friend-project-tag */
color: #595959;

/* Line 536: .talk-name */
color: #595959;

/* Line 540: a.talk-name */
color: #595959;

/* Line 545: a.talk-name:visited */
color: #595959;

/* Line 558: .about-subheading -- color stays #767676 but remove opacity */
color: #767676;
opacity: 0.5;  /* DELETE this line */
```

Actually, `#767676` is 4.48:1 which rounds to below 4.5:1. Let me recalculate. The WCAG relative luminance of #767676 = 0.176. White = 1.0. Contrast = (1.0 + 0.05) / (0.176 + 0.05) = 1.05 / 0.226 = 4.646:1. This passes AA (>= 4.5:1). So `#767676` is fine for normal-sized text.

But `#888888` on white: luminance = 0.246. Contrast = 1.05 / 0.296 = 3.547:1. This FAILS AA.

Revised plan: change `#888` to `#767676` (maintains the aesthetic but just barely passes), or to `#666666` (luminance = 0.133, contrast = 1.05/0.183 = 5.74:1, comfortably passes).

I recommend `#666` for all instances of `#888`, and removing the `opacity: 0.5` from `.about-subheading`.

### T21 -- Remove crisp-edges

In `src/components/HeroParallax.astro`, delete lines 85-86:

```css
/* DELETE these two lines from .parallax-card img */
image-rendering: -webkit-optimize-contrast;
image-rendering: crisp-edges;
```

### T8 -- Lazy-Load Hero Images

In `src/components/HeroParallax.astro` frontmatter, change the positions map to include loading strategy:

```js
const positions = shuffled.map((p, i) => ({
  ...p,
  ...layouts[i],
  zIndex: Math.floor(layouts[i].depth * 10),
  isPortrait: p.coverOrientation === 'portrait',
  loading: i < 6 ? 'eager' : 'lazy',
}))
```

Then in the template:

```html
<img src={p.cover} alt={p.title} loading={p.loading} decoding="async" />
```

The first 6 cards (which have the smallest `top` values and are most likely visible) load eagerly; the remaining 8 load lazily.

### T14 -- Throttle Parallax with rAF

In `src/components/HeroParallax.astro` `<script>`, refactor:

```js
// Cache depth values at initialization
const depthMap = new Map()
cards.forEach(card => {
  depthMap.set(card, parseFloat(card.style.getPropertyValue('--depth')))
})

let rafId = null

function handleMove(clientX, clientY) {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    const rect = container.getBoundingClientRect()
    const dx = (clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (clientY - rect.top - rect.height / 2) / (rect.height / 2)

    cards.forEach(card => {
      const depth = depthMap.get(card)
      const rotation = card.dataset.baseRotation || '0'
      card.style.transform = `rotate(${rotation}deg) translate(${dx * depth * MAX_SHIFT}px, ${dy * depth * MAX_SHIFT}px)`
    })
    rafId = null
  })
}
```

### T11 -- Non-Blocking Google Fonts

In `src/layouts/Layout.astro`, change line 32:

```html
<!-- Before -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet" />

<!-- After -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" /></noscript>
```

The `display=swap` is already in the URL, which is good -- it means the font will not block rendering even if the CSS loads synchronously. But the `<link rel="stylesheet">` itself still blocks initial render while the browser fetches the CSS file. The preload pattern defers the CSS loading.

### T10 -- Width/Height on Images

This is the most labor-intensive fix. Every `<img>` needs dimensions. Options:

**For hero parallax cards:** The CSS sets explicit width/height on the cards, and the images are `object-fit: cover`. The images themselves do not need width/height because the container constrains them. However, adding explicit dimensions helps during the brief period before CSS loads.

**For project thumbnails:** Controlled by `.project-thumb` at 400x300 (desktop), 300x225 (tablet), 100%x auto with `aspect-ratio: 4/3` (mobile). Since the img is `width: 100%; height: 100%; object-fit: cover;`, the parent dimensions control the space. CLS is minimal because the parent has explicit dimensions.

**For friend photos:** `.friend-photo` has `width: 160px` and no height (determined by content). This DOES cause CLS. Add `aspect-ratio` or explicit height:

```css
.friend-photo {
  width: 160px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}
```

**For about photo:** `.about-photo` has `width: 200px` and `align-self: stretch` (height fills the parent). CLS is moderate. Add:

```css
.about-photo {
  aspect-ratio: 3 / 4;
}
```

**For logo images:** `.logo-strip img` has `height: 44px; width: auto;`. The width is unpredictable. Add explicit `width` and `height` attributes to each `<img>` in `about.astro` matching their intrinsic sizes.

**For project media images:** `.project-media-img` has `width: calc(50% - 0.75rem); height: auto;`. These cause CLS. Add `aspect-ratio` as a fallback. This requires knowing the aspect ratio of each image, which would need build-time detection (similar to the existing sharp-based orientation detection). This is medium effort.

**Pragmatic approach:** Add `aspect-ratio` to CSS for friend photos and about photo. For project media, accept some CLS for now (or extend the build script to detect dimensions).

---

## 6. Risk Assessment

### High Risk

**T6 (Hero rework):**
- **Risk:** The mobile grid fallback uses `!important` to override inline styles. If the breakpoint threshold changes, or if someone adds new cards, the `nth-child` selectors could show/hide wrong cards.
- **Mitigation:** Use a CSS class applied via a media-query-aware approach, or move card visibility to the Astro template (render fewer cards conditionally using Astro's server-side rendering).
- **Risk:** The parallax JS still tries to transform cards on mobile. With `position: relative` and `transform: none !important`, the JS transforms will be overridden by CSS, but the JS still runs and reads DOM properties.
- **Mitigation:** Also disable the parallax JS on mobile by checking `window.matchMedia('(max-width: 600px)')` and skipping the touchmove listener.

**T5 (Sidebar breakpoint change):**
- **Risk:** Moving the sidebar collapse from 600px to 768px means that all the content rules currently inside the 600px block that depend on `margin-left: 0` and `padding: 1.2rem 1rem` would need to also move to 768px. If some rules are left at 600px, there will be a 601-768px range where the sidebar is collapsed but content still has `margin-left: 270px`, creating a huge left margin with no sidebar visible.
- **Mitigation:** Carefully audit every rule in the 600px block. Rules about sidebar/layout/content go to 768px. Rules about specific component sizing (hero height, project thumb sizing, etc.) can stay at 600px or be split.
- **Risk:** The 900px breakpoint currently adjusts `.project-thumb` and `.content` padding. If we move sidebar collapse to 768px, the 768-900px range now has no sidebar and full-width content but with the 900px-breakpoint thumb sizes (300x225). This is actually fine -- those sizes work well in full-width.

### Medium Risk

**T3 (Color contrast):**
- **Risk:** Darkening nav colors from `#767676` to `#595959` changes the visual weight of the navigation. The designer may have specifically chosen the lighter gray for aesthetic reasons.
- **Mitigation:** The change is subtle (~17% darker). Test visually. The active state is already `#222`, so the contrast between active and inactive nav items increases slightly.

**T15 (Social links in bottom nav):**
- **Risk:** Adding 3 more tappable items to the mobile bottom bar could make it feel crowded, especially at 320px width.
- **Mitigation:** Consider making the social icons smaller (14-16px) and grouping them with a smaller gap. Or add them only to the about page.

**T10 (Width/height on images):**
- **Risk:** Using `aspect-ratio` in CSS for friend photos assumes all photos are approximately 3:4 portrait. If some are landscape or square, the `object-fit: cover` will crop them differently than expected.
- **Mitigation:** The build script already detects orientation for project covers. Extend it to include friend photo dimensions in the JSON, then use those values.

### Low Risk

**T7, T8, T21, T26, T20, T14, T11:** These are all low-risk, targeted changes that modify a few lines and have obvious, verifiable effects. They are unlikely to break anything.

**T19 (Friends photo resize):**
- **Risk:** Reducing photo width from 160px to 100px at small breakpoints changes the visual balance of the card. Very small photos might look odd.
- **Mitigation:** Test at 320px and 375px. 100px is still a meaningful photo size -- roughly 1 inch on most phones.

---

## Summary

The mobile experience of this portfolio is seriously broken in three areas: (1) the hero parallax is unusable below 900px effective width, (2) the sidebar creates a severe content squeeze between 600-900px, and (3) several content elements (social links, itch.io iframes, friend photos) are either hidden or overflow on mobile.

The recommended implementation order tackles these in 5 batches, starting with the hero (most visible, most broken), then the sidebar/nav, then page-specific fixes, then accessibility/performance, and finally build/cleanup tasks. Nine of the 30 tasks should be skipped or deferred due to scope, risk, or negligible user impact.

The riskiest change is the hero parallax mobile rework (T6) because it requires overriding inline styles with `!important` and potentially restructuring the JS behavior. The sidebar breakpoint change (T5) is the second riskiest because moving rules between breakpoints could create gaps if not done carefully. All other changes are low to medium risk.
