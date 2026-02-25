# Path A -- Pragmatic Minimalist Implementation Proposal

**Author:** Implementation Engineer A
**Date:** 2026-02-24
**Philosophy:** Least work, maximum impact. Fix what is broken, skip what is cosmetic. Ship fast.

---

## 1. Tasks to DO (with rationale)

### T1 -- Add `sharp` to package.json
**Effort:** Trivial (one line change)
**Why:** The build literally depends on sharp for cover orientation detection. If Astro ever drops it as a transitive dependency, the entire build breaks with no clear error. This is a 10-second fix that prevents a future catastrophic failure.

### T2 -- Add `.catch()` to `buildAll()`
**Effort:** Trivial (3-4 lines)
**Why:** An unhandled promise rejection on build is a real usability problem -- you get a confusing stack trace instead of a helpful error message. The directory guard for `aboutDir` is also worth adding since `findPhoto(aboutDir)` calls `fs.readdirSync` which throws if the directory does not exist. Skip the media-existence validation part -- that is a nice-to-have, not a breakage.

### T3 -- Fix WCAG color contrast
**Effort:** Small (update ~6 color values in app.css)
**Why:** The `.about-subheading` at `#767676` with `opacity: 0.5` is genuinely unreadable. The `#888` colors on `.talk-name` and `.friend-project-tag` also fail AA. These are real accessibility failures that affect real users. The fix is straightforward: darken the colors, remove or reduce the opacity multiplier.

### T4 -- Add `<h1>` headings to pages
**Effort:** Small (one tag per page, ~5 files)
**Why:** Zero `<h1>` on the entire site is confirmed. This hurts SEO and screen reader navigation. Each page just needs one appropriate `<h1>`. For index.astro it could be a visually-hidden "Divya -- Artist Portfolio". For works, friends, about, the existing section titles can be promoted. The timeline year dividers being `<div>` is a lower priority -- I would skip converting those to `<h2>` for now since it risks visual regression.

### T5 -- Add tablet breakpoint (600-900px range)
**Effort:** Medium (CSS changes, needs testing)
**Why:** This is directly user-reported. At 768px (iPad portrait), a 270px sidebar leaves only 498px for content. The fix: add a breakpoint around 768px that either collapses the sidebar to a top bar or reduces its width significantly (e.g., 180px). I lean toward collapsing at 768px (matching the mobile behavior) since building a third sidebar layout is more complexity for marginal gain. Effectively, move the mobile breakpoint from 600px up to 768px.

### T6 -- Fix hero parallax overflow on mobile
**Effort:** Medium (CSS + minor template changes)
**Why:** This is the primary mobile issue. 14 cards with absolute positions at `left: 78%` spill off-screen. The pragmatic fix: at mobile sizes (under 768px), show fewer cards (e.g., the first 6-8) and reposition them with tighter percentages that stay within bounds. OR: hide the parallax entirely on mobile and show a simpler single-image hero. I favor the latter -- it is more reliable and the parallax is a desktop experience anyway. A simple CSS `display: none` on `.hero-parallax` at mobile, replaced by a static cover image grid or just the intro text, is the least-risk approach.

### T7 -- Show card titles on touch devices
**Effort:** Small (CSS only)
**Why:** Titles are hover-only, so touch users cannot see what projects the hero cards link to. Add a `@media (hover: none)` rule that makes `.parallax-card-title` always visible (opacity: 1), similar to what already exists for `.project-thumb-label` in the works timeline. This is a one-liner CSS addition.

### T8 -- Lazy-load below-fold hero images
**Effort:** Small (template logic)
**Why:** 14 images all `loading="eager"` is a page-weight problem, especially on mobile. The fix: cards at `top >= 50%` should use `loading="lazy"`. This is a simple conditional in the template. Roughly cards 10-14 (those at top: 52-74%) get lazy loading.

### T11 -- Non-blocking Google Fonts
**Effort:** Small (change one `<link>` tag)
**Why:** Render-blocking font load is the #1 perceived performance issue on slow connections. The font link already uses `display=swap` in the Google Fonts URL, but the stylesheet itself blocks rendering. The pragmatic fix: add `<link rel="preload" href="..." as="style" onload="this.onload=null;this.rel='stylesheet'">` with a `<noscript>` fallback. Alternatively, just add `media="print" onload="this.media='all'"` to the existing link -- a well-known pattern.

