<script setup lang="ts">
// "Mặt cắt sinh thái": every patch placed by distance inland from the water's
// edge (x) and ground elevation (y). A water band rises with the simulated
// tide; patches under it are flooded. Shows zonation and flooding at once.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Table2, ChartScatter } from '@lucide/vue'
import { SPECIES, SPECIES_BY_ZONE, type SpeciesId } from '~/data/species'
import type { Patch } from '~/composables/useForest'

const props = withDefaults(defineProps<{
  focus?: SpeciesId | null
  height?: number
  showSlider?: boolean
  selectedId?: string | null
}>(), { focus: null, height: 240, showSlider: true, selectedId: null })
const tide = defineModel<number>('tide', { default: 0.6 })
const emit = defineEmits<{ select: [Patch]; hover: [Patch | null] }>()

const { patches, stats, floodedCount } = useForest()
const box = ref<HTMLElement | null>(null)
const W = ref(640)
let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(([e]) => { W.value = Math.max(280, e!.contentRect.width) })
  if (box.value) ro.observe(box.value)
})
onBeforeUnmount(() => ro?.disconnect())

const TIDE_MAX = 1.6
const m = { l: 40, r: 12, t: 26, b: 30 }
const H = computed(() => props.height)
const xMax = computed(() => Math.max(50, Math.ceil(stats.value.maxInland / 50) * 50))
const yMax = computed(() => Math.max(TIDE_MAX, Math.ceil(stats.value.maxGround * 2) / 2))
const x = (v: number) => m.l + (v / xMax.value) * (W.value - m.l - m.r)
const y = (v: number) => H.value - m.b - (v / yMax.value) * (H.value - m.t - m.b)
const xTicks = computed(() => {
  const step = xMax.value > 200 ? 100 : 50
  return Array.from({ length: Math.floor(xMax.value / step) + 1 }, (_, i) => i * step)
})
const yTicks = computed(() => Array.from({ length: Math.round(yMax.value / 0.5) + 1 }, (_, i) => i * 0.5))

const flooded = computed(() => floodedCount(tide.value))
const floodedShare = computed(() => (stats.value.total ? flooded.value / stats.value.total : 0))

// Nearest-point hover (≥ 24 px target), keyboard reachable via the table.
const hover = ref<Patch | null>(null)
const tip = ref({ x: 0, y: 0 })
function onMove(e: PointerEvent) {
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  const px = e.clientX - rect.left, py = e.clientY - rect.top
  let best: Patch | null = null, bestD = 24
  for (const p of patches.value) {
    if (props.focus && p.species_id !== props.focus) continue
    const d = Math.hypot(x(p.inland_m) - px, y(p.ground_m) - py)
    if (d < bestD) { bestD = d; best = p }
  }
  hover.value = best
  if (best) tip.value = { x: x(best.inland_m), y: y(best.ground_m) }
  emit('hover', best)
}
function onLeave() { hover.value = null; emit('hover', null) }
function onClick() { if (hover.value) emit('select', hover.value) }

const view = ref<'chart' | 'table'>('chart')
const tableRows = computed(() => SPECIES_BY_ZONE.map((id) => {
  const ps = patches.value.filter((p) => p.species_id === id)
  if (!ps.length) return null
  const g = ps.map((p) => p.ground_m)
  return { id, count: ps.length, min: Math.min(...g), max: Math.max(...g), flooded: ps.filter((p) => p.ground_m < tide.value).length }
}).filter((r): r is NonNullable<typeof r> => !!r))
</script>

