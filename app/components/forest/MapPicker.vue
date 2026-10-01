<script setup lang="ts">
// Location picker: a flat map with every patch in its species colour and a
// fixed centre pin. Pan the map under the pin, then confirm.
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { SPECIES, SPECIES_IDS } from '~/data/species'
import type { LngLat } from '~/utils/geo'

const props = defineProps<{ start?: LngLat | null }>()
const emit = defineEmits<{ pick: [LngLat] }>()
const forest = useForest()
const el = ref<HTMLElement | null>(null)
const map = shallowRef<MLMap | null>(null)
const center = ref<LngLat | null>(null)
const nearest = ref<ReturnType<typeof forest.nearestPatch>>(null)

onMounted(async () => {
  const ml = await import('maplibre-gl')
  ml.setWorkerUrl(workerUrl)
  await forest.load()
  if (!el.value) return
  const v = (n: string) => cssVar(n)
  const start = props.start ?? forest.center.value
  const [w, s, e, n] = forest.bounds.value
  const m = new ml.Map({
    container: el.value,
    center: start,
    zoom: 17.6,
    maxBounds: [[w, s], [e, n]],
    attributionControl: false,
    style: {
      version: 8,
      sources: {
        context: { type: 'geojson', data: forest.context.value },
        patches: { type: 'geojson', data: forest.patchCollection.value },
      },
      layers: [
        { id: 'land', type: 'background', paint: { 'background-color': v('--map-land') } },
        { id: 'wet', type: 'fill', source: 'context', filter: ['==', ['get', 'kind'], 'wetland'], paint: { 'fill-color': v('--map-forest') } },
        { id: 'water', type: 'fill', source: 'context', filter: ['in', ['get', 'kind'], ['literal', ['water', 'aquaculture']]], paint: { 'fill-color': v('--map-water') } },
        { id: 'roads', type: 'line', source: 'context', filter: ['==', ['get', 'kind'], 'road'], paint: { 'line-color': v('--map-road-casing'), 'line-width': 3 } },
        {
          id: 'patches', type: 'fill', source: 'patches',
          paint: { 'fill-color': ['match', ['get', 'species_id'], ...SPECIES_IDS.flatMap((id) => [id, v(`--species-${id}`)]), '#888'] as never, 'fill-opacity': 0.75, 'fill-outline-color': v('--surface') },
        },
      ],
    },
  })
  const update = () => {
    const c = m.getCenter()
    center.value = [c.lng, c.lat]
    nearest.value = forest.nearestPatch(center.value)
  }
  m.on('load', update)
  m.on('move', update)
  map.value = m
})
onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <div class="picker">
    <div ref="el" class="map" />
    <div class="pin" aria-hidden="true"><span /></div>
    <div class="info glass">
      <p v-if="nearest" class="near">
        <i :style="{ background: `var(--species-${nearest.patch.species_id})` }" />
        Gần khóm {{ nearest.patch.id }} · {{ SPECIES[nearest.patch.species_id].name }} · {{ num(nearest.distance) }} m
      </p>
      <p v-if="center" class="coords tabular">{{ center[1].toFixed(5) }}, {{ center[0].toFixed(5) }}</p>
      <UiButton block :disabled="!center" @click="center && emit('pick', center)">Dùng vị trí này</UiButton>
    </div>
  </div>
</template>

<style scoped>
.picker { position: relative; height: min(64dvh, 560px); margin: 0 -20px -20px; overflow: hidden; }
.map { position: absolute; inset: 0; }
.pin { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; z-index: 2; }
.pin span { position: absolute; left: -11px; top: -11px; width: 22px; height: 22px; border-radius: 50%; background: #1a73e8; box-shadow: 0 0 0 3px #fff, 0 0 0 10px rgba(26, 115, 232, 0.2), 0 3px 10px rgba(0, 0, 0, 0.3); }
.info { position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 3; padding: 12px; border-radius: 20px; display: flex; flex-direction: column; gap: 8px; }
.near { display: flex; align-items: center; gap: 8px; font: 600 14px/1.3 var(--font-sans); }
.near i { width: 10px; height: 10px; border-radius: 3px; flex: none; }
.coords { font: var(--t-caption); color: var(--label-2); }
@media (min-width: 768px) { .picker { margin: 0 -20px -20px; } }
</style>
