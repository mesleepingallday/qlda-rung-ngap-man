<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { NuxtLink } from '#components'

const props = defineProps<{
  title: string
  subtitle?: string
  value?: string
  icon?: Component
  /** Background of the rounded icon tile (any CSS colour). */
  tint?: string
  to?: string
  button?: boolean
  chevron?: boolean
  destructive?: boolean
}>()
defineEmits<{ click: [MouseEvent] }>()
const tag = computed(() => (props.to ? NuxtLink : props.button ? 'button' : 'div'))
const interactive = computed(() => !!props.to || props.button)
</script>

<template>
  <li class="row-li">
    <component
      :is="tag"
      :to="to"
      :type="button ? 'button' : undefined"
      class="lrow"
      :class="{ interactive, destructive }"
      @click="$emit('click', $event)"
    >
      <span v-if="icon || $slots.leading" class="lead">
        <slot name="leading">
          <span class="tile" :style="{ background: tint ?? 'var(--accent)' }">
            <component :is="icon" aria-hidden="true" :stroke-width="2.2" />
          </span>
        </slot>
      </span>
      <span class="text">
        <span class="title">{{ title }}</span>
        <span v-if="subtitle || $slots.subtitle" class="subtitle"><slot name="subtitle">{{ subtitle }}</slot></span>
      </span>
      <span v-if="value || $slots.trailing" class="trail">
        <slot name="trailing"><span class="value">{{ value }}</span></slot>
      </span>
      <ChevronRight v-if="chevron ?? !!to" class="chev" aria-hidden="true" :stroke-width="2.4" />
    </component>
  </li>
</template>

<style scoped>
.row-li { position: relative; }
.row-li + .row-li::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  left: var(--row-inset, 16px);
  height: 0.5px;
  background: var(--separator-strong);
}
.row-li:has(.lead) + .row-li::before, .row-li:has(.lead) { --row-inset: 60px; }
.lrow {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 10px 16px;
  text-align: left;
  color: var(--label);
  text-decoration: none !important;
}
.interactive { cursor: pointer; transition: background-color var(--dur-1); }
.interactive:hover { background: color-mix(in srgb, var(--label) 4%, transparent); }
.interactive:active { background: color-mix(in srgb, var(--label) 8%, transparent); }
.lead { flex: none; display: grid; place-items: center; }
.tile {
  width: 32px; height: 32px;
  display: grid; place-items: center;
  border-radius: 9px;
  color: #fff;
}
.tile svg { width: 18px; height: 18px; }
.text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.title { font: var(--t-callout); font-weight: 500; letter-spacing: -0.01em; }
.subtitle { font: var(--t-footnote); color: var(--label-2); }
.trail { flex: none; display: flex; align-items: center; gap: 8px; color: var(--label-2); font: var(--t-callout); }
.value { font-variant-numeric: tabular-nums; }
.chev { flex: none; width: 18px; height: 18px; color: var(--label-3); margin-right: -4px; }
.destructive .title { color: var(--danger); }
</style>
