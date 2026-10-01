<script setup lang="ts">
// New observation: one scrolling form, top to bottom in the order people work
// in the field: what → photo → which species / what condition → where → note.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Check, ImagePlus, LocateFixed, MapPin, ScanSearch, X } from '@lucide/vue'
import { CONDITIONS, CONDITION_IDS, SPECIES, SPECIES_BY_ZONE, SPECIES_IDS, type SpeciesId } from '~/data/species'
import { CERTAINTY, type Certainty } from '~/composables/useObservations'
import type { LngLat } from '~/utils/geo'

definePageMeta({ layout: 'bare' })
useHead({ title: 'Ghi nhận mới · Rừng ngập mặn Huế' })

const route = useRoute()
const router = useRouter()
const { profile, displayName } = useUser()
const { add } = useObservations()
const forest = useForest()
const { show } = useToast()
const { draft, reset } = useDraft()

// Prefill from links: ?species=, ?patch=, role.
if (!draft.touched) {
  draft.kind = profile.value.role === 'local' ? 'condition' : 'species'
}
const qs = route.query.species as SpeciesId | undefined
if (qs && SPECIES_IDS.includes(qs)) { draft.kind = 'species'; draft.species_id = qs; draft.certainty = 'likely' }
watch(() => forest.byId.value, (m) => {
  const pid = route.query.patch as string | undefined
  const p = pid ? m.get(pid) : undefined
  if (p && draft.patch_id !== p.id) {
    draft.patch_id = p.id
    draft.location = p.centroid
    draft.locationSource = 'patch'
    if (!draft.species_id && draft.kind === 'species') draft.species_id = p.species_id
  }
}, { immediate: true })
draft.touched = true

// --- Photos ---------------------------------------------------------------
const MAX_PHOTOS = 4
const previews = ref<string[]>([])
watch(() => draft.files.slice(), (files) => {
  previews.value.forEach((u) => URL.revokeObjectURL(u))
  previews.value = files.map((f) => URL.createObjectURL(f))
}, { immediate: true })
onBeforeUnmount(() => previews.value.forEach((u) => URL.revokeObjectURL(u)))
function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = [...(input.files ?? [])].filter((f) => f.type.startsWith('image/'))
  draft.files = [...draft.files, ...files].slice(0, MAX_PHOTOS)
  input.value = ''
}
function removePhoto(i: number) { draft.files = draft.files.filter((_, j) => j !== i) }

// --- Location -----------------------------------------------------------------
const locating = ref(false)
const pickerOpen = ref(false)
function useGps() {
  if (!('geolocation' in navigator)) return show('Thiết bị không hỗ trợ định vị.', { tone: 'warn' })
  locating.value = true
  navigator.geolocation.getCurrentPosition((pos) => {
    locating.value = false
    draft.location = [pos.coords.longitude, pos.coords.latitude]
    draft.accuracy = Math.round(pos.coords.accuracy)
    draft.locationSource = 'gps'
    draft.patch_id = null
  }, () => {
    locating.value = false
    show('Không lấy được vị trí. Hãy cho phép dùng vị trí, hoặc chọn trên bản đồ.', { tone: 'warn' })
  }, { enableHighAccuracy: true, timeout: 15000 })
}
function onPick(p: LngLat) {
  draft.location = p
  draft.accuracy = null
  draft.locationSource = 'map'
  draft.patch_id = null
  pickerOpen.value = false
}
const nearest = computed(() => (draft.location ? forest.nearestPatch(draft.location) : null))
const locationText = computed(() => {
  if (!draft.location) return null
  if (draft.locationSource === 'patch' && draft.patch_id) return `Tại khóm ${draft.patch_id}`
  const n = nearest.value
  return n ? `Gần khóm ${n.patch.id} · ${num(n.distance)} m` : `${draft.location[1].toFixed(5)}, ${draft.location[0].toFixed(5)}`
})

