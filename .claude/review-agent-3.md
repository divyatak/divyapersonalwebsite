# Readability, Responsiveness & UX Quality Review

**Reviewer:** Agent 3 (Readability & UX Focus)
**Date:** 2026-02-24

## 1. Code Readability

### Strengths
- Variable names clear and descriptive throughout
- Helper functions named for exactly what they do (slugify, findCover, isUrl, encodePath)
- CSS class names follow clear BEM-adjacent convention
- Astro pages use clean destructuring

### Issues
- `rawMedia` mapping does too much in one expression — should extract `classifyMediaItem()`
- Parallax layouts array: 14 hardcoded positions with no comments explaining reasoning
- Biased shuffle algorithm: `Math.random() - 0.5` is not uniform — use Fisher-Yates
- Custom event hero activation pattern not self-documenting
- `linkifyBio()` hardcodes "Joyus Studio" — fragile, should be data-driven
- `mentionNames` hardcodes friend IDs — should be a field in info.txt
- `itchPageUrl` computed but never used — dead code in [slug].astro

## 2. Responsive Design Deep-Dive

### Breakpoint Strategy
- Two breakpoints: 900px (tablet) and 600px (mobile)
- **Gap: No breakpoint at 768px iPad portrait** — sidebar at 270px leaves only 498px for content

### Sidebar Nav
- Desktop: Works correctly
- Tablet (768-900px): 270px sidebar leaves tight content area
- Mobile: Bottom bar with safe-area handling (good)
- **Issue**: 4rem bottom padding may not cover nav bar on large safe-area devices
- **Issue**: Social icons hidden on mobile with NO alternative access
- **Issue**: At 320px, four nav items very tightly packed

### Hero Parallax
- Desktop (1440px): Cards at `left: 78%` overflow container — clipped by overflow:hidden
- Mobile (<=600px): 14 cards in ~375x300px = extreme overlap, bottom rows invisible
- **Critical at 320px**: 200px cards at `left: 60%` overflow by 72px
- **Issue**: `font-weight: 200` on timeline-year may be invisible on low-density displays

### Project Detail Pages
- Media grid works well, good mobile collapse
- **Issue**: itch.io iframe hardcoded `height="167"` doesn't adapt
- **Issue**: Projects with 30+ images create very long pages with no pagination

### Friends Grid
- Mobile collapse works
- **Issue**: 160px fixed photo on 375px screen leaves only ~159px for text

### About Page
- Collapse works correctly
- **Issue**: Logo strip 3rem gap excessive on mobile — logos wrap to one per line

## 3. Accessibility

### Strengths
- All sections have aria-label attributes
- Navigation has aria-current="page"
- Skip-to-content link present
- YouTube iframes have title attributes
- Focus-visible styles defined

### Issues (CRITICAL)
- **No `<h1>` heading on ANY page** — violates heading hierarchy
- **Timeline years are `<div>` not headings** — screen readers can't navigate
- **Color contrast failures:**
  - `.about-subheading`: #767676 at opacity 0.5 = ~2.08:1 ratio — **SEVERELY FAILS WCAG AA**
  - `.talk-name` and `.friend-project-tag`: #888 on white = 3.54:1 — **FAILS WCAG AA** (needs 4.5:1)
  - `.nav-item`: #767676 on white = 4.54:1 — barely passes
- **Press links render `<a>` even when `p.url` is undefined**
- **Parallax card titles invisible on touch** — no hover:none fallback
- Project thumbnails announce title 3 times (aria-label + alt + span text)
- Social icon links at 20x20px — hard to see focus outlines

## 4. Content Pipeline Robustness

### Good
- Lines without colons silently skipped
- Unknown keys generate console.warn()
- Missing title falls back to directory name
- Slug collision handling works

### Issues
- No validation of media file existence — broken image links can ship
- No URL format validation on itch: and link: values
- UTF-8 BOM (common on Windows) could break first line parsing
- `sharp` not in package.json — import crash if not available
- `findPhoto(aboutDir)` crashes if about directory doesn't exist (only checks info file)
- Same-year slug collisions would fail (only handles cross-year)

## 5. CSS Organization

### Issues
- All classes in global scope — generic names (.content, .placeholder) could conflict
- No CSS custom properties for design tokens — colors hardcoded in many places
- No documented breakpoint system
- `.about-intro` sets `align-items: flex-start` but `.about-photo` sets `align-self: stretch` — conflicting
- Many duplicate `:visited` color resets could use a utility class
- Sidebar width 270px hardcoded in two places

## 6. Edge Cases

- **Zero projects**: Empty timeline, no "no projects" message; empty hero container
- **Zero friends**: "collaborators" heading with empty grid
- **Missing covers**: Falls back correctly to placeholder
- **Slug collision**: "(un)seen Life" appears in 2024 and 2026 — handled with year suffix
- **Content typo**: "Vietman" should be "Vietnam"
- **Deprecated HTML**: `frameborder="0"` on itch.io iframe

## Priority Summary

| Priority | Issue | Location |
|----------|-------|----------|
| HIGH | WCAG contrast failures on subheadings/tags | app.css |
| HIGH | No h1 headings on any page | All pages |
| HIGH | sharp not in package.json | build-projects.js:3 |
| MED | Mobile bottom bar may overlap content | app.css |
| MED | Social links hidden on mobile | app.css |
| MED | Press links render without href check | about.astro:88 |
| MED | Build crashes if about/ dir missing | build-projects.js |
| MED | No media file existence validation | build-projects.js |
| MED | Parallax cards heavily clipped on mobile | HeroParallax.astro |
| LOW | Dead code: itchPageUrl, unused components | [slug].astro, components/ |
| LOW | Hardcoded mentionNames | friends.astro:5 |
| LOW | Biased shuffle algorithm | HeroParallax.astro:5 |
| LOW | Typo: "Vietman" | public/projects/2024/ |
| LOW | frameborder deprecated | [slug].astro:39 |
