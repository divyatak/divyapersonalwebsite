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
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          try {
            const { slug, layout } = JSON.parse(body)
            if (!slug || typeof slug !== 'string') throw new Error('missing slug')
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
  integrations: [sitemap(), workLayoutEditor()],
})