// --- Submit ---------------------------------------------------------------
const valid = computed(() => (draft.kind === 'species' ? !!draft.species_id || draft.files.length > 0 : !!draft.condition))
const missing = computed(() => {
  if (valid.value) return null
  return draft.kind === 'species' ? 'Chọn loài hoặc thêm ít nhất một ảnh.' : 'Chọn loại hiện trạng.'
})
const saving = ref(false)
async function submit() {
  if (!valid.value || saving.value) return
  saving.value = true
  const obs = await add({
    kind: draft.kind,
    species_id: draft.kind === 'species' ? draft.species_id : null,
    certainty: draft.kind === 'species' && draft.species_id ? draft.certainty : null,
    condition: draft.kind === 'condition' ? draft.condition : null,
    note: draft.note.trim(),
    lng: draft.location?.[0] ?? null,
    lat: draft.location?.[1] ?? null,
    accuracy_m: draft.accuracy,
    patch_id: draft.patch_id ?? nearest.value?.patch.id ?? null,
    author: { name: displayName.value, role: profile.value.role },
  }, draft.files)
  saving.value = false
  reset()
  show('Đã lưu ghi nhận. Giảng viên sẽ xem và xác minh.', { tone: 'ok' })
  router.replace(`/observations/${obs.id}`)
}
function cancel() {
  reset()
  if (window.history.state?.back) router.back()
  else router.push('/observations')
}
const KIND_OPTIONS = [{ value: 'species', label: 'Cây · loài' }, { value: 'condition', label: 'Hiện trạng' }] as const
const CERTAINTY_OPTIONS = (Object.keys(CERTAINTY) as Certainty[]).map((value) => ({ value, label: CERTAINTY[value] }))
</script>

