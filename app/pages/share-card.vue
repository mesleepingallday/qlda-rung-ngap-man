<script setup lang="ts">
// 1200 × 630 link-preview card (Zalo, Facebook, Messenger), rendered from the
// live diorama by scripts/build-share-card.mjs into public/icons/og-image.png.
definePageMeta({ layout: 'bare' })
useHead({ title: 'Rừng ngập mặn Huế' })
</script>

<template>
  <div class="card-1200">
    <div class="copy">
      <div class="brand"><AppMark :size="64" /><span>Rừng ngập mặn Huế</span></div>
      <h1>Khám phá Rú&nbsp;Chá như một mô&nbsp;hình sống</h1>
      <p>Nhận dạng loài cây · Mô phỏng thủy&nbsp;triều<br>Ghi nhận cùng giảng viên</p>
    </div>
    <div class="art"><ForestDiorama :exaggeration="3.2" /></div>
  </div>
</template>

<style scoped>
.card-1200 {
  width: 1200px;
  height: 630px;
  display: grid;
  grid-template-columns: 480px 1fr;
  align-items: center;
  overflow: hidden;
  background:
    radial-gradient(55% 70% at 72% 55%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%),
    var(--bg);
}
.copy { padding: 0 0 0 72px; display: flex; flex-direction: column; gap: 22px; }
.brand { display: flex; align-items: center; gap: 16px; font: 700 28px/1.2 var(--font-sans); letter-spacing: -0.02em; }
h1 { font: 700 50px/1.12 var(--font-sans); letter-spacing: -0.03em; text-wrap: balance; }
p { font: 500 22px/1.4 var(--font-sans); color: var(--label-2); }
.art { margin-right: -40px; }
</style>
