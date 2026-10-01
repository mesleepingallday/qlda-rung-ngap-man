// Captures the /share-card page as the link-preview image (1200 × 630).
// Start the dev server first (npm run dev), then: node scripts/build-share-card.mjs
import { chromium } from 'playwright-core'
const base = process.env.BASE_URL || 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' })
await page.goto(`${base}/share-card`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: 'public/icons/og-image.png' })
await browser.close()
console.log('Wrote public/icons/og-image.png')
