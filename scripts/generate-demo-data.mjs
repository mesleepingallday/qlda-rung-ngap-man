// Generates the DEMO dataset used by the app until surveyed data exists:
//   public/data/patches.geojson  – vegetation patches (schema: vegetation_patches)
//   public/data/context.geojson  – a hand-built placeholder basemap
//
// Everything here is SIMULATED. The app labels it as such everywhere it is
// shown. Replace patches.geojson with polygons digitised in QGIS (EPSG:4326,
// same properties) and context.geojson with `npm run data:context` (real OSM).
//
// Layout: water (Tam Giang lagoon side) to the south, a tidal creek cutting
// into the forest, species zoned by distance from the water's edge.
//
// Usage: node scripts/generate-demo-data.mjs [--center=lng,lat] [--seed=n]
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const CENTER = args.center ? args.center.split(',').map(Number) : [107.5935, 16.5485] // unverified estimate
const SEED = Number(args.seed || 20261001)
const HALF = 650 // metres from centre to the context bbox edge

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(SEED)
const between = (a, b) => a + (b - a) * rnd()
const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }

const mPerDegLat = 111320
const mPerDegLng = 111320 * Math.cos((CENTER[1] * Math.PI) / 180)
const toLngLat = ([x, y]) => [+(CENTER[0] + x / mPerDegLng).toFixed(7), +(CENTER[1] + y / mPerDegLat).toFixed(7)]
const ring = (pts) => { const r = pts.map(toLngLat); r.push(r[0]); return r }
const poly = (kind, pts, extra = {}) => ({ type: 'Feature', properties: { kind, ...extra }, geometry: { type: 'Polygon', coordinates: [ring(pts)] } })
const line = (kind, pts, extra = {}) => ({ type: 'Feature', properties: { kind, ...extra }, geometry: { type: 'LineString', coordinates: pts.map(toLngLat) } })
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]

// ---------------------------------------------------------------------------
// Geography (metres; x east, y north)
// ---------------------------------------------------------------------------
const shoreY = (x) => -118 + 14 * Math.sin(x / 70) + 7 * Math.sin(x / 23 + 1.3)
const FOREST_HALF = 245
// Landward depth of the forest at x, tapering to zero at both ends.
const depthAt = (x) => {
  const u = Math.min(1, Math.abs(x) / FOREST_HALF)
  return Math.max(0, 185 * Math.pow(1 - u ** 4, 0.55) + 12 * Math.sin(x / 37 + 0.6))
}
// Tidal creek: centreline as a function of distance d from the shore.
const creekX = (d) => 38 + 20 * Math.sin(d / 36) + 0.22 * d
const creekHalfWidth = (d) => Math.max(2.2, 8.5 - d * 0.042)
const CREEK_LEN = 150

function distanceToCreek(x, y) {
  let best = Infinity
  for (let d = 0; d <= CREEK_LEN; d += 2) {
    const cx = creekX(d), cy = shoreY(cx) + d
    const dist = Math.hypot(x - cx, y - cy) - creekHalfWidth(d)
    if (dist < best) best = dist
  }
  return best
}
const inForest = (x, y) => {
  if (Math.abs(x) > FOREST_HALF) return false
  const d = y - shoreY(x)
  return d >= 3 && d <= depthAt(x)
}

// ---------------------------------------------------------------------------
// Patches: Poisson-disc sampling inside the forest, then zonation.
// ---------------------------------------------------------------------------
const SPECIES = {
  acanthus: { height: 1.5, r: [6, 9.5] },
  excoecaria: { height: 6, r: [7.5, 11.5] },
  pandanus: { height: 3.5, r: [5, 7.5] },
  derris: { height: 2.5, r: [4.5, 7] },
}

