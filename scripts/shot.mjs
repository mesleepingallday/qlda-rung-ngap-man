// Quick screenshot helper for design QA: node scripts/shot.mjs <url> <out.png> [w] [h] [dark] [fullPage]
import { chromium } from 'playwright-core'
const [url, out, w = '1280', h = '800', theme = 'light', full = '0'] = process.argv.slice(2)
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, colorScheme: theme === 'dark' ? 'dark' : 'light' })
if (process.env.ROLE) {
  const profile = { name: process.env.NAME || 'Minh Anh', role: process.env.ROLE, onboardedAt: '2026-10-01T08:00:00.000Z' }
  await page.addInitScript((p) => { try { localStorage.setItem('rnm:profile', JSON.stringify(p)) } catch {} }, profile)
}
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('VUE_ROUTER')) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(+(process.env.WAIT || 1500))
await page.screenshot({ path: out, fullPage: full === '1' })
await browser.close()
if (logs.length) console.log(logs.slice(0, 20).join('\n'))
console.log('saved', out)
