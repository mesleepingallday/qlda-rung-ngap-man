<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BadgeCheck, Box, CircleDashed, Compass, Hand, Layers, LocateFixed, Minus, Plus, Square, X } from '@lucide/vue'
import { SPECIES, SPECIES_IDS, type SpeciesId } from '~/data/species'
import type { Patch } from '~/composables/useForest'
import { distanceMetres, type LngLat } from '~/utils/geo'

definePageMeta({ fullBleed: true })
useHead({ title: 'Bản đồ · Rừng ngập mặn Huế' })

type MapApi = { flyToPatch: (id: string) => void; resetView: () => void; resetNorth: () => void; showUser: (p: LngLat, fly: boolean) => void; zoomBy: (d: number) => void }

const route = useRoute()
const router = useRouter()
const forest = useForest()
const { stats, byId, isDemo, bounds, patches } = forest
const { regular, canHover } = useViewport()
const { show } = useToast()

// --- View state -------------------------------------------------------------
const mapRef = ref<MapApi | null>(null)
const tide = ref(route.query.tide ? 0.6 : 0)
const exaggeration = persisted<number>('map-exaggeration', () => 1)
const colorMode = persisted<'touch' | 'all'>('map-color-mode', () => 'touch')
const basemap = ref<'map' | 'satellite'>('map')
const pitched = ref(true)
const focus = ref<SpeciesId | null>(SPECIES_IDS.includes(route.query.species as SpeciesId) ? (route.query.species as SpeciesId) : null)
const preview = ref<SpeciesId | null>(null)
const selectedId = ref<string | null>(typeof route.query.patch === 'string' ? route.query.patch : null)
const detent = ref<'peek' | 'half' | 'full'>(route.query.tide ? 'half' : 'peek')
const layersOpen = ref(false)
const bearing = ref(-18)
const mapError = ref<string | null>(null)
const hintSeen = persisted<boolean>('explore-hint-seen', () => false)

const selected = computed(() => (selectedId.value ? byId.value.get(selectedId.value) ?? null : null))

// --- Hover popover (pointer devices) --------------------------------------
const hover = ref<{ patch: Patch; x: number; y: number } | null>(null)
const stage = ref<HTMLElement | null>(null)
function onHover(p: Patch | null, pt: { x: number; y: number } | null) {
  hover.value = p && pt ? { patch: p, ...pt } : null
  if (p) hintSeen.value = true
}
const popStyle = computed(() => {
  if (!hover.value || !stage.value) return {}
  const w = 248, h = 118, pad = 14, off = 18
  const W = stage.value.clientWidth, H = stage.value.clientHeight
  let x = hover.value.x + off, y = hover.value.y - h - off
  if (x + w > W - pad) x = hover.value.x - w - off
  if (y < pad) y = hover.value.y + off
  return { left: `${Math.max(pad, Math.min(x, W - w - pad))}px`, top: `${Math.max(pad, Math.min(y, H - h - pad))}px` }
})

// --- Selection --------------------------------------------------------------
function onSelect(p: Patch | null) {
  hintSeen.value = true
  selectedId.value = p?.id ?? null
  hover.value = null
  if (p && !regular.value && detent.value === 'peek') detent.value = 'half'
}
function selectFromChart(p: Patch) {
  selectedId.value = p.id
  mapRef.value?.flyToPatch(p.id)
}
watch(selectedId, (id) => {
  const q = { ...route.query }
  if (id) q.patch = id
  else delete q.patch
  router.replace({ query: q })
})
watch(focus, (s) => {
  const q = { ...route.query }
  if (s) q.species = s
  else delete q.species
  router.replace({ query: q })
})

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (layersOpen.value) layersOpen.value = false
  else if (selectedId.value) selectedId.value = null
  else if (focus.value) focus.value = null
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function onReady() {
  if (selectedId.value) mapRef.value?.flyToPatch(selectedId.value)
}

// --- Locate me ----------------------------------------------------------------
const locating = ref(false)
function locate() {
  if (!('geolocation' in navigator)) return show('Thiết bị không hỗ trợ định vị.', { tone: 'warn' })
  locating.value = true
  navigator.geolocation.getCurrentPosition((pos) => {
    locating.value = false
    const me: LngLat = [pos.coords.longitude, pos.coords.latitude]
    const [w, s, e, n] = bounds.value
    const inside = me[0] >= w && me[0] <= e && me[1] >= s && me[1] <= n
    mapRef.value?.showUser(me, inside)
    if (!inside) {
      const d = distanceMetres(me, forest.center.value)
      show(`Bạn đang cách Rú Chá khoảng ${d > 2000 ? `${num(d / 1000, 1)} km` : `${num(d)} m`}.`)
    }
  }, () => {
    locating.value = false
    show('Không lấy được vị trí. Hãy cho phép ứng dụng dùng vị trí của bạn.', { tone: 'warn' })
  }, { enableHighAccuracy: true, timeout: 12000 })
}

