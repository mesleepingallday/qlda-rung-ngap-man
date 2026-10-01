// Captures the design-review gallery in docs/redesign/screens/ (WebP).
// Start the app first (npm run dev), then: npm run screens
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import sharp from 'sharp'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'redesign', 'screens')
mkdirSync(OUT, { recursive: true })

const PHONE = { width: 390, height: 844 }
const DESK = { width: 1440, height: 900 }
const people = {
  local: { name: 'Bác Hòa', role: 'local' },
  student: { name: 'Minh Anh', role: 'student', classCode: 'SH-K46' },
  advisor: { name: 'Nguyễn Văn An', role: 'advisor', org: 'Khoa Sinh học' },
}

const shots = [
  { file: '01-welcome-phone', vp: PHONE, path: '/welcome', wait: 2600 },
  { file: '02-role-phone', vp: PHONE, path: '/welcome', wait: 600, run: async (p) => { await p.getByRole('button', { name: 'Bắt đầu' }).click(); await p.waitForTimeout(500); await p.getByRole('button', { name: 'Tiếp tục' }).click(); await p.waitForTimeout(500); await p.getByRole('radio', { name: /Sinh viên/ }).click(); await p.waitForTimeout(400) } },
  { file: '03-home-phone', vp: PHONE, who: 'student', path: '/', wait: 1800 },
  { file: '04-map-phone', vp: PHONE, who: 'local', path: '/explore', wait: 6500 },
  { file: '05-map-patch-phone', vp: PHONE, who: 'local', path: '/explore?patch=P070', wait: 6500 },
  { file: '06-species-phone', vp: PHONE, who: 'student', path: '/species', wait: 1200 },
  { file: '07-species-detail-phone-dark', vp: PHONE, who: 'student', path: '/species/acanthus', wait: 1500, dark: true },
  { file: '08-identify-phone', vp: PHONE, who: 'student', path: '/identify', wait: 900 },
  { file: '09-identify-result-phone', vp: PHONE, who: 'student', path: '/identify', wait: 600, run: async (p) => { await p.getByRole('radio', { name: /Lá chụm/ }).click(); await p.waitForTimeout(900) } },
  { file: '10-new-observation-phone', vp: PHONE, who: 'local', path: '/observations/new', wait: 1200 },
  { file: '11-review-queue-phone', vp: PHONE, who: 'advisor', path: '/observations?tab=queue', wait: 1200 },
  { file: '12-welcome-desktop-dark', vp: DESK, path: '/welcome', wait: 2600, dark: true },
  { file: '13-home-desktop', vp: DESK, who: 'advisor', path: '/', wait: 2000 },
  { file: '14-map-desktop', vp: DESK, who: 'student', path: '/explore?patch=P070&tide=1', wait: 7000 },
  { file: '15-map-desktop-dark', vp: DESK, who: 'student', path: '/explore?species=acanthus', wait: 7000, dark: true },
  { file: '16-species-detail-desktop', vp: DESK, who: 'student', path: '/species/excoecaria', wait: 1600 },
  { file: '17-observation-desktop', vp: DESK, who: 'advisor', path: '/observations/demo-3', wait: 1600 },
]

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: s.vp, deviceScaleFactor: 2, colorScheme: s.dark ? 'dark' : 'light' })
  const page = await ctx.newPage()
  const profile = s.who ? { ...people[s.who], onboardedAt: '2026-10-01T08:00:00.000Z' } : null
  await page.addInitScript((p) => {
    try {
      if (p) localStorage.setItem('rnm:profile', JSON.stringify(p))
      localStorage.setItem('rnm:explore-hint-seen', 'true')
    } catch {}
  }, profile)
  await page.goto(BASE + s.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(s.wait)
  if (s.run) await s.run(page)
  const png = await page.screenshot()
  await sharp(png).webp({ quality: 82 }).toFile(join(OUT, `${s.file}.webp`))
  console.log('✓', s.file)
  await ctx.close()
}
await browser.close()
