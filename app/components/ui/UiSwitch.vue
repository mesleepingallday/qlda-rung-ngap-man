<script setup lang="ts">
defineProps<{ label: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button type="button" role="switch" class="switch" :aria-checked="model" :aria-label="label" @click="model = !model">
    <span class="knob" aria-hidden="true" />
  </button>
</template>

<style scoped>
.switch {
  position: relative;
  flex: none;
  width: 51px; height: 31px;
  border-radius: 999px;
  background: var(--surface-3);
  transition: background-color var(--dur-2) var(--ease-out);
}
.switch[aria-checked='true'] { background: var(--accent); }
.knob {
  position: absolute;
  top: 2px; left: 2px;
  width: 27px; height: 27px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18), 0 0 0 0.5px rgba(0, 0, 0, 0.04);
  transition: transform var(--dur-3) var(--ease-spring);
}
.switch[aria-checked='true'] .knob { transform: translateX(20px); }
</style>
