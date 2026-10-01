<script setup lang="ts">
import { computed } from 'vue'
import { CONDITIONS, SPECIES } from '~/data/species'
import { ROLES } from '~/composables/useUser'
import type { Observation } from '~/composables/useObservations'

const props = defineProps<{ obs: Observation; showAuthor?: boolean; from?: string }>()
const title = computed(() => props.obs.kind === 'species'
  ? (props.obs.species_id ? SPECIES[props.obs.species_id].name : 'Chưa rõ loài')
  : CONDITIONS[props.obs.condition ?? 'other'].label)
</script>

<template>
  <li class="obs-li">
    <NuxtLink :to="from ? `/observations/${obs.id}?from=${from}` : `/observations/${obs.id}`" class="obs">
      <span class="lead">
        <span v-if="obs.photos.length" class="photo"><ObsPhoto :photo-key="obs.photos[0]!" /></span>
        <SpeciesThumb v-else-if="obs.kind === 'species' && obs.species_id" :id="obs.species_id" :size="48" decorative />
        <span v-else class="cond" :class="{ unknown: obs.kind === 'species' }">
          <component :is="obs.kind === 'species' ? CONDITION_ICON.other : CONDITION_ICON[obs.condition ?? 'other']" aria-hidden="true" :stroke-width="2" />
        </span>
      </span>
      <span class="text">
        <span class="title">{{ title }}</span>
        <span class="meta">
          <template v-if="showAuthor">{{ obs.author.name }} · {{ ROLES[obs.author.role].short }} · </template>{{ relativeText(obs.created_at) }}
        </span>
        <span v-if="obs.note" class="note">{{ obs.note }}</span>
      </span>
      <span class="trail">
        <ObsStatusBadge :status="obs.status" />
        <span v-if="obs.demo" class="demo">demo</span>
      </span>
    </NuxtLink>
  </li>
</template>

<style scoped>
.obs-li { position: relative; }
.obs-li + .obs-li::before { content: ''; position: absolute; top: 0; left: 76px; right: 0; height: 0.5px; background: var(--separator-strong); }
.obs {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 12px 16px;
  color: var(--label);
  text-decoration: none !important;
  transition: background-color var(--dur-1);
}
.obs:hover { background: color-mix(in srgb, var(--label) 4%, transparent); }
.lead { width: 48px; height: 48px; }
.photo { display: block; width: 48px; height: 48px; border-radius: 12px; overflow: hidden; }
.cond { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 12px; background: var(--surface-2); color: var(--label-2); }
.cond svg { width: 22px; height: 22px; }
.text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.title { font: var(--t-callout); font-weight: 600; }
.meta { font: var(--t-footnote); color: var(--label-2); }
.note { font: var(--t-footnote); color: var(--label-2); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.trail { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.demo { font: 600 10px/1 var(--font-sans); letter-spacing: 0.04em; text-transform: uppercase; color: var(--label-2); }
@media (max-width: 420px) {
  .obs { grid-template-columns: 48px 1fr; }
  .trail { grid-column: 2; flex-direction: row; align-items: center; }
}
</style>