<template>
  <div class="new">
    <header class="bar">
      <UiButton variant="plain" size="sm" @click="cancel">Hủy</UiButton>
      <h1 class="t-headline">Ghi nhận mới</h1>
      <UiButton size="sm" :disabled="!valid" :loading="saving" @click="submit">Gửi</UiButton>
    </header>

    <form class="form" @submit.prevent="submit">
      <UiSegmented v-model="draft.kind" :options="[...KIND_OPTIONS]" label="Loại ghi nhận" />
      <p class="kind-help">{{ draft.kind === 'species' ? 'Một cây hoặc một đám cây bạn muốn xác định loài.' : 'Sạt lở, chặt phá, rác thải, cây chết hay cây con mới mọc.' }}</p>

      <!-- Photos -->
      <section class="sec" aria-labelledby="ph-h">
        <h2 id="ph-h" class="sec-title">Ảnh <span class="opt">{{ draft.files.length }}/{{ MAX_PHOTOS }}</span></h2>
        <div class="photos">
          <label v-if="draft.files.length < MAX_PHOTOS" class="add">
            <input type="file" accept="image/*" multiple class="visually-hidden" @change="onFiles">
            <ImagePlus aria-hidden="true" :stroke-width="1.8" />
            <span>Chụp hoặc chọn ảnh</span>
          </label>
          <div v-for="(u, i) in previews" :key="u" class="thumb">
            <img :src="u" :alt="`Ảnh ${i + 1}`">
            <button type="button" class="rm" :aria-label="`Xóa ảnh ${i + 1}`" @click="removePhoto(i)"><X :stroke-width="2.6" /></button>
          </div>
        </div>
        <p class="tip">Mẹo: chụp cả cây, rồi chụp cận lá, hoa hoặc quả.</p>
      </section>

      <!-- Species -->
      <section v-if="draft.kind === 'species'" class="sec" aria-labelledby="sp-h">
        <div class="sec-row">
          <h2 id="sp-h" class="sec-title">Loài</h2>
          <UiButton to="/identify" variant="plain" size="sm" :icon="ScanSearch">Dùng khóa nhận dạng</UiButton>
        </div>
        <div class="species" role="radiogroup" aria-labelledby="sp-h">
          <button
            v-for="id in SPECIES_BY_ZONE"
            :key="id"
            type="button"
            role="radio"
            class="sp"
            :aria-checked="draft.species_id === id"
            @click="draft.species_id = draft.species_id === id ? null : id"
          >
            <SpeciesThumb :id="id" :size="40" decorative />
            <span class="sp-text"><span class="sp-name">{{ SPECIES[id].name }}</span><span class="sp-sci">{{ SPECIES[id].scientific }}</span></span>
            <span class="tick" aria-hidden="true"><Check :stroke-width="3" /></span>
          </button>
          <button type="button" role="radio" class="sp unknown" :aria-checked="draft.species_id === null" @click="draft.species_id = null">
            <span class="q" aria-hidden="true">?</span>
            <span class="sp-text"><span class="sp-name">Chưa biết</span><span class="sp-sci">Giảng viên sẽ xác định từ ảnh</span></span>
            <span class="tick" aria-hidden="true"><Check :stroke-width="3" /></span>
          </button>
        </div>
        <div v-if="draft.species_id" class="certainty">
          <p class="field-label">Bạn chắc chắn đến đâu?</p>
          <UiSegmented v-model="draft.certainty" :options="CERTAINTY_OPTIONS" label="Mức chắc chắn" size="sm" />
        </div>
      </section>

      <!-- Condition -->
      <section v-else class="sec" aria-labelledby="cd-h">
        <h2 id="cd-h" class="sec-title">Hiện trạng</h2>
        <div class="conds" role="radiogroup" aria-labelledby="cd-h">
          <button
            v-for="c in CONDITION_IDS"
            :key="c"
            type="button"
            role="radio"
            class="cond"
            :aria-checked="draft.condition === c"
            @click="draft.condition = c"
          >
            <component :is="CONDITION_ICON[c]" aria-hidden="true" :stroke-width="2" />
            <span class="c-label">{{ CONDITIONS[c].label }}</span>
            <span class="c-hint">{{ CONDITIONS[c].hint }}</span>
          </button>
        </div>
      </section>

      <!-- Location -->
      <section class="sec" aria-labelledby="loc-h">
        <h2 id="loc-h" class="sec-title">Vị trí</h2>
        <div class="loc card">
          <div v-if="draft.location" class="loc-map"><MiniMap :point="draft.location" :highlight="draft.patch_id ?? nearest?.patch.id ?? null" /></div>
          <div class="loc-row">
            <MapPin aria-hidden="true" :stroke-width="2" />
            <div class="loc-text">
              <p class="loc-main">{{ locationText ?? 'Chưa có vị trí' }}</p>
              <p class="loc-sub">
                <template v-if="draft.locationSource === 'gps'">Từ GPS<template v-if="draft.accuracy"> · sai số ±{{ draft.accuracy }} m</template></template>
                <template v-else-if="draft.locationSource === 'map'">Chọn trên bản đồ</template>
                <template v-else-if="draft.locationSource === 'patch'">Từ khóm cây trên bản đồ</template>
                <template v-else>Vị trí giúp giảng viên đối chiếu với bản đồ</template>
              </p>
            </div>
          </div>
          <div class="loc-actions">
            <UiButton variant="gray" size="sm" :icon="LocateFixed" :loading="locating" @click="useGps">Vị trí hiện tại</UiButton>
            <UiButton variant="gray" size="sm" :icon="MapPin" @click="pickerOpen = true">Chọn trên bản đồ</UiButton>
          </div>
        </div>
      </section>

      <!-- Note -->
      <section class="sec" aria-labelledby="note-h">
        <h2 id="note-h" class="sec-title">Ghi chú <span class="opt">không bắt buộc</span></h2>
        <textarea
          v-model="draft.note"
          rows="4"
          maxlength="600"
          :placeholder="draft.kind === 'species' ? 'Ví dụ: cây cao khoảng 3 m, đang có quả, mọc sát bờ lạch.' : 'Ví dụ: đoạn bờ dài khoảng 10 m bị sạt sau đợt triều cường.'"
        />
      </section>

      <div class="submit">
        <p v-if="missing" class="missing">{{ missing }}</p>
        <UiButton type="submit" size="lg" block :disabled="!valid" :loading="saving">Gửi ghi nhận</UiButton>
        <p class="fine">Bản thử nghiệm: ghi nhận được lưu trên thiết bị này.</p>
      </div>
    </form>

    <UiSheet v-model:open="pickerOpen" title="Chọn vị trí" size="large">
      <MapPicker v-if="pickerOpen" :start="draft.location" @pick="onPick" />
    </UiSheet>
  </div>
</template>

<style scoped>
.new { min-height: 100dvh; background: var(--bg); }
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: calc(var(--safe-top) + 10px) 12px 10px;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 0.5px 0 var(--separator);
}
.bar > :first-child { justify-self: start; }
.bar > :last-child { justify-self: end; }
.form { width: 100%; max-width: 640px; margin: 0 auto; padding: 18px 20px calc(var(--safe-bottom) + 32px); display: flex; flex-direction: column; gap: 22px; }
.kind-help { margin-top: -12px; font: var(--t-footnote); color: var(--label-2); }
.sec { display: flex; flex-direction: column; gap: 10px; }
.sec-row { display: flex; justify-content: space-between; align-items: center; }
.sec-title { font: var(--t-headline); }
.opt { font: 400 13px/1 var(--font-sans); color: var(--label-2); margin-left: 6px; }
.field-label { font: 600 13px/1.3 var(--font-sans); color: var(--label-2); margin-bottom: 6px; }

