<script setup lang="ts">
import type { Component } from 'vue'
withDefaults(defineProps<{
  tone?: 'neutral' | 'ok' | 'warn' | 'info' | 'danger' | 'accent'
  icon?: Component
  size?: 'sm' | 'md'
}>(), { tone: 'neutral', size: 'md' })
</script>

<template>
  <span class="badge" :class="[`t-${tone}`, `s-${size}`]">
    <component :is="icon" v-if="icon" aria-hidden="true" :stroke-width="2.4" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--r-full);
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
  vertical-align: middle;
}
.s-md { height: 26px; padding: 0 10px; font-size: 13px; }
.s-sm { height: 22px; padding: 0 8px; font-size: 12px; }
.badge svg { width: 14px; height: 14px; flex: none; }
.s-sm svg { width: 12px; height: 12px; }
.t-neutral { background: var(--surface-2); color: var(--label-2); }
.t-ok { background: var(--ok-tint); color: var(--ok); }
.t-warn { background: var(--warn-tint); color: var(--warn); }
.t-info { background: var(--info-tint); color: var(--info); }
.t-danger { background: var(--danger-tint); color: var(--danger); }
.t-accent { background: var(--accent-tint); color: var(--accent-text); }
</style>
