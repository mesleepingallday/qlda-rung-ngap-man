<script setup lang="ts">
import { computed, ref } from 'vue'
import { BadgeCheck, ChevronLeft, Map as MapIcon, MessageCircleQuestion, Send, Trash2 } from '@lucide/vue'
import { CONDITIONS, SPECIES, SPECIES_BY_ZONE, type SpeciesId } from '~/data/species'
import { CERTAINTY, STATUS } from '~/composables/useObservations'
import { ROLES } from '~/composables/useUser'
import type { LngLat } from '~/utils/geo'

const route = useRoute()
const router = useRouter()
const { get, review, remove, pending } = useObservations()
const { isAdvisor, displayName } = useUser()
const forest = useForest()
const { show } = useToast()

const obs = computed(() => get(route.params.id as string))

const title = computed(() => {
  const o = obs.value
  if (!o) return 'Không tìm thấy'
  return o.kind === 'species' ? (o.species_id ? SPECIES[o.species_id].name : 'Chưa rõ loài') : CONDITIONS[o.condition ?? 'other'].label
})
useHead(() => ({ title: `${title.value} · Ghi nhận` }))
const point = computed<LngLat | null>(() => (obs.value?.lng != null && obs.value?.lat != null ? [obs.value.lng, obs.value.lat] : null))
const near = computed(() => (point.value ? forest.nearestPatch(point.value) : null))
const photoIndex = ref(0)

// --- Review (advisors) -------------------------------------------------------
const reviewOpen = ref(false)
const decision = ref<'verified' | 'needs_info'>('verified')
const reviewSpecies = ref<SpeciesId | null>(null)
const comment = ref('')
const updatePatch = ref(true)
function openReview(d: 'verified' | 'needs_info') {
  decision.value = d
  reviewSpecies.value = obs.value?.species_id ?? near.value?.patch.species_id ?? null
  comment.value = ''
  updatePatch.value = true
  reviewOpen.value = true
}
const patchMatches = computed(() => !!near.value && near.value.distance <= 20 && reviewSpecies.value === near.value.patch.species_id)
const canSubmitReview = computed(() => decision.value === 'needs_info' ? comment.value.trim().length > 0 : obs.value?.kind !== 'species' || !!reviewSpecies.value)
function submitReview() {
  const o = obs.value
  if (!o || !canSubmitReview.value) return
  review(o.id, { by: displayName.value, decision: decision.value, species_id: o.kind === 'species' ? reviewSpecies.value : null, comment: comment.value.trim() })
  if (decision.value === 'verified' && o.kind === 'species' && patchMatches.value && updatePatch.value && near.value) {
    forest.setVerified(near.value.patch.id, true, displayName.value)
  }
  reviewOpen.value = false
  show(decision.value === 'verified' ? 'Đã xác minh ghi nhận' : 'Đã gửi yêu cầu bổ sung', { tone: 'ok' })
  const nextItem = pending.value.find((x) => x.id !== o.id)
  if (route.query.from === 'queue' && nextItem) router.replace(`/observations/${nextItem.id}?from=queue`)
}

// --- Delete (own observations) ---------------------------------------------
const confirmDelete = ref(false)
async function doDelete() {
  if (!obs.value) return
  await remove(obs.value.id)
  confirmDelete.value = false
  show('Đã xóa ghi nhận')
  router.replace('/observations?tab=mine')
}
function back() {
  if (window.history.state?.back) router.back()
  else router.push('/observations')
}
</script>

