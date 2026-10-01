<script setup lang="ts">
// Floating glass tab bar (phones). Four destinations; the selected one gets
// a soft pill behind it. Advisors see the review queue size on "Ghi nhận".
import { NAV } from '~/utils/nav'

const route = useRoute()
const { isAdvisor } = useUser()
const { pending } = useObservations()
</script>

<template>
  <nav class="tabbar glass" aria-label="Điều hướng chính">
    <NuxtLink
      v-for="item in NAV"
      :key="item.to"
      :to="item.to"
      class="tab"
      :class="{ active: item.match(route.path) }"
      :aria-current="item.match(route.path) ? 'page' : undefined"
    >
      <span class="icon-wrap">
        <component :is="item.icon" class="ic" aria-hidden="true" :stroke-width="item.match(route.path) ? 2.3 : 1.9" />
        <span v-if="item.to === '/observations' && isAdvisor && pending.length" class="dot">{{ pending.length }}</span>
      </span>
      <span class="label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  z-index: 50;
  left: max(12px, var(--safe-left));
  right: max(12px, var(--safe-right));
  bottom: max(10px, calc(var(--safe-bottom) - 6px));
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: var(--tabbar-h);
  padding: 4px;
  border-radius: 999px;
}
.tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: 999px;
  color: var(--label-2);
  text-decoration: none !important;
  transition: color var(--dur-2), background-color var(--dur-2);
}
.tab.active { color: var(--accent-text); background: color-mix(in srgb, var(--label) 7%, transparent); }
.icon-wrap { position: relative; }
.ic { width: 23px; height: 23px; }
.label { font: 600 10.5px/1.2 var(--font-sans); letter-spacing: 0.01em; }
.dot {
  position: absolute;
  top: -5px; right: -11px;
  min-width: 17px; height: 17px; padding: 0 4px;
  border-radius: 9px;
  background: var(--danger);
  color: #fff;
  font: 700 10.5px/17px var(--font-sans);
  text-align: center;
  box-shadow: 0 0 0 2px var(--bg-elevated);
}
</style>
