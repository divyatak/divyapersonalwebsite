# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static personal website for divyapersonalwebsite.studiotypo.xyz, built with Astro (static site generator). Outputs plain HTML pages with zero client-side JavaScript (except a small hash-redirect script on the home page).

## Commands

```bash
npm install        # Install dependencies (no lock file committed)
npm run generate   # Rebuild project/friends JSON from public/ folders
npm run dev        # Generate data + start Astro dev server (localhost:4321)
npm run build      # Generate data + production build to dist/
npm run preview    # Generate data + preview production build locally
```

No linter, formatter, or test framework is configured.

## Architecture

Astro static site with file-based routing. No React or client-side framework — all pages are server-rendered to static HTML at build time.

### Content pipeline
- `public/projects/{year}/{name}/` — project folders with `info.txt` + images
- `public/friends/{name}/` — friend folders with `info.txt` + photo
- `scripts/build-projects.js` — reads folders, outputs `src/data/generated-projects.json` and `src/data/generated-friends.json` (gitignored)
- `src/data/data.js` — manual data for talks, press, contact

### Pages
- `src/pages/index.astro` — home (intro + hash redirect for old URLs)
- `src/pages/works/index.astro` — works timeline grid
- `src/pages/works/[slug].astro` — individual project pages (dynamic routes via `getStaticPaths`)
- `src/pages/friends.astro` — collaborators
- `src/pages/about.astro` — artist statement, talks, press, contact
- `src/pages/404.astro` — not found

### Layout & styles
- `src/layouts/Layout.astro` — shared shell (head, sidebar nav, main content slot)
- `src/styles/global.css` — reset, typography, link colors
- `src/styles/app.css` — all component styles