<template>
  <div class="page detail">
    <AppPageHeader v-if="!obs" title="Không tìm thấy ghi nhận" back="/observations" back-label="Ghi nhận" />
    <template v-else>
      <button type="button" class="back" @click="back"><ChevronLeft aria-hidden="true" :stroke-width="2.4" />Ghi nhận</button>

      <div class="layout">
        <div class="col-main">
          <!-- Media -->
          <div v-if="obs.photos.length" class="media card">
            <ObsPhoto :photo-key="obs.photos[photoIndex]!" :alt="`Ảnh ${photoIndex + 1} của ghi nhận`" />
            <div v-if="obs.photos.length > 1" class="dots" role="tablist" aria-label="Ảnh">
              <button v-for="(p, i) in obs.photos" :key="p" type="button" role="tab" :aria-selected="i === photoIndex" :aria-label="`Ảnh ${i + 1}`" @click="photoIndex = i" />
            </div>
          </div>
          <div v-else class="media none card" :style="obs.species_id ? { '--c': `var(--species-${obs.species_id})` } : undefined">
            <SpeciesThumb v-if="obs.kind === 'species' && obs.species_id" :id="obs.species_id" :size="96" decorative />
            <span v-else class="cond-ic"><component :is="CONDITION_ICON[obs.kind === 'species' ? 'other' : obs.condition ?? 'other']" aria-hidden="true" :stroke-width="1.8" /></span>
            <p class="no-photo">Không có ảnh</p>
          </div>

          <!-- Title -->
          <div class="head">
            <div>
              <p class="kicker">{{ obs.kind === 'species' ? 'Cây · loài' : 'Hiện trạng' }}<template v-if="obs.demo"> · ví dụ minh họa</template></p>
              <h1 class="t-large">{{ title }}</h1>
              <p v-if="obs.kind === 'species' && obs.species_id" class="sci">{{ SPECIES[obs.species_id].scientific }}</p>
            </div>
            <ObsStatusBadge :status="obs.status" size="md" />
          </div>
          <p v-if="obs.note" class="note">{{ obs.note }}</p>

          <!-- Facts -->
          <UiList>
            <UiListRow title="Người gửi" :value="`${obs.author.name} · ${ROLES[obs.author.role].short}`" />
            <UiListRow title="Thời gian" :value="`${timeText(obs.created_at)}, ${dateShortText(obs.created_at)}`" />
            <UiListRow v-if="obs.kind === 'species'" title="Mức chắc chắn" :value="obs.certainty ? CERTAINTY[obs.certainty] : 'Chưa biết loài'" />
            <UiListRow v-if="near" title="Khóm gần nhất" :value="`${near.patch.id} · ${SPECIES[near.patch.species_id].name} · ${num(near.distance)} m`" :to="`/explore?patch=${near.patch.id}`" />
          </UiList>
        </div>

        <div class="col-side">
          <!-- Location -->
          <section v-if="point" class="card loc" aria-label="Vị trí">
            <div class="loc-map"><MiniMap :point="point" :highlight="near?.patch.id ?? null" /></div>
            <div class="loc-foot">
              <span class="tabular muted">{{ point[1].toFixed(5) }}, {{ point[0].toFixed(5) }}<template v-if="obs.accuracy_m"> · ±{{ obs.accuracy_m }} m</template></span>
              <UiButton v-if="near" :to="`/explore?patch=${near.patch.id}`" variant="plain" size="sm" :icon="MapIcon">Bản đồ</UiButton>
            </div>
          </section>

          <!-- Timeline -->
          <section class="card timeline" aria-labelledby="tl-h">
            <h2 id="tl-h" class="tl-title">Tiến trình</h2>
            <ol>
              <li class="ev done">
                <span class="node" aria-hidden="true" />
                <p class="ev-title">Đã gửi</p>
                <p class="ev-meta">{{ relativeText(obs.created_at) }}</p>
              </li>
              <li v-for="(r, i) in obs.reviews" :key="i" class="ev" :class="r.decision === 'verified' ? 'ok' : 'info'">
                <span class="node" aria-hidden="true" />
                <p class="ev-title">{{ STATUS[r.decision].label }}<template v-if="r.species_id"> · {{ SPECIES[r.species_id].name }}</template></p>
                <p class="ev-meta">{{ r.by }} · {{ relativeText(r.at) }}</p>
                <p v-if="r.comment" class="ev-comment">“{{ r.comment }}”</p>
              </li>
              <li v-if="obs.status === 'pending'" class="ev wait">
                <span class="node" aria-hidden="true" />
                <p class="ev-title">Chờ giảng viên xác minh</p>
                <p class="ev-meta">Bạn sẽ thấy kết quả tại đây</p>
              </li>
            </ol>
          </section>

          <!-- Actions -->
          <div v-if="isAdvisor && obs.status !== 'verified'" class="review-bar">
            <UiButton variant="gray" :icon="MessageCircleQuestion" @click="openReview('needs_info')">Yêu cầu bổ sung</UiButton>
            <UiButton :icon="BadgeCheck" @click="openReview('verified')">Xác minh</UiButton>
          </div>
          <UiButton v-if="obs.mine" variant="danger" size="sm" :icon="Trash2" class="del" @click="confirmDelete = true">Xóa ghi nhận</UiButton>
        </div>
      </div>
    </template>

    <!-- Review sheet -->
    <UiSheet v-model:open="reviewOpen" :title="decision === 'verified' ? 'Xác minh ghi nhận' : 'Yêu cầu bổ sung'">
      <div v-if="obs" class="review">
        <template v-if="decision === 'verified' && obs.kind === 'species'">
          <p class="field-label">Loài đúng là</p>
          <div class="r-species" role="radiogroup" aria-label="Loài đúng">
            <button v-for="id in SPECIES_BY_ZONE" :key="id" type="button" role="radio" class="r-sp" :aria-checked="reviewSpecies === id" @click="reviewSpecies = id">
              <SpeciesThumb :id="id" :size="32" decorative />{{ SPECIES[id].name }}
            </button>
          </div>
          <p v-if="obs.species_id && reviewSpecies && reviewSpecies !== obs.species_id" class="r-note">Bạn đang sửa loài từ {{ SPECIES[obs.species_id].name }} thành {{ SPECIES[reviewSpecies].name }}.</p>
          <label v-if="near && near.distance <= 20" class="r-check">
            <input v-model="updatePatch" type="checkbox" :disabled="!patchMatches">
            <span>
              Đồng thời đánh dấu khóm {{ near.patch.id }} là đã xác minh
              <small v-if="!patchMatches">Loài của khóm trên bản đồ ({{ SPECIES[near.patch.species_id].name }}) khác loài bạn chọn.</small>
            </span>
          </label>
        </template>
        <label class="r-comment">
          <span class="field-label">{{ decision === 'needs_info' ? 'Cần bổ sung gì?' : 'Nhận xét' }} <span v-if="decision === 'verified'" class="opt">không bắt buộc</span></span>
          <textarea v-model="comment" rows="3" :placeholder="decision === 'needs_info' ? 'Ví dụ: chụp thêm ảnh cận lá và quả.' : 'Ví dụ: đúng loài, lưu ý nhựa độc.'" />
        </label>
      </div>
      <template #footer>
        <UiButton block size="lg" :icon="decision === 'verified' ? BadgeCheck : Send" :disabled="!canSubmitReview" @click="submitReview">
          {{ decision === 'verified' ? 'Xác minh' : 'Gửi yêu cầu' }}
        </UiButton>
      </template>
    </UiSheet>

    <UiSheet v-model:open="confirmDelete" title="Xóa ghi nhận?">
      <p class="muted">Ghi nhận và ảnh sẽ bị xóa khỏi thiết bị này. Không thể hoàn tác.</p>
      <template #footer>
        <div class="confirm-row">
          <UiButton variant="gray" block @click="confirmDelete = false">Giữ lại</UiButton>
          <UiButton variant="danger" block :icon="Trash2" @click="doDelete">Xóa</UiButton>
        </div>
      </template>
    </UiSheet>
  </div>
