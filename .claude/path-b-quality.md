# Path B -- Quality Purist Implementation Proposal

**Engineer:** Implementation Engineer B
**Philosophy:** Do things right. Fix structural issues, not just symptoms. Technical debt compounds.
**Date:** 2026-02-24

---

## 1. Task Disposition: DO vs SKIP

### Tasks to DO (23 of 30)

| ID | Title | Rationale |
|----|-------|-----------|
| **T1** | sharp not in package.json | **Non-negotiable.** Relying on transitive dependencies is a build-time bomb. One `npm update` or Astro major version change breaks the entire build with a cryptic "Cannot find module" error. A one-line fix to `package.json` eliminates this risk permanently. |
| **T2** | Build script error handling | **Non-negotiable.** An unhandled promise rejection on `buildAll()` crashes the process with exit code 1 but no useful message. The `findPhoto(aboutDir)` call will throw `ENOENT` if `public/about/` is missing. For a build script that runs on every `npm run dev`, this needs to fail gracefully with actionable messages. |
| **T3** | WCAG color contrast failures | **Non-negotiable.** `.about-subheading` at `#767676` with `opacity: 0.5` produces ~2.08:1 contrast -- this fails even WCAG Level A. The `.talk-name` and `.friend-project-tag` at `#888` on white are 3.54:1, failing AA. These are not edge cases; they affect anyone reading in sunlight on a phone. Fix by darkening colors and removing the destructive `opacity: 0.5`. |
| **T4** | No h1 headings on any page | **Non-negotiable.** Zero `<h1>` elements across the entire site. Verified: `grep -r "<h1" src/` returns nothing. This violates the most basic HTML heading hierarchy requirement, harms SEO (search engines use `<h1>` as primary page heading signal), and makes screen-reader landmark navigation useless. Each page needs exactly one `<h1>`. |
| **T5** | Sidebar breaks 600-900px | **High value.** Between 600px and 900px, the 270px fixed sidebar leaves only 330-630px for content. On an iPad portrait (768px), the content area is 498px -- barely enough for the works grid. Adding a tablet breakpoint around 768px to collapse or narrow the sidebar is essential for tablet users. |
| **T6** | Hero parallax overflow on mobile | **High value, highest complexity.** 14 cards with absolute positioning at percentages like `left: 78%` overflow on any screen under ~500px. At 375px, cards positioned at `left: 72-78%` extend to ~410px, creating horizontal scroll. The mobile breakpoint reduces card sizes but does not reposition them. Needs a fundamentally different approach on small screens. |
| **T7** | Card titles invisible on touch | **High value.** Verified: `.parallax-card-title` uses `opacity: 0` with reveal only on `.parallax-card:hover`. There is no `@media (hover: none)` rule for this element (unlike `.project-thumb-label` on the works page, which correctly has one). Touch users see cards with no text -- they cannot identify what the hero images link to. |
| **T8** | 14 hero images loaded eagerly | **High value.** All 14 images use `loading="eager"`. Cards at `top: 54-74%` are well below the fold, especially on mobile where the container is only 60vh. Changing below-fold cards to `loading="lazy"` is a straightforward win -- approximately 8-10 images moved to lazy, saving potentially 2-5MB on initial load. |
| **T10** | No width/height on images (CLS) | **High value.** Confirmed: zero `<img>` elements across the site specify `width` and `height` attributes (only the itch.io iframe has dimensions). This causes layout shift on every image load. For the works grid, friends grid, and project detail pages, this is highly visible. CLS directly affects Core Web Vitals scores. |
| **T11** | Google Fonts render-blocking | **Medium-high value.** Line 32 of `Layout.astro` loads Montserrat via a synchronous `<link rel="stylesheet">`. On 3G connections, this adds 500ms-2s of blank screen time. The fix is well-established: use `<link rel="preload" as="style" onload="this.rel='stylesheet'">` with a `<noscript>` fallback. |
| **T12** | Dead hero components | **Medium value, easy win.** `HeroKaleidoscope.astro` and `HeroSlideshow.astro` exist and are never imported. Verified: no import statements reference them. The Kaleidoscope component contains a `setInterval` never cleared. Removing ~380 lines of dead code eliminates confusion for future maintainers. |
| **T14** | mousemove not rAF-throttled | **Medium value.** The mousemove handler in `HeroParallax.astro` (line 150-155) calls `getPropertyValue('--depth')` on every card for every mouse event. At 60Hz, that is 14 style reads per frame. Wrapping in `requestAnimationFrame` and caching `--depth` values eliminates redundant work. |
| **T15** | Social links hidden on mobile | **High value.** At `max-width: 600px`, `.sidebar-socials` is set to `display: none` (line 651-652 of app.css). There is no alternative placement. Users on mobile literally cannot reach the Instagram, LinkedIn, or Substack links from any page. This is a content accessibility failure. |
| **T16** | Press links render without href | **Medium value.** In `about.astro` line 88, `<a href={p.url}>` renders regardless of whether `p.url` exists. Currently all press entries have URLs, but the code will break silently when a press item without a URL is added. Fix now while the pattern is visible. |
| **T20** | itch.io iframe not responsive | **High value for mobile.** The iframe at `[slug].astro` line 39 uses `width="552" height="167"`. On any screen under 552px, this overflows. The fix is straightforward: remove inline width/height, use CSS `width: 100%` with an aspect-ratio wrapper. |
| **T21** | crisp-edges on photographs | **Medium value.** `image-rendering: crisp-edges` (HeroParallax.astro line 86) is designed for pixel art. Applied to photographs, it produces visible aliasing artifacts, especially on mobile where images are scaled down. Remove it -- the browser's default bilinear filtering is correct for photos. |
| **T22** | Biased shuffle algorithm | **Low effort, correctness fix.** `Math.random() - 0.5` sort produces measurably non-uniform distributions. A Fisher-Yates shuffle is 4 lines of code and is correct. When correctness costs almost nothing, there is no reason to leave incorrect code. |
| **T23** | itchPageUrl dead code | **Trivial.** Line 20 of `[slug].astro` computes `itchPageUrl` and never uses it. One line to delete. |
| **T25** | Stale CLAUDE.md | **Low effort.** `CLAUDE.md` references `src/data/data.js` which does not exist. Verified: the file is gone. The about data now lives in `generated-about.json`. Stale docs actively mislead. |
| **T26** | Logo strip spacing on mobile | **Medium value for mobile.** The logo strip uses `gap: 2rem 3rem`. On a 375px screen with ~343px usable width after padding, 3rem column gap (48px) is excessive. Logos wrap to near single-column. Reducing to `1rem` at the mobile breakpoint fixes this. |
| **T27** | Typo: "Vietman" | **Trivial.** Verified: `public/projects/2024/(un)seen Vietman/info.txt` line 1 reads `title: (un)seen Vietman`. This is a content error visible to users. The folder name also contains the typo, but changing that would require updating the slug. The title in `info.txt` is the minimal fix. Note: changing the folder name is more invasive and should be considered separately. |
| **T29** | Unused hasgeek.png | **Trivial.** `public/logos/hasgeek.png` exists on disk. Verified: zero references to "hasgeek" in any `src/` file. It ships to production for no reason. Delete it. |
| **T30** | UTF-8 BOM on Windows | **Important for this project.** The dev environment is Windows 11 (confirmed by env context). Notepad and other Windows editors can silently prepend `\xEF\xBB\xBF` to files. The `parseInfo` function reads the first line as a key-value pair; a BOM would corrupt the first key (e.g., `\xEF\xBB\xBFtitle` instead of `title`). This is a real risk on this specific machine. Add `.replace(/^\uFEFF/, '')` after `readFileSync`. |

