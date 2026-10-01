import { KEY, type ArtId } from '~/data/key'
import type { SpeciesId, TraitKey } from '~/data/species'

/** The key's drawing that best shows a species' state for a trait (null if the state is shared/unknown). */
export function traitArt(species: SpeciesId, trait: TraitKey): ArtId | null {
  const q = KEY.find((x) => x.id === trait)
  if (!q) return null
  const opts = q.options.filter((o) => o.species.includes(species))
  if (opts.length !== 1) return null
  return opts[0]!.art
}
