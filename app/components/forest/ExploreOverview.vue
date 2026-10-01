<script setup lang="ts">
// The forest at a glance, beside the map: species (filter), tide (simulate),
// and how to read the model. Used in the phone sheet and the desktop panel.
import { Info } from '@lucide/vue'
import type { SpeciesId } from '~/data/species'
import type { Patch } from '~/composables/useForest'

defineProps<{ focus: SpeciesId | null; selectedId?: string | null; exaggeration: number }>()
const tide = defineModel<number>('tide', { required: true })
const emit = defineEmits<{ focus: [SpeciesId | null]; preview: [SpeciesId | null]; selectPatch: [Patch] }>()

const { stats, isDemo, isPlaceholderContext } = useForest()
</script>

<template>
  <div class="overview">
    <section aria-labelledby="ov-species">
      <div class="sec-head">
        <h3 id="ov-species">Loài</h3>
        <button v-if="focus" type="button" class="clear" @click="emit('focus', null)">Bỏ lọc</button>
        <span v-else class="hint">chạm để lọc trên bản đồ</span>
      </div>
      <VizComposition compact :selected="focus" @hover="emit('preview', $event)" @select="emit('focus', focus === $event ? null : $event)" />
    </section>

    <section aria-labelledby="ov-tide">
      <div class="sec-head">
        <h3 id="ov-tide">Thủy triều</h3>
        <span class="hint">mô phỏng</span>
      </div>
      <VizTransect v-model:tide="tide" :focus="focus" :selected-id="selectedId" :height="190" @select="emit('selectPatch', $event)" />
    </section>

    <section aria-labelledby="ov-read">
      <div class="sec-head"><h3 id="ov-read">Cách đọc mô hình</h3></div>
      <ul class="read">
        <li><span class="sw clay" aria-hidden="true" />Khối xám: khóm cây; chạm hoặc rê chuột để hiện màu loài</li>
        <li><span class="sw line" aria-hidden="true" />Viền liền: đã được giảng viên xác minh</li>
        <li><span class="sw dash" aria-hidden="true" />Viền đứt: chưa xác minh</li>
        <li><span class="sw mound" aria-hidden="true" />Bệ nâu: cao độ nền so với mực nước biển</li>
        <li v-if="exaggeration > 1"><span class="sw ex" aria-hidden="true">×{{ exaggeration }}</span>Chiều cao đang được phóng đại để dễ nhìn</li>
      </ul>
    </section>

    <NuxtLink to="/about" class="source">
      <Info aria-hidden="true" :stroke-width="2" />
      <span>
        <template v-if="isDemo">{{ stats.total }} khóm là dữ liệu minh họa. </template>
        Nền bản đồ: {{ isPlaceholderContext ? 'vẽ minh họa' : '© OpenStreetMap contributors' }}. Xem nguồn dữ liệu
      </span>
    </NuxtLink>
  </div>
</template>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 22px; }
.sec-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.sec-head h3 { font: var(--t-headline); }
.hint { font: var(--t-caption); color: var(--label-2); }
.clear { font: 600 13px/1 var(--font-sans); color: var(--accent-text); padding: 4px 6px; border-radius: 8px; }
.read { display: flex; flex-direction: column; gap: 10px; }
.read li { display: flex; align-items: center; gap: 10px; font: var(--t-footnote); color: var(--label-2); }
.sw { flex: none; width: 22px; height: 16px; border-radius: 4px; display: grid; place-items: center; }
.sw.clay { background: linear-gradient(var(--patch-gray-hi), var(--patch-gray-lo)); }
.sw.line { border: 2px solid var(--patch-outline); }
.sw.dash { border: 2px dashed var(--patch-outline); }
.sw.mound { background: var(--patch-ground); height: 8px; align-self: center; }
.sw.ex { font: 700 10px/1 var(--font-sans); color: var(--warn); background: var(--warn-tint); }
.source { display: flex; gap: 8px; align-items: flex-start; font: var(--t-caption); color: var(--label-2); text-decoration: none !important; }
.source svg { width: 15px; height: 15px; flex: none; margin-top: 1px; }
</style>