### Tasks to SKIP (7 of 30)

| ID | Title | Rationale |
|----|-------|-----------|
| **T9** | No WebP/AVIF or srcset | **Skip for now.** This is a significant infrastructure change: either wire `optimize-images.js` into the build (which currently converts all PNGs to JPG, losing transparency), or implement Astro's `<Image>` component across all pages. The existing `optimize-images.js` script has destructive behavior (converts PNG to JPG). Doing this correctly requires designing a proper image pipeline, which is a separate project. The other image fixes (T8 lazy loading, T10 width/height) capture the most impactful gains without this risk. |
| **T13** | Monolithic app.css | **Skip for now.** At 714 lines, `app.css` is not large enough to cause a real performance problem -- when inlined by Astro, the total CSS payload is under 15KB uncompressed, which gzips to roughly 3-4KB. Splitting into per-page scoped styles is architecturally cleaner but carries high risk of breaking the cascade, missing edge cases, and introducing regressions. The benefit-to-risk ratio is unfavorable at this stage. Revisit after all mobile/responsive fixes are stable. |
| **T17** | Hardcoded values should be data-driven | **Skip.** The `mentionNames` set, `linkifyBio` hardcoding, and logo strip HTML are pragmatic choices for a personal portfolio with slow-changing data. Making these data-driven adds abstraction without clear benefit -- the owner updates this site manually and infrequently. The sidebar width duplication is real but better addressed by T18 (CSS custom properties). |
| **T18** | No CSS custom properties | **Skip for now.** Introducing design tokens is architecturally nice but changes the foundation of `app.css` while we are also making responsive fixes (T5, T6, T19, T26). Doing both simultaneously increases merge conflict risk and makes debugging harder. Better to stabilize the responsive layout first, then refactor to custom properties in a separate pass. |
| **T19** | Friends grid breaks on tablets | **Partially addressed by T5.** The tablet breakpoint added for T5 (sidebar collapse at ~768px) will give the friends grid more horizontal space. The remaining issue (160px fixed photo width) is minor and can be addressed in a follow-up. Attempting both T5 and T19 together risks conflicting CSS changes. |
| **T24** | Sequential sharp in build | **Skip.** The current project has ~20-30 projects. Sequential `sharp` calls complete in under 2 seconds. Premature optimization for a build script that runs in < 3 seconds total. Revisit if the project grows to 100+ entries. |
| **T28** | box-shadow transition paint cost | **Skip.** This only applies on hover (desktop only). Modern GPUs handle `box-shadow` transitions without visible jank. The pseudo-element technique adds complexity for no perceptible improvement. |

