<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{
  min: number
  max: number
  step?: number
  label: string
  valueText?: string
  color?: string
}>(), { step: 1 })
const model = defineModel<number>({ required: true })
const pct = computed(() => ((model.value - props.min) / (props.max - props.min)) * 100)
</script>

<template>
  <input
    v-model.number="model"
    class="slider"
    type="range"
    :min="min"
    :max="max"
    :step="step"
    :aria-label="label"
    :aria-valuetext="valueText"
    :style="{ '--pct': `${pct}%`, '--fill': color ?? 'var(--accent)' }"
  >
</template>

<style scoped>
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 28px;
  background: transparent;
  cursor: pointer;
  touch-action: pan-y;
}
.slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, var(--fill) var(--pct), var(--surface-3) var(--pct));
}
.slider::-moz-range-track { height: 6px; border-radius: 3px; background: var(--surface-3); }
.slider::-moz-range-progress { height: 6px; border-radius: 3px; background: var(--fill); }
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 26px; height: 26px;
  margin-top: -10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}
.slider::-moz-range-thumb {
  width: 26px; height: 26px; border: 0; border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}
.slider:focus-visible { outline: none; }
.slider:focus-visible::-webkit-slider-thumb { outline: 2.5px solid var(--focus-ring); outline-offset: 2px; }
.slider:focus-visible::-moz-range-thumb { outline: 2.5px solid var(--focus-ring); outline-offset: 2px; }
</style>
