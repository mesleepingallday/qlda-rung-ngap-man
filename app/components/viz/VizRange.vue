<script setup lang="ts">
// Range bar: min–max of one measure for a species on a shared scale, with a
// median tick, so species stay comparable across pages.
const props = defineProps<{ min: number; max: number; median: number; scaleMax: number; color: string; label: string }>()
const pos = (v: number) => `${(Math.max(0, v) / props.scaleMax) * 100}%`
</script>

<template>
  <div class="range" role="img" :aria-label="label">
    <div class="track">
      <span class="bar" :style="{ left: pos(min), width: `calc(${pos(max)} - ${pos(min)})`, background: color }" />
      <span class="med" :style="{ left: pos(median) }" />
    </div>
    <div class="scale"><span>0</span><span>{{ num(scaleMax, 0) }} m</span></div>
  </div>
</template>

<style scoped>
.track { position: relative; height: 10px; border-radius: 5px; background: var(--surface-2); }
.bar { position: absolute; top: 0; bottom: 0; min-width: 6px; border-radius: 5px; }
.med { position: absolute; top: -3px; bottom: -3px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: var(--label); box-shadow: 0 0 0 2px var(--surface); }
.scale { display: flex; justify-content: space-between; margin-top: 4px; font: 500 11px/1 var(--font-sans); color: var(--label-3); font-variant-numeric: tabular-nums; }
</style>
