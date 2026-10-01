<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div class="shell">
    <AppSidebar class="only-regular" />
    <main id="main" class="content" :class="{ bleed: route.meta.fullBleed }">
      <slot />
    </main>
    <AppTabBar class="only-compact" />
    <AppToaster />
  </div>
</template>

<style scoped>
.shell { display: flex; min-height: 100dvh; }
.content {
  flex: 1 1 auto;
  min-width: 0;
  padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 32px);
}
.content.bleed { padding-bottom: 0; }
.only-regular { display: none; }
@media (min-width: 768px) {
  .only-regular { display: flex; }
  .only-compact { display: none; }
  .content { padding-bottom: 48px; }
  .content.bleed { padding-bottom: 0; }
}
</style>
