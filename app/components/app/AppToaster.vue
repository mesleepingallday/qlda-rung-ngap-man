<script setup lang="ts">
import { CircleCheck, Info, TriangleAlert } from '@lucide/vue'
const { toasts, dismiss } = useToast()
const icons = { ok: CircleCheck, warn: TriangleAlert, neutral: Info }
</script>

<template>
  <div class="toaster" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast glass" :class="`t-${t.tone}`">
        <component :is="icons[t.tone]" class="ic" aria-hidden="true" :stroke-width="2.2" />
        <span class="text">{{ t.text }}</span>
        <button v-if="t.action" type="button" class="act" @click="t.action.run(); dismiss(t.id)">{{ t.action.label }}</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toaster {
  position: fixed;
  z-index: 90;
  left: 50%;
  bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 20px);
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: min(440px, calc(100vw - 32px));
  pointer-events: none;
}
@media (min-width: 768px) { .toaster { bottom: 28px; } }
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  padding: 10px 14px 10px 12px;
  border-radius: var(--r-full);
  font: 500 15px/1.35 var(--font-sans);
  pointer-events: auto;
}
.ic { width: 20px; height: 20px; flex: none; color: var(--label-2); }
.t-ok .ic { color: var(--ok); }
.t-warn .ic { color: var(--warn); }
.text { min-width: 0; }
.act { margin-left: 4px; font-weight: 650; color: var(--accent-text); padding: 4px 6px; border-radius: 8px; }
.toast-enter-active, .toast-leave-active { transition: opacity var(--dur-2), transform var(--dur-3) var(--ease-spring); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px) scale(0.96); }
</style>