</template>

<style scoped>
.detail { padding-top: calc(var(--safe-top) + 12px); }
@media (min-width: 768px) { .detail { padding-top: 32px; } }
.back { display: inline-flex; align-items: center; gap: 2px; margin: 0 0 12px -8px; padding: 6px 8px 6px 4px; border-radius: 10px; color: var(--accent-text); font: 500 16px/1 var(--font-sans); }
.back svg { width: 22px; height: 22px; }
.layout { display: grid; gap: 16px; }
.col-main, .col-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.media { position: relative; aspect-ratio: 4 / 3; overflow: hidden; }
.media.none {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  aspect-ratio: 16 / 7;
  background: radial-gradient(70% 90% at 50% 0%, color-mix(in srgb, var(--c, var(--label-3)) 16%, transparent), transparent 70%), var(--surface);
}
.cond-ic { width: 80px; height: 80px; display: grid; place-items: center; border-radius: 24px; background: var(--surface-2); color: var(--label-2); }
.cond-ic svg { width: 40px; height: 40px; }
.no-photo { font: var(--t-caption); color: var(--label-2); }
.dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; }
.dots button { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, 0.55); }
.dots button[aria-selected='true'] { background: #fff; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.kicker { font: 600 13px/1.3 var(--font-sans); color: var(--label-2); }
.sci { font: var(--t-callout); font-style: italic; color: var(--label-2); }
.note { font: var(--t-body); text-wrap: pretty; }
.loc { overflow: hidden; }
.loc-map { height: 170px; }
.loc-foot { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 8px 14px; font: var(--t-caption); }
.timeline { padding: 18px; }
.tl-title { font: var(--t-headline); margin-bottom: 12px; }
.timeline ol { display: flex; flex-direction: column; }
.ev { position: relative; padding: 0 0 18px 26px; }
.ev:last-child { padding-bottom: 0; }
.ev::before { content: ''; position: absolute; left: 6px; top: 16px; bottom: 0; width: 2px; background: var(--separator-strong); }
.ev:last-child::before { display: none; }
.node { position: absolute; left: 0; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--label-3); box-shadow: 0 0 0 3px var(--surface); }
.ev.ok .node { background: var(--ok); }
.ev.info .node { background: var(--info); }
.ev.wait .node { background: var(--surface); box-shadow: inset 0 0 0 2px var(--warn), 0 0 0 3px var(--surface); }
.ev-title { font: 600 15px/1.35 var(--font-sans); }
.ev-meta { font: var(--t-footnote); color: var(--label-2); }
.ev-comment { margin-top: 6px; padding: 10px 12px; border-radius: 12px; background: var(--surface-2); font: var(--t-subhead); }
.review-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.del { align-self: flex-start; }

