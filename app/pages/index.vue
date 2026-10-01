<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpRight, Camera, ChevronRight, Info, ScanSearch } from '@lucide/vue'
import type { Role } from '~/composables/useUser'

useHead({ title: 'Tổng quan · Rừng ngập mặn Huế' })

const { profile, displayName, isAdvisor } = useUser()
const { stats, isDemo } = useForest()
const { sorted, pending, mine } = useObservations()
const tide = ref(0.6)

const canopy = computed(() => area(stats.value.canopy))
const recent = computed(() => (profile.value.role === 'student' && mine.value.length ? mine.value : sorted.value).slice(0, 3))
const recentTitle = computed(() => (profile.value.role === 'student' && mine.value.length ? 'Ghi nhận của bạn' : 'Ghi nhận gần đây'))

// Phone layout: the same sections, ordered for what each role does most.
const ORDER: Record<Role, string[]> = {
  local: ['hero', 'actions', 'transect', 'comp', 'obs', 'kpis', 'ext'],
  student: ['hero', 'actions', 'kpis', 'comp', 'transect', 'obs', 'ext'],
  advisor: ['queue', 'hero', 'kpis', 'comp', 'transect', 'ext', 'obs', 'actions'],
}
const ord = (k: string) => ({ order: Math.max(0, ORDER[profile.value.role].indexOf(k)) })
</script>

