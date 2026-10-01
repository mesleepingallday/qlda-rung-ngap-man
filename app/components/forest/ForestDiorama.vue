<script setup lang="ts">
// Isometric "diorama" of the forest, drawn in SVG from the live dataset:
// a cut block of ground with the lagoon in front and every patch extruded
// to its height. No WebGL, so it is cheap enough for onboarding and Home.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Polygon } from 'geojson'
import type { SpeciesId } from '~/data/species'
import { localFrame, type LngLat, type XY } from '~/utils/geo'
import { clipToRect, decimate, makeProjector, pathOf, signedArea } from '~/utils/iso'
import { cssVar, shade } from '~/utils/css'

const props = withDefaults(defineProps<{
  mode?: 'species' | 'clay'
  focus?: SpeciesId | null
  /** Animate from clay to species colours, patch by patch, on mount. */
  reveal?: boolean
  exaggeration?: number
  label?: string
}>(), { mode: 'species', focus: null, reveal: false, exaggeration: 3, label: '' })

const { patchCollection, context, center, stats } = useForest()
const { resolved } = useTheme()

const camera = { azimuth: -28, elevation: 31 }
const SLAB = 24 // visual depth of the cut block (m)
const WATER = 7 // depth of the water band on the cut faces (m)

interface Prism { id: string; species: SpeciesId; depth: number; jitter: number; sides: { d: string; k: number }[]; top: string; shadow: string }