.photos { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; }
.add, .thumb { flex: none; width: 104px; height: 104px; border-radius: 18px; }
.add {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  padding: 8px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1.5px var(--separator-strong);
  border: 1.5px dashed transparent;
  color: var(--accent-text);
  font: 600 12px/1.3 var(--font-sans);
  text-align: center;
  cursor: pointer;
}
.add:focus-within { outline: 2.5px solid var(--focus-ring); outline-offset: 2px; }
.add svg { width: 28px; height: 28px; }
.thumb { position: relative; overflow: hidden; background: var(--surface-2); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.rm { position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: rgba(0, 0, 0, 0.55); color: #fff; }
.rm svg { width: 14px; height: 14px; }
.tip { font: var(--t-footnote); color: var(--label-2); }

.species { display: flex; flex-direction: column; border-radius: var(--r-md); background: var(--surface); box-shadow: var(--shadow-sm), inset 0 0 0 0.5px var(--separator); overflow: hidden; }
.sp { display: grid; grid-template-columns: 40px 1fr 24px; gap: 12px; align-items: center; padding: 10px 14px; text-align: left; transition: background-color var(--dur-1); }
.sp + .sp { box-shadow: inset 0 0.5px 0 var(--separator-strong); }
.sp:hover { background: color-mix(in srgb, var(--label) 4%, transparent); }
.sp-text { display: flex; flex-direction: column; min-width: 0; }
.sp-name { font: var(--t-callout); font-weight: 600; }
.sp-sci { font: var(--t-footnote); color: var(--label-2); }
.sp:not(.unknown) .sp-sci { font-style: italic; }
.q { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 11px; background: var(--surface-2); font: 700 18px/1 var(--font-sans); color: var(--label-2); }
.tick { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; color: transparent; box-shadow: inset 0 0 0 1.5px var(--separator-strong); transition: all var(--dur-2); }
.tick svg { width: 14px; height: 14px; }
.sp[aria-checked='true'] .tick { background: var(--accent); color: var(--accent-ink); box-shadow: none; }
.certainty { margin-top: 4px; }

.conds { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.cond { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; padding: 14px; border-radius: 16px; background: var(--surface); box-shadow: var(--shadow-sm), inset 0 0 0 1px var(--separator); text-align: left; transition: box-shadow var(--dur-2), background-color var(--dur-2); }
.cond svg { width: 22px; height: 22px; color: var(--label-2); margin-bottom: 6px; }
.cond[aria-checked='true'] { background: var(--accent-tint); box-shadow: inset 0 0 0 2px var(--accent); }
.cond[aria-checked='true'] svg { color: var(--accent-text); }
.c-label { font: var(--t-callout); font-weight: 600; }
.c-hint { font: var(--t-caption); color: var(--label-2); }

.loc { overflow: hidden; }
.loc-map { height: 140px; border-bottom: 0.5px solid var(--separator); }
.loc-row { display: flex; gap: 12px; align-items: flex-start; padding: 14px 14px 6px; }
.loc-row > svg { width: 20px; height: 20px; color: var(--accent-text); flex: none; margin-top: 2px; }
.loc-main { font: var(--t-callout); font-weight: 600; }
.loc-sub { font: var(--t-footnote); color: var(--label-2); }
.loc-actions { display: flex; gap: 8px; flex-wrap: wrap; padding: 8px 14px 14px 46px; }

textarea {
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--separator-strong);
  font: var(--t-body);
  resize: vertical;
  min-height: 110px;
}
textarea::placeholder { color: var(--label-3); }
textarea:focus { outline: none; box-shadow: inset 0 0 0 2px var(--accent); }

.submit { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.missing { font: var(--t-footnote); color: var(--warn); text-align: center; }
.fine { font: var(--t-caption); color: var(--label-2); text-align: center; }
@media (min-width: 768px) { .conds { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>
