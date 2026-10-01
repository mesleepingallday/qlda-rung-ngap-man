// Renders the app mark to every icon the web app and the installed app need.
// Usage: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(out, { recursive: true })

// Glyph drawn on a 64-unit grid (same as app/components/app/AppMark.vue).
const glyph = `
  <path d="M32 8.5c8.6 5.3 11.6 12.8 9.6 20.6-1.3 4.6-4.5 7.7-9.6 9.6-5.1-1.9-8.3-5-9.6-9.6-2-7.8 1-15.3 9.6-20.6z" fill="#fff"/>
  <path d="M32 14v24" stroke="#0e6a4d" stroke-width="2" stroke-linecap="round"/>
  <path d="M32 37c-6 3-10 9-11.5 17M32 37c6 3 10 9 11.5 17M32 41c-2.2 4-3.2 8.5-3.4 13M32 41c2.2 4 3.2 8.5 3.4 13" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <path d="M9 50.5c3.4 0 4.6-2.3 8-2.3s4.6 2.3 8 2.3 4.6-2.3 8-2.3 4.6 2.3 8 2.3 4.6-2.3 8-2.3 4.6 2.3 8 2.3" stroke="#9fd8f0" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
const gradient = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14855f"/><stop offset="1" stop-color="#0a4d3a"/></linearGradient></defs>`

/** Rounded app tile (favicon, apple-touch, regular PWA icons). */
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${gradient}<rect width="64" height="64" rx="15" fill="url(#g)"/>${glyph}</svg>`
/** Full-bleed square with the glyph inside the 80% maskable safe zone. */
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${gradient}<rect width="64" height="64" fill="url(#g)"/><g transform="translate(32 32) scale(0.72) translate(-32 -31)">${glyph}</g></svg>`
/** Opaque square for iOS (it applies its own mask). */
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${gradient}<rect width="64" height="64" fill="url(#g)"/><g transform="translate(32 32) scale(0.86) translate(-32 -31)">${glyph}</g></svg>`

const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()

writeFileSync(join(out, 'icon.svg'), rounded)
writeFileSync(join(out, 'icon-192.png'), png(rounded, 192))
writeFileSync(join(out, 'icon-512.png'), png(rounded, 512))
writeFileSync(join(out, 'maskable-512.png'), png(maskable, 512))
writeFileSync(join(out, 'apple-touch-icon.png'), png(square, 180))
writeFileSync(join(out, 'favicon-32.png'), png(rounded, 32))
console.log('Icons written to public/icons')
