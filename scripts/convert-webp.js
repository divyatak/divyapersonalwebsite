/**
 * Convert all JPG/PNG images in public/ to WebP format.
 * Replaces originals with WebP versions.
 * Usage: node scripts/convert-webp.js
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const PUBLIC_DIR = path.resolve('public')
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png'])
// Skip SVG/GIF — they don't benefit from WebP conversion
const SKIP_DIRS = new Set(['.git', 'node_modules', 'archive'])

let converted = 0
let skipped = 0
let totalSavedBytes = 0

async function walkAndConvert(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      await walkAndConvert(fullPath)
      continue
    }

    const ext = path.extname(entry.name).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) continue

    const baseName = path.basename(entry.name, path.extname(entry.name))
    const webpPath = path.join(dir, `${baseName}.webp`)

    // Skip if WebP already exists
    if (fs.existsSync(webpPath)) {
      skipped++
      continue
    }

    try {
      const originalSize = fs.statSync(fullPath).size
      const originalBuffer = fs.readFileSync(fullPath)

      // Convert to WebP — quality 80 for photos, good balance of size/quality
      const webpBuffer = await sharp(originalBuffer)
        .webp({ quality: 80 })
        .toBuffer()

      // Only convert if WebP is actually smaller
      if (webpBuffer.length < originalSize) {
        fs.writeFileSync(webpPath, webpBuffer)
        fs.unlinkSync(fullPath)  // Remove original
        const saved = originalSize - webpBuffer.length
        totalSavedBytes += saved
        converted++
        const rel = path.relative(PUBLIC_DIR, fullPath)
        const pct = ((saved / originalSize) * 100).toFixed(0)
        console.log(`  ${rel} → .webp (${formatBytes(originalSize)} → ${formatBytes(webpBuffer.length)}, -${pct}%)`)
      } else {
        // WebP is larger — keep original, skip
        skipped++
        const rel = path.relative(PUBLIC_DIR, fullPath)
        console.log(`  ${rel} — skipped (WebP would be larger)`)
      }
    } catch (err) {
      console.error(`  Error converting ${fullPath}: ${err.message}`)
    }
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

async function main() {
  console.log('Converting images to WebP...\n')
  await walkAndConvert(PUBLIC_DIR)
  console.log(`\nDone! Converted: ${converted}, Skipped: ${skipped}`)
  console.log(`Total saved: ${formatBytes(totalSavedBytes)}`)
}

main().catch(err => {
  console.error('Conversion failed:', err)
  process.exit(1)
})
