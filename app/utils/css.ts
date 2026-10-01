/** Read a design token from :root (map layers and canvases need raw values). */
export function cssVar(name: string, el: Element = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim()
}

/** Mix a hex colour toward black (k < 0) or white (k > 0); k in [-1, 1]. */
export function shade(hex: string, k: number) {
  const h = hex.replace('#', '')
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  const t = k < 0 ? 0 : 255
  const a = Math.abs(k)
  return '#' + c.map((v) => Math.round(v + (t - v) * a).toString(16).padStart(2, '0')).join('')
}
