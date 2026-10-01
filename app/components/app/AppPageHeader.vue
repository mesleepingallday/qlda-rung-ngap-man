<script setup lang="ts">
// Large title header. On phones a compact glass bar fades in once the large
// title scrolls away (like iOS navigation bars).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft } from '@lucide/vue'

const props = defineProps<{ title: string; eyebrow?: string; subtitle?: string; back?: string; backLabel?: string }>()
const sentinel = ref<HTMLElement | null>(null)
const collapsed = ref(false)
let io: IntersectionObserver | null = null
const router = useRouter()

function goBack() {
  if (window.history.state?.back) router.back()
  else if (props.back) router.push(props.back)
}

onMounted(() => {
  io = new IntersectionObserver(([e]) => { collapsed.value = !e!.isIntersecting }, { rootMargin: '-8px 0px 0px 0px' })
  if (sentinel.value) io.observe(sentinel.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <header class="ph">
    <div class="mini glass" :class="{ show: collapsed }" aria-hidden="true">
      <button v-if="back" type="button" class="mini-back" tabindex="-1" @click="goBack"><ChevronLeft :stroke-width="2.4" /></button>
      <span class="mini-title">{{ title }}</span>
    </div>

    <button v-if="back" type="button" class="back" @click="goBack">
      <ChevronLeft aria-hidden="true" :stroke-width="2.4" />
      <span>{{ backLabel ?? 'Quay lại' }}</span>
    </button>

    <div class="main-row">
      <div class="titles">
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h1 class="t-large">{{ title }}</h1>
        <p v-if="subtitle || $slots.subtitle" class="subtitle"><slot name="subtitle">{{ subtitle }}</slot></p>
      </div>
      <div v-if="$slots.trailing" class="trailing"><slot name="trailing" /></div>
    </div>
    <div ref="sentinel" class="sentinel" aria-hidden="true" />
    <slot />
  </header>
</template>

<style scoped>
.ph { padding-top: calc(var(--safe-top) + 12px); margin-bottom: var(--space-5); }
@media (min-width: 768px) { .ph { padding-top: 36px; margin-bottom: var(--space-6); } }
.main-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4); }
.titles { min-width: 0; }
.eyebrow { margin-bottom: 2px; text-transform: none; }
.subtitle { margin-top: 4px; font: var(--t-subhead); color: var(--label-2); display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
.trailing { flex: none; display: flex; align-items: center; gap: 8px; padding-bottom: 4px; }
.sentinel { height: 1px; }
.back {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin: 0 0 8px -8px;
  padding: 6px 8px 6px 4px;
  border-radius: 10px;
  color: var(--accent-text);
  font: 500 16px/1 var(--font-sans);
}
.back svg { width: 22px; height: 22px; }
.back:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }

.mini {
  position: fixed;
  z-index: 40;
  top: 0; left: 0; right: 0;
  height: calc(var(--safe-top) + 48px);
  padding: var(--safe-top) 56px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.5px 0 var(--separator);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity var(--dur-2) var(--ease-out), transform var(--dur-2) var(--ease-out);
}
.mini.show { opacity: 1; pointer-events: auto; transform: none; }
.mini-title { font: var(--t-headline); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mini-back { position: absolute; left: 8px; bottom: 6px; width: 36px; height: 36px; display: grid; place-items: center; color: var(--accent-text); }
.mini-back svg { width: 24px; height: 24px; }
@media (min-width: 768px) { .mini { display: none; } }
</style>