<template>
  <div class="page home">
    <AppPageHeader :eyebrow="todayText()" title="Rú Chá">
      <template #subtitle>
        <span>Hương Phong · Huế</span>
        <NuxtLink v-if="isDemo" to="/about" class="demo-pill"><Info aria-hidden="true" :stroke-width="2.2" />Dữ liệu minh họa</NuxtLink>
      </template>
      <template #trailing>
        <NuxtLink to="/profile" class="me" :aria-label="`Hồ sơ của ${displayName}`">
          <AppAvatar :name="displayName" :role="profile.role" :size="40" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="grid">
      <!-- Forest model -->
      <NuxtLink to="/explore" class="hero card" :style="ord('hero')" aria-label="Mở bản đồ 3D khu rừng">
        <div class="hero-head">
          <span class="hero-kicker">Mô hình rừng</span>
          <span class="hero-open">Mở bản đồ 3D <ArrowUpRight aria-hidden="true" :stroke-width="2.2" /></span>
        </div>
        <div class="hero-art"><ForestDiorama :exaggeration="3" /></div>
        <div class="hero-foot">
          <span><strong>{{ num(stats.total) }}</strong> khóm cây · <strong>{{ stats.speciesCount }}</strong> loài</span>
          <span class="faint">Chiều cao phóng đại ×3</span>
        </div>
      </NuxtLink>

      <div class="side">
        <!-- Advisor: review queue -->
        <section v-if="isAdvisor" class="queue card" :style="ord('queue')" aria-labelledby="queue-h">
          <div class="queue-top">
            <div>
              <h2 id="queue-h" class="queue-title">Cần bạn xác minh</h2>
              <p class="muted queue-sub">Ghi nhận từ sinh viên và người dân</p>
            </div>
            <span class="queue-num">{{ pending.length }}</span>
          </div>
          <ul v-if="pending.length" class="queue-list" role="list">
            <ObsRow v-for="o in pending.slice(0, 2)" :key="o.id" :obs="o" show-author from="queue" />
          </ul>
          <UiButton to="/observations?tab=queue" variant="tinted" size="sm" :icon-right="ChevronRight" class="queue-btn">
            {{ pending.length ? 'Mở hàng chờ' : 'Không có gì cần xác minh' }}
          </UiButton>
        </section>

        <!-- Primary tasks -->
        <div class="actions" :style="ord('actions')">
          <NuxtLink to="/identify" class="action card">
            <span class="action-ic"><ScanSearch aria-hidden="true" :stroke-width="2" /></span>
            <span class="action-title">Nhận dạng cây</span>
            <span class="action-sub">Vài câu hỏi về lá, rễ, dạng cây</span>
          </NuxtLink>
          <NuxtLink to="/observations/new" class="action card">
            <span class="action-ic cam"><Camera aria-hidden="true" :stroke-width="2" /></span>
            <span class="action-title">{{ profile.role === 'local' ? 'Báo hiện trạng' : 'Ghi nhận mới' }}</span>
            <span class="action-sub">Ảnh, vị trí và ghi chú</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Key figures -->
      <section class="kpis" :style="ord('kpis')" aria-label="Số liệu chính">
        <UiStat label="Khóm cây" :value="num(stats.total)" />
        <UiStat label="Diện tích tán" :value="canopy.value" :unit="canopy.unit" />
        <UiStat label="Số loài" :value="String(stats.speciesCount)" note="danh mục tạm thời" />
        <UiStat label="Đã xác minh" :value="pct(stats.verifiedShare)">
          <template #note><VizMeter :value="stats.verified" :total="stats.total" :label="`${stats.verified} trên ${stats.total} khóm đã xác minh`" /></template>
        </UiStat>
      </section>

      <!-- Composition -->
      <section class="comp card pad" :style="ord('comp')" aria-labelledby="comp-h">
        <div class="section-head">
          <h2 id="comp-h">Thành phần loài</h2>
          <span class="muted t-footnote">theo diện tích tán</span>
        </div>
        <VizComposition link-rows />
      </section>

      <!-- Zonation & tide -->
      <section class="tr-card card pad" :style="ord('transect')" aria-labelledby="tr-h">
        <div class="section-head">
          <h2 id="tr-h">Mặt cắt và thủy triều</h2>
          <NuxtLink to="/explore?tide=1" class="link">Xem trên bản đồ</NuxtLink>
        </div>
        <p class="lede">Nền đất cao dần từ mép nước vào bờ, và mỗi loài chiếm một dải riêng. Kéo mực nước để xem khóm nào ngập trước.</p>
        <VizTransect v-model:tide="tide" :height="230" />
      </section>

      <!-- Recent observations -->
      <section class="obs card" :style="ord('obs')" aria-labelledby="obs-h">
        <div class="section-head pad-x">
          <h2 id="obs-h">{{ recentTitle }}</h2>
          <NuxtLink to="/observations" class="link">Xem tất cả</NuxtLink>
        </div>
        <ul role="list" class="obs-list">
          <ObsRow v-for="o in recent" :key="o.id" :obs="o" show-author />
        </ul>
      </section>

      <!-- Extent over time -->
      <section class="ext card pad" :style="ord('ext')" aria-labelledby="ext-h">
        <div class="section-head">
          <h2 id="ext-h">Diện tích rừng qua các năm</h2>
          <UiBadge size="sm">Sắp có</UiBadge>
        </div>
        <VizExtentPending />
      </section>
    </div>

    <NuxtLink to="/about" class="about-note">
      <Info aria-hidden="true" :stroke-width="2" />
      <span>Số liệu khu rừng hiện là <strong>dữ liệu minh họa</strong>, có cùng cấu trúc với dữ liệu khảo sát thật. Xem nguồn và cách đọc.</span>
      <ChevronRight aria-hidden="true" :stroke-width="2.2" class="chev" />
    </NuxtLink>
  </div>
</template>

<style scoped>
.demo-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--warn-tint);
  color: var(--warn);
  font: 600 12.5px/1 var(--font-sans);
  text-decoration: none !important;
}
.demo-pill svg { width: 13px; height: 13px; }
.me { display: block; border-radius: 50%; }

.grid { display: flex; flex-direction: column; gap: 16px; }
.side { display: contents; }
.card { min-width: 0; }
.pad { padding: 18px 18px 16px; }
.pad-x { padding: 18px 18px 0; }
.lede { margin: -4px 0 14px; font: var(--t-subhead); color: var(--label-2); text-wrap: pretty; }

