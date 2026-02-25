import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const MAX_WIDTH = 2000
const JPG_QUALITY = 85
const SIZE_THRESHOLD = 500 * 1024 // only optimize files > 500KB
const publicDir = path.resolve('public')
const archiveDir = path.resolve('archive-originals')

const imageExts = new Set(['.jpg', '.jpeg', '.png'])

function walkDir(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(full))
    } else if (imageExts.has(path.extname(entry.name).toLowerCase())) {
      results.push(full)
    }
  }
  return results
}

async function optimizeImage(filePath) {
  const stat = fs.statSync(filePath)
  if (stat.size < SIZE_THRESHOLD) return null

  const ext = path.extname(filePath).toLowerCase()
  const isPng = ext === '.png'
  const relativePath = path.relative(publicDir, filePath)
  const inputBuf = fs.readFileSync(filePath)
  const meta = await sharp(inputBuf).metadata()

  const needsResize = meta.width > MAX_WIDTH
  const needsConvert = isPng

  if (!needsResize && !needsConvert) return null

  // Archive original
  const archivePath = path.join(archiveDir, relativePath)
  fs.mkdirSync(path.dirname(archivePath), { recursive: true })
  fs.copyFileSync(filePath, archivePath)

  // Process using the already-read buffer to avoid path issues on Windows
  let pipeline = sharp(inputBuf)
  if (needsResize) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }

  const outputBuffer = await pipeline.jpeg({ quality: JPG_QUALITY }).toBuffer()

  // If converting PNG to JPG, write new file and delete old
  if (isPng) {
    const newPath = filePath.replace(/\.png$/i, '.jpg')
    fs.writeFileSync(newPath, outputBuffer)
    fs.unlinkSync(filePath)
    const savings = stat.size - outputBuffer.length
    return {
      file: relativePath,
      from: (stat.size / 1024 / 1024).toFixed(2) + ' MB',
      to: (outputBuffer.length / 1024 / 1024).toFixed(2) + ' MB',
      saved: (savings / 1024 / 1024).toFixed(2) + ' MB',
      renamed: path.basename(newPath),
    }
  } else {
    fs.writeFileSync(filePath, outputBuffer)
    const savings = stat.size - outputBuffer.length
    return {
      file: relativePath,
      from: (stat.size / 1024 / 1024).toFixed(2) + ' MB',
      to: (outputBuffer.length / 1024 / 1024).toFixed(2) + ' MB',
      saved: (savings / 1024 / 1024).toFixed(2) + ' MB',
    }
  }
}

async function main() {
  const images = walkDir(publicDir)
  console.log(`Found ${images.length} images in public/`)

  let totalSaved = 0
  const results = []

  for (const img of images) {
    try {
      const result = await optimizeImage(img)
      if (result) {
        results.push(result)
        totalSaved += parseFloat(result.saved)
        console.log(`  ✓ ${result.file} — ${result.from} → ${result.to} (saved ${result.saved})${result.renamed ? ` → ${result.renamed}` : ''}`)
      }
    } catch (err) {
      console.error(`  ✗ ${path.relative(publicDir, img)} — ${err.message}`)
    }
  }

  console.log(`\nOptimized ${results.length} images, saved ${totalSaved.toFixed(2)} MB total`)
}

main()
