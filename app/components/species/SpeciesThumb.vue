<script setup lang="ts">
// Species avatar: the generated illustration when one exists, otherwise the
// species' growth-form glyph on its identity colour.
import { computed } from 'vue'
import type { ArtId } from '~/data/key'
import { SPECIES, type SpeciesId } from '~/data/species'

const props = withDefaults(defineProps<{ id: SpeciesId; size?: number; shape?: 'rounded' | 'circle'; decorative?: boolean }>(), { size: 48, shape: 'rounded' })

const GLYPH: Record<SpeciesId, ArtId> = { excoecaria: 'form-tree', acanthus: 'form-shrub', pandanus: 'form-tuft', derris: 'form-climber' }
// Light identity colours carry dark ink so the glyph keeps ≥ 3:1 contrast.
const INK: Record<SpeciesId, string> = { excoecaria: '#ffffff', acanthus: '#ffffff', pandanus: 'rgba(40, 26, 0, 0.88)', derris: 'rgba(3, 32, 44, 0.88)' }

const img = computed(() => speciesImageUrl(props.id))
const radius = computed(() => (props.shape === 'circle' ? '50%' : `${Math.round(props.size * 0.26)}px`))
</script>

<template>
  <span
    class="thumb"
    :class="{ 'has-img': img }"
    :style="{ width: `${size}px`, height: `${size}px`, borderRadius: radius, '--c': `var(--species-${id})`, color: INK[id] }"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : SPECIES[id].name"
    :aria-hidden="decorative || undefined"
  >
    <img v-if="img" :src="img" alt="" loading="lazy" decoding="async">
    <span v-else class="glyph"><CharacterArt :art="GLYPH[id]" /></span>
  </span>
</template>

<style scoped>
.thumb {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  overflow: hidden;
  background: var(--c);
}
.thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 55%);
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  pointer-events: none;
}
.has-img { background: color-mix(in srgb, var(--c) 16%, var(--surface)); }
.has-img::after { background: none; }
img { width: 88%; height: 88%; object-fit: contain; }
.glyph { width: 62%; height: 62%; }
.glyph :deep(path) { stroke-width: 2.6; }
</style>
