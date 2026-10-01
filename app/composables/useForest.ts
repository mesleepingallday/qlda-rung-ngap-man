import { computed, ref, shallowRef } from 'vue'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { SPECIES_BY_ZONE, type SpeciesId } from '~/data/species'
import { convexHull, inflate, localFrame, ringCentroid, smooth, type LngLat, type XY } from '~/utils/geo'
import { persisted } from './persisted'

/** One vegetation patch (schema: vegetation_patches, docs/feasibility.md). */
export interface PatchProps {
  fid: number
  id: string
  species_id: SpeciesId
  height_m: number
  crown_diameter_m: number
  area_m2: number
  /** Ground elevation above mean sea level (m). */
  ground_m: number
  shore_distance_m?: number
  observed_at: string | null
  source: string
  confidence: number
  verified: boolean
  verified_by: string | null
  notes?: string
}
export interface Patch extends PatchProps {
  centroid: LngLat
  /** Distance inland from the water's edge (m), for the transect. */
  inland_m: number
}

export interface PatchOverride { verified: boolean; by: string; at: string }

interface RawData {
  patches: FeatureCollection<Polygon, PatchProps> & { demo?: boolean; center?: LngLat; bearing?: number }
  context: FeatureCollection & { placeholder?: boolean; bbox?: number[]; attribution?: string }
}

const raw = shallowRef<RawData | null>(null)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const error = ref<string | null>(null)
let inflight: Promise<void> | null = null
let baseURL = '/'

function asset(path: string) {
  return baseURL.replace(/\/$/, '') + path
}

async function load() {
  if (raw.value) return
  if (inflight) return inflight
  status.value = 'loading'
  inflight = (async () => {
    try {
      const [patches, context] = await Promise.all([
        $fetch<RawData['patches']>(asset('/data/patches.geojson'), { responseType: 'json' }),
        $fetch<RawData['context']>(asset('/data/context.geojson'), { responseType: 'json' }).catch(
          () => ({ type: 'FeatureCollection', features: [], placeholder: true }) as RawData['context'],
        ),
      ])
      raw.value = { patches, context }
      status.value = 'ready'
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      status.value = 'error'
    } finally {
      inflight = null
    }
  })()
  return inflight
}

const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

