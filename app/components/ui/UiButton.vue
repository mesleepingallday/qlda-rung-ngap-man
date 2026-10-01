<script setup lang="ts">
import { computed, type Component } from 'vue'
import { NuxtLink } from '#components'

const props = withDefaults(defineProps<{
  variant?: 'filled' | 'tinted' | 'gray' | 'plain' | 'glass' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: Component
  iconRight?: Component
  to?: string
  block?: boolean
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
}>(), { variant: 'filled', size: 'md', type: 'button' })

const tag = computed(() => (props.to && !props.disabled ? NuxtLink : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="to ? undefined : type"
    class="btn"
    :class="[`v-${variant}`, `s-${size}`, { block, loading }]"
    :disabled="tag === 'button' ? disabled || loading : undefined"
    :aria-disabled="disabled || undefined"
    :aria-busy="loading || undefined"
  >
    <component :is="icon" v-if="icon" class="ic" aria-hidden="true" :stroke-width="2.1" />
    <span class="label"><slot /></span>
    <component :is="iconRight" v-if="iconRight" class="ic" aria-hidden="true" :stroke-width="2.1" />
    <span v-if="loading" class="spinner" aria-hidden="true" />
  </component>
</template>

<style scoped>
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--r-full);
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-decoration: none !important;
  user-select: none;
  transition: background-color var(--dur-1) var(--ease-out), transform var(--dur-1) var(--ease-out), opacity var(--dur-1);
}
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn:disabled, .btn[aria-disabled='true'] { opacity: 0.38; cursor: not-allowed; }
.block { display: flex; width: 100%; }

.s-sm { height: 34px; padding: 0 14px; font-size: 14px; gap: 6px; }
.s-md { height: 44px; padding: 0 20px; font-size: 16px; }
.s-lg { height: 54px; padding: 0 26px; font-size: 17px; }
.ic { width: 1.15em; height: 1.15em; flex: none; }
.s-sm .ic { width: 16px; height: 16px; }

.v-filled { background: var(--accent); color: var(--accent-ink); }
.v-filled:hover:not(:disabled) { background: var(--accent-hover); }
.v-tinted { background: var(--accent-tint); color: var(--accent-text); }
.v-tinted:hover:not(:disabled) { background: color-mix(in srgb, var(--accent-tint) 80%, var(--accent) 20%); }
.v-gray { background: var(--surface-2); color: var(--label); }
.v-gray:hover:not(:disabled) { background: var(--surface-3); }
.v-plain { color: var(--accent-text); padding-inline: 10px; }
.v-plain:hover:not(:disabled) { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.v-glass {
  color: var(--label);
  background: var(--glass);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: inset 0 0 0 0.5px var(--glass-edge), var(--shadow-float);
}
.v-danger { background: var(--danger-tint); color: var(--danger); }

.loading .label, .loading .ic { opacity: 0; }
.spinner {
  position: absolute;
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: spin 700ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