### T12 -- Delete dead hero components
**Effort:** Trivial (delete 2 files)
**Why:** HeroKaleidoscope.astro and HeroSlideshow.astro are never imported. 380 lines of dead code. Deleting them reduces confusion and maintenance surface. Zero risk since they are not referenced anywhere.

### T15 -- Make social links accessible on mobile
**Effort:** Small (template + CSS)
**Why:** Social icons completely vanish on mobile (`display: none`). Users on phones have no way to reach Instagram/LinkedIn/Substack. The pragmatic fix: add social icons to the about page (they are already thematically appropriate there), or add them as a simple row at the bottom of the mobile nav bar.

### T16 -- Conditional press link rendering
**Effort:** Trivial (template change)
**Why:** Confirmed in about.astro line 88: `<a href={p.url}>` renders even when `p.url` is undefined. The fix is a ternary: if `p.url` exists, render `<a>`, otherwise render `<span>`. Three lines of code.

### T20 -- Responsive itch.io iframe
**Effort:** Small (CSS)
**Why:** Hardcoded `width="552"` overflows on any screen under 552px. The `.itch-embed` container already has `max-width: 552px` and `width: 100%` on the iframe, but the inline `width="552"` attribute on the iframe itself overrides the CSS. Remove the hardcoded width/height attributes and let CSS control sizing. Also remove the deprecated `frameborder="0"`.

### T21 -- Remove `crisp-edges` from photographs
**Effort:** Trivial (delete 2 CSS lines)
**Why:** `image-rendering: crisp-edges` is for pixel art, not photographs. It makes photos look harsh. Confirmed at lines 85-86 in HeroParallax.astro's scoped style. Delete both `image-rendering` lines.

### T23 -- Remove dead `itchPageUrl`
**Effort:** Trivial (delete 1 line)
**Why:** Line 20 of `[slug].astro` computes `itchPageUrl` but never uses it. Dead code -- remove it.

### T27 -- Fix "Vietman" typo
**Effort:** Trivial (edit info.txt)
**Why:** It is a typo in a project title that renders on the live site. Confirmed at `public/projects/2024/(un)seen Vietman/info.txt`. One character fix.

### T30 -- Strip UTF-8 BOM in parseInfo
**Effort:** Trivial (one line)
**Why:** The developer is on Windows. Windows text editors frequently add BOM. If the first line of any info.txt has a BOM, the first key will be corrupted. Add `.replace(/^\uFEFF/, '')` after `readFileSync`. One line, prevents a real subtle bug.

---

## 2. Tasks to SKIP (with rationale)

### T9 -- WebP/AVIF and srcset
**Skip.** This is a large undertaking (image pipeline, build integration, template rewrites across every page). The existing optimize-images.js script is broken (converts PNG to JPG losing transparency). Building a proper image pipeline is a project unto itself. The bandwidth savings are real but this is a portfolio site, not a high-traffic app. Do this later as a dedicated effort.

### T10 -- Width/height attributes on images
**Skip for now.** This requires knowing the intrinsic dimensions of every image at build time. The build script already uses sharp for cover orientation -- extending it to emit width/height is feasible but touches the data pipeline and every template. Medium effort, moderate reward. Recommend doing this when T9 (image pipeline) is tackled since they are related.

### T13 -- Split monolithic app.css
**Skip.** Moving styles into scoped `<style>` blocks across 6+ pages is a large refactor with high regression risk and near-zero user-visible impact. The entire CSS file is 714 lines -- this is not a performance bottleneck. Astro inlines it anyway, so there is no extra HTTP request. The maintenance benefit is real but not urgent.

### T14 -- Throttle mousemove with rAF
**Skip.** The performance cost of updating transforms on 14 elements per mousemove is negligible on modern browsers. The `will-change: transform` is already set, so the browser composites efficiently. The cached depth values optimization saves microseconds. Not worth the code churn.

### T17 -- Hardcoded values should be data-driven
**Skip.** The `mentionNames` set, the `linkifyBio` hardcoded string, and the logo strip are all stable data that changes rarely. Making them data-driven adds complexity (new info.txt fields, new parsing logic) for zero user-visible benefit. When the data actually changes, a developer can update the code.

### T18 -- CSS custom properties / design tokens
**Skip.** This is a refactoring task with no user-visible impact. The site has ~20 color values. A find-and-replace when needed is fine. If the T3 contrast fix is done properly with clear values, there is no urgent need.

### T19 -- Friends grid tablet breakpoint
**Skip separately.** This is naturally addressed if T5 moves the mobile breakpoint from 600px to 768px, since the friends grid already goes single-column at the mobile breakpoint. No extra work needed.