---

## 2. Proposed Implementation Order

The ordering follows this principle: **fix what can break the build first, then fix what users cannot use, then fix what users experience poorly, then clean up.**

### Batch 1: Build Reliability (foundational -- everything depends on a working build)

| Step | Task | What to do |
|------|------|------------|
| 1 | **T1** | Add `"sharp": "^0.33.0"` to `package.json` dependencies. Run `npm install` to verify. |
| 2 | **T2** | Add `.catch()` to `buildAll()`, guard `findPhoto(aboutDir)` with `fs.existsSync`, add BOM stripping (**T30** folded in here). |
| 3 | **T30** | *(Folded into T2)* Add `.replace(/^\uFEFF/, '')` to all `readFileSync` calls in `parseInfo` and `parseFriendInfo`. |

**Estimated complexity:** Small
**Files touched:** `package.json`, `scripts/build-projects.js`
**Risk:** Very low. These are additive changes to the build script. Test by running `npm run build` and verifying output.

### Batch 2: Accessibility Foundations (standards compliance -- affects all users on all devices)

| Step | Task | What to do |
|------|------|------------|
| 4 | **T4** | Add `<h1>` to each page: "Divya" on index, "Works" on works/index, project title on [slug], "Friends" on friends, "About" on about. Demote existing `<h2>` section titles as needed. Ensure visual styling matches current appearance (use CSS to style the `<h1>` to match). |
| 5 | **T3** | Fix contrast: change `.about-subheading` to `color: #595959` and remove `opacity: 0.5`. Change `.talk-name` and `a.talk-name` from `#888` to `#595959`. Change `.friend-project-tag` from `#888` to `#595959`. Verify all `#767676` usages -- `.nav-item` and `.sidebar-socials a` are large/bold text (passes at 3:1) so those are acceptable. `.timeline-year` at `#767676` is 4rem/200 weight -- verify contrast ratio for large text. |
| 6 | **T16** | In `about.astro`, conditionally render press links: `{p.url ? <a ...> : <span>}`. |

**Estimated complexity:** Small-Medium
**Files touched:** `src/pages/index.astro`, `src/pages/works/index.astro`, `src/pages/works/[slug].astro`, `src/pages/friends.astro`, `src/pages/about.astro`, `src/styles/app.css`
**Risk:** Low-Medium. The `<h1>` addition needs careful CSS to avoid visual disruption -- the headings should be styled to match the current visual hierarchy. Test each page visually before and after.

