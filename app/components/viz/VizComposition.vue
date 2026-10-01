<script setup lang="ts">
// Part-to-whole: one 100% stacked bar (canopy area by species, water's edge →
// inland order) with a legend that doubles as the table view.
import { computed, ref } from 'vue'
import { SPECIES, type SpeciesId } from '~/data/species'
import { NuxtLink } from '#components'

const props = withDefaults(defineProps<{
  /** Highlighted species (linked highlighting from outside). */
  focus?: SpeciesId | null
  /** Rows link to species pages instead of emitting selection. */
  linkRows?: boolean
  selected?: SpeciesId | null
  compact?: boolean
}>(), { focus: null, linkRows: false, selected: null, compact: false })
const emit = defineEmits<{ hover: [SpeciesId | null]; select: [SpeciesId] }>()

const { stats } = useForest()
const hovered = ref<SpeciesId | null>(null)
const active = computed(() => hovered.value ?? props.focus ?? props.selected)
const rows = computed(() => stats.value.bySpecies)

function setHover(id: SpeciesId | null) {
  hovered.value = id
  emit('hover', id)
}
</script>

<template>
  <div class="composition" :class="{ 'has-focus': !!active, compact }">
    <div class="bar" role="img" :aria-label="`Tỉ lệ diện tích tán theo loài: ${rows.map((r) => `${SPECIES[r.id].name} ${pct(r.share)}`).join(', ')}`">
      <span
        v-for="r in rows"
        :key="r.id"
        class="seg"
        :class="{ on: active === r.id }"
        :style="{ flexGrow: r.share, background: `var(--species-${r.id})` }"
        :title="`${SPECIES[r.id].name}: ${pct(r.share)}`"
        @pointerenter="setHover(r.id)"
        @pointerleave="setHover(null)"
      />
    </div>

    <ul class="legend" role="list">
      <li v-for="r in rows" :key="r.id">
        <component
          :is="linkRows ? NuxtLink : 'button'"
          :to="linkRows ? `/species/${r.id}` : undefined"
          :type="linkRows ? undefined : 'button'"
          class="row"
          :class="{ on: active === r.id }"
          :aria-pressed="linkRows ? undefined : selected === r.id"
          @pointerenter="setHover(r.id)"
          @pointerleave="setHover(null)"
          @focus="setHover(r.id)"
          @blur="setHover(null)"
          @click="!linkRows && emit('select', r.id)"
        >
          <span class="key" :style="{ background: `var(--species-${r.id})` }" aria-hidden="true" />
          <span class="name">
            <span class="common">{{ SPECIES[r.id].name }}</span>
            <span v-if="!compact" class="sci">{{ SPECIES[r.id].scientific }}</span>
          </span>
          <span class="nums">
            <span class="share">{{ pct(r.share) }}</span>
            <span class="detail tabular">{{ r.count }} khóm · {{ areaText(r.area) }}</span>
          </span>
        </component>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  gap: 2px;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
}
.seg { min-width: 6px; transition: opacity var(--dur-2) var(--ease-out), flex-grow var(--dur-4) var(--ease-spring); cursor: default; }
.has-focus .seg:not(.on) { opacity: 0.22; }
.legend { margin-top: 14px; display: flex; flex-direction: column; }
.row {
  width: 100%;
  display: grid;
  grid-template-columns: 12px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  margin: 0 -10px;
  width: calc(100% + 20px);
  border-radius: 12px;
  text-align: left;
  color: var(--label);
  text-decoration: none !important;
  transition: background-color var(--dur-1), opacity var(--dur-2);
}
.row:hover, .row.on { background: color-mix(in srgb, var(--label) 5%, transparent); }
.row[aria-pressed='true'] { box-shadow: inset 0 0 0 1.5px var(--label-3); }
.has-focus .row:not(.on) { opacity: 0.55; }
.key { width: 12px; height: 12px; border-radius: 3px; }
.name { display: flex; flex-direction: column; min-width: 0; }
.common { font: var(--t-callout); font-weight: 600; }
.sci { font: var(--t-footnote); font-style: italic; color: var(--label-2); }
.nums { display: flex; flex-direction: column; align-items: flex-end; }
.share { font: 650 16px/1.25 var(--font-sans); }
.detail { font: var(--t-caption); color: var(--label-2); }
.compact .row { padding-block: 7px; }
</style>