### T22 -- Biased shuffle
**Skip.** The visual result of a slightly biased shuffle of 14 hero cards is imperceptible. Nobody will notice or care. Fisher-Yates is "correct" but the current approach works fine in practice.

### T24 -- Sequential sharp operations
**Skip.** Build speed is not a reported problem. The project count is small (likely under 50). This optimization would save maybe 1-2 seconds on a build that is already fast.

### T25 -- Stale CLAUDE.md
**Skip.** CLAUDE.md referencing `src/data/data.js` which does not exist is mildly confusing to AI tools, not to users. Low priority.

### T26 -- Logo strip spacing on mobile
**Skip separately.** If T5 moves the mobile breakpoint to 768px, this gets a free improvement. The remaining issue at 375px with `3rem` gap can be fixed if still broken after T5, but is minor.

### T28 -- box-shadow transition paint cost
**Skip.** Negligible performance impact on modern GPUs. Hover is desktop-only. Not worth touching.

### T29 -- Unused hasgeek.png
**Skip.** Confirmed: `hasgeek.png` exists in `public/logos/` but is not referenced in any template. It is ~15KB likely. Not worth a commit by itself, but could be bundled with T12 (dead code cleanup).

---

## 3. Proposed Implementation Order

### Batch 1: Zero-Risk Cleanup (trivial, no visual changes)
**Estimated Complexity: Small**

1. **T1** -- Add `sharp` to package.json dependencies
2. **T2** -- Add `.catch()` on `buildAll()` + guard `aboutDir` existence
3. **T30** -- Add BOM stripping to `parseInfo` / `parseFriendInfo`
4. **T12** -- Delete `HeroKaleidoscope.astro` and `HeroSlideshow.astro`
5. **T23** -- Delete unused `itchPageUrl` variable in `[slug].astro`
6. **T27** -- Fix "Vietman" -> "Vietnam" typo in info.txt
7. **T29** -- Delete unused `hasgeek.png` (bundle with cleanup)

**Verification:** Run `npm run build` -- it should succeed with no errors. No visual changes expected.

---

### Batch 2: Quick Visual/Accessibility Fixes (small, targeted CSS + template edits)
**Estimated Complexity: Small**

8. **T3** -- Fix color contrast values in app.css:
   - `.about-subheading`: change to `color: #595959` and remove `opacity: 0.5`
   - `.talk-name` and `a.talk-name`: change `#888` to `#595959`
   - `.friend-project-tag`: change `#888` to `#595959`
   - `.nav-item` and `.sidebar-socials a`: `#767676` passes 4.54:1 on white -- borderline. Darken to `#6b6b6b` for safe margin.
9. **T4** -- Add `<h1>` to each page:
   - `index.astro`: Add visually-hidden `<h1>` "Divya -- Artist Portfolio"
   - `works/index.astro`: Promote or add `<h1>Works</h1>` (can style to match current look)
   - `works/[slug].astro`: Change `.project-detail-title` from `<h2>` to `<h1>`
   - `friends.astro`: Add `<h1>` "Friends" (visually-hidden or styled)
   - `about.astro`: Add `<h1>` "About" (visually-hidden or styled)
10. **T21** -- Remove `image-rendering: crisp-edges` from parallax card images
11. **T16** -- Conditional `<a>` vs `<span>` for press items in about.astro

**Verification:** Visual inspection on desktop. Check contrast with browser dev tools. Run Lighthouse accessibility audit. Confirm no heading hierarchy warnings.

---

### Batch 3: Mobile Layout Fixes (the core mobile issues)
**Estimated Complexity: Medium**

12. **T5** -- Move the mobile breakpoint from 600px to 768px. This means:
    - Change `@media (max-width: 600px)` to `@media (max-width: 768px)` in app.css
    - Adjust the 900px tablet breakpoint to work with the new 768px mobile breakpoint (the range is now 768-900px instead of 600-900px, which is a narrow and manageable range)
    - This also naturally fixes T19 (friends grid) and helps T26 (logo strip)
13. **T6** -- Hide parallax hero on mobile, show static fallback:
    - At `max-width: 768px`, hide `.hero-parallax` via CSS
    - Show a simple static alternative (e.g., a single featured project image, or just let the intro text stand alone since `.home-section` already column-reverses on mobile)
    - If going with the simplest approach: just hide the hero container on mobile and let the intro text be the full mobile home page. This is a valid design choice for a portfolio site.
