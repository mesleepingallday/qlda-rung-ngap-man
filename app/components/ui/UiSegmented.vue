<script setup lang="ts" generic="T extends string">
// iOS-style segmented control. Radio-group semantics with roving focus and
// arrow-key navigation; the selected "thumb" slides between segments.
import { computed, ref } from 'vue'

const props = defineProps<{
  options: { value: T; label: string; badge?: number }[]
  label: string
  size?: 'sm' | 'md'
}>()
const model = defineModel<T>({ required: true })
const root = ref<HTMLElement | null>(null)
const index = computed(() => Math.max(0, props.options.findIndex((o) => o.value === model.value)))

function onKey(e: KeyboardEvent) {
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const i = (index.value + dir + props.options.length) % props.options.length
  model.value = props.options[i]!.value
  ;(root.value?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[i])?.focus()
}
</script>

<template>
  <div
    ref="root"
    class="seg"
    :class="`s-${size ?? 'md'}`"
    role="radiogroup"
    :aria-label="label"
    :style="{ '--n': options.length, '--i': index }"
    @keydown="onKey"
  >
    <span class="thumb" aria-hidden="true" />
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="o.value === model"
      :tabindex="o.value === model ? 0 : -1"
      @click="model = o.value"
    >
      {{ o.label }}
      <span v-if="o.badge" class="badge" :aria-label="`${o.badge} mục`">{{ o.badge }}</span>
    </button>
  </div>
</template>

<style scoped>
.seg {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  padding: 2px;
  border-radius: 11px;
  background: var(--surface-2);
  isolation: isolate;
}
.s-md { height: 36px; }
.s-sm { height: 32px; }
.thumb {
  position: absolute;
  top: 2px; bottom: 2px; left: 2px;
  width: calc((100% - 4px) / var(--n));
  transform: translateX(calc(var(--i) * 100%));
  border-radius: 9px;
  background: var(--bg-elevated);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(0, 0, 0, 0.04);
  transition: transform var(--dur-3) var(--ease-spring);
  z-index: -1;
}
:root[data-theme='dark'] .thumb { background: #3a3f3b; }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) .thumb { background: #3a3f3b; } }
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  border-radius: 9px;
  font: 500 14px/1 var(--font-sans);
  color: var(--label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.s-sm button { font-size: 13px; }
button[aria-checked='true'] { font-weight: 600; }
.badge {
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 9px;
  background: var(--warn);
  color: var(--bg-elevated);
  font: 700 11px/18px var(--font-sans);
}
</style>
