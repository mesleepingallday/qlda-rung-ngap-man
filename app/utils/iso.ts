// Orthographic "diorama" projection used by <ForestDiorama>. Builds a list of
// pre-sorted SVG faces (slab, water, forest floor, extruded patches) from the
// same GeoJSON the map uses, so the illustration is always the real dataset.
import type { XY } from './geo'

export interface IsoCamera {
  /** Direction the camera looks toward, degrees clockwise from north. */
  azimuth: number
  /** Camera elevation above the horizon, degrees. */
  elevation: number
}

export function makeProjector({ azimuth, elevation }: IsoCamera) {
  const az = (azimuth * Math.PI) / 180, el = (elevation * Math.PI) / 180
  const f: XY = [Math.sin(az), Math.cos(az)] // forward (into the screen)
  const r: XY = [Math.cos(az), -Math.sin(az)] // screen right
  const sinE = Math.sin(el), cosE = Math.cos(el)
  return {
    forward: f,
    project: (x: number, y: number, z: number): XY => [x * r[0] + y * r[1], -((x * f[0] + y * f[1]) * sinE + z * cosE)],
    depth: (x: number, y: number) => x * f[0] + y * f[1],
  }
}

/** Sutherland–Hodgman clip of a polygon against an axis-aligned rectangle. */
export function clipToRect(poly: XY[], [x0, y0, x1, y1]: [number, number, number, number]): XY[] {
  type Edge = [(p: XY) => boolean, (a: XY, b: XY) => XY]
  const lerpX = (a: XY, b: XY, x: number): XY => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]
  const lerpY = (a: XY, b: XY, y: number): XY => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]
  const edges: Edge[] = [
    [(p) => p[0] >= x0, (a, b) => lerpX(a, b, x0)],
    [(p) => p[0] <= x1, (a, b) => lerpX(a, b, x1)],
    [(p) => p[1] >= y0, (a, b) => lerpY(a, b, y0)],
    [(p) => p[1] <= y1, (a, b) => lerpY(a, b, y1)],
  ]
  let out = poly
  for (const [inside, cut] of edges) {
    const input = out
    out = []
    for (let i = 0; i < input.length; i++) {
      const cur = input[i]!, prev = input[(i - 1 + input.length) % input.length]!
      if (inside(cur)) {
        if (!inside(prev)) out.push(cut(prev, cur))
        out.push(cur)
      } else if (inside(prev)) out.push(cut(prev, cur))
    }
    if (!out.length) break
  }
  return out
}

export function signedArea(poly: XY[]) {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!, q = poly[(i + 1) % poly.length]!
    a += p[0] * q[1] - q[0] * p[1]
  }
  return a / 2
}

export const pathOf = (pts: XY[]) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z'

/** Drop vertices so a ring has at most `max` points (keeps the outline). */
export function decimate(ring: XY[], max: number) {
  if (ring.length <= max) return ring
  const step = ring.length / max
  return Array.from({ length: max }, (_, i) => ring[Math.floor(i * step)]!)
}
