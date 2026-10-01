<script setup lang="ts">
import { computed } from 'vue'
import type { Role } from '~/composables/useUser'

const props = withDefaults(defineProps<{ name: string; role?: Role; size?: number }>(), { size: 36 })
// Role tint (not a status colour): earth, water, leaf.
const tint = computed(() => ({ local: '#9a6b2f', student: '#2f6fa3', advisor: '#0d6b4f' })[props.role ?? 'local'])
</script>

<template>
  <span class="avatar" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.38}px`, background: tint }" aria-hidden="true">
    {{ initials(name || 'Khách') }}
  </span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  color: #fff;
  font-weight: 650;
  letter-spacing: 0.01em;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1);
}
</style>
