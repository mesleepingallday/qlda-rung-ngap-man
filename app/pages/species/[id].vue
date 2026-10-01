<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, BookOpen, Camera, ChevronLeft, Map as MapIcon, ScanSearch, ShieldAlert, TriangleAlert } from '@lucide/vue'
import { GROUP_LABEL, SPECIES, SPECIES_IDS, TRAIT_LABEL, TRAIT_ORDER, type SpeciesId } from '~/data/species'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as SpeciesId)
if (!SPECIES_IDS.includes(id.value)) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy loài' })

const sp = computed(() => SPECIES[id.value])
useHead(() => ({ title: `${sp.value.name} (${sp.value.scientific}) · Rừng ngập mặn Huế` }))

const { stats } = useForest()
const st = computed(() => stats.value.bySpecies.find((s) => s.id === id.value))
const traits = computed(() => TRAIT_ORDER.filter((t) => sp.value.traits[t]).map((t) => ({ key: t, label: TRAIT_LABEL[t], text: sp.value.traits[t]!, art: traitArt(id.value, t) })))
const tide = ref(0.6)
const scaleMax = computed(() => Math.ceil(stats.value.maxHeight))

function back() {
  if (window.history.state?.back) router.back()
  else router.push('/species')
}
</script>

<template>
  <div class="detail">
    <header class="hero" :style="{ '--c': `var(--species-${id})` }">
      <div class="hero-inner page">
        <button type="button" class="back" @click="back"><ChevronLeft aria-hidden="true" :stroke-width="2.4" />Loài</button>
        <div class="hero-main">
          <SpeciesThumb :id="id" :size="112" />
          <div class="hero-text">
            <p class="kicker">{{ sp.familyVi }} · {{ sp.family }}</p>
            <h1 class="t-large name">{{ sp.name }}</h1>
            <p class="sci">{{ sp.scientific }}<span v-if="sp.author" class="author">{{ sp.author }}</span></p>
            <p v-if="sp.altNames.length" class="alt">Tên khác: {{ sp.altNames.join(', ') }}</p>
            <div class="badges">
              <UiBadge tone="accent" size="sm">{{ GROUP_LABEL[sp.group] }}</UiBadge>
              <UiBadge v-if="sp.status === 'draft'" tone="warn" size="sm">Bản nháp · chờ giảng viên xác nhận</UiBadge>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="page body">
      <div class="col-main">
        <p v-if="sp.safety" class="safety" :class="sp.safety.level">
          <component :is="sp.safety.level === 'danger' ? ShieldAlert : TriangleAlert" aria-hidden="true" :stroke-width="2" />
          <span><strong>{{ sp.safety.level === 'danger' ? 'Cẩn thận: có độc. ' : 'Lưu ý. ' }}</strong>{{ sp.safety.text }}</span>
        </p>

        <p class="summary">{{ sp.summary }}</p>

        <section class="card panel" aria-labelledby="traits-h">
          <h2 id="traits-h" class="block-title">Đặc điểm nhận dạng</h2>
          <ul class="traits">
            <li v-for="t in traits" :key="t.key">
              <span class="t-art" :class="{ empty: !t.art }"><CharacterArt v-if="t.art" :art="t.art" /></span>
              <div>
                <p class="t-label">{{ t.label }}</p>
                <p class="t-text">{{ t.text }}</p>
              </div>
            </li>
          </ul>
          <UiButton to="/identify" variant="tinted" size="sm" :icon="ScanSearch">Thử khóa nhận dạng</UiButton>
        </section>

        <section v-if="sp.confusions?.length" class="card panel" aria-labelledby="conf-h">
          <h2 id="conf-h" class="block-title">Dễ nhầm với</h2>
          <NuxtLink v-for="c in sp.confusions" :key="c.with" :to="`/species/${c.with}`" class="conf">
            <SpeciesThumb :id="c.with" :size="44" decorative />
            <div>
              <p class="conf-name">{{ SPECIES[c.with].name }} <span class="sci-sm">{{ SPECIES[c.with].scientific }}</span></p>
              <p class="conf-tip">{{ c.tip }}</p>
            </div>
            <ArrowRight aria-hidden="true" :stroke-width="2" class="conf-arrow" />
          </NuxtLink>
        </section>
      </div>

      <aside class="col-side">
        <section v-if="st" class="card panel" aria-labelledby="here-h">
          <div class="block-head">
            <h2 id="here-h" class="block-title">Tại Rú Chá</h2>
            <UiBadge size="sm" tone="warn">minh họa</UiBadge>
          </div>
          <div class="here-stats">
            <div><span class="hs-v">{{ st.count }}</span><span class="hs-l">khóm</span></div>
            <div><span class="hs-v">{{ pct(st.share) }}</span><span class="hs-l">diện tích tán</span></div>
            <div><span class="hs-v">{{ st.verified }}</span><span class="hs-l">đã xác minh</span></div>
          </div>
          <div class="measure">
            <p class="m-label">Chiều cao <span class="tabular">{{ num(st.height.min, 1) }}–{{ num(st.height.max, 1) }} m</span></p>
            <VizRange :min="st.height.min" :max="st.height.max" :median="st.height.median" :scale-max="scaleMax" :color="`var(--species-${id})`" :label="`Chiều cao từ ${num(st.height.min, 1)} đến ${num(st.height.max, 1)} mét, trung vị ${num(st.height.median, 1)} mét`" />
          </div>
          <div class="measure">
            <p class="m-label">Vị trí điển hình</p>
            <p class="m-text">{{ sp.zone }}. Nền đất {{ num(st.ground.min, 2) }}–{{ num(st.ground.max, 2) }} m so với mực nước biển.</p>
          </div>
          <VizTransect v-model:tide="tide" :focus="id" :height="170" :show-slider="false" />
          <UiButton :to="`/explore?species=${id}`" variant="gray" size="md" block :icon="MapIcon">Xem trên bản đồ</UiButton>
        </section>

        <div class="actions">
          <UiButton :to="`/observations/new?species=${id}`" size="lg" block :icon="Camera">Ghi nhận loài này</UiButton>
        </div>

        <section class="sources" aria-labelledby="src-h">
          <h2 id="src-h" class="src-title"><BookOpen aria-hidden="true" :stroke-width="2" />Nguồn tham khảo</h2>
          <p>Cần bổ sung tài liệu khoa học và ảnh thực địa do giảng viên cung cấp. Thông tin hiện tại là bản nháp để thử nghiệm giao diện.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.hero {
  background:
    radial-gradient(70% 120% at 15% 0%, color-mix(in srgb, var(--c) 26%, transparent), transparent 70%),
    linear-gradient(180deg, color-mix(in srgb, var(--c) 10%, var(--bg)), var(--bg));
  padding-top: calc(var(--safe-top) + 8px);
}
.hero-inner { padding-bottom: 24px; }
.back { display: inline-flex; align-items: center; gap: 2px; margin: 4px 0 12px -8px; padding: 6px 8px 6px 4px; border-radius: 10px; color: var(--accent-text); font: 500 16px/1 var(--font-sans); }
.back svg { width: 22px; height: 22px; }
.hero-main { display: flex; flex-direction: column; gap: 16px; }
.kicker { font: 600 13px/1.3 var(--font-sans); color: var(--label-2); }
.name { margin-top: 2px; }
.sci { font: var(--t-title3); font-weight: 450; font-style: italic; color: var(--label-2); }
.author { margin-left: 0.35em; font-style: normal; font-size: 15px; color: var(--label-3); }
.alt { margin-top: 4px; font: var(--t-footnote); color: var(--label-2); }
.badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }

