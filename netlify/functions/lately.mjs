/**
 * /api/lately — the live half of the landing's Lately slot.
 *
 * The page can't ask Substack directly (no CORS on the feed), so this
 * function does it server-side on demand: latest Substack post + latest
 * public GitHub push, as one small JSON. The CDN holds the answer for an
 * hour (durable cache), so Substack and GitHub see a handful of requests a
 * day no matter the traffic — and the site NEVER needs a rebuild for the
 * slot to stay current.
 *
 * Instagram has no public feed API; its line stays hand-edited in
 * src/data/lately-instagram.json.
 */

const UA = { 'user-agent': 'divyatak.art lately rail' }

async function substack() {
  const res = await fetch('https://divyatak.substack.com/feed', { headers: UA })
  if (!res.ok) return null
  const xml = await res.text()
  const item = /<item>([\s\S]*?)<\/item>/.exec(xml)?.[1]
  if (!item) return null
  const title = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(item)?.[1]
  const link = /<link>([\s\S]*?)<\/link>/.exec(item)?.[1]
  const image = /<enclosure url="([^"]+)"/.exec(item)?.[1]
  return title ? { title, link: link || null, image: image || null } : null
}

async function github() {
  const res = await fetch(
    'https://api.github.com/users/divyatak/repos?sort=pushed&per_page=1&type=owner',
    { headers: { ...UA, accept: 'application/vnd.github+json' } }
  )
  if (!res.ok) return null
  const repos = await res.json()
  const r = Array.isArray(repos) && repos[0]
  return r ? { repo: r.name, url: r.html_url, pushed: r.pushed_at } : null
}

export default async () => {
  const [sub, gh] = await Promise.all([
    substack().catch(() => null),
    github().catch(() => null),
  ])
  return new Response(JSON.stringify({ substack: sub, github: gh }), {
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      // browsers revalidate; Netlify's CDN keeps it warm for an hour
      'cache-control': 'public, max-age=300',
      'netlify-cdn-cache-control': 'public, durable, s-maxage=3600',
    },
  })
}

export const config = { path: '/api/lately' }