### Batch 3: Mobile Layout (the user's primary complaint -- "things are breaking on mobile")

| Step | Task | What to do |
|------|------|------------|
| 7 | **T5** | Add a tablet breakpoint at `max-width: 768px` that collapses the sidebar to a top/bottom bar (same as mobile pattern) or reduces width to ~180px. Adjust `.content` margin-left accordingly. |
| 8 | **T15** | Add social links to the mobile bottom nav bar, or add a social links section to the about page. The cleanest approach: add a small row of social icons to the mobile bottom nav (conditionally shown at `max-width: 600px`). |
| 9 | **T6** | Redesign hero for mobile: at `max-width: 600px`, switch from absolute-positioned scattered cards to a CSS grid of 6 cards (2 columns x 3 rows) with proper containment. Remove parallax effect on touch devices. At `max-width: 900px`, reduce to 10 cards and scale positions. |
| 10 | **T7** | Add `@media (hover: none)` rule for `.parallax-card-title` making titles always visible (same pattern already used for `.project-thumb-label` in app.css line 244-256). |
| 11 | **T20** | Remove `width="552" height="167"` and `frameborder="0"` from itch.io iframe. Add CSS: `.itch-embed iframe { width: 100%; height: 167px; border: none; }`. The `.itch-embed` container already has `max-width: 552px`. |
| 12 | **T26** | Add to the `max-width: 600px` media query: `.logo-strip { gap: 1rem 1.5rem; }`. |

**Estimated complexity:** Large (primarily due to T6)
**Files touched:** `src/styles/app.css`, `src/components/HeroParallax.astro`, `src/layouts/Layout.astro`, `src/pages/works/[slug].astro`
**Risk:** Medium-High. T6 (hero parallax redesign) is the highest-risk change in the entire list. The hero is the first thing users see, and changing its layout at mobile sizes requires careful testing across viewport widths (320, 375, 414, 768, 1024). T5 (tablet breakpoint) also affects every page. Test thoroughly with browser dev tools and real devices.

### Batch 4: Performance (measurable improvements to load time and rendering)

| Step | Task | What to do |
|------|------|------------|
| 13 | **T8** | In `HeroParallax.astro`, change `loading="eager"` to `loading="lazy"` for cards with `top >= 36` (indices 6-13 in the layouts array). Keep the first 6 cards eager. |
| 14 | **T10** | Add `width` and `height` attributes to all `<img>` elements. For the works grid thumbnails, use `width="400" height="300"`. For friend photos, use `width="160" height="160"`. For about photo, use `width="200" height="260"`. For hero cards: portrait `width="260" height="365"`, landscape `width="370" height="250"`. For logo strip, use `height="44"` (width varies). These reflect the CSS-specified display sizes. |
| 15 | **T11** | Replace the synchronous Google Fonts `<link>` with preload pattern: `<link rel="preload" href="..." as="style" onload="this.rel='stylesheet'">` plus `<noscript><link rel="stylesheet" href="..."></noscript>`. |
| 16 | **T14** | Wrap mousemove handler in `requestAnimationFrame`. Cache `--depth` values in a `Map` at initialization. |
| 17 | **T21** | Remove `image-rendering: -webkit-optimize-contrast` and `image-rendering: crisp-edges` from `.parallax-card img` in HeroParallax.astro. |

**Estimated complexity:** Medium
**Files touched:** `src/components/HeroParallax.astro`, `src/layouts/Layout.astro`, `src/pages/works/index.astro`, `src/pages/works/[slug].astro`, `src/pages/friends.astro`, `src/pages/about.astro`
**Risk:** Low-Medium. T10 (width/height) needs accurate values -- wrong values cause visible aspect ratio distortion. Use CSS `object-fit: cover` as a safety net (already in place for most images). T11 (font preload) can cause FOUT (flash of unstyled text) if implemented incorrectly -- test with throttled network.

### Batch 5: Cleanup (code hygiene -- no user-visible change)

