import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const projectsDir = path.resolve('public/projects')
const friendsDir = path.resolve('public/friends')
const aboutDir = path.resolve('public/about')
const dataDir = path.resolve('src/data')
const outFile = path.resolve('src/data/generated-projects.json')
const outFriendsFile = path.resolve('src/data/generated-friends.json')
const outAboutFile = path.resolve('src/data/generated-about.json')

const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'])
const videoExts = new Set(['.mp4', '.webm', '.mov'])

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findCover(dir) {
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const ext = path.extname(f)
    const name = path.basename(f, ext).toLowerCase()
    if (name === 'cover' && imageExts.has(ext.toLowerCase())) return f
  }
  return null
}

function findPhoto(dir) {
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const ext = path.extname(f)
    const name = path.basename(f, ext).toLowerCase()
    if (name === 'photo' && imageExts.has(ext.toLowerCase())) return f
  }
  return null
}

function parseInfo(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '')
  const result = { title: '', description: '', media: [], collaborators: [], categories: [], itch: '', link: '' }

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase()
    const value = trimmed.slice(colonIdx + 1).trim()

    if (key === 'title') result.title = value
    else if (key === 'description') result.description = value
    else if (key === 'media') result.media.push(value)
    else if (key === 'collaborator') result.collaborators.push(value)
    else if (key === 'category') result.categories.push(value.toLowerCase())
    else if (key === 'itch') result.itch = value
    else if (key === 'link') result.link = value
    else console.warn(`Unknown key "${key}" in ${filePath}`)
  }

  if (!result.title) console.warn(`Missing "title" field in ${filePath}`)

  return result
}

function parseFriendInfo(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '')
  const result = { name: '', url: '', description: '', role: '' }

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase()
    const value = trimmed.slice(colonIdx + 1).trim()

    if (key === 'name') result.name = value
    else if (key === 'url') result.url = value
    else if (key === 'description') result.description = value
    else if (key === 'role') result.role = value
    else console.warn(`Unknown key "${key}" in ${filePath}`)
  }

  if (!result.name) console.warn(`Missing "name" field in ${filePath}`)

  return result
}

function isUrl(str) {
  return str.startsWith('http://') || str.startsWith('https://')
}

