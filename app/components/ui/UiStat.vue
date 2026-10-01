<script setup lang="ts">
// Stat tile: label · value (proportional figures) · unit · optional note.
defineProps<{ label: string; value: string; unit?: string; note?: string }>()
</script>

<template>
  <div class="stat">
    <span class="label">{{ label }}</span>
    <span class="value">{{ value }}<span v-if="unit" class="unit">{{ unit }}</span></span>
    <span v-if="note || $slots.note" class="note"><slot name="note">{{ note }}</slot></span>
  </div>
</template>

<style scoped>
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 14px 16px;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm), inset 0 0 0 0.5px var(--separator);
}
.label { font: 500 13px/1.3 var(--font-sans); color: var(--label-2); }
.value { font: 650 28px/1.15 var(--font-sans); letter-spacing: -0.025em; }
.unit { margin-left: 3px; font: 600 15px/1 var(--font-sans); letter-spacing: 0; color: var(--label-2); }
.note { font: var(--t-caption); color: var(--label-2); }
</style>