14. **T7** -- Add `@media (hover: none)` rule for `.parallax-card-title` to show titles always on touch
15. **T20** -- Remove hardcoded width/height from itch.io iframe, remove `frameborder`

**Verification:** Test on mobile viewport sizes (375px, 414px, 768px) using browser dev tools. Check iPad portrait (768px) layout specifically. Verify itch.io embed does not overflow. Verify hero does not overflow or show clipped cards.

---

### Batch 4: Performance Quick Wins
**Estimated Complexity: Small**

16. **T8** -- Change hero images to `loading="lazy"` for cards with `top >= 50%` (roughly the bottom half). Keep top cards as `loading="eager"`.
17. **T11** -- Make Google Fonts non-render-blocking using `media="print" onload="this.media='all'"` pattern with `<noscript>` fallback.
18. **T15** -- Add social links to the about page (add a small social icons section near the email link, reusing the same SVG icons from the sidebar).

**Verification:** Run Lighthouse performance audit. Confirm fonts still load (test with cache cleared). Confirm social links appear on mobile about page.

---

## 4. Complexity Summary

| Batch | Description | Complexity | Tasks | Files Touched |
|-------|-------------|------------|-------|---------------|
| 1 | Zero-risk cleanup | Small | T1, T2, T30, T12, T23, T27, T29 | 4 files + 3 deletions |
| 2 | Accessibility fixes | Small | T3, T4, T21, T16 | 7 files |
| 3 | Mobile layout | Medium | T5, T6, T7, T20 | 3 files |
| 4 | Performance wins | Small | T8, T11, T15 | 3 files |

**Total: 18 tasks addressed out of 30.** 12 skipped (all justified above).

---

## 5. Risk Assessment

### Batch 1 Risks: Very Low
- Deleting dead components has zero risk (no imports).
- Adding sharp to package.json has zero risk.
- The typo fix and BOM stripping are low risk.
- **Mitigation:** Run `npm run build` after changes.

### Batch 2 Risks: Low
- Color changes could make text too dark or change the aesthetic feel. The designer should review.
- Adding `<h1>` tags requires a `visually-hidden` utility class to avoid disrupting the visual layout. Need to define a `.sr-only` class.
- Removing `crisp-edges` may subtly change how photos render -- likely for the better, but worth a visual check.
- **Mitigation:** Side-by-side screenshot comparison before/after.

### Batch 3 Risks: Medium
- **Moving the breakpoint from 600px to 768px is the highest-risk change.** Every mobile style rule shifts to a wider range. Elements that currently have desktop styling at 700px will now get mobile styling. Need to test thoroughly at 768px, 769px (the transition point), and common tablet sizes.
- Hiding the hero on mobile is a design decision, not just an engineering one. The site owner may want the parallax experience on mobile. Alternative: show just 4-6 cards with safe positions. This decision should be confirmed with the user.
- The itch.io iframe fix (removing width/height attributes) could change sizing on desktop if CSS does not fully compensate. The `.itch-embed` wrapper has `max-width: 552px` which should handle it, but needs testing.
- **Mitigation:** Test on real devices or accurate simulators at 375px, 414px, 768px, 1024px. Test with actual itch.io embeds.

### Batch 4 Risks: Low
- The font-loading pattern (`media="print" onload`) is well-established but could cause a brief FOUT (flash of unstyled text) while the font loads. The `display=swap` in the Google Fonts URL already handles this, so the visual impact should be minimal.
- Adding social links to the about page requires duplicating SVG icons -- minor code duplication, but straightforward.
- Lazy-loading hero images below the fold is safe; the worst case is a brief placeholder before images load, which is acceptable for off-screen content.
- **Mitigation:** Test on throttled connection (Slow 3G) to verify font and image loading behavior.

### Overall Risk Assessment
The riskiest single change is T5 (breakpoint adjustment). If this causes unexpected layout issues, it may need fine-tuning across several CSS rules. The safest approach is to test Batch 3 incrementally: apply T5 first, verify, then layer on T6/T7/T20.

---

## Summary

This plan addresses 18 of 30 tasks, covering all 5 Critical items, 5 of 7 High items, and 8 other items. The 12 skipped tasks are either large-effort refactors (T9, T10, T13, T18), premature optimizations (T14, T24, T28), or matters that resolve themselves once higher-priority fixes land (T19, T26). The plan is organized in 4 batches that can each be verified independently, starting with zero-risk changes and building toward the mobile layout fixes that carry the most risk but deliver the most user-visible improvement.