| Step | Task | What to do |
|------|------|------------|
| 18 | **T12** | Delete `src/components/HeroKaleidoscope.astro` and `src/components/HeroSlideshow.astro`. Remove the `hero-activate` custom event dispatch from `index.astro` line 27 and the event listener from `HeroParallax.astro` (simplify to direct initialization). |
| 19 | **T22** | Replace `.sort(() => Math.random() - 0.5)` with Fisher-Yates shuffle in HeroParallax.astro. |
| 20 | **T23** | Delete line 20 (`const itchPageUrl = ...`) from `[slug].astro`. |
| 21 | **T25** | Update CLAUDE.md: remove reference to `src/data/data.js`, add `src/data/generated-about.json` to the content pipeline docs. |
| 22 | **T27** | Change `title: (un)seen Vietman` to `title: (un)seen Vietnam` in `public/projects/2024/(un)seen Vietman/info.txt`. Note: the folder name also contains the typo; renaming it would change the generated slug. Document this for the site owner to decide. |
| 23 | **T29** | Delete `public/logos/hasgeek.png`. |

**Estimated complexity:** Small
**Files touched:** `src/components/HeroKaleidoscope.astro` (delete), `src/components/HeroSlideshow.astro` (delete), `src/components/HeroParallax.astro`, `src/pages/index.astro`, `src/pages/works/[slug].astro`, `CLAUDE.md`, `public/projects/2024/(un)seen Vietman/info.txt`, `public/logos/hasgeek.png` (delete)
**Risk:** Very low. These are deletions and corrections. Verify `npm run build` succeeds after removing the dead components and the event system.

---

## 3. Summary of Implementation Sequence

```
Batch 1: Build Reliability       [T1, T2, T30]         -- Small
Batch 2: Accessibility           [T4, T3, T16]         -- Small-Medium
Batch 3: Mobile Layout           [T5, T15, T6, T7,     -- Large
                                  T20, T26]
Batch 4: Performance             [T8, T10, T11, T14,   -- Medium
                                  T21]
Batch 5: Cleanup                 [T12, T22, T23, T25,  -- Small
                                  T27, T29]
```

**Total: 23 tasks across 5 batches.**

---

## 4. Risk Assessment

### High-Risk Items

**T6 (Hero parallax on mobile)** is the single highest-risk task. The current layout uses absolute positioning with percentage-based left/top values for 14 cards. There is no clean way to "fix" this -- it requires an alternative layout strategy for small screens. Possible approaches:

- **Option A (recommended):** At `max-width: 600px`, replace the parallax scatter with a 2-column CSS grid showing 6 cards. Disable parallax movement. This is a clean break from the desktop behavior but guarantees no overflow.
- **Option B:** Recalculate all 14 position percentages to fit within a smaller bounding box. This preserves the scattered aesthetic but requires precise per-card tuning and still risks overlap.
- **Option C:** Show only 4-6 cards on mobile with positions constrained to the visible area. Less dramatic than a grid but easier to implement than full repositioning.

I recommend Option A because it is deterministic -- a CSS grid cannot overflow its container.

**T5 (Tablet breakpoint)** changes the fundamental page layout for an entire viewport range. The sidebar collapse needs to match the existing mobile bottom-bar pattern to avoid inventing a third layout paradigm.

**T10 (width/height on images)** is medium-risk because the hero card dimensions change across breakpoints. The `width` and `height` attributes should reflect the intrinsic image size (or the largest display size), not the CSS-reduced mobile size. The browser uses these for aspect ratio reservation, not literal sizing.

### Medium-Risk Items

- **T3 (contrast fixes):** Changing colors affects the visual identity. The owner should approve the new color values. I recommend `#595959` (4.58:1 on white) as the replacement for both `#888` and the `#767676 + opacity: 0.5` combination, as it passes AA while remaining visually light.
- **T11 (font preload):** If the `onload` swap fires too late, users see a flash of system font. Test with network throttling to ensure acceptable behavior.
- **T12 (dead component removal):** The `hero-activate` event system links `index.astro` to `HeroParallax.astro`. Removing it requires verifying that the parallax initialization still triggers. The simplest approach: remove the event listener wrapper and run the initialization code directly.

### Low-Risk Items

Everything else. Build script changes (T1, T2, T30) are additive. Cleanup tasks (T22, T23, T25, T27, T29) are deletions or typo fixes. These should be tested with `npm run build` but are unlikely to cause issues.

---

## 5. Architectural Improvements Beyond the Task List