// --- Camera padding: keep the forest clear of panels ----------------------
const padding = computed(() => regular.value
  ? { top: 24, right: selected.value ? 380 : 24, bottom: 24, left: 404 }
  : { top: 64, right: 0, bottom: 200, left: 0 })

const flooded = computed(() => forest.floodedCount(tide.value))
const SEG_BASEMAP = [{ value: 'map', label: 'Sơ đồ' }, { value: 'satellite', label: 'Vệ tinh' }] as const
const SEG_COLOR = [{ value: 'touch', label: 'Khi chạm' }, { value: 'all', label: 'Luôn hiện' }] as const
const SEG_EX = [{ value: '1', label: '×1' }, { value: '2', label: '×2' }, { value: '3', label: '×3' }] as const
const exString = computed({ get: () => String(exaggeration.value) as '1' | '2' | '3', set: (v) => { exaggeration.value = Number(v) } })
</script>

<template>
  <div ref="stage" class="explore" :class="{ regular }">
    <ForestMap
      ref="mapRef"
      :tide="tide"
      :exaggeration="exaggeration"
      :color-mode="colorMode"
      :focus-species="focus"
      :preview-species="preview"
      :selected-id="selectedId"
      :basemap="basemap"
      :pitched="pitched"
      :padding="padding"
      @hover="onHover"
      @select="onSelect"
      @ready="onReady"
      @bearing="bearing = $event"
      @error="mapError = $event"
    />

    <!-- Status pills (top-left on phones, above the panel on desktop) -->
    <div class="pills" :class="{ 'with-panel': regular }">
      <NuxtLink v-if="isDemo" to="/about" class="pill glass warn">Dữ liệu minh họa</NuxtLink>
      <span v-if="exaggeration > 1" class="pill glass">Chiều cao ×{{ exaggeration }}</span>
      <span v-if="tide > 0" class="pill glass water">Triều {{ num(tide, 2) }} m · {{ flooded }} khóm ngập</span>
    </div>

    <!-- Map controls -->
    <div class="controls">
      <div class="group glass">
        <button type="button" class="ctl" :aria-expanded="layersOpen" aria-label="Tùy chọn hiển thị" title="Tùy chọn hiển thị" @click="layersOpen = !layersOpen"><Layers :stroke-width="2" /></button>
        <button type="button" class="ctl" :aria-pressed="!pitched" :aria-label="pitched ? 'Chuyển sang nhìn từ trên (2D)' : 'Chuyển sang 3D'" :title="pitched ? 'Xem 2D' : 'Xem 3D'" @click="pitched = !pitched">
          <component :is="pitched ? Square : Box" :stroke-width="2" />
        </button>
        <button type="button" class="ctl" aria-label="Hướng bắc lên trên" title="Hướng bắc" @click="mapRef?.resetNorth()">
          <Compass :stroke-width="2" :style="{ transform: `rotate(${-bearing - 45}deg)` }" />
        </button>
      </div>
      <div v-if="regular" class="group glass">
        <button type="button" class="ctl" aria-label="Phóng to" @click="mapRef?.zoomBy(0.6)"><Plus :stroke-width="2" /></button>
        <button type="button" class="ctl" aria-label="Thu nhỏ" @click="mapRef?.zoomBy(-0.6)"><Minus :stroke-width="2" /></button>
      </div>
      <button type="button" class="ctl solo glass" :class="{ busy: locating }" aria-label="Vị trí của tôi" title="Vị trí của tôi" @click="locate"><LocateFixed :stroke-width="2" /></button>
    </div>

    <Transition name="menu">
      <div v-if="layersOpen" class="layers glass" role="dialog" aria-label="Tùy chọn hiển thị">
        <div class="layers-head">
          <h2>Hiển thị</h2>
          <UiIconButton :icon="X" label="Đóng" size="sm" variant="gray" @click="layersOpen = false" />
        </div>
        <label class="opt"><span>Bản đồ nền</span><UiSegmented v-model="basemap" :options="[...SEG_BASEMAP]" label="Bản đồ nền" size="sm" /></label>
        <label class="opt"><span>Màu loài</span><UiSegmented v-model="colorMode" :options="[...SEG_COLOR]" label="Hiện màu loài" size="sm" /></label>
        <label class="opt"><span>Phóng đại chiều cao</span><UiSegmented v-model="exString" :options="[...SEG_EX]" label="Phóng đại chiều cao" size="sm" /></label>
        <p class="opt-note">Ảnh vệ tinh: © Esri, Maxar, Earthstar Geographics. Chỉ để tham chiếu, không dùng làm dữ liệu.</p>
      </div>
    </Transition>

    <!-- First-run hint -->
    <Transition name="menu">
      <div v-if="!hintSeen && !selected" class="hint glass" role="status">
        <Hand aria-hidden="true" :stroke-width="2" />
        <span>{{ canHover ? 'Rê chuột lên một khóm cây để xem loài' : 'Chạm vào một khóm cây để xem đó là loài gì' }}</span>
        <button type="button" aria-label="Ẩn gợi ý" @click="hintSeen = true"><X :stroke-width="2.4" /></button>
      </div>
    </Transition>

    <!-- Hover popover -->
    <div v-if="hover && canHover && hover.patch.id !== selectedId" class="pop glass" :style="popStyle" aria-hidden="true">
      <p class="pop-name"><i :style="{ background: `var(--species-${hover.patch.species_id})` }" />{{ SPECIES[hover.patch.species_id].name }}</p>
      <p class="pop-sci">{{ SPECIES[hover.patch.species_id].scientific }}</p>
      <p class="pop-row tabular">Cao {{ num(hover.patch.height_m, 1) }} m · Nền {{ num(hover.patch.ground_m, 2) }} m</p>
      <p class="pop-status">
        <component :is="hover.patch.verified ? BadgeCheck : CircleDashed" :stroke-width="2.2" />
        {{ hover.patch.verified ? 'Đã xác minh' : 'Chưa xác minh' }} · nhấp để xem chi tiết
      </p>
    </div>

    <!-- Desktop: overview panel + inspector -->
    <template v-if="regular">
      <aside class="panel glass" aria-label="Thông tin khu rừng">
        <header class="panel-head">
          <h1 class="t-title2">Rú Chá</h1>
          <p class="muted">Hương Phong · Huế · {{ num(stats.total) }} khóm, {{ stats.speciesCount }} loài</p>
        </header>
        <ExploreOverview
          v-model:tide="tide"
          :focus="focus"
          :selected-id="selectedId"
          :exaggeration="exaggeration"
          @focus="focus = $event"
          @preview="preview = $event"
          @select-patch="selectFromChart"
        />
      </aside>
      <Transition name="inspector">
        <aside v-if="selected" :key="selected.id" class="inspector glass" aria-label="Chi tiết khóm cây">
          <PatchDetail :patch="selected" :tide="tide" closable @close="selectedId = null" />
        </aside>
      </Transition>
    </template>

    <!-- Phones: bottom sheet -->
    <MapSheet v-else v-model:detent="detent" label="Thông tin khu rừng">
      <template #header>
        <div v-if="!selected" class="sheet-head">
          <div>
            <h1 class="t-title3">Rú Chá</h1>
            <p class="muted t-footnote">{{ num(stats.total) }} khóm cây · {{ stats.speciesCount }} loài</p>
          </div>
        </div>
        <div v-if="!selected" class="chips" role="group" aria-label="Lọc theo loài">
          <button type="button" class="chip" :aria-pressed="!focus" @click="focus = null">Tất cả</button>
          <button
            v-for="s in stats.bySpecies"
            :key="s.id"
            type="button"
            class="chip"
            :aria-pressed="focus === s.id"
            @click="focus = focus === s.id ? null : s.id"
          >
            <i :style="{ background: `var(--species-${s.id})` }" aria-hidden="true" />{{ SPECIES[s.id].name }}
          </button>
        </div>
      </template>
      <PatchDetail v-if="selected" :patch="selected" :tide="tide" closable @close="selectedId = null" />
      <ExploreOverview
        v-else
        v-model:tide="tide"
        :focus="focus"
        :exaggeration="exaggeration"
        @focus="focus = $event"
        @preview="preview = $event"
        @select-patch="selectFromChart"
      />
    </MapSheet>

    <!-- No WebGL / failed to load -->
    <div v-if="mapError && !mapError.includes('vệ tinh')" class="fallback">
      <div class="fallback-card card">
        <ForestDiorama :exaggeration="3" />
        <p class="t-headline">{{ mapError }}</p>
        <p class="muted t-subhead">Bạn vẫn có thể xem mô hình minh họa, danh sách loài và mặt cắt thủy triều.</p>
        <UiButton to="/" variant="gray">Về Tổng quan</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore { position: relative; height: 100dvh; overflow: hidden; background: var(--map-land); }