/* Hero */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 14px;
  color: var(--label);
  text-decoration: none !important;
  overflow: hidden;
  background:
    radial-gradient(70% 60% at 50% 55%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 75%),
    var(--surface);
  transition: transform var(--dur-2) var(--ease-out), box-shadow var(--dur-2);
}
.hero:hover { box-shadow: var(--shadow-md), inset 0 0 0 0.5px var(--separator); }
.hero:active { transform: scale(0.995); }
.hero-head { display: flex; justify-content: space-between; align-items: center; }
.hero-kicker { font: 600 13px/1.3 var(--font-sans); color: var(--label-2); }
.hero-open { display: inline-flex; align-items: center; gap: 4px; font: 600 14px/1 var(--font-sans); color: var(--accent-text); }
.hero-open svg { width: 16px; height: 16px; }
.hero-art { margin: 6px -6px 2px; }
.hero-foot { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; font: var(--t-subhead); }
.hero-foot strong { font-weight: 700; }
.hero-foot .faint { font: var(--t-caption); }

/* Advisor queue */
.queue { padding: 18px 0 14px; }
.queue-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 0 18px; }
.queue-title { font: var(--t-title3); }
.queue-sub { font: var(--t-footnote); margin-top: 2px; }
.queue-num { font: 700 34px/1 var(--font-sans); letter-spacing: -0.03em; color: var(--warn); }
.queue-list { margin: 8px 0 4px; }
.queue-btn { margin: 4px 18px 0; }

/* Actions */
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.action {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  color: var(--label);
  text-decoration: none !important;
  transition: transform var(--dur-1) var(--ease-out), box-shadow var(--dur-2);
}
.action:hover { box-shadow: var(--shadow-md), inset 0 0 0 0.5px var(--separator); }
.action:active { transform: scale(0.98); }
.action-ic { display: grid; place-items: center; width: 36px; height: 36px; margin-bottom: 8px; border-radius: 11px; background: var(--accent); color: var(--accent-ink); }
.action-ic.cam { background: var(--water); }
.action-ic svg { width: 20px; height: 20px; }
.action-title { font: var(--t-headline); }
.action-sub { font: var(--t-footnote); color: var(--label-2); }

/* KPIs */
.kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Lists */
.obs { padding-bottom: 8px; }
.obs-list { margin-top: 4px; }

.about-note {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  color: var(--label-2);
  font: var(--t-footnote);
  text-decoration: none !important;
}
.about-note > svg { width: 18px; height: 18px; flex: none; }
.about-note .chev { margin-left: auto; color: var(--label-3); }
.about-note strong { color: var(--label); font-weight: 600; }

/* Desktop composition */
@media (min-width: 1024px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-areas:
      'hero hero hero hero hero hero hero hero side side side side'
      'kpis kpis kpis kpis kpis kpis kpis kpis kpis kpis kpis kpis'
      'comp comp comp comp comp tran tran tran tran tran tran tran'
      'obs  obs  obs  obs  obs  obs  obs  ext  ext  ext  ext  ext';
    gap: 20px;
    align-items: start;
  }
  .grid > * { order: 0 !important; }
  .hero { grid-area: hero; align-self: stretch; padding: 20px 22px 18px; }
  .hero-art { flex: 1; display: grid; place-items: center; margin: 10px 0; }
  .side { grid-area: side; display: flex; flex-direction: column; gap: 16px; align-self: stretch; }
  .side .actions { flex: 1; }
  .side:not(:has(.queue)) .actions { grid-template-columns: 1fr; }
  .side:not(:has(.queue)) .action { justify-content: flex-end; padding: 20px; }
  .side:not(:has(.queue)) .action-ic { width: 44px; height: 44px; border-radius: 13px; margin-bottom: auto; }
  .kpis { grid-area: kpis; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .me { display: none; }
  .comp { grid-area: comp; }
  .tr-card { grid-area: tran; }
  .obs { grid-area: obs; }
  .ext { grid-area: ext; }
}
</style>