### 5a. The hero-activate event system is unnecessary complexity

`index.astro` dispatches a `hero-activate` custom event (line 27). `HeroParallax.astro` listens for this event to initialize parallax (line 133). This was designed to support switching between multiple hero modes (parallax, kaleidoscope, slideshow). Since the other modes are dead code (T12), this event indirection is pure complexity. After removing the dead components, the parallax script should initialize directly -- no event needed.

### 5b. The hidden attribute pattern is fragile

`HeroParallax.astro` renders with `hidden` (line 33), and `index.astro` immediately removes it via JavaScript (line 28-29). This causes a flash -- the hero is invisible until the script runs. Since there is only one hero mode now, the container should render visible by default. Remove `hidden` from the template and the script that un-hides it.

### 5c. Media dimensions should be captured at build time

The build script (`scripts/build-projects.js`) already uses `sharp` to detect cover orientation. It should also capture `width` and `height` from image metadata and include them in the generated JSON. This would allow templates to render `<img width={...} height={...}>` from data rather than hardcoding approximate values, fully solving T10 with accurate per-image dimensions.

### 5d. The about page data pipeline should support the logo strip

The logo strip on the about page is hardcoded HTML (lines 35-47 of about.astro). The logos live in `public/logos/` but there is no data mapping between venue names and logo files. Adding a `logo` field to the talk/workshop entries in `info.txt` (e.g., `talk: Talk on Creativity | Layers, Portugal (online) | 2025 | | google.png`) or creating a separate `logos.txt` would make this data-driven. However, this is a future improvement -- the current approach works and the logo list changes infrequently.

### 5e. Consider Astro's `<Image>` component for future image optimization

Astro has a built-in `<Image>` component that automatically generates WebP/AVIF variants and responsive `srcset`. The current site uses raw `<img>` tags pointing to `public/` files, bypassing Astro's image pipeline entirely. Migrating to `<Image>` would solve T9 (WebP/AVIF), T10 (width/height), and part of T8 (lazy loading) in one architectural change. However, this is a significant refactor that changes how images are referenced and requires moving images out of `public/` into `src/` (Astro processes `src/` images but serves `public/` images as-is). Recommend as a Phase 2 project after the current fixes are stable.

### 5f. The sidebar width should be a CSS custom property (preparatory for T18)

Even though I recommend skipping the full T18 (design tokens), the sidebar width `270px` is duplicated between `.sidebar { width: 270px }` and `.content { margin-left: 270px }`. This is actively dangerous for the T5 fix -- adding a tablet breakpoint means updating both values in sync. At minimum, add `--sidebar-width: 270px` to `:root` and reference it in both selectors. This is a targeted application of T18's principle without the full refactor.

---

## 6. Testing Strategy

After each batch, verify:

1. **Batch 1:** `npm run build` succeeds. `npm run dev` starts. Manually delete `public/about/` temporarily and verify the build does not crash.
2. **Batch 2:** Visual inspection of all 5 pages. Screen reader test (VoiceOver or NVDA) to verify heading navigation works. Run a contrast checker against the new color values.
3. **Batch 3:** Test at viewport widths: 320px, 375px, 414px, 768px, 834px (iPad), 1024px, 1440px. Verify no horizontal scrollbar at any width. Verify social links are reachable on mobile. Verify hero cards do not overflow. Verify itch.io iframe fits within viewport.
4. **Batch 4:** Run Lighthouse audit before and after. Compare LCP, CLS, and total page weight. Verify no visible FOUT with font preload change.
5. **Batch 5:** `npm run build` succeeds. Visual spot-check that nothing changed. Verify the typo fix appears in the generated JSON.

---

## 7. Estimated Total Effort

| Batch | Complexity | Estimated Time |
|-------|------------|----------------|
| Batch 1: Build Reliability | Small | 30 minutes |
| Batch 2: Accessibility | Small-Medium | 1 hour |
| Batch 3: Mobile Layout | Large | 3-4 hours |
| Batch 4: Performance | Medium | 1.5 hours |
| Batch 5: Cleanup | Small | 30 minutes |
| **Total** | | **~7 hours** |

Batch 3 dominates because T6 (hero parallax mobile) requires designing and testing an alternative layout. Everything else is mechanical.
