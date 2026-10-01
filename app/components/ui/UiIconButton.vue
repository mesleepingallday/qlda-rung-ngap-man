<script setup lang="ts">
import { computed, type Component } from 'vue'
import { NuxtLink } from '#components'

const props = withDefaults(defineProps<{
  icon: Component
  label: string
  variant?: 'glass' | 'gray' | 'plain' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  pressed?: boolean
}>(), { variant: 'gray', size: 'md' })
const tag = computed(() => (props.to ? NuxtLink : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="to ? undefined : 'button'"
    class="ibtn"
    :class="[`v-${variant}`, `s-${size}`, { on: pressed }]"
    :aria-label="label"
    :title="label"
    :aria-pressed="pressed === undefined ? undefined : pressed"
  >
    <component :is="icon" aria-hidden="true" :stroke-width="2" />
  </component>
</template>

<style scoped>
.ibtn {
  display: inline-grid;
  place-items: center;
  flex: none;
  border-radius: var(--r-full);
  color: var(--label);
  transition: background-color var(--dur-1) var(--ease-out), transform var(--dur-1) var(--ease-out), color var(--dur-1);
}
.ibtn:active { transform: scale(0.94); }
.s-sm { width: 32px; height: 32px; }
.s-sm svg { width: 17px; height: 17px; }
.s-md { width: 40px; height: 40px; }
.s-md svg { width: 20px; height: 20px; }
.s-lg { width: 48px; height: 48px; }
.s-lg svg { width: 22px; height: 22px; }

.v-gray { background: var(--surface-2); }
.v-gray:hover { background: var(--surface-3); }
.v-plain:hover { background: var(--surface-2); }
.v-filled { background: var(--accent); color: var(--accent-ink); }
.v-glass {
  background: var(--glass);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: inset 0 0 0 0.5px var(--glass-edge), var(--shadow-float);
}
.on { background: var(--label) !important; color: var(--bg) !important; }
</style>
