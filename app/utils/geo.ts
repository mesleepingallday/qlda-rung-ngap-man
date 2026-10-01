// Small, dependency-free geometry helpers. The study area is ~1 km across, so
// a local equirectangular frame (metres east/north of a centre) is accurate to
// well under a metre and keeps the maths readable.

export type LngLat = [number, number]
export type XY = [number, number]

export function metresPerDegree(lat: number) {
  return { lng: 111320 * Math.cos((lat * Math.PI) / 180), lat: 111320 }
}

/** Projector between lng/lat and local metres around `center`. */
export function localFrame(center: LngLat) {
  const m = metresPerDegree(center[1])
  return {
    toXY: ([lng, lat]: LngLat): XY => [(lng - center[0]) * m.lng, (lat - center[1]) * m.lat],
    toLngLat: ([x, y]: XY): LngLat => [center[0] + x / m.lng, center[1] + y / m.lat],
  }
}

export function distanceMetres(a: LngLat, b: LngLat) {
  const m = metresPerDegree((a[1] + b[1]) / 2)
  return Math.hypot((a[0] - b[0]) * m.lng, (a[1] - b[1]) * m.lat)
}

/**
 * Area-weighted centroid of a closed ring (falls back to vertex mean).
 * Computed relative to the first vertex: raw lng × lat products (~1 780)
 * would cancel catastrophically for patch-sized areas (~1e-8 deg²).
 */
export function ringCentroid(ring: LngLat[]): LngLat {
  const [ox, oy] = ring[0]!
  let a = 0, cx = 0, cy = 0
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const x0 = ring[i]![0] - ox, y0 = ring[i]![1] - oy
    const x1 = ring[i + 1]![0] - ox, y1 = ring[i + 1]![1] - oy
    const f = x0 * y1 - x1 * y0
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
  }
  if (Math.abs(a) < 1e-18) {
    const n = ring.length
    return [ring.reduce((s, p) => s + p[0], 0) / n, ring.reduce((s, p) => s + p[1], 0) / n]
  }
  return [ox + cx / (3 * a), oy + cy / (3 * a)]
}

/** Andrew's monotone-chain convex hull (counter-clockwise, not closed). */
export function convexHull(points: XY[]): XY[] {
  const pts = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1])
  if (pts.length < 3) return pts
  const cross = (o: XY, a: XY, b: XY) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: XY[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: XY[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop(); lower.pop()
  return lower.concat(upper)
}

/** Push each vertex of a CCW polygon outward by `d` metres along its bisector. */
export function inflate(poly: XY[], d: number): XY[] {
  const n = poly.length
  return poly.map((p, i) => {
    const prev = poly[(i - 1 + n) % n]!, next = poly[(i + 1) % n]!
    const n1 = normal(prev, p), n2 = normal(p, next)
    let nx = n1[0] + n2[0], ny = n1[1] + n2[1]
    const len = Math.hypot(nx, ny) || 1
    nx /= len; ny /= len
    return [p[0] + nx * d, p[1] + ny * d] as XY
  })
}
function normal(a: XY, b: XY): XY {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  return [dy / len, -dx / len] // right-hand normal = outward for CCW
}

/** Chaikin corner cutting for a closed polygon. */
export function smooth(poly: XY[], iterations = 2): XY[] {
  let out = poly
  for (let k = 0; k < iterations; k++) {
    const next: XY[] = []
    for (let i = 0; i < out.length; i++) {
      const a = out[i]!, b = out[(i + 1) % out.length]!
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25])
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    out = next
  }
  return out
}

export function bboxOf(coords: LngLat[]): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity
  for (const [x, y] of coords) {
    if (x < w) w = x
    if (y < s) s = y
    if (x > e) e = x
    if (y > n) n = y
  }
  return [w, s, e, n]
}

/** Ray-casting point-in-ring test (ring as lng/lat or metres). */
export function pointInRing(p: [number, number], ring: [number, number][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!, [xj, yj] = ring[j]!
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
