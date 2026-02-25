# Performance, Efficiency & Speed Review

**Reviewer:** Agent 2 (Performance Focus)
**Date:** 2026-02-24

## 1. Page Load Performance

### 1.1 Google Fonts loaded synchronously (render-blocking)
- `Layout.astro:32` loads Montserrat via standard `<link>`, blocking rendering
- Should use `preload` or self-host

### 1.2 All CSS shipped to every page
- `app.css` (714 lines) inlined into every page via Layout.astro
- About page ships works/timeline styles, etc.

### 1.3 Hero parallax loads 14 images eagerly
- `HeroParallax.astro:41` — `loading="eager"` on all 14 cards
- Cards at `top: 74%` are below fold, wasteful

### 1.4 No width/height on images
- Zero `<img>` tags have `width`/`height` attributes
- Causes Cumulative Layout Shift (CLS)

## 2. JavaScript Efficiency

### 2.1 Parallax mousemove not rAF-throttled
- `HeroParallax.astro:157` — updates 14 cards on every mousemove (60-120fps)
- Should use requestAnimationFrame throttling

### 2.2 CSS custom property read on every event
- `--depth` read via `getPropertyValue` per card per event — should be cached

### 2.3 Kaleidoscope: setInterval never cleared (memory leak)
- `HeroKaleidoscope.astro:162` — interval runs forever if activated

### 2.4 Slideshow: infinite rAF with no stop condition
- `HeroSlideshow.astro:145` — animates every frame even when nothing changes

## 3. CSS Performance

### 3.1 `will-change: transform` on 14 cards
- Each creates a compositor layer, consuming GPU memory

### 3.2 `box-shadow` transition on parallax cards
- Transitioning box-shadow triggers expensive paint every frame

### 3.3 `image-rendering: crisp-edges` on photos
- Designed for pixel art, makes photographs look harsh/pixelated

## 4. Build Pipeline

### 4.1 Sequential sharp operations
- `build-projects.js:183` — cover orientation detection runs one at a time
- Should use Promise.all() for parallelism

### 4.2 Synchronous I/O in async function
- Mixes `fs.readFileSync` with `await sharp()` — limited async benefit

### 4.3 No build caching
- Regenerates all JSON on every build even if no files changed

## 5. Image Optimization

### 5.1 No WebP/AVIF — biggest single win
- 0 WebP, 0 AVIF files — 25-50% bandwidth savings possible

### 5.2 No responsive images (srcset/sizes)
- Mobile downloads full-res images for 200px display — 90% bandwidth waste

### 5.3 12 PNGs still in public/projects/2020/
- Not converted by optimize-images.js

### 5.4 optimize-images.js not in build pipeline
- Must be run manually, easily forgotten

## 6. Mobile Performance

### 6.1 Parallax touch UX questionable
- Touch-based parallax competes with scroll gesture

### 6.2 No content-visibility for off-screen content
- Browser paints all thumbnails regardless of visibility

### 6.3 MP4 files served directly with no size limits
- 5 MP4s in Mixed meanings — could be huge on cellular

## 7. Unused Code

### 7.1 HeroKaleidoscope.astro — 197 lines, never imported
### 7.2 HeroSlideshow.astro — 183 lines, never imported
### 7.3 hasgeek.png — never referenced
### 7.4 CLAUDE.md references deleted data.js

## Priority Summary

| Priority | Issue | Location |
|----------|-------|----------|
| HIGH | No WebP/AVIF images | All images |
| HIGH | No srcset/sizes | All `<img>` tags |
| HIGH | 14 hero images eager | HeroParallax.astro:41 |
| HIGH | Fonts render-blocking | Layout.astro:32 |
| HIGH | No width/height on images (CLS) | All `<img>` tags |
| MED | mousemove not rAF-throttled | HeroParallax.astro:157 |
| MED | Sequential sharp in build | build-projects.js:183 |
| MED | All CSS on every page | Layout.astro |
| MED | crisp-edges on photos | HeroParallax.astro |
| LOW | Unused components | HeroKaleidoscope, HeroSlideshow |
| LOW | box-shadow transition | HeroParallax.astro |
| LOW | hasgeek.png unused | public/logos/ |
