<script setup lang="ts">
// 2.5D forest map (MapLibre GL). Patches are clay-grey extrusions that take
// their species colour on hover / selection / filter, or always when the
// viewer asks for it. Ground mounds and a translucent tide volume make
// elevation and flooding visible. Styling comes from the design tokens and
// follows the light/dark theme.
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { Map as MLMap, MapGeoJSONFeature, GeoJSONSource, ExpressionSpecification, MapMouseEvent, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { SPECIES_IDS, type SpeciesId } from '~/data/species'
import type { Patch } from '~/composables/useForest'
import type { LngLat } from '~/utils/geo'

const props = withDefaults(defineProps<{
  tide?: number
  exaggeration?: number
  colorMode?: 'touch' | 'all'
  focusSpecies?: SpeciesId | null
  /** Species highlighted from the legend (transient, does not dim others when null). */
  previewSpecies?: SpeciesId | null
  selectedId?: string | null
  basemap?: 'map' | 'satellite'
  pitched?: boolean
  /** Extra camera padding (px) so the forest is framed beside panels/sheets. */
  padding?: { top: number; right: number; bottom: number; left: number }
}>(), {
  tide: 0, exaggeration: 1, colorMode: 'touch', focusSpecies: null, previewSpecies: null, selectedId: null,
  basemap: 'map', pitched: true, padding: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
})
const emit = defineEmits<{
  hover: [patch: Patch | null, point: { x: number; y: number } | null]
  select: [patch: Patch | null]
  ready: []
  error: [message: string]
  bearing: [deg: number]
}>()

const forest = useForest()
const { resolved } = useTheme()
const container = ref<HTMLElement | null>(null)
const map = shallowRef<MLMap | null>(null)
let ml: typeof import('maplibre-gl') | null = null
let hoveredFid: number | null = null
let selectedFid: number | null = null
let userMarker: Marker | null = null
let ro: ResizeObserver | null = null

const SAT_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const kindIs = (...k: string[]): ExpressionSpecification => ['in', ['get', 'kind'], ['literal', k]]
const isPoly: ExpressionSpecification = ['==', ['geometry-type'], 'Polygon']

function palette() {
  const v = (n: string) => cssVar(n)
  return {
    land: v('--map-land'), green: v('--map-green'), wetland: v('--map-forest'), residential: v('--map-residential'),
    sand: v('--map-sand'), water: v('--map-water'), waterEdge: v('--map-water-edge'), road: v('--map-road'),
    casing: v('--map-road-casing'), building: v('--map-building'), tide: v('--map-tide'),
    grayLo: v('--patch-gray-lo'), grayHi: v('--patch-gray-hi'), dim: v('--patch-dim'), ground: v('--patch-ground'),
    outline: v('--patch-outline'), label: v('--label'),
    species: Object.fromEntries(SPECIES_IDS.map((id) => [id, v(`--species-${id}`)])) as Record<SpeciesId, string>,
    aquaculture: resolved.value === 'dark' ? '#15303a' : '#bdd5df',
  }
}

function colorExpr(): ExpressionSpecification {
  const p = palette()
  const speciesColor: ExpressionSpecification = ['match', ['get', 'species_id'], ...SPECIES_IDS.flatMap((k) => [k, p.species[k]]), '#888888'] as unknown as ExpressionSpecification
  const gray: ExpressionSpecification = ['interpolate', ['linear'], ['%', ['*', ['get', 'fid'], 37], 100], 0, p.grayLo, 100, p.grayHi]
  const focus = props.focusSpecies ?? props.previewSpecies
  const lit: ExpressionSpecification = ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'selected'], false]]
  // case(hovered/selected → colour, [focused species → colour], fallback)
  const parts: unknown[] = ['case', lit, speciesColor]
  if (focus) parts.push(['==', ['get', 'species_id'], focus], speciesColor)
  const fallback = props.focusSpecies ? p.dim : props.colorMode === 'all' ? speciesColor : gray
  parts.push(fallback)
  return parts as ExpressionSpecification
}
const k = () => props.exaggeration

