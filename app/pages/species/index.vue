<script setup lang="ts">
import { ArrowRight, Info, ScanSearch, ShieldAlert } from '@lucide/vue'
import { GROUP_LABEL, SPECIES, SPECIES_BY_ZONE } from '~/data/species'

useHead({ title: 'Loài · Rừng ngập mặn Huế' })
const { stats } = useForest()
const statOf = (id: string) => stats.value.bySpecies.find((s) => s.id === id)
</script>

<template>
  <div class="page">
    <AppPageHeader title="Loài" :subtitle="`${SPECIES_BY_ZONE.length} loài ghi nhận tại Rú Chá`" />

    <NuxtLink to="/identify" class="identify card">
      <div class="id-text">
        <span class="id-ic"><ScanSearch aria-hidden="true" :stroke-width="2" /></span>
        <h2 class="t-title3">Không biết đây là cây gì?</h2>
        <p class="muted">Trả lời vài câu hỏi về dạng cây, lá và rễ. Ứng dụng gợi ý loài phù hợp và giải thích vì sao.</p>
        <span class="id-cta">Bắt đầu nhận dạng <ArrowRight aria-hidden="true" :stroke-width="2.2" /></span>
      </div>
      <div class="id-art" aria-hidden="true">
        <span><CharacterArt art="leaf-simple" /></span>
        <span><CharacterArt art="margin-spiny" /></span>
        <span><CharacterArt art="roots-prop" /></span>
        <span><CharacterArt art="leaf-compound" /></span>
      </div>
    </NuxtLink>

    <div class="zone-head">
      <h2 class="t-title3">Từ mép nước vào bờ</h2>
      <p class="draft"><Info aria-hidden="true" :stroke-width="2" />Thông tin loài là bản nháp, đang chờ giảng viên xác nhận.</p>
    </div>

    <ol class="grid" role="list">
      <li v-for="id in SPECIES_BY_ZONE" :key="id">
        <NuxtLink :to="`/species/${id}`" class="sp card" :style="{ '--c': `var(--species-${id})` }">
          <div class="sp-top">
            <SpeciesThumb :id="id" :size="64" />
            <ShieldAlert v-if="SPECIES[id].safety?.level === 'danger'" class="danger" aria-label="Có độc" :stroke-width="2" />
          </div>
          <h3 class="sp-name">{{ SPECIES[id].name }}</h3>
          <p class="sp-sci">{{ SPECIES[id].scientific }}</p>
          <p class="sp-zone">{{ SPECIES[id].zone }}</p>
          <div class="sp-foot">
            <span class="tabular">{{ statOf(id)?.count ?? 0 }} khóm · {{ pct(statOf(id)?.share ?? 0) }} tán</span>
            <span class="grp">{{ GROUP_LABEL[SPECIES[id].group] }}</span>
          </div>
        </NuxtLink>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.identify {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 20px;
  color: var(--label);
  text-decoration: none !important;
  background:
    radial-gradient(70% 90% at 100% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%),
    var(--surface);
  transition: box-shadow var(--dur-2), transform var(--dur-1);
}
.identify:hover { box-shadow: var(--shadow-md), inset 0 0 0 0.5px var(--separator); }
.identify:active { transform: scale(0.995); }
.id-text { display: flex; flex-direction: column; gap: 6px; }
.id-ic { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: var(--accent); color: var(--accent-ink); margin-bottom: 4px; }
.id-ic svg { width: 22px; height: 22px; }
.id-text .muted { font: var(--t-subhead); max-width: 46ch; }
.id-cta { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; font: 600 16px/1 var(--font-sans); color: var(--accent-text); }
.id-cta svg { width: 18px; height: 18px; }
.id-art { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.id-art span { aspect-ratio: 1; padding: 12px; border-radius: 16px; background: var(--surface-2); color: var(--accent-text); }

.zone-head { margin: 32px 0 14px; display: flex; flex-direction: column; gap: 4px; }
.draft { display: flex; align-items: center; gap: 6px; font: var(--t-footnote); color: var(--label-2); }
.draft svg { width: 15px; height: 15px; flex: none; }

.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.sp {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  color: var(--label);
  text-decoration: none !important;
  overflow: hidden;
  transition: box-shadow var(--dur-2), transform var(--dur-1);
}
.sp::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 90px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c) 14%, transparent), transparent);
  pointer-events: none;
}
.sp:hover { box-shadow: var(--shadow-md), inset 0 0 0 0.5px var(--separator); }
.sp:active { transform: scale(0.985); }
.sp-top { position: relative; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.danger { width: 20px; height: 20px; color: var(--danger); }
.sp-name { font: var(--t-title3); }
.sp-sci { font: var(--t-footnote); font-style: italic; color: var(--label-2); }
.sp-zone { margin-top: 8px; font: var(--t-footnote); color: var(--label); flex: 1; }
.sp-foot { margin-top: 12px; padding-top: 10px; border-top: 0.5px solid var(--separator); display: flex; flex-direction: column; gap: 2px; font: var(--t-caption); color: var(--label-2); }
.grp { color: var(--label-3); }

@media (min-width: 768px) {
  .identify { grid-template-columns: 1fr 300px; align-items: center; padding: 26px 28px; }
  .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
}
</style>
