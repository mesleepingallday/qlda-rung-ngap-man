<script setup lang="ts">
// Static top-down snippet of the forest around a point (SVG, no WebGL):
// cheap enough for list details and forms.
import { computed } from 'vue'
import type { Polygon } from 'geojson'
import { localFrame, type LngLat } from '~/utils/geo'

const props = withDefaults(defineProps<{ point: LngLat; radius?: number; highlight?: string | null }>(), { radius: 70, highlight: null })
const { patchCollection, context } = useForest()
const W = 360, H = 180

const view = computed(() => {
  const frame = localFrame(props.point)
  const scale = H / (props.radius * 2)
  const pt = (ll: LngLat) => { const [x, y] = frame.toXY(ll); return [W / 2 + x * scale, H / 2 - y * scale] as const }
  const path = (ring: LngLat[]) => 'M' + ring.map((p) => pt(p).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z'
  const near = (ring: LngLat[]) => ring.some((p) => { const [x, y] = frame.toXY(p); return Math.abs(x) < props.radius * 2.2 && Math.abs(y) < props.radius * 1.6 })
  const water = context.value.features
    .filter((f) => f.geometry?.type === 'Polygon' && ['water', 'wetland', 'aquaculture'].includes(String(f.properties?.kind)))
    .map((f) => ({ kind: String(f.properties?.kind), d: path((f.geometry as Polygon).coordinates[0] as LngLat[]) }))
  const patches = patchCollection.value.features
    .filter((f) => near(f.geometry.coordinates[0] as LngLat[]))
    .map((f) => ({ id: f.properties.id, species: f.properties.species_id, d: path(f.geometry.coordinates[0] as LngLat[]) }))
  return { water, patches }
})
</script>

<template>
  <svg class="mini" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Bản đồ vị trí ghi nhận">
    <rect :width="W" :height="H" class="land" />
    <path v-for="(w, i) in view.water" :key="i" :d="w.d" :class="w.kind" />
    <path v-for="p in view.patches" :key="p.id" :d="p.d" :style="{ fill: `var(--species-${p.species})` }" :class="{ hl: p.id === highlight }" />
    <g :transform="`translate(${W / 2} ${H / 2})`" class="pin">
      <circle r="13" class="halo" />
      <circle r="6.5" class="dot" />
    </g>
  </svg>
</template>

<style scoped>
.mini { display: block; width: 100%; height: 100%; }
.land { fill: var(--map-land); }
.water { fill: var(--map-water); }
.aquaculture { fill: var(--map-water); opacity: 0.8; }
.wetland { fill: var(--map-forest); }
path:not(.water):not(.wetland):not(.aquaculture) { opacity: 0.55; stroke: var(--surface); stroke-width: 1; }
path.hl { opacity: 1 !important; stroke: var(--label) !important; stroke-width: 2 !important; }
.halo { fill: rgba(26, 115, 232, 0.2); }
.dot { fill: #1a73e8; stroke: #fff; stroke-width: 2.5; }
</style>
