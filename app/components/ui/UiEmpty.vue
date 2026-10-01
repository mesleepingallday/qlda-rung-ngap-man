<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ icon: Component; title: string; text?: string; compact?: boolean }>()
</script>

<template>
  <div class="empty" :class="{ compact }">
    <span class="halo"><component :is="icon" aria-hidden="true" :stroke-width="1.8" /></span>
    <p class="title">{{ title }}</p>
    <p v-if="text" class="text">{{ text }}</p>
    <div v-if="$slots.default" class="actions"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: var(--space-8) var(--space-6);
}
.compact { padding: var(--space-6) var(--space-4); }
.halo {
  display: grid;
  place-items: center;
  width: 64px; height: 64px;
  margin-bottom: 8px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--label-2);
}
.halo svg { width: 28px; height: 28px; }
.title { font: var(--t-headline); }
.text { max-width: 36ch; font: var(--t-subhead); color: var(--label-2); text-wrap: pretty; }
.actions { margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
</style>