<template>
  <div class="transect">
    <div class="top">
      <ul class="legend" aria-label="Chú giải loài">
        <li v-for="s in stats.bySpecies" :key="s.id" :class="{ dim: focus && focus !== s.id }">
          <span class="dot" :style="{ background: `var(--species-${s.id})` }" aria-hidden="true" />{{ SPECIES[s.id].name }}
        </li>
      </ul>
      <button type="button" class="view-toggle" :aria-pressed="view === 'table'" @click="view = view === 'chart' ? 'table' : 'chart'">
        <component :is="view === 'chart' ? Table2 : ChartScatter" aria-hidden="true" :stroke-width="2" />
        {{ view === 'chart' ? 'Bảng' : 'Biểu đồ' }}
      </button>
    </div>

    <div v-show="view === 'chart'" ref="box" class="plot" :style="{ height: `${H}px` }">
      <svg
        :width="W"
        :height="H"
        role="img"
        :aria-label="`Mặt cắt: cao độ nền của ${stats.total} khóm theo khoảng cách từ mép nước. Ở mực nước ${num(tide, 2)} m có ${flooded} khóm bị ngập.`"
        @pointermove="onMove"
        @pointerleave="onLeave"
        @click="onClick"
      >
        <g class="grid">
          <line v-for="t in yTicks" :key="`y${t}`" :x1="m.l" :x2="W - m.r" :y1="y(t)" :y2="y(t)" />
        </g>
        <g class="axis">
          <text class="axis-title" :x="m.l - 30" y="11">Cao độ nền (m)</text>
          <text v-for="t in yTicks" :key="`yl${t}`" :x="m.l - 8" :y="y(t) + 4" text-anchor="end">{{ num(t, 1) }}</text>
          <text v-for="t in xTicks" :key="`xl${t}`" :x="x(t)" :y="H - 8" text-anchor="middle">{{ t }} m</text>
        </g>
        <g class="dots">
          <circle
            v-for="p in patches"
            :key="p.id"
            :cx="x(p.inland_m)"
            :cy="y(p.ground_m)"
            :r="p.id === selectedId || p.id === hover?.id ? 6 : 4.5"
            :fill="`var(--species-${p.species_id})`"
            :class="{ faded: focus && focus !== p.species_id, hot: p.id === selectedId || p.id === hover?.id }"
          />
        </g>
        <!-- Water above the dots: flooded patches read as submerged -->
        <rect class="water" :x="m.l" :width="W - m.l - m.r" :y="y(tide)" :height="Math.max(0, y(0) - y(tide))" />
        <line class="waterline" :x1="m.l" :x2="W - m.r" :y1="y(tide)" :y2="y(tide)" />
        <text class="water-label" :x="W - m.r - 4" :y="y(tide) - 7" text-anchor="end">Mực nước {{ num(tide, 2) }} m</text>
      </svg>

      <div v-if="hover" class="tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }" role="status">
        <span class="tip-value">{{ num(hover.ground_m, 2) }} m</span>
        <span class="tip-row"><i :style="{ background: `var(--species-${hover.species_id})` }" />{{ SPECIES[hover.species_id].name }} · {{ hover.id }}</span>
        <span class="tip-sub">Cách mép nước {{ num(hover.inland_m) }} m · {{ hover.ground_m < tide ? 'đang ngập' : 'khô' }}</span>
      </div>
    </div>
    <div v-show="view === 'chart'" class="ends" aria-hidden="true"><span>← Mép nước</span><span>Phía đất liền →</span></div>

    <table v-if="view === 'table'" class="table">
      <caption class="visually-hidden">Cao độ nền và số khóm ngập theo loài ở mực nước {{ num(tide, 2) }} m</caption>
      <thead><tr><th scope="col">Loài</th><th scope="col">Cao độ nền</th><th scope="col">Ngập</th></tr></thead>
      <tbody>
        <tr v-for="r in tableRows" :key="r.id">
          <th scope="row"><span class="dot" :style="{ background: `var(--species-${r.id})` }" aria-hidden="true" />{{ SPECIES[r.id].name }}</th>
          <td class="tabular">{{ num(r.min, 2) }}–{{ num(r.max, 2) }} m</td>
          <td class="tabular">{{ r.flooded }}/{{ r.count }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="showSlider" class="tide">
      <div class="tide-head">
        <span class="tide-label">Mực nước triều <span class="faint">(mô phỏng)</span></span>
        <span class="tide-value tabular">{{ num(tide, 2) }} m</span>
      </div>
      <UiSlider v-model="tide" :min="0" :max="TIDE_MAX" :step="0.05" label="Mực nước triều mô phỏng" :value-text="`${num(tide, 2)} mét`" color="var(--water)" />
      <p class="tide-summary">
        <strong>{{ flooded }}</strong> / {{ stats.total }} khóm đang ngập <span class="muted">({{ pct(floodedShare) }})</span>
      </p>
    </div>
    <p class="caveat">Mô phỏng đơn giản: so mực nước với cao độ nền của từng khóm, chưa tính sóng, gió và địa hình chi tiết.</p>
  </div>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.legend { display: flex; flex-wrap: wrap; gap: 4px 14px; }
.legend li { display: inline-flex; align-items: center; gap: 6px; font: 500 13px/1.3 var(--font-sans); color: var(--label-2); transition: opacity var(--dur-2); }
.legend li.dim .dot { opacity: 0.25; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; flex: none; }
.view-toggle { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 999px; background: var(--surface-2); font: 500 13px/1 var(--font-sans); color: var(--label); }
.view-toggle svg { width: 15px; height: 15px; }

.plot { position: relative; width: 100%; }
svg { display: block; overflow: visible; cursor: crosshair; touch-action: pan-y; }
.grid line { stroke: var(--chart-grid); stroke-width: 1; }
.axis text { fill: var(--label-2); font: 500 11px/1 var(--font-sans); font-variant-numeric: tabular-nums; }
.dots circle { stroke: var(--surface); stroke-width: 2; transition: opacity var(--dur-2), r var(--dur-2); }
.dots circle.faded { opacity: 0.12; }
.dots circle.hot { stroke: var(--label); stroke-width: 2; }
.water { fill: var(--water); fill-opacity: 0.2; transition: y var(--dur-2) var(--ease-out), height var(--dur-2) var(--ease-out); }
.waterline { stroke: var(--water); stroke-width: 2; }
.water-label { fill: var(--water-text); font: 650 11px/1 var(--font-sans); paint-order: stroke; stroke: var(--surface); stroke-width: 3px; }
.axis .axis-title { fill: var(--label-2); font: 600 11px/1 var(--font-sans); }
.ends { display: flex; justify-content: space-between; margin: 2px 12px 0 40px; font: 500 11px/1.3 var(--font-sans); color: var(--label-2); }

.tip {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, calc(-100% - 14px));
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--bg-elevated);
  box-shadow: var(--shadow-lg);
  pointer-events: none;
  white-space: nowrap;
}
.tip-value { font: 650 15px/1.2 var(--font-sans); }
.tip-row { display: flex; align-items: center; gap: 6px; font: 500 13px/1.3 var(--font-sans); }
.tip-row i { width: 12px; height: 2px; border-radius: 1px; }
.tip-sub { font: var(--t-caption); color: var(--label-2); }

.table { width: 100%; border-collapse: collapse; font: var(--t-subhead); }
.table th, .table td { padding: 10px 6px; text-align: left; border-bottom: 0.5px solid var(--separator); }
.table thead th { font: 600 12px/1.3 var(--font-sans); color: var(--label-2); }
.table tbody th { font-weight: 600; display: flex; align-items: center; gap: 8px; }
.table td:last-child, .table th:last-child { text-align: right; }

.tide { margin-top: 14px; }
.tide-head { display: flex; justify-content: space-between; align-items: baseline; }
.tide-label { font: 600 14px/1.3 var(--font-sans); }
.tide-value { font: 650 15px/1.3 var(--font-sans); color: var(--water-text); }
.tide-summary { font: var(--t-subhead); }
.tide-summary strong { font-weight: 700; }
.caveat { margin-top: 8px; font: var(--t-caption); color: var(--label-2); }
</style>