.explore.regular { height: 100dvh; }

.pills { position: absolute; z-index: 20; top: calc(var(--safe-top) + 12px); left: 12px; right: 76px; display: flex; flex-wrap: wrap; gap: 6px; pointer-events: none; }
.pills.with-panel { left: 404px; top: 16px; right: 200px; }
.pill { pointer-events: auto; display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 999px; font: 600 13px/1 var(--font-sans); color: var(--label); text-decoration: none !important; }
.pill.warn { color: var(--warn); }
.pill.water { color: var(--water); }

.controls { position: absolute; z-index: 25; top: calc(var(--safe-top) + 12px); right: 12px; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
.regular .controls { top: 16px; right: 16px; }
.regular:has(.inspector) .controls { right: 392px; }
.group { display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; }
.ctl { width: 46px; height: 46px; display: grid; place-items: center; color: var(--label); transition: background-color var(--dur-1); }
.group .ctl + .ctl { box-shadow: inset 0 0.5px 0 var(--separator-strong); }
.ctl:hover { background: color-mix(in srgb, var(--label) 6%, transparent); }
.ctl svg { width: 21px; height: 21px; transition: transform var(--dur-3) var(--ease-out); }
.ctl[aria-pressed='true'], .ctl[aria-expanded='true'] { color: var(--accent-text); }
.solo { border-radius: 16px; }
.busy svg { animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: 0.35; } }

