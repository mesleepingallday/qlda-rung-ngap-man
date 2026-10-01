import type { FeatureCollection } from 'geojson'
import { SPECIES } from '~/data/species'
import type { Patch } from '~/composables/useForest'

function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportGeoJSON(fc: FeatureCollection) {
  download('ru-cha-vegetation-patches.geojson', JSON.stringify(fc, null, 1), 'application/geo+json')
}

/** One row per patch; opens cleanly in Excel / Google Sheets (UTF-8 BOM). */
export function exportCSV(patches: Patch[]) {
  const cols = ['id', 'species_id', 'species_name', 'scientific_name', 'height_m', 'crown_diameter_m', 'area_m2', 'ground_m', 'distance_from_water_m', 'lng', 'lat', 'verified', 'confidence', 'source', 'observed_at']
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = patches.map((p) => [
    p.id, p.species_id, SPECIES[p.species_id].name, SPECIES[p.species_id].scientific, p.height_m, p.crown_diameter_m, p.area_m2,
    p.ground_m, Math.round(p.inland_m), p.centroid[0].toFixed(6), p.centroid[1].toFixed(6), p.verified, p.confidence, p.source, p.observed_at ?? '',
  ].map(esc).join(','))
  download('ru-cha-vegetation-patches.csv', '﻿' + [cols.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8')
}
