<script setup lang="ts">
// Meter: one ratio against its whole. Fill and track are steps of one hue.
defineProps<{ value: number; total: number; label: string; tone?: 'ok' | 'accent' | 'water' }>()
</script>

<template>
  <div class="meter" :class="`t-${tone ?? 'ok'}`">
    <div class="track" role="meter" :aria-valuenow="value" aria-valuemin="0" :aria-valuemax="total" :aria-label="label">
      <span class="fill" :style="{ width: `${total ? (value / total) * 100 : 0}%` }" />
    </div>
  </div>
</template>

<style scoped>
.track { height: 8px; border-radius: 4px; overflow: hidden; background: color-mix(in srgb, var(--c) 18%, var(--surface-2)); }
.fill { display: block; height: 100%; border-radius: 4px; background: var(--c); transition: width var(--dur-4) var(--ease-spring); }
.t-ok { --c: var(--ok); }
.t-accent { --c: var(--accent); }
.t-water { --c: var(--water); }
</style>
