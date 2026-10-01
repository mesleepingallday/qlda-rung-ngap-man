// Turns generated images (PNG/JPG, any size) into light WebP files the app
// picks up automatically. Drop originals into app/assets/images/<folder>/
// with the file names from docs/redesign/image-prompts.md, then run:
//   npm run images
// Originals are kept in app/assets/images/_originals/ (git-ignored).
import { mkdirSync, readdirSync, renameSync, existsSync } from 'node:fs'
import { dirname, extname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'assets', 'images')
const SIZES = { species: 768, onboarding: 1600 }
const originals = join(root, '_originals')
mkdirSync(originals, { recursive: true })

let n = 0
for (const [folder, size] of Object.entries(SIZES)) {
  const dir = join(root, folder)
  if (!existsSync(dir)) continue
  for (const file of readdirSync(dir)) {
    const ext = extname(file).toLowerCase()
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue
    const src = join(dir, file)
    const out = join(dir, `${basename(file, extname(file))}.webp`)
    await sharp(src).resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90, effort: 5 }).toFile(out)
    renameSync(src, join(originals, `${folder}-${file}`))
    console.log(`✓ ${folder}/${basename(out)}`)
    n++
  }
}
console.log(n ? `Optimised ${n} image(s).` : 'No PNG/JPG files found to optimise.')
