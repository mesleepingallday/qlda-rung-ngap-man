<script setup lang="ts">
// Non-modal bottom sheet over the map (phones), with three detents. Drag the
// header or tap the grabber to cycle. Content scrolls inside once expanded.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Detent = 'peek' | 'half' | 'full'
const detent = defineModel<Detent>('detent', { default: 'peek' })
defineProps<{ label: string }>()

const vh = ref(800)
const drag = ref<number | null>(null)
let startY = 0, startOffset = 0, startT = 0, moved = false

const PEEK = 196
const heights = computed(() => ({ peek: PEEK, half: Math.round(vh.value * 0.54), full: vh.value - 64 }))
const offset = computed(() => (drag.value ?? vh.value - heights.value[detent.value]))

function measure() { vh.value = window.innerHeight }
onMounted(() => { measure(); window.addEventListener('resize', measure) })
onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
})

function down(e: PointerEvent) {
  if (e.button !== 0) return
  startY = e.clientY; startOffset = offset.value; startT = performance.now(); moved = false
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up, { once: true })
}
function move(e: PointerEvent) {
  const dy = e.clientY - startY
  if (!moved && Math.abs(dy) < 6) return
  moved = true
  drag.value = Math.min(vh.value - PEEK + 40, Math.max(64, startOffset + dy))
}
function up(e: PointerEvent) {
  window.removeEventListener('pointermove', move)
  if (!moved || drag.value === null) { drag.value = null; return }
  const v = (e.clientY - startY) / Math.max(1, performance.now() - startT)
  const visible = vh.value - drag.value
  drag.value = null
  const order: Detent[] = ['peek', 'half', 'full']
  if (Math.abs(v) > 0.5) {
    const i = order.indexOf(detent.value)
    detent.value = order[Math.max(0, Math.min(2, i + (v < 0 ? 1 : -1)))]!
    return
  }
  detent.value = order.reduce((best, d) => (Math.abs(heights.value[d] - visible) < Math.abs(heights.value[best] - visible) ? d : best), 'peek' as Detent)
}
function cycle() {
  if (moved) return
  detent.value = detent.value === 'peek' ? 'half' : detent.value === 'half' ? 'full' : 'peek'
}
</script>

<template>
  <section
    class="sheet glass"
    :class="[`d-${detent}`, { dragging: drag !== null }]"
    :style="{ transform: `translateY(${offset}px)` }"
    role="region"
    :aria-label="label"
  >
    <div class="grab" @pointerdown="down">
      <button type="button" class="grabber" :aria-label="detent === 'full' ? 'Thu gọn bảng thông tin' : 'Mở rộng bảng thông tin'" :aria-expanded="detent !== 'peek'" @click="cycle" />
      <slot name="header" />
    </div>
    <div class="content" :class="{ scroll: detent !== 'peek' }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.sheet {
  position: fixed;
  z-index: 30;
  left: 0; right: 0; top: 0;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  border-radius: 28px 28px 0 0;
  background: var(--glass-strong);
  transition: transform var(--dur-4) var(--ease-spring);
  will-change: transform;
}
.dragging { transition: none; }
.grab { flex: none; padding: 6px 18px 10px; touch-action: none; cursor: grab; user-select: none; }
.grabber { position: relative; display: block; width: 40px; height: 5px; margin: 2px auto 10px; border-radius: 3px; background: var(--separator-strong); padding: 0; }
.grabber::before { content: ''; position: absolute; inset: -14px -30px; }
.content { flex: 1 1 auto; min-height: 0; overflow: hidden; padding: 0 18px calc(var(--tabbar-h) + var(--safe-bottom) + 96px); }
.content.scroll { overflow-y: auto; overscroll-behavior: contain; }
</style>