function poissonDisc(minDist, tries = 30) {
  const cell = minDist / Math.SQRT2
  const W = FOREST_HALF * 2, H = 260, X0 = -FOREST_HALF, Y0 = -150
  const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell)
  const grid = new Array(cols * rows).fill(null)
  const pts = [], active = []
  const ok = (p) => {
    if (!inForest(p[0], p[1]) || distanceToCreek(p[0], p[1]) < 6) return false
    const gx = Math.floor((p[0] - X0) / cell), gy = Math.floor((p[1] - Y0) / cell)
    for (let i = Math.max(0, gx - 2); i <= Math.min(cols - 1, gx + 2); i++)
      for (let j = Math.max(0, gy - 2); j <= Math.min(rows - 1, gy + 2); j++) {
        const q = grid[j * cols + i]
        if (q && Math.hypot(q[0] - p[0], q[1] - p[1]) < minDist) return false
      }
    return true
  }
  const add = (p) => { pts.push(p); active.push(p); grid[Math.floor((p[1] - Y0) / cell) * cols + Math.floor((p[0] - X0) / cell)] = p }
  add([-120, shoreY(-120) + 60])
  while (active.length) {
    const k = Math.floor(rnd() * active.length), base = active[k]
    let found = false
    for (let t = 0; t < tries; t++) {
      const a = rnd() * Math.PI * 2, r = minDist * (1 + rnd())
      const p = [base[0] + Math.cos(a) * r, base[1] + Math.sin(a) * r]
      if (p[0] < X0 || p[0] >= X0 + W || p[1] < Y0 || p[1] >= Y0 + H) continue
      if (ok(p)) { add(p); found = true; break }
    }
    if (!found) active.splice(k, 1)
  }
  return pts
}

const centres = poissonDisc(19).sort((a, b) => a[0] - b[0] || a[1] - b[1])

function pickSpecies(t, nearCreek) {
  if (rnd() < 0.1 && t > 0.2) return 'derris'
  const n = t + gauss() * 0.11 - (nearCreek ? 0.18 : 0)
  if (n < 0.27) return 'acanthus'
  if (n < 0.73) return 'excoecaria'
  return 'pandanus'
}

function blob([cx, cy], radius, steps = 14) {
  const phase = rnd() * Math.PI * 2, lobes = 2 + Math.floor(rnd() * 3)
  const pts = []
  for (let k = 0; k < steps; k++) {
    const a = (k / steps) * Math.PI * 2
    const r = radius * (1 + 0.2 * Math.sin(lobes * a + phase) + (rnd() - 0.5) * 0.14)
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

const nearestDist = centres.map((p, i) => Math.min(...centres.filter((_, j) => j !== i).map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))))
const START = Date.UTC(2026, 2, 1), END = Date.UTC(2026, 8, 20)

const features = centres.map((p, i) => {
  const [x, y] = p
  const d = y - shoreY(x)
  const t = Math.min(1, Math.max(0, d / Math.max(1, depthAt(x))))
  const nearCreek = distanceToCreek(x, y) < 14
  const species_id = pickSpecies(t, nearCreek)
  const spec = SPECIES[species_id]
  const radius = Math.min(between(...spec.r), nearestDist[i] * 0.62)
  const height_m = +(spec.height * between(0.75, 1.25)).toFixed(1)
  const verified = rnd() < 0.56
  const confidence = +(verified ? between(0.74, 0.98) : between(0.36, 0.69)).toFixed(2)
  const ground_m = +(0.16 + 0.96 * t + gauss() * 0.05 - (nearCreek ? 0.12 : 0)).toFixed(2)
  const shape = blob(p, radius)
  const area = Math.round(Math.PI * radius * radius)
  const fid = i + 1
  return {
    type: 'Feature',
    properties: {
      fid,
      id: `P${String(fid).padStart(3, '0')}`,
      species_id,
      height_m,
      crown_diameter_m: +(radius * 2).toFixed(1),
      area_m2: area,
      ground_m: Math.max(0.08, ground_m),
      shore_distance_m: Math.round(d),
      observed_at: verified ? new Date(between(START, END)).toISOString().slice(0, 10) : null,
      source: 'demo',
      confidence,
      verified,
      verified_by: verified ? 'demo-advisor' : null,
      notes: 'Demo data, not surveyed',
    },
    geometry: { type: 'Polygon', coordinates: [ring(shape)] },
  }
})

