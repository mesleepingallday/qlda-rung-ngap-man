<script setup lang="ts">
// Everything known about one patch, in reading order: what it is, how sure
// we are, its measurements, how it relates to the tide, and what to do next.
import { computed } from 'vue'
import { BadgeCheck, Camera, CircleDashed, Droplets, Leaf, ShieldAlert, X } from '@lucide/vue'
import { SPECIES } from '~/data/species'
import type { Patch } from '~/composables/useForest'

const props = defineProps<{ patch: Patch; tide: number; closable?: boolean }>()
defineEmits<{ close: [] }>()

const { isAdvisor, displayName } = useUser()
const { setVerified } = useForest()
const { show } = useToast()
const sp = computed(() => SPECIES[props.patch.species_id])
const flooded = computed(() => props.tide > 0 && props.patch.ground_m < props.tide)

function toggleVerified() {
  const next = !props.patch.verified
  setVerified(props.patch.id, next, displayName.value)
  show(next ? `Đã xác minh khóm ${props.patch.id}` : `Đã bỏ xác minh khóm ${props.patch.id}`, { tone: next ? 'ok' : 'neutral' })
}
</script>

<template>
  <article class="patch" :aria-label="`Khóm ${patch.id}: ${sp.name}`">
    <header class="head">
      <SpeciesThumb :id="patch.species_id" :size="56" />
      <div class="names">
        <p class="kicker">Khóm {{ patch.id }}</p>
        <h2 class="name">{{ sp.name }}</h2>
        <p class="sci">{{ sp.scientific }}</p>
      </div>
      <UiIconButton v-if="closable" :icon="X" label="Đóng" size="sm" variant="gray" class="close" @click="$emit('close')" />
    </header>

    <div class="badges">
      <UiBadge v-if="patch.verified" tone="ok" :icon="BadgeCheck" size="sm">Đã xác minh · {{ pct(patch.confidence) }}</UiBadge>
      <UiBadge v-else tone="neutral" :icon="CircleDashed" size="sm">Chưa xác minh · {{ pct(patch.confidence) }}</UiBadge>
      <UiBadge v-if="patch.source === 'demo'" tone="warn" size="sm">Dữ liệu minh họa</UiBadge>
    </div>

    <NuxtLink v-if="sp.safety?.level === 'danger'" :to="`/species/${patch.species_id}`" class="safety">
      <ShieldAlert aria-hidden="true" :stroke-width="2" />
      <span>Nhựa cây có độc. Không bẻ cành, ngắt lá.</span>
    </NuxtLink>

    <dl class="metrics">
      <div><dt>Chiều cao</dt><dd>{{ num(patch.height_m, 1) }}<small> m</small></dd></div>
      <div><dt>Đường kính tán</dt><dd>{{ num(patch.crown_diameter_m, 1) }}<small> m</small></dd></div>
      <div><dt>Diện tích tán</dt><dd>{{ num(patch.area_m2) }}<small> m²</small></dd></div>
      <div><dt>Cao độ nền</dt><dd>{{ num(patch.ground_m, 2) }}<small> m</small></dd></div>
    </dl>

    <div class="tide" :class="{ wet: flooded }">
      <Droplets aria-hidden="true" :stroke-width="2" />
      <div>
        <p class="tide-main">Ngập khi mực nước triều ≥ {{ num(patch.ground_m, 2) }} m</p>
        <p v-if="tide > 0" class="tide-sub">{{ flooded ? 'Đang ngập' : 'Còn khô' }} ở mực nước mô phỏng {{ num(tide, 2) }} m</p>
        <p v-else class="tide-sub">Cách mép nước khoảng {{ num(patch.inland_m) }} m</p>
      </div>
    </div>

    <p v-if="patch.verified && patch.verified_by" class="provenance">
      Xác minh bởi {{ patch.verified_by === 'demo-advisor' ? 'Giảng viên (demo)' : patch.verified_by }}<template v-if="patch.observed_at"> · khảo sát {{ dateShortText(patch.observed_at) }}</template>
    </p>

    <div class="actions">
      <UiButton :to="`/observations/new?patch=${patch.id}`" :icon="Camera" size="md" block>Ghi nhận tại khóm này</UiButton>
      <UiButton :to="`/species/${patch.species_id}`" :icon="Leaf" variant="gray" size="md" block>Về loài {{ sp.name }}</UiButton>
      <UiButton v-if="isAdvisor" variant="tinted" size="md" block :icon="patch.verified ? CircleDashed : BadgeCheck" @click="toggleVerified">
        {{ patch.verified ? 'Bỏ xác minh' : 'Đánh dấu đã xác minh' }}
      </UiButton>
    </div>
  </article>
</template>

<style scoped>
.patch { display: flex; flex-direction: column; gap: 14px; }
.head { display: grid; grid-template-columns: 56px 1fr auto; gap: 14px; align-items: center; }
.names { min-width: 0; }
.kicker { font: 600 12px/1.3 var(--font-sans); color: var(--label-2); letter-spacing: 0.02em; }
.name { font: var(--t-title2); letter-spacing: -0.016em; }
.sci { font: var(--t-footnote); font-style: italic; color: var(--label-2); }
.close { align-self: start; }
.badges { display: flex; flex-wrap: wrap; gap: 6px; }
.safety {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--danger-tint);
  color: var(--danger);
  font: 600 14px/1.35 var(--font-sans);
  text-decoration: none !important;
}
.safety svg { width: 18px; height: 18px; flex: none; }
.metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.metrics div { padding: 10px 12px; border-radius: 12px; background: var(--surface-2); }
.metrics dt { font: 500 12px/1.3 var(--font-sans); color: var(--label-2); }
.metrics dd { font: 650 20px/1.25 var(--font-sans); letter-spacing: -0.02em; }
.metrics small { font: 600 13px/1 var(--font-sans); color: var(--label-2); letter-spacing: 0; }
.tide { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: 12px; background: var(--water-tint); color: var(--label); }
.tide svg { width: 20px; height: 20px; flex: none; color: var(--water); margin-top: 1px; }
.tide-main { font: 600 14px/1.35 var(--font-sans); }
.tide-sub { font: var(--t-footnote); color: var(--label-2); }
.tide.wet .tide-sub { color: var(--water-text); font-weight: 600; }
.provenance { font: var(--t-footnote); color: var(--label-2); }
.actions { display: flex; flex-direction: column; gap: 8px; }
</style>