const geometry = computed(() => {
  const features = patchCollection.value.features
  if (!features.length) return null
  const frame = localFrame(center.value)
  const P = makeProjector(camera)
  const ex = props.exaggeration

  // Frame: patch extent plus room for the lagoon in front.
  const all = features.flatMap((f) => (f.geometry.coordinates[0] as LngLat[]).map(frame.toXY))
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1])
  const rect: [number, number, number, number] = [Math.min(...xs) - 28, Math.min(...ys) - 64, Math.max(...xs) + 28, Math.max(...ys) + 22]
  const [x0, y0, x1, y1] = rect
  const pr = (x: number, y: number, z = 0) => P.project(x, y, z)
  const poly3 = (pts: [number, number, number][]) => pathOf(pts.map(([x, y, z]) => pr(x, y, z)))

  // Ground surfaces from the context layer, clipped to the block.
  const surfaces: { kind: string; d: string }[] = []
  const order = ['farmland', 'aquaculture', 'sand', 'wetland', 'water']
  const ctx = context.value.features
    .filter((f) => f.geometry?.type === 'Polygon' && order.includes(String(f.properties?.kind)))
    .sort((a, b) => order.indexOf(String(a.properties?.kind)) - order.indexOf(String(b.properties?.kind)))
  let shoreOnEast = y0
  for (const f of ctx) {
    const ring = ((f.geometry as Polygon).coordinates[0] as LngLat[]).map(frame.toXY)
    const clipped = clipToRect(ring, rect)
    if (clipped.length < 3) continue
    const kind = String(f.properties?.kind)
    surfaces.push({ kind, d: pathOf(clipped.map(([x, y]) => pr(x, y))) })
    // How far up the east face the lagoon reaches (water band on the cut).
    if (kind === 'water') for (const [x, y] of clipped) if (Math.abs(x - x1) < 0.5 && y > shoreOnEast && y < y0 + (y1 - y0) * 0.6) shoreOnEast = y
  }

  const slab = {
    top: poly3([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]]),
    south: poly3([[x0, y0, 0], [x1, y0, 0], [x1, y0, -SLAB], [x0, y0, -SLAB]]),
    east: poly3([[x1, y0, 0], [x1, y1, 0], [x1, y1, -SLAB], [x1, y0, -SLAB]]),
    waterSouth: poly3([[x0, y0, 0], [x1, y0, 0], [x1, y0, -WATER], [x0, y0, -WATER]]),
    waterEast: shoreOnEast > y0 ? poly3([[x1, y0, 0], [x1, shoreOnEast, 0], [x1, shoreOnEast, -WATER], [x1, y0, -WATER]]) : '',
    rim: `M${pr(x0, y0).join(',')}L${pr(x1, y0).join(',')}L${pr(x1, y1).join(',')}`,
    edge: `M${pr(x1, y0).join(',')}L${pr(x1, y0, -SLAB).join(',')}`,
  }

  // Light from the south-west (toward the viewer's left) so the two visible
  // faces of each crown read with different tones.
  const L: XY = [-0.55, -0.83]
  const shadowDir: XY = [0.62, 0.78]
  const prisms: Prism[] = features.map((f) => {
    let ring = decimate((f.geometry.coordinates[0] as LngLat[]).slice(0, -1).map(frame.toXY), 12)
    if (signedArea(ring) < 0) ring = ring.reverse()
    const h = f.properties.height_m * ex
    const sides: Prism['sides'] = []
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!, b = ring[(i + 1) % ring.length]!
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const n: XY = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len]
      if (n[0] * P.forward[0] + n[1] * P.forward[1] >= 0) continue
      const lit = Math.max(0, n[0] * L[0] + n[1] * L[1])
      sides.push({ d: poly3([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], h], [a[0], a[1], h]]), k: -0.34 + lit * 0.24 })
    }
    const top = pathOf(ring.map(([x, y]) => pr(x, y, h)))
    const s = h * 0.55
    const shadow = pathOf(ring.map(([x, y]) => pr(x + shadowDir[0] * s, y + shadowDir[1] * s)))
    const c = ring.reduce((acc, p) => [acc[0] + p[0] / ring.length, acc[1] + p[1] / ring.length], [0, 0])
    return {
      id: f.properties.id,
      species: f.properties.species_id,
      depth: P.depth(c[0], c[1]),
      jitter: (((f.properties.fid * 37) % 100) / 100 - 0.5) * 0.1,
      sides, top, shadow,
    }
  }).sort((a, b) => b.depth - a.depth)

  // viewBox from the block corners and the tallest crowns.
  const corners = [pr(x0, y0, -SLAB), pr(x1, y0, -SLAB), pr(x1, y1, -SLAB), pr(x0, y1, stats.value.maxHeight * ex), pr(x1, y1, stats.value.maxHeight * ex), pr(x0, y0)]
  const vx = Math.min(...corners.map((c) => c[0])), vy = Math.min(...corners.map((c) => c[1]))
  const vw = Math.max(...corners.map((c) => c[0])) - vx, vh = Math.max(...corners.map((c) => c[1])) - vy
  const pad = vw * 0.02
  return { viewBox: `${vx - pad} ${vy - pad} ${vw + pad * 2} ${vh + pad * 2}`, surfaces, slab, prisms }
})

// --- Colour (reactive to theme / mode / focus / reveal) ------------------
// While revealing: the set of patches already in colour (null = all).
const revealed = ref<Set<string> | null>(props.reveal ? new Set() : null)
let timer: ReturnType<typeof setInterval> | null = null
let started = false

function startReveal() {
  const g = geometry.value
  if (started || !g) return
  started = true
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { revealed.value = null; return }
  // Front-to-back sweep, a few patches per frame.
  const ids = [...g.prisms].reverse().map((p) => p.id)
  const lit = new Set<string>()
  let i = 0
  const handle = setInterval(() => {
    for (let k = 0; k < 4 && i < ids.length; k++) lit.add(ids[i++]!)
    revealed.value = new Set(lit)
    if (i >= ids.length) { clearInterval(handle); timer = null; revealed.value = null }
  }, 28)
  timer = handle
}
if (props.reveal) {
  onMounted(() => setTimeout(startReveal, 500))
  watch(() => geometry.value?.prisms.length, (n) => { if (n) setTimeout(startReveal, 500) })
}
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