.review { display: flex; flex-direction: column; gap: 14px; }
.field-label { font: 600 13px/1.3 var(--font-sans); color: var(--label-2); }
.opt { font-weight: 400; color: var(--label-2); }
.r-species { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.r-sp { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 14px; background: var(--surface-2); font: 600 15px/1.2 var(--font-sans); text-align: left; }
.r-sp[aria-checked='true'] { background: var(--accent-tint); box-shadow: inset 0 0 0 2px var(--accent); }
.r-note { font: var(--t-footnote); color: var(--warn); }
.r-check { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: 14px; background: var(--surface-2); font: var(--t-subhead); }
.r-check input { width: 20px; height: 20px; accent-color: var(--accent); flex: none; margin-top: 1px; }
.r-check small { display: block; font: var(--t-caption); color: var(--label-2); }
.r-comment { display: flex; flex-direction: column; gap: 6px; }
.r-comment textarea { width: 100%; padding: 12px 14px; border: 0; border-radius: var(--r-md); background: var(--surface-2); font: var(--t-callout); resize: vertical; }
.r-comment textarea:focus { outline: none; box-shadow: inset 0 0 0 2px var(--accent); }
.confirm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

@media (min-width: 1024px) {
  .layout { grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr); gap: 24px; align-items: start; }
  .col-side { position: sticky; top: 24px; }
}
</style>
