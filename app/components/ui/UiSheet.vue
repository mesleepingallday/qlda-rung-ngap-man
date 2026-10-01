<script setup lang="ts">
// Modal sheet: slides up from the bottom on phones (drag the grabber down to
// dismiss) and appears as a centred dialog on wider screens. Traps focus,
// closes on Escape / scrim, and returns focus to the opener.
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { X } from '@lucide/vue'

const props = withDefaults(defineProps<{ title: string; size?: 'auto' | 'large'; hideTitle?: boolean }>(), { size: 'auto' })
const open = defineModel<boolean>('open', { required: true })
const panel = ref<HTMLElement | null>(null)
const titleId = useId()
let opener: HTMLElement | null = null

const drag = ref(0)
let startY = 0, startT = 0, dragging = false

function close() { open.value = false }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.stopPropagation(); close(); return }
  if (e.key !== 'Tab' || !panel.value) return
  const f = [...panel.value.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null)
  if (!f.length) return
  const first = f[0]!, last = f[f.length - 1]!
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

function onPointerDown(e: PointerEvent) {
  dragging = true; startY = e.clientY; startT = performance.now()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (dragging) drag.value = Math.max(0, e.clientY - startY)
}
function onPointerUp() {
  if (!dragging) return
  dragging = false
  const v = drag.value / Math.max(1, performance.now() - startT)
  if (drag.value > 120 || v > 0.6) close()
  drag.value = 0
}

watch(open, async (v) => {
  if (v) {
    opener = document.activeElement as HTMLElement | null
    document.documentElement.style.overflow = 'hidden'
    await nextTick()
    const target = panel.value?.querySelector<HTMLElement>('[autofocus], input, textarea, select') ?? panel.value
    target?.focus({ preventScroll: true })
  } else {
    document.documentElement.style.overflow = ''
    opener?.focus?.({ preventScroll: true })
  }
})
onBeforeUnmount(() => { document.documentElement.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="sheet-root" @keydown="onKeydown">
        <div class="scrim" aria-hidden="true" @click="close" />
        <div
          ref="panel"
          class="panel"
          :class="`size-${props.size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          :style="drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined"
        >
          <header
            class="head"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <span class="grabber" aria-hidden="true" />
            <div class="head-row">
              <div class="head-side"><slot name="leading" /></div>
              <h2 :id="titleId" class="title" :class="{ 'visually-hidden': hideTitle }">{{ title }}</h2>
              <div class="head-side end">
                <slot name="trailing">
                  <UiIconButton :icon="X" label="Đóng" size="sm" variant="gray" @click="close" />
                </slot>
              </div>
            </div>
          </header>
          <div class="body"><slot /></div>
          <footer v-if="$slots.footer" class="foot"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-root { position: fixed; inset: 0; z-index: 80; display: flex; align-items: flex-end; justify-content: center; }
.scrim { position: absolute; inset: 0; background: var(--scrim); }
.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100dvh - var(--safe-top) - 24px);
  background: var(--bg-elevated);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  box-shadow: var(--shadow-lg);
  padding-bottom: var(--safe-bottom);
  transition: transform var(--dur-3) var(--ease-spring);
  outline: none;
}
.size-large { height: calc(100dvh - var(--safe-top) - 24px); }
.head { flex: none; padding: 6px 12px 4px; touch-action: none; cursor: grab; }
.grabber { display: block; width: 36px; height: 5px; margin: 0 auto 6px; border-radius: 3px; background: var(--separator-strong); }
.head-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 40px; gap: 8px; }
.head-side { display: flex; align-items: center; gap: 4px; min-width: 0; }
.head-side.end { justify-content: flex-end; }
.title { font: var(--t-headline); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.body { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; padding: 8px 20px 20px; }
.foot { flex: none; padding: 12px 20px 16px; border-top: 0.5px solid var(--separator); }

@media (min-width: 768px) {
  .sheet-root { align-items: center; padding: 24px; }
  .panel { width: min(560px, 100%); border-radius: var(--r-xl); padding-bottom: 0; max-height: min(86dvh, 860px); }
  .size-large { height: min(86dvh, 860px); }
  .grabber { display: none; }
  .head { cursor: default; padding-top: 12px; }
}

.sheet-enter-active, .sheet-leave-active { transition: opacity var(--dur-3) var(--ease-out); }
.sheet-enter-active .panel, .sheet-leave-active .panel { transition: transform var(--dur-3) var(--ease-spring), opacity var(--dur-3); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .panel, .sheet-leave-to .panel { transform: translateY(100%); }
@media (min-width: 768px) {
  .sheet-enter-from .panel, .sheet-leave-to .panel { transform: translateY(16px) scale(0.98); opacity: 0; }
}
</style>
