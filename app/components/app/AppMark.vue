<script setup lang="ts">
// App mark: a mangrove leaf over prop roots and tide lines.
withDefaults(defineProps<{ size?: number }>(), { size: 32 })
const id = `mark-${Math.random().toString(36).slice(2, 7)}`
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true" class="mark">
    <defs>
      <linearGradient :id="id" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#14855f" />
        <stop offset="1" stop-color="#0a4d3a" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="15" :fill="`url(#${id})`" />
    <path d="M32 8.5c8.6 5.3 11.6 12.8 9.6 20.6-1.3 4.6-4.5 7.7-9.6 9.6-5.1-1.9-8.3-5-9.6-9.6-2-7.8 1-15.3 9.6-20.6z" fill="#fff" />
    <path d="M32 14v24" stroke="#0e6a4d" stroke-width="2" stroke-linecap="round" />
    <path d="M32 37c-6 3-10 9-11.5 17M32 37c6 3 10 9 11.5 17M32 41c-2.2 4-3.2 8.5-3.4 13M32 41c2.2 4 3.2 8.5 3.4 13" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" />
    <path d="M9 50.5c3.4 0 4.6-2.3 8-2.3s4.6 2.3 8 2.3 4.6-2.3 8-2.3 4.6 2.3 8 2.3 4.6-2.3 8-2.3 4.6 2.3 8 2.3" stroke="#9fd8f0" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.95" />
  </svg>
</template>

<style scoped>
.mark { flex: none; display: block; }
</style>