function encodePath(p) {
  return p.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

async function buildAll() {
  // Ensure output directory exists
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  // --- Build projects ---
  const works = []
  // Map: collaborator name (lowercase) -> [project titles]
  const collabProjects = new Map()
  // Track slugs for uniqueness
  const usedSlugs = new Set()

  if (fs.existsSync(projectsDir)) {
    const yearDirs = fs.readdirSync(projectsDir)
      .filter(d => /^\d{4}$/.test(d) && fs.statSync(path.join(projectsDir, d)).isDirectory())
      .sort((a, b) => Number(b) - Number(a))

    for (const year of yearDirs) {
      const yearPath = path.join(projectsDir, year)
      const projectDirs = fs.readdirSync(yearPath)
        .filter(d => fs.statSync(path.join(yearPath, d)).isDirectory())
        .sort()

      const projects = []

      for (const projDir of projectDirs) {
        const projPath = path.join(yearPath, projDir)
        const infoPath = path.join(projPath, 'info.txt')

        if (!fs.existsSync(infoPath)) continue

        const info = parseInfo(infoPath)
        const cover = findCover(projPath)
        const basePath = `/projects/${year}/${projDir}`
        const encodedBase = encodePath(basePath)

        const rawMedia = []
        for (const m of info.media) {
          if (isUrl(m)) {
            rawMedia.push({ type: 'youtube', src: m })
            continue
          }
          const ext = path.extname(m).toLowerCase()
          const type = videoExts.has(ext) ? 'video' : 'image'
          const src = `${encodedBase}/${encodeURIComponent(m)}`
          const entry = { type, src }

          // Read dimensions for images
          if (type === 'image') {
            try {
              const filePath = path.resolve('public', src.slice(1))
              const meta = await sharp(fs.readFileSync(decodeURIComponent(filePath))).metadata()
              if (meta.width) entry.width = meta.width
              if (meta.height) entry.height = meta.height
            } catch (e) { /* skip dimensions */ }
          }

          rawMedia.push(entry)
        }

        // Deduplicate media entries by src
        const seenSrc = new Set()
        const media = rawMedia.filter(m => {
          if (seenSrc.has(m.src)) {
            console.warn(`Duplicate media entry "${m.src}" in ${infoPath}`)
            return false
          }
          seenSrc.add(m.src)
          return true
        })

        const title = info.title || projDir

        // Generate unique slug
        let slug = slugify(title)
        if (usedSlugs.has(slug)) {
          slug = `${slug}-${year}`
        }
        usedSlugs.add(slug)

        // Track collaborator -> project links
        for (const collab of info.collaborators) {
          const key = collab.toLowerCase()
          if (!collabProjects.has(key)) collabProjects.set(key, [])
          collabProjects.get(key).push(title)
        }

        // Use first image from media as fallback cover
        const firstImage = media.find(m => m.type === 'image')
        const coverSrc = cover
          ? `${encodedBase}/${encodeURIComponent(cover)}`
          : firstImage ? firstImage.src : null

        // Detect cover orientation
        let coverOrientation = 'landscape'
        if (coverSrc) {
          try {
            const coverFile = coverSrc.startsWith('/')
              ? path.resolve('public', coverSrc.slice(1))
              : coverSrc
            const meta = await sharp(fs.readFileSync(decodeURIComponent(coverFile))).metadata()
            if (meta.width && meta.height) {
              coverOrientation = meta.height > meta.width ? 'portrait' : 'landscape'
            }
          } catch (e) { /* fallback to landscape */ }
        }

        const project = {
          id: projDir,
          slug,
          title,
          description: info.description || '',
          cover: coverSrc,
          coverOrientation,
          media,
        }
        if (info.categories.length > 0) project.categories = info.categories
        if (info.itch) project.itch = info.itch
        if (info.link) project.link = info.link
        projects.push(project)
      }

      if (projects.length > 0) {
        works.push({ year: Number(year), projects })
      }
    }
  }

  fs.writeFileSync(outFile, JSON.stringify(works, null, 2) + '\n')

  // --- Build friends ---
  const friends = []

  if (fs.existsSync(friendsDir)) {
    const friendDirs = fs.readdirSync(friendsDir)
      .filter(d => fs.statSync(path.join(friendsDir, d)).isDirectory())
      .sort()

    for (const friendDir of friendDirs) {
      const friendPath = path.join(friendsDir, friendDir)
      const infoPath = path.join(friendPath, 'info.txt')

      if (!fs.existsSync(infoPath)) continue

      const info = parseFriendInfo(infoPath)
      const photo = findPhoto(friendPath)
      const basePath = `/friends/${friendDir}`
      const encodedBase = encodePath(basePath)

      // Find projects this friend collaborated on
      const key = (info.name || friendDir).toLowerCase()
      const projectList = collabProjects.get(key) || []

      friends.push({
        id: friendDir,
        name: info.name || friendDir,
        role: info.role || '',
        url: info.url || '',
        description: info.description || '',
        photo: photo ? `${encodedBase}/${encodeURIComponent(photo)}` : null,
        projects: projectList,
      })
    }
  }

  // --- Parse mentions from mentions.txt ---
  const mentions = []
  const mentionsPath = path.join(friendsDir, 'mentions.txt')

  if (fs.existsSync(mentionsPath)) {
    const text = fs.readFileSync(mentionsPath, 'utf-8').replace(/^\uFEFF/, '')
    // Split into blocks separated by blank lines
    const blocks = text.split(/\n\s*\n/).filter(b => b.trim())

    for (const block of blocks) {
      const entry = { name: '', url: '', description: '', role: '' }
      for (const line of block.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx === -1) continue
        const key = trimmed.slice(0, colonIdx).trim().toLowerCase()
        const value = trimmed.slice(colonIdx + 1).trim()
        if (key === 'name') entry.name = value
        else if (key === 'url') entry.url = value
        else if (key === 'description') entry.description = value
        else if (key === 'role') entry.role = value
      }
      if (entry.name) {
        const key = entry.name.toLowerCase()
        const projectList = collabProjects.get(key) || []
        mentions.push({
          id: slugify(entry.name),
          name: entry.name,
          role: entry.role,
          url: entry.url,
          description: entry.description,
          photo: null,
          projects: projectList,
          isMention: true,
        })
      }
    }
  }

  fs.writeFileSync(outFriendsFile, JSON.stringify({ collaborators: friends, mentions }, null, 2) + '\n')

  // --- Build about ---
  const about = { bio: [], email: '', photo: null, talks: [], workshops: [], press: [] }
  const aboutInfoPath = path.join(aboutDir, 'info.txt')

  if (fs.existsSync(aboutDir) && fs.existsSync(aboutInfoPath)) {
    const photo = findPhoto(aboutDir) || findCover(aboutDir)
    // Also check for any image file as photo
    if (!photo) {
      const files = fs.readdirSync(aboutDir)
      for (const f of files) {
        if (imageExts.has(path.extname(f).toLowerCase())) {
          about.photo = `/about/${encodeURIComponent(f)}`
          break
        }
      }
    } else {
      about.photo = `/about/${encodeURIComponent(photo)}`
    }

    const text = fs.readFileSync(aboutInfoPath, 'utf-8').replace(/^\uFEFF/, '')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx === -1) continue
      const key = trimmed.slice(0, colonIdx).trim().toLowerCase()
      const value = trimmed.slice(colonIdx + 1).trim()

      if (key === 'bio') {
        about.bio.push(value)
      } else if (key === 'email') {
        about.email = value
      } else if (key === 'talk' || key === 'workshop') {
        const parts = value.split('|').map(s => s.trim())
        const entry = { title: parts[0] || '', venue: parts[1] || '' }
        if (parts[2]) entry.year = parseInt(parts[2], 10)
        if (parts[3]) entry.url = parts[3]
        if (key === 'talk') about.talks.push(entry)
        else about.workshops.push(entry)
      } else if (key === 'press') {
        const parts = value.split('|').map(s => s.trim())
        const pressEntry = { title: parts[0] || '', outlet: parts[1] || '' }
        if (parts[2] && parseInt(parts[2], 10)) pressEntry.year = parseInt(parts[2], 10)
        if (parts[3]) pressEntry.url = parts[3]
        about.press.push(pressEntry)
      }
    }
  }

  fs.writeFileSync(outAboutFile, JSON.stringify(about, null, 2) + '\n')

  const projCount = works.reduce((n, y) => n + y.projects.length, 0)
  console.log(`Generated ${projCount} projects, ${friends.length} friends`)
}

buildAll().catch(err => {
  console.error('Build failed:', err.message || err)
  process.exit(1)
})
