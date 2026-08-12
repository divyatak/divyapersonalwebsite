import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * The work-page editor's save endpoint — DEV ONLY (astro:server:setup never
 * runs in a production build). The editor UI on /works/[slug]/ POSTs
 * { slug, layout } here and it lands in src/data/work-layouts.json, which the
 * page imports; Vite then reloads the page with the saved arrangement.
 * layout: null deletes the entry, restoring the automatic layout.
 */
const layoutFile = fileURLToPath(new URL('./src/data/work-layouts.json', import.meta.url))

const workLayoutEditor = () => ({
  name: 'work-layout-editor',
  hooks: {
    'astro:server:setup'({ server }) {
      server.middlewares.use('/__work-layout', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }
        // HARDENING (this endpoint sits in front of Vite's own host/cors
        // checks): only same-origin JSON requests from the editor may write.
        // A foreign page's forged text/plain POST fails the content-type
        // check; a JSON one is forced into a preflight that never passes.
        const secFetch = req.headers['sec-fetch-site']
        if (secFetch && secFetch !== 'same-origin') {
          res.statusCode = 403
          res.end('same-origin only')
          return
        }
        if (!/^application\/json\b/.test(req.headers['content-type'] || '')) {
          res.statusCode = 415
          res.end('application/json only')
          return
        }
        let body = ''
        let dead = false
        req.on('data', (c) => {
          body += c
          if (body.length > 262144 && !dead) { // 256KB is far beyond any real layout
            dead = true
            res.statusCode = 413
            res.end('too large')
            req.destroy()
          }
        })
        req.on('end', () => {
          if (dead) return
          try {
            const { slug, layout } = JSON.parse(body)
            if (typeof slug !== 'string' || !/^[a-z0-9-]{1,80}$/.test(slug)) {
              throw new Error('bad slug')
            }
            if (layout !== null) {
              if (!layout || !Array.isArray(layout.flow)) throw new Error('bad layout')
              for (const b of layout.flow) {
                const okPara = b && b.kind === 'para' && typeof b.body === 'string'
                const okPlate = b && b.kind === 'plate' && b.media &&
                  (b.media.type === 'image' || b.media.type === 'video') &&
                  typeof b.media.src === 'string' && b.media.src.startsWith('/')
                if (!okPara && !okPlate) throw new Error('bad block')
                if (typeof b.pos !== 'string' || !/^[a-z-]{3,6}$/.test(b.pos)) throw new Error('bad pos')
              }
            }
            let all = {}
            try { all = JSON.parse(fs.readFileSync(layoutFile, 'utf8')) } catch {}
            if (layout === null) delete all[slug]
            else all[slug] = layout
            fs.writeFileSync(layoutFile, JSON.stringify(all, null, 2) + '\n')
            res.setHeader('content-type', 'text/plain')
            res.end('ok')
          } catch (e) {
            res.statusCode = 400
            res.end(String(e))
          }
        })
      })
    },
  },
})

export default defineConfig({
  site: 'https://divyatak.art',
  integrations: [
    // redirect stubs and prototype leftovers have no business in the sitemap
    sitemap({
      filter: (page) =>
        !page.includes('/prototype/') && !/\/works\/$/.test(page),
    }),
    workLayoutEditor(),
  ],
})