const palette = computed(() => {
  void resolved.value
  const dark = resolved.value === 'dark'
  return {
    land: cssVar('--map-land'),
    forest: cssVar('--map-forest'),
    water: cssVar('--map-water'),
    farmland: cssVar('--map-green'),
    aquaculture: dark ? '#173039' : '#bcd4de',
    sand: cssVar('--map-sand'),
    grayLo: cssVar('--patch-gray-lo'),
    grayHi: cssVar('--patch-gray-hi'),
    dim: cssVar('--patch-dim'),
    soilTop: dark ? '#3b3329' : '#cdbb9c',
    soilBottom: dark ? '#221e19' : '#a69272',
    waterCut: dark ? 'rgba(78,163,214,0.42)' : 'rgba(63,143,192,0.5)',
    rim: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.9)',
    shadow: dark ? 'rgba(0,0,0,0.45)' : 'rgba(40,52,38,0.22)',
    species: {
      excoecaria: cssVar('--species-excoecaria'),
      acanthus: cssVar('--species-acanthus'),
      pandanus: cssVar('--species-pandanus'),
      derris: cssVar('--species-derris'),
    } as Record<SpeciesId, string>,
  }
})

function baseColor(p: Prism) {
  const pal = palette.value
  const clay = shade(pal.grayLo, 0.5 + p.jitter * 2 > 0.5 ? 0.12 : 0.04)
  if (revealed.value && !revealed.value.has(p.id)) return clay
  if (props.mode === 'clay') return clay
  if (props.focus && props.focus !== p.species) return pal.dim
  return shade(pal.species[p.species], p.jitter)
}

const surfaceFill = (kind: string) => {
  const p = palette.value
  return ({ water: p.water, wetland: p.forest, farmland: p.farmland, aquaculture: p.aquaculture, sand: p.sand } as Record<string, string>)[kind] ?? p.land
}

const ariaLabel = computed(() => props.label || `Mô hình 3D khu rừng: ${stats.value.total} khóm cây, ${stats.value.speciesCount} loài. Chiều cao phóng đại ×${props.exaggeration}.`)
const uid = `dio-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
  <svg v-if="geometry" class="diorama" :viewBox="geometry.viewBox" role="img" :aria-label="ariaLabel" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient :id="`${uid}-soil`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="palette.soilTop" />
        <stop offset="1" :stop-color="palette.soilBottom" />
      </linearGradient>
      <filter :id="`${uid}-blur`" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </defs>

    <!-- The cut block -->
    <path :d="geometry.slab.south" :fill="`url(#${uid}-soil)`" />
    <path :d="geometry.slab.east" :fill="`url(#${uid}-soil)`" style="filter: brightness(0.86)" />
    <path :d="geometry.slab.waterSouth" :fill="palette.waterCut" />
    <path v-if="geometry.slab.waterEast" :d="geometry.slab.waterEast" :fill="palette.waterCut" style="filter: brightness(0.9)" />

    <!-- Ground surfaces -->
    <path :d="geometry.slab.top" :fill="palette.land" />
    <path v-for="(s, i) in geometry.surfaces" :key="i" :d="s.d" :fill="surfaceFill(s.kind)" />

    <!-- Soft contact shadows -->
    <g :filter="`url(#${uid}-blur)`" :fill="palette.shadow">
      <path v-for="p in geometry.prisms" :key="p.id" :d="p.shadow" />
    </g>

    <!-- Crowns, back to front -->
    <g class="prisms">
      <g v-for="p in geometry.prisms" :key="p.id">
        <path v-for="(s, i) in p.sides" :key="i" :d="s.d" :style="{ fill: shade(baseColor(p), s.k) }" />
        <path :d="p.top" :style="{ fill: shade(baseColor(p), 0.06) }" />
      </g>
    </g>

    <path :d="geometry.slab.rim" fill="none" :stroke="palette.rim" stroke-width="1.2" stroke-linejoin="round" />
    <path :d="geometry.slab.edge" fill="none" :stroke="palette.rim" stroke-width="0.8" opacity="0.6" />
  </svg>
  <div v-else class="diorama-placeholder" aria-hidden="true" />
</template>

<style scoped>
.diorama { width: 100%; height: auto; overflow: visible; }
.prisms path { transition: fill 520ms var(--ease-out); }
.diorama-placeholder { width: 100%; aspect-ratio: 16 / 9; }
</style>