.layers {
  position: absolute;
  z-index: 26;
  top: calc(var(--safe-top) + 12px);
  right: 68px;
  width: min(340px, calc(100vw - 92px));
  padding: 14px 16px 16px;
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--glass-strong);
}
.regular .layers { top: 16px; right: 74px; }
.regular:has(.inspector) .layers { right: 450px; }
.layers-head { display: flex; justify-content: space-between; align-items: center; }
.layers-head h2 { font: var(--t-headline); }
.opt { display: flex; flex-direction: column; gap: 6px; font: 600 13px/1.3 var(--font-sans); color: var(--label-2); }
.opt-note { font: var(--t-caption); color: var(--label-2); }

.hint {
  position: absolute;
  z-index: 22;
  left: 12px;
  right: 70px;
  margin: 0 auto;
  width: fit-content;
  top: calc(var(--safe-top) + 64px);
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100vw - 32px);
  padding: 10px 10px 10px 14px;
  border-radius: 999px;
  font: 500 14px/1.3 var(--font-sans);
}
.regular .hint { top: 76px; left: 404px; right: 16px; }
.hint > svg { width: 18px; height: 18px; flex: none; color: var(--accent-text); }
.hint button { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: var(--surface-2); color: var(--label-2); flex: none; }
.hint button svg { width: 14px; height: 14px; }

.pop { position: absolute; z-index: 24; width: 248px; padding: 12px 14px; border-radius: 16px; pointer-events: none; background: var(--glass-strong); }
.pop-name { display: flex; align-items: center; gap: 8px; font: var(--t-headline); }
.pop-name i { width: 12px; height: 12px; border-radius: 3px; flex: none; }
.pop-sci { margin: 0 0 6px 20px; font: var(--t-footnote); font-style: italic; color: var(--label-2); }
.pop-row { font: 500 14px/1.35 var(--font-sans); }
.pop-status { display: flex; align-items: center; gap: 6px; margin-top: 4px; font: var(--t-caption); color: var(--label-2); }
.pop-status svg { width: 14px; height: 14px; }

.panel {
  position: absolute;
  z-index: 20;
  top: 16px; left: 16px; bottom: 16px;
  width: 372px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 20px 18px;
  border-radius: 26px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--glass-strong);
}
.panel-head .muted { font: var(--t-footnote); margin-top: 2px; }
.inspector {
  position: absolute;
  z-index: 21;
  top: 16px; right: 16px;
  width: 360px;
  max-height: calc(100% - 32px);
  overflow-y: auto;
  padding: 18px;
  border-radius: 26px;
  background: var(--glass-strong);
}

.sheet-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.chips { display: flex; gap: 8px; overflow-x: auto; margin: 0 -18px; padding: 0 18px 4px; scrollbar-width: none; }
.chips::-webkit-scrollbar { display: none; }
.chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--surface-2);
  font: 600 14px/1 var(--font-sans);
  color: var(--label);
  transition: background-color var(--dur-2), color var(--dur-2);
}
.chip i { width: 10px; height: 10px; border-radius: 50%; }
.chip[aria-pressed='true'] { background: var(--label); color: var(--bg); }

.fallback { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; padding: 24px; background: var(--bg); }
.fallback-card { max-width: 520px; padding: 24px; display: flex; flex-direction: column; gap: 10px; text-align: center; align-items: center; }

.menu-enter-active, .menu-leave-active { transition: opacity var(--dur-2), transform var(--dur-3) var(--ease-spring); }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
.inspector-enter-active, .inspector-leave-active { transition: opacity var(--dur-2), transform var(--dur-3) var(--ease-spring); }
.inspector-enter-from, .inspector-leave-to { opacity: 0; transform: translateX(16px); }
</style>