// ---------------------------------------------------------------------------
// Placeholder context (clearly flagged; replaced by real OSM when available)
// ---------------------------------------------------------------------------
const ctx = []
const xs = []
for (let x = -HALF; x <= HALF; x += 20) xs.push(x)

// Lagoon
ctx.push(poly('water', [...xs.map((x) => [x, shoreY(x)]), [HALF, -HALF], [-HALF, -HALF]], { name: 'Mặt nước (minh họa)' }))

// Forest floor (intertidal mud) under the patches
const forestEdge = []
for (let x = -FOREST_HALF; x <= FOREST_HALF; x += 10) forestEdge.push([x, shoreY(x) + depthAt(x) + 10])
for (let x = FOREST_HALF; x >= -FOREST_HALF; x -= 10) forestEdge.push([x, shoreY(x) - 2])
ctx.push(poly('wetland', forestEdge))

// Tidal creek as a polygon of varying width: the centreline offset to both
// sides, perpendicular to its direction.
const left = [], right = []
for (let d = -10; d <= CREEK_LEN; d += 5) {
  const dd = Math.max(0, d)
  const x = creekX(dd), y = shoreY(x) + d
  const x2 = creekX(dd + 2), y2 = shoreY(x2) + d + 2
  const len = Math.hypot(x2 - x, y2 - y)
  const nx = -(y2 - y) / len, ny = (x2 - x) / len
  const w = creekHalfWidth(dd)
  left.push([x + nx * w, y + ny * w])
  right.push([x - nx * w, y - ny * w])
}
ctx.push(poly('water', [...left, ...right.reverse()], { name: 'Lạch triều (minh họa)' }))

// Aquaculture ponds either side of the forest
for (const side of [-1, 1]) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      const x0 = side * (FOREST_HALF + 45 + i * 70), x1 = x0 + side * 60
      const xa = Math.min(x0, x1), xb = Math.max(x0, x1)
      const y0 = Math.max(shoreY(xa), shoreY(xb)) + 14 + j * 58
      ctx.push(poly('aquaculture', rect(xa, y0, xb, y0 + 50)))
    }
  }
}

// Rice fields north of the forest
for (let i = -6; i < 6; i++) {
  for (let j = 0; j < 2; j++) {
    const x0 = i * 96 + 4, y0 = 128 + j * 70
    ctx.push(poly('farmland', rect(x0, y0, x0 + 88, y0 + 62)))
  }
}

// Village
ctx.push(poly('residential', rect(-HALF, 290, HALF, HALF)))
ctx.push(line('road', xs.map((x) => [x, 300 + 6 * Math.sin(x / 140)]), { highway: 'tertiary' }))
ctx.push(line('road', [[-46, 300], [-50, 230], [-58, 150], [-62, 95]], { highway: 'track' }))
ctx.push(line('road', [[210, 302], [215, 420], [222, HALF]], { highway: 'residential' }))
for (let i = 0; i < 44; i++) {
  const x = -620 + (i % 22) * 58 + between(-8, 8)
  const y = (i < 22 ? 318 : 380) + between(-6, 12)
  const w = between(10, 18), h = between(9, 14)
  ctx.push(poly('building', rect(x, y, x + w, y + h)))
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
const bbox = [...toLngLat([-HALF, -HALF]), ...toLngLat([HALF, HALF])]
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
mkdirSync(outDir, { recursive: true })
const counts = features.reduce((m, f) => ((m[f.properties.species_id] = (m[f.properties.species_id] || 0) + 1), m), {})

writeFileSync(join(outDir, 'patches.geojson'), JSON.stringify({
  type: 'FeatureCollection',
  name: 'vegetation_patches',
  demo: true,
  center: CENTER,
  bearing: 0,
  generator: 'scripts/generate-demo-data.mjs',
  seed: SEED,
  features,
}))
writeFileSync(join(outDir, 'context.geojson'), JSON.stringify({
  type: 'FeatureCollection',
  placeholder: true,
  attribution: 'Nền minh họa, vẽ tay',
  center: CENTER,
  bbox,
  features: ctx,
}))
console.log(`Wrote ${features.length} demo patches`, counts, `and ${ctx.length} placeholder context features`)
