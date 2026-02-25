# Code Architecture, Modularity & Scalability Review

**Reviewer:** Agent 1 (Architecture Focus)
**Date:** 2026-02-24

## 1. Architecture & Structure

### Strengths
- Clear separation: static assets (public/), generated data (src/data/), presentation (src/pages/, src/components/)
- Content pipeline (folders -> build script -> JSON -> Astro pages) is straightforward
- File-based routing used idiomatically

### Concerns
- CLAUDE.md references nonexistent `src/data/data.js` — stale documentation
- `optimize-images.js` not referenced in package.json scripts — orphaned utility
- Social links (Instagram, LinkedIn, Substack) hardcoded in Layout.astro with inline SVGs — should be configurable
- Build script handles three separate concerns (projects, friends, about) in one file

### Coupling
- Tight coupling between build script JSON schema and page templates — no type definitions or validation
- Hero activation via CustomEvent is over-engineered — only HeroParallax is used
- HeroKaleidoscope and HeroSlideshow are dead code, never imported

## 2. Modularity

### Duplicated Patterns That Should Be Extracted
1. Talk/workshop list items — same JSX pattern repeated twice in about.astro
2. Friend name with optional link — repeated in collaborators and mentions sections
3. Image with lazy loading fallback — repeated across works, friends, about pages

### Style Organization
- All component styles in single `app.css` (714 lines) — monolithic
- Hero components correctly use scoped `<style>` blocks
- All 714 lines loaded on every page regardless of usage
- **Recommendation:** Move page-specific styles into scoped `<style>` blocks

## 3. Scalability

### Content Growth Concerns
- Sequential `sharp` operations in build — bottleneck at 100+ projects
- 14 hero images loaded eagerly — heavy initial page load
- All project data in one JSON file — affects build memory

### Build Pipeline Bottlenecks
1. `sharp` not listed in package.json — relies on Astro transitive dependency (fragile)
2. No error handling on `buildAll()` — unhandled promise rejection
3. No watch mode — adding project requires dev server restart
4. No incremental builds — regenerates everything every time

## 4. Code Smells

### Dead Code
- HeroKaleidoscope.astro and HeroSlideshow.astro — ~370 lines never used
- `itchPageUrl` computed but never used in [slug].astro
- Hero switching event system with no actual switching mechanism

### Hardcoded Values
- `mentionNames = new Set(['amrita-sukrity'])` in friends.astro — should be data-driven
- Logo strip entirely hardcoded HTML — no data source
- `linkifyBio` hardcodes 'Joyus Studio' replacement
- 14 parallax position/depth/rotation values are magic numbers
- Sidebar width 270px duplicated in .sidebar and .content margin-left

### Other Smells
- YouTube URL regex doesn't handle embed URLs, Shorts, or playlists
- No TypeScript interfaces for generated JSON
- `videoExts` set re-created inside project loop — should be module scope

## 5. Mobile Responsiveness Issues

### Sidebar (CRITICAL)
- No breakpoint between 600px and 900px — 270px sidebar on 700px tablet leaves only 430px for content
- Bottom padding 4rem on mobile may not cover fixed bottom nav with system font scaling
- Bottom nav lacks visual backdrop separation

### Parallax Hero (CRITICAL)
- Cards at `left: 78%` on 375px screen overflow by ~118px — clipped
- Cards at `top: 72-74%` in 300px container extend far below visible area
- 14 cards in 375x300px creates extreme overlap — cluttered
- Touch parallax competes with scrolling
- No `@media (hover: none)` treatment for card titles — invisible on touch

### Friends Grid
- No tablet breakpoint — 2 columns with 160px fixed photo on 448px effective width breaks layout
- `.friend-photo` width fixed at 160px at all breakpoints above 600px

### About Page
- Logo strip 3rem column gap excessive on 375px screens
- About photo 200x200px crop may lose significant content

### General
- No breakpoint between 600-900px for primary layout
- `.content` has no max-width — text stretches on ultrawide
- Project thumbnails jump abruptly between breakpoints

## 6. Build Script Quality

### Strengths
- Handles URL encoding for special characters
- Deduplicates media entries with warnings
- Unique slug generation with collision handling
- Cross-references collaborators between projects and friends

### Issues
1. `sharp` dependency implicit — not in package.json (CRITICAL)
2. No `.catch()` on `buildAll()` call
3. Synchronous filesystem ops in async function
4. `parseInfo` doesn't handle multiline values
5. No validation of media file existence
6. Cover orientation detection swallows all errors silently
7. `optimize-images.js` converts all PNGs to JPG — loses transparency

## Priority Summary

| Priority | Issue | Location |
|----------|-------|----------|
| CRITICAL | sharp not in package.json | build-projects.js:3 |
| CRITICAL | No buildAll() error handling | build-projects.js:309 |
| CRITICAL | Sidebar breaks 600-900px | app.css |
| HIGH | Parallax overflow/clip on mobile | HeroParallax.astro + app.css |
| HIGH | Parallax titles invisible on touch | HeroParallax.astro |
| HIGH | Dead code: Kaleidoscope + Slideshow | src/components/ |
| HIGH | Hardcoded mentionNames | friends.astro:5 |
| MED | Monolithic app.css | src/styles/app.css |
| MED | No TypeScript interfaces | build script + pages |
| MED | 14 eager-loaded images | HeroParallax.astro |
| LOW | Sequential sharp reads | build-projects.js |
| LOW | Logo strip spacing on mobile | app.css |