export function useForest() {
  // Read in setup context; load() may later run after an await.
  if (status.value === 'idle') baseURL = useRuntimeConfig().app.baseURL || '/'
  if (import.meta.client && status.value === 'idle') load()
  const overrides = persisted<Record<string, PatchOverride>>('patch-overrides', () => ({}))

  const center = computed<LngLat>(() => raw.value?.patches.center ?? [107.5935, 16.5485])
  const isDemo = computed(() => raw.value?.patches.demo !== false)
  const isPlaceholderContext = computed(() => raw.value?.context.placeholder !== false)

  const patches = computed<Patch[]>(() => {
    const fc = raw.value?.patches
    if (!fc) return []
    const frame = localFrame(center.value)
    const bearing = ((fc.bearing ?? 0) * Math.PI) / 180
    // Inland axis: unit vector pointing from water to land.
    const axis: XY = [Math.sin(bearing), Math.cos(bearing)]
    const list = fc.features.map((f) => {
      const ring = f.geometry.coordinates[0] as LngLat[]
      const centroid = ringCentroid(ring)
      const [x, y] = frame.toXY(centroid)
      const o = overrides.value[f.properties.id]
      return {
        ...f.properties,
        ...(o ? { verified: o.verified, verified_by: o.verified ? o.by : null } : {}),
        centroid,
        inland_m: f.properties.shore_distance_m ?? x * axis[0] + y * axis[1],
      }
    })
    if (list.every((p) => p.shore_distance_m == null)) {
      const min = Math.min(...list.map((p) => p.inland_m))
      for (const p of list) p.inland_m -= min
    }
    return list
  })

  const byId = computed(() => new Map(patches.value.map((p) => [p.id, p])))

  /** Patch collection for the map, with advisor overrides applied. */
  const patchCollection = computed<FeatureCollection<Polygon, PatchProps>>(() => {
    const fc = raw.value?.patches
    if (!fc) return { type: 'FeatureCollection', features: [] }
    return {
      type: 'FeatureCollection',
      features: fc.features.map((f) => {
        const o = overrides.value[f.properties.id]
        return o ? { ...f, properties: { ...f.properties, verified: o.verified, verified_by: o.verified ? o.by : null } } : f
      }),
    }
  })

  const context = computed(() => raw.value?.context ?? { type: 'FeatureCollection', features: [] } as FeatureCollection)

  /** Rounded hull around the forest: the area the tide simulation fills. */
  const tideArea = computed<Feature<Polygon>>(() => {
    const fc = raw.value?.patches
    const frame = localFrame(center.value)
    const pts: XY[] = fc ? fc.features.flatMap((f) => (f.geometry.coordinates[0] as LngLat[]).map(frame.toXY)) : []
    const hull = pts.length > 2 ? smooth(inflate(convexHull(pts), 14), 3) : []
    const ring = hull.map(frame.toLngLat)
    if (ring.length) ring.push(ring[0]!)
    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }
  })

  const bounds = computed<[number, number, number, number]>(() => {
    const b = raw.value?.context.bbox
    if (b && b.length === 4) return b as [number, number, number, number]
    const [cx, cy] = center.value
    return [cx - 0.0062, cy - 0.0058, cx + 0.0062, cy + 0.0058]
  })

  const stats = computed(() => {
    const list = patches.value
    const canopy = list.reduce((s, p) => s + p.area_m2, 0)
    const verified = list.filter((p) => p.verified).length
    const bySpecies = SPECIES_BY_ZONE.map((id) => {
      const ps = list.filter((p) => p.species_id === id)
      const area = ps.reduce((s, p) => s + p.area_m2, 0)
      const hs = ps.map((p) => p.height_m)
      const gs = ps.map((p) => p.ground_m)
      return {
        id,
        count: ps.length,
        area,
        share: canopy ? area / canopy : 0,
        verified: ps.filter((p) => p.verified).length,
        height: { min: Math.min(...hs), max: Math.max(...hs), median: median(hs) },
        ground: { min: Math.min(...gs), max: Math.max(...gs), median: median(gs) },
        inland: { median: median(ps.map((p) => p.inland_m)) },
      }
    }).filter((s) => s.count > 0)
    return {
      total: list.length,
      canopy,
      verified,
      verifiedShare: list.length ? verified / list.length : 0,
      speciesCount: bySpecies.length,
      bySpecies,
      maxHeight: Math.max(0, ...list.map((p) => p.height_m)),
      maxGround: Math.max(0, ...list.map((p) => p.ground_m)),
      maxInland: Math.max(0, ...list.map((p) => p.inland_m)),
    }
  })

  const floodedCount = (tide: number) => patches.value.filter((p) => p.ground_m < tide).length

  function setVerified(id: string, verified: boolean, by: string) {
    overrides.value = { ...overrides.value, [id]: { verified, by, at: new Date().toISOString() } }
  }

  /** Nearest patch to a point (metres), for observations. */
  function nearestPatch(lngLat: LngLat) {
    const frame = localFrame(center.value)
    const [x, y] = frame.toXY(lngLat)
    let best: Patch | null = null, bestD = Infinity
    for (const p of patches.value) {
      const [px, py] = frame.toXY(p.centroid)
      const d = Math.hypot(px - x, py - y)
      if (d < bestD) { bestD = d; best = p }
    }
    return best ? { patch: best, distance: bestD } : null
  }

  return {
    status, error, load,
    center, bounds, isDemo, isPlaceholderContext,
    patches, byId, patchCollection, context, tideArea,
    stats, floodedCount, setVerified, nearestPatch,
  }
}
