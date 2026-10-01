<script setup lang="ts">
// Sidebar (tablet & desktop). Collapses to an icon rail below 1200 px.
import { Plus, ScanSearch } from '@lucide/vue'
import { NAV } from '~/utils/nav'
import { ROLES } from '~/composables/useUser'

const route = useRoute()
const { profile, displayName, isAdvisor } = useUser()
const { pending } = useObservations()
</script>

<template>
  <aside class="sidebar" aria-label="Điều hướng chính">
    <NuxtLink to="/" class="brand" aria-label="Rừng ngập mặn Huế: Tổng quan">
      <AppMark :size="34" />
      <span class="brand-text">
        <span class="brand-name">Rừng ngập mặn</span>
        <span class="brand-sub">Huế · Rú Chá</span>
      </span>
    </NuxtLink>

    <div class="actions">
      <UiButton to="/observations/new" :icon="Plus" block class="act-primary">Ghi nhận mới</UiButton>
      <UiButton to="/identify" :icon="ScanSearch" variant="gray" block class="act-secondary">Nhận dạng cây</UiButton>
    </div>

    <nav class="nav">
      <NuxtLink
        v-for="item in NAV"
        :key="item.to"
        :to="item.to"
        class="item"
        :class="{ active: item.match(route.path) }"
        :aria-current="item.match(route.path) ? 'page' : undefined"
        :title="item.label"
      >
        <component :is="item.icon" class="ic" aria-hidden="true" :stroke-width="2" />
        <span class="item-label">{{ item.label }}</span>
        <span v-if="item.to === '/observations' && isAdvisor && pending.length" class="count" :aria-label="`${pending.length} chờ xác minh`">{{ pending.length }}</span>
      </NuxtLink>
    </nav>

    <NuxtLink to="/profile" class="me" :class="{ active: route.path.startsWith('/profile') || route.path.startsWith('/about') }" title="Hồ sơ">
      <AppAvatar :name="displayName" :role="profile.role" :size="34" />
      <span class="me-text">
        <span class="me-name">{{ displayName }}</span>
        <span class="me-role">{{ ROLES[profile.role].short }}</span>
      </span>
    </NuxtLink>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: var(--sidebar-w);
  padding: 18px 14px 14px;
  border-right: 0.5px solid var(--separator);
  background: color-mix(in srgb, var(--bg) 70%, var(--surface));
}
.brand { display: flex; align-items: center; gap: 10px; padding: 4px 6px; color: var(--label); text-decoration: none !important; }
.brand-text { display: flex; flex-direction: column; min-width: 0; }
.brand-name { font: 700 16px/1.2 var(--font-sans); letter-spacing: -0.015em; }
.brand-sub { font: var(--t-caption); color: var(--label-2); }
.actions { display: flex; flex-direction: column; gap: 8px; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  color: var(--label);
  font: 500 15px/1 var(--font-sans);
  text-decoration: none !important;
  transition: background-color var(--dur-1);
}
.item:hover { background: color-mix(in srgb, var(--label) 5%, transparent); }
.item.active { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent-text); font-weight: 600; }
.ic { width: 20px; height: 20px; flex: none; }
.count {
  margin-left: auto;
  min-width: 22px; height: 20px; padding: 0 6px;
  border-radius: 10px;
  background: var(--danger);
  color: #fff;
  font: 700 12px/20px var(--font-sans);
  text-align: center;
}
.me {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 14px;
  color: var(--label);
  text-decoration: none !important;
}
.me:hover, .me.active { background: color-mix(in srgb, var(--label) 5%, transparent); }
.me-text { display: flex; flex-direction: column; min-width: 0; }
.me-name { font: 600 14px/1.25 var(--font-sans); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.me-role { font: var(--t-caption); color: var(--label-2); }

/* Icon rail between 768 and 1199 px */
@media (max-width: 1199px) {
  .sidebar { width: var(--rail-w); align-items: center; padding-inline: 10px; }
  .brand-text, .item-label, .me-text, .actions { display: none; }
  .item { width: 48px; justify-content: center; padding: 0; }
  .count { position: absolute; margin: 0; transform: translate(14px, -12px); min-width: 18px; height: 18px; font-size: 11px; line-height: 18px; }
  .item { position: relative; }
  .me { padding: 6px; }
}
</style>
