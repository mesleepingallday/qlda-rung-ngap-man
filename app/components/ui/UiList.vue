<script setup lang="ts">
// Inset grouped list (iOS Settings style).
defineProps<{ header?: string; footer?: string }>()
</script>

<template>
  <section class="list-group">
    <h3 v-if="header || $slots.header" class="lg-header"><slot name="header">{{ header }}</slot></h3>
    <ul class="lg-body card" role="list"><slot /></ul>
    <p v-if="footer || $slots.footer" class="lg-footer"><slot name="footer">{{ footer }}</slot></p>
  </section>
</template>

<style scoped>
.list-group { min-width: 0; }
.lg-header {
  margin: 0 0 6px var(--space-4);
  font: 500 13px/1.3 var(--font-sans);
  color: var(--label-2);
  text-transform: none;
}
.lg-body { overflow: hidden; border-radius: var(--r-md); }
.lg-footer { margin: 8px var(--space-4) 0; font: var(--t-footnote); color: var(--label-2); }
</style>
