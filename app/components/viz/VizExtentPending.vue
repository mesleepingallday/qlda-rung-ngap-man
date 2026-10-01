<script setup lang="ts">
// Mangrove extent over time (L1, Sentinel-2 + Random Forest in Earth Engine).
// No results yet, so the chart frame is shown empty with what will fill it;
// nothing is plotted that has not been measured.
import { Satellite } from '@lucide/vue'
const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
</script>

<template>
  <div class="extent">
    <svg viewBox="0 0 320 120" preserveAspectRatio="none" class="frame" aria-hidden="true">
      <line v-for="i in 4" :key="i" x1="0" x2="320" :y1="i * 26 - 10" :y2="i * 26 - 10" class="grid" />
      <text v-for="(yr, i) in years" :key="yr" :x="12 + i * 42" y="116" class="tick">{{ yr }}</text>
    </svg>
    <div class="msg">
      <span class="ic"><Satellite aria-hidden="true" :stroke-width="1.9" /></span>
      <p class="title">Chưa có số liệu biến động</p>
      <p class="text">Biểu đồ sẽ hiện diện tích rừng theo năm khi có kết quả phân loại ảnh Sentinel-2 và đánh giá độ chính xác.</p>
    </div>
  </div>
</template>

<style scoped>
.extent { position: relative; display: grid; min-height: 196px; }
.extent > * { grid-area: 1 / 1; }
.frame { width: 100%; height: 100%; opacity: 0.85; align-self: stretch; }
.grid { stroke: var(--chart-grid); stroke-width: 1; }
.tick { fill: var(--label-3); font: 500 8px/1 var(--font-sans); }
.msg {
  position: relative;
  padding-bottom: 22px !important;
  background: radial-gradient(closest-side, var(--surface) 62%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding: 0 12px;
}
.ic { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 4px; border-radius: 50%; background: var(--surface-2); color: var(--label-2); }
.ic svg { width: 20px; height: 20px; }
.title { font: var(--t-headline); font-size: 15px; }
.text { max-width: 40ch; font: var(--t-footnote); color: var(--label-2); text-wrap: pretty; }
</style>