.body { display: grid; gap: 16px; padding-top: 8px; }
.col-main, .col-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.safety { display: flex; gap: 12px; padding: 14px 16px; border-radius: var(--r-md); font: var(--t-subhead); }
.safety svg { width: 22px; height: 22px; flex: none; }
.safety.danger { background: var(--danger-tint); color: var(--danger); }
.safety.caution { background: var(--warn-tint); color: var(--warn); }
.summary { font: var(--t-body); text-wrap: pretty; }
.panel { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.block-head { display: flex; justify-content: space-between; align-items: center; }
.block-title { font: var(--t-title3); }
.traits { display: flex; flex-direction: column; gap: 14px; }
.traits li { display: grid; grid-template-columns: 52px 1fr; gap: 14px; align-items: start; }
.t-art { width: 52px; height: 52px; padding: 7px; border-radius: 14px; background: var(--surface-2); color: var(--accent-text); }
.t-art.empty { background: transparent; box-shadow: inset 0 0 0 1px var(--separator); }
.t-label { font: 600 13px/1.3 var(--font-sans); color: var(--label-2); }
.t-text { font: var(--t-callout); text-wrap: pretty; }
.conf { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: start; padding: 12px; margin: 0 -6px; border-radius: 14px; color: var(--label); text-decoration: none !important; }
.conf:hover { background: var(--surface-2); }
.conf-name { font: var(--t-headline); }
.sci-sm { font: var(--t-footnote); font-style: italic; color: var(--label-2); font-weight: 400; }
.conf-tip { font: var(--t-subhead); color: var(--label-2); margin-top: 2px; }
.conf-arrow { width: 18px; height: 18px; color: var(--label-3); margin-top: 4px; }
.here-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.here-stats div { display: flex; flex-direction: column; padding: 10px 12px; border-radius: 12px; background: var(--surface-2); }
.hs-v { font: 650 22px/1.2 var(--font-sans); letter-spacing: -0.02em; }
.hs-l { font: var(--t-caption); color: var(--label-2); }
.measure { display: flex; flex-direction: column; gap: 6px; }
.m-label { display: flex; justify-content: space-between; font: 600 13px/1.3 var(--font-sans); color: var(--label-2); }
.m-label span { color: var(--label); }
.m-text { font: var(--t-subhead); }
.sources { padding: 4px 4px 0; }
.src-title { display: flex; align-items: center; gap: 8px; font: var(--t-headline); margin-bottom: 4px; }
.src-title svg { width: 18px; height: 18px; color: var(--label-2); }
.sources p { font: var(--t-footnote); color: var(--label-2); }

@media (min-width: 768px) {
  .hero { padding-top: 24px; }
  .hero-main { flex-direction: row; align-items: center; gap: 24px; }
  .hero-main :deep(.thumb) { width: 140px !important; height: 140px !important; border-radius: 34px !important; }
}
@media (min-width: 1024px) {
  .body { grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr); gap: 24px; align-items: start; }
  .col-side { position: sticky; top: 24px; }
}
</style>
