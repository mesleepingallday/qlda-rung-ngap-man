// In-memory draft of the observation being written, so stepping out to the
// identification key (or the map) and back never loses photos or text.
import { reactive } from 'vue'
import type { ConditionId, SpeciesId } from '~/data/species'
import type { Certainty, ObsKind } from './useObservations'
import type { LngLat } from '~/utils/geo'

export interface Draft {
  kind: ObsKind
  species_id: SpeciesId | null
  certainty: Certainty
  condition: ConditionId | null
  note: string
  files: File[]
  location: LngLat | null
  accuracy: number | null
  locationSource: 'gps' | 'map' | 'patch' | null
  patch_id: string | null
  touched: boolean
}

const blank = (): Draft => ({
  kind: 'species', species_id: null, certainty: 'likely', condition: null, note: '',
  files: [], location: null, accuracy: null, locationSource: null, patch_id: null, touched: false,
})
const draft = reactive<Draft>(blank())

export function useDraft() {
  function reset() { Object.assign(draft, blank()) }
  return { draft, reset }
}