function addLayers() {
  const m = map.value!
  const p = palette()
  m.addLayer({ id: 'land', type: 'background', paint: { 'background-color': p.land } })
  m.addLayer({ id: 'ctx-farmland', type: 'fill', source: 'context', filter: ['all', isPoly, kindIs('farmland', 'vegetation')], paint: { 'fill-color': p.green } })
  m.addLayer({ id: 'ctx-residential', type: 'fill', source: 'context', filter: ['all', isPoly, kindIs('residential')], paint: { 'fill-color': p.residential } })
  m.addLayer({ id: 'ctx-wetland', type: 'fill', source: 'context', filter: ['all', isPoly, kindIs('wetland')], paint: { 'fill-color': p.wetland } })
  m.addLayer({ id: 'ctx-sand', type: 'fill', source: 'context', filter: ['all', isPoly, kindIs('sand')], paint: { 'fill-color': p.sand } })
  m.addLayer({ id: 'ctx-aquaculture', type: 'fill', source: 'context', filter: ['all', isPoly, kindIs('aquaculture')], paint: { 'fill-color': p.aquaculture } })
  m.addLayer({ id: 'ctx-water', type: 'fill', source: 'context', filter: ['all', isPoly, kindIs('water')], paint: { 'fill-color': p.water } })
  m.addLayer({ id: 'ctx-water-edge', type: 'line', source: 'context', filter: ['all', isPoly, kindIs('water')], paint: { 'line-color': p.waterEdge, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.8, 19, 2] } })
  m.addLayer({ id: 'ctx-waterway', type: 'line', source: 'context', filter: kindIs('waterway'), layout: { 'line-cap': 'round' }, paint: { 'line-color': p.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 19, 10] } })
  m.addLayer({ id: 'sat', type: 'raster', source: 'sat', layout: { visibility: props.basemap === 'satellite' ? 'visible' : 'none' }, paint: { 'raster-saturation': -1, 'raster-contrast': 0.08, 'raster-opacity': 0.92 } })
  m.addLayer({ id: 'ctx-road-casing', type: 'line', source: 'context', filter: kindIs('road'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': p.casing, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 3, 19, 16] } })
  m.addLayer({ id: 'ctx-road', type: 'line', source: 'context', filter: kindIs('road'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': p.road, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 1.6, 19, 12] } })
  // Verification is read from the outline style, never from colour alone.
  m.addLayer({ id: 'patch-outline', type: 'line', source: 'patches', filter: ['==', ['get', 'verified'], true], paint: { 'line-color': p.outline, 'line-width': 1.3, 'line-opacity': 0.7 } })
  m.addLayer({ id: 'patch-outline-unverified', type: 'line', source: 'patches', filter: ['!=', ['get', 'verified'], true], paint: { 'line-color': p.outline, 'line-width': 1.3, 'line-opacity': 0.7, 'line-dasharray': [2, 1.6] } })
  m.addLayer({ id: 'patch-selected', type: 'line', source: 'patches', paint: { 'line-color': p.label, 'line-width': 3, 'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0] } })
  m.addLayer({ id: 'ctx-building', type: 'fill-extrusion', source: 'context', filter: ['all', isPoly, kindIs('building')], paint: { 'fill-extrusion-color': p.building, 'fill-extrusion-height': 5, 'fill-extrusion-opacity': 0.92 } })
  m.addLayer({ id: 'patch-ground', type: 'fill-extrusion', source: 'patches', paint: { 'fill-extrusion-color': p.ground, 'fill-extrusion-base': 0, 'fill-extrusion-height': ['*', ['get', 'ground_m'], k()] } })
  m.addLayer({
    id: 'patches', type: 'fill-extrusion', source: 'patches',
    paint: {
      'fill-extrusion-color': colorExpr(),
      'fill-extrusion-base': ['*', ['get', 'ground_m'], k()],
      'fill-extrusion-height': ['*', ['+', ['get', 'ground_m'], ['get', 'height_m']], k()],
      'fill-extrusion-opacity': 0.96,
      'fill-extrusion-vertical-gradient': true,
    },
  })
  m.addLayer({ id: 'tide', type: 'fill-extrusion', source: 'tide', layout: { visibility: props.tide > 0 ? 'visible' : 'none' }, paint: { 'fill-extrusion-color': p.tide, 'fill-extrusion-opacity': 0.42, 'fill-extrusion-height': props.tide * k() } })
}

function applyTheme() {
  const m = map.value
  if (!m?.isStyleLoaded()) return
  const p = palette()
  const set = (id: string, prop: string, v: unknown) => { if (m.getLayer(id)) m.setPaintProperty(id, prop as never, v as never) }
  set('land', 'background-color', p.land)
  set('ctx-farmland', 'fill-color', p.green)
  set('ctx-residential', 'fill-color', p.residential)
  set('ctx-wetland', 'fill-color', p.wetland)
  set('ctx-sand', 'fill-color', p.sand)
  set('ctx-aquaculture', 'fill-color', p.aquaculture)
  set('ctx-water', 'fill-color', p.water)
  set('ctx-water-edge', 'line-color', p.waterEdge)
  set('ctx-waterway', 'line-color', p.water)
  set('ctx-road-casing', 'line-color', p.casing)
  set('ctx-road', 'line-color', p.road)
  set('patch-outline', 'line-color', p.outline)
  set('patch-outline-unverified', 'line-color', p.outline)
  set('patch-selected', 'line-color', p.label)
  set('ctx-building', 'fill-extrusion-color', p.building)
  set('patch-ground', 'fill-extrusion-color', p.ground)
  set('tide', 'fill-extrusion-color', p.tide)
  set('patches', 'fill-extrusion-color', colorExpr())
}

function toPatch(f: MapGeoJSONFeature): Patch | null {
  return forest.byId.value.get(String(f.properties.id)) ?? null
}

function setState(fid: number | null, key: 'hover' | 'selected', on: boolean) {
  if (fid === null || !map.value) return
  map.value.setFeatureState({ source: 'patches', id: fid }, { [key]: on })
}

const canHover = import.meta.client && matchMedia('(hover: hover) and (pointer: fine)').matches

function onMove(e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) {
  const f = e.features?.[0]
  if (!f || !canHover) return
  map.value!.getCanvas().style.cursor = 'pointer'
  const fid = Number(f.id)
  if (hoveredFid !== fid) {
    setState(hoveredFid, 'hover', false)
    hoveredFid = fid
    setState(fid, 'hover', true)
  }
  emit('hover', toPatch(f), { x: e.point.x, y: e.point.y })
}
function onLeave() {
  if (!map.value) return
  map.value.getCanvas().style.cursor = ''
  setState(hoveredFid, 'hover', false)
  hoveredFid = null
  emit('hover', null, null)
}
function onClick(e: MapMouseEvent) {
  const f = map.value!.queryRenderedFeatures(e.point, { layers: ['patches'] })[0]
  emit('select', f ? toPatch(f) : null)
}

function fidOf(id: string | null) {
  if (!id) return null
  const f = forest.patchCollection.value.features.find((x) => x.properties.id === id)
  return f ? f.properties.fid : null
}

function forestCenter(): LngLat {
  const ps = forest.patches.value
  if (!ps.length) return forest.center.value
  return [ps.reduce((s, p) => s + p.centroid[0], 0) / ps.length, ps.reduce((s, p) => s + p.centroid[1], 0) / ps.length]
}

function homeCamera() {
  const wide = (container.value?.clientWidth ?? 800) > 900
  return { center: forestCenter(), zoom: wide ? 16.95 : 15.95, pitch: props.pitched ? 56 : 0, bearing: props.pitched ? -18 : 0, padding: props.padding }
}

async function init() {
  try {
    ml = await import('maplibre-gl')
    ml.setWorkerUrl(workerUrl)
  } catch (e) {
    emit('error', 'Không tải được thư viện bản đồ.')
    return
  }
  await forest.load()
  if (!container.value) return
  const [w, s, e, n] = forest.bounds.value
  let m: MLMap
  try {
    m = new ml.Map({
      container: container.value,
      style: {
        version: 8,
        sources: {
          context: { type: 'geojson', data: forest.context.value },
          patches: { type: 'geojson', data: forest.patchCollection.value, promoteId: 'fid' },
          tide: { type: 'geojson', data: forest.tideArea.value },
          sat: { type: 'raster', tiles: [SAT_TILES], tileSize: 256, maxzoom: 19 },
        },
        layers: [],
      },
      center: forestCenter(),
      zoom: 16.5,
      pitch: props.pitched ? 56 : 0,
      bearing: props.pitched ? -18 : 0,
      minZoom: 15.2,
      maxZoom: 19.6,
      maxPitch: 70,
      maxBounds: [[w, s], [e, n]],
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
      fadeDuration: 0,
    })
  } catch {
    emit('error', 'Thiết bị này không hiển thị được bản đồ 3D (WebGL).')
    return
  }
  map.value = m
  m.on('load', () => {
    m.jumpTo(homeCamera())
    addLayers()
    m.on('mousemove', 'patches', onMove)
    m.on('mouseleave', 'patches', onLeave)
    m.on('click', onClick)
    m.on('rotate', () => emit('bearing', m.getBearing()))
    m.on('error', (ev) => { if (String(ev.error?.message ?? '').includes('arcgis')) emit('error', 'Không tải được ảnh vệ tinh.') })
    syncSelection()
    emit('ready')
  })
  ro = new ResizeObserver(() => m.resize())
  ro.observe(container.value)
}

function syncSelection() {
  const fid = fidOf(props.selectedId)
  if (fid === selectedFid) return
  setState(selectedFid, 'selected', false)
  selectedFid = fid
  setState(fid, 'selected', true)
}

// --- Reactivity ----------------------------------------------------------
watch(() => [props.colorMode, props.focusSpecies, props.previewSpecies], () => {
  if (map.value?.getLayer('patches')) map.value.setPaintProperty('patches', 'fill-extrusion-color', colorExpr())
})
watch(() => props.exaggeration, () => {
  const m = map.value
  if (!m?.getLayer('patches')) return
  m.setPaintProperty('patch-ground', 'fill-extrusion-height', ['*', ['get', 'ground_m'], k()])
  m.setPaintProperty('patches', 'fill-extrusion-base', ['*', ['get', 'ground_m'], k()])
  m.setPaintProperty('patches', 'fill-extrusion-height', ['*', ['+', ['get', 'ground_m'], ['get', 'height_m']], k()])
  m.setPaintProperty('tide', 'fill-extrusion-height', props.tide * k())
})
watch(() => props.tide, (t) => {
  const m = map.value
  if (!m?.getLayer('tide')) return
  m.setLayoutProperty('tide', 'visibility', t > 0 ? 'visible' : 'none')
  m.setPaintProperty('tide', 'fill-extrusion-height', t * k())
})
watch(() => props.basemap, (b) => {
  const m = map.value
  if (!m?.getLayer('sat')) return
  m.setLayoutProperty('sat', 'visibility', b === 'satellite' ? 'visible' : 'none')
  for (const id of ['ctx-road', 'ctx-road-casing', 'ctx-building']) m.setLayoutProperty(id, 'visibility', b === 'satellite' ? 'none' : 'visible')
})
watch(() => props.pitched, (p) => map.value?.easeTo({ pitch: p ? 56 : 0, bearing: p ? -18 : 0, duration: 650 }))
watch(() => props.selectedId, syncSelection)
watch(() => props.padding, (p, old) => {
  if (JSON.stringify(p) !== JSON.stringify(old)) map.value?.easeTo({ padding: p, duration: 350 })
}, { deep: true })
watch(() => forest.patchCollection.value, (fc) => (map.value?.getSource('patches') as GeoJSONSource | undefined)?.setData(fc))
watch(resolved, () => requestAnimationFrame(applyTheme))

// --- Imperative API ------------------------------------------------------
function flyToPatch(id: string) {
  const p = forest.byId.value.get(id)
  if (!p || !map.value) return
  map.value.easeTo({ center: p.centroid, zoom: Math.max(map.value.getZoom(), 17.6), padding: props.padding, duration: 800 })
}
function resetView() {
  map.value?.easeTo({ ...homeCamera(), duration: 800 })
}
function resetNorth() {
  map.value?.easeTo({ bearing: 0, duration: 500 })
}
function showUser(lngLat: LngLat, fly: boolean) {
  if (!map.value || !ml) return
  if (!userMarker) {
    const el = document.createElement('div')
    el.className = 'user-dot'
    userMarker = new ml.Marker({ element: el }).setLngLat(lngLat).addTo(map.value)
  } else userMarker.setLngLat(lngLat)
  if (fly) map.value.easeTo({ center: lngLat, zoom: 18, duration: 900 })
}
function zoomBy(d: number) { map.value?.easeTo({ zoom: (map.value?.getZoom() ?? 17) + d, duration: 300 }) }
defineExpose({ flyToPatch, resetView, resetNorth, showUser, zoomBy })

onMounted(init)
onBeforeUnmount(() => { ro?.disconnect(); map.value?.remove(); map.value = null })
</script>

<template>
  <div ref="container" class="forest-map" role="application" aria-label="Bản đồ 3D khu rừng Rú Chá. Dùng danh sách loài và các nút điều khiển để khám phá." />
</template>

<style scoped>
.forest-map { position: absolute; inset: 0; background: var(--map-land); }
.forest-map :deep(.user-dot) {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #1a73e8;
  box-shadow: 0 0 0 3px #fff, 0 0 0 9px rgba(26, 115, 232, 0.22), 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
