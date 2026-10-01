<script setup lang="ts">
// Loads a stored observation photo (IndexedDB blob) as an object URL.
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ photoKey: string; alt?: string; fit?: 'cover' | 'contain' }>()
const url = ref<string | null>(null)

watch(() => props.photoKey, async (k) => {
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = await photoUrl(k)
}, { immediate: true })
onBeforeUnmount(() => { if (url.value) URL.revokeObjectURL(url.value) })
</script>

<template>
  <img v-if="url" :src="url" :alt="alt ?? ''" class="photo" :style="{ objectFit: fit ?? 'cover' }" decoding="async">
  <span v-else class="photo ph" aria-hidden="true" />
</template>

<style scoped>
.photo { width: 100%; height: 100%; display: block; }
.ph { background: var(--surface-2); }
</style>
