<script setup lang="ts">
// Provenance and method: where every dataset comes from, how trustworthy it
// is today, and what the app can and cannot say. Linked from every demo badge.
import { computed } from 'vue'
import { Camera, Layers, Leaf, Map as MapIcon, Satellite, TreeDeciduous } from '@lucide/vue'

useHead({ title: 'Về dữ liệu · Rừng ngập mặn Huế' })
const { stats, isDemo, isPlaceholderContext } = useForest()

const SOURCES = computed(() => [
  {
    icon: TreeDeciduous, title: 'Khóm cây', state: isDemo.value ? 'Minh họa' : 'Khảo sát', tone: isDemo.value ? 'warn' : 'ok',
    text: isDemo.value
      ? `${stats.value.total} khóm được tạo tự động, theo đúng cấu trúc dữ liệu vegetation_patches, để thử giao diện. Sẽ được thay bằng ranh giới khoanh vẽ trên ảnh flycam (UAV) hoặc điểm GPS thực địa của giảng viên.`
      : 'Ranh giới khoanh vẽ từ ảnh flycam và điểm thực địa, có người xác minh.',
  },
  {
    icon: MapIcon, title: 'Nền bản đồ', state: isPlaceholderContext.value ? 'Minh họa' : 'OpenStreetMap', tone: isPlaceholderContext.value ? 'warn' : 'ok',
    text: isPlaceholderContext.value
      ? 'Đường bờ, lạch triều, ao nuôi và làng được vẽ tay để làm nền. Chạy npm run data:context để thay bằng dữ liệu OpenStreetMap thật.'
      : '© OpenStreetMap contributors, giấy phép ODbL.',
  },
  { icon: Satellite, title: 'Ảnh vệ tinh', state: 'Chỉ tham chiếu', tone: 'neutral', text: 'Esri World Imagery (© Esri, Maxar, Earthstar Geographics), hiển thị đen trắng để đối chiếu. Không trích xuất hay dùng làm dữ liệu phân tích.' },
  { icon: Leaf, title: 'Thông tin loài và khóa định loại', state: 'Bản nháp', tone: 'warn', text: 'Soạn từ mô tả hình thái phổ biến, đang chờ giảng viên xác nhận và bổ sung tài liệu khoa học, ảnh thực địa.' },
  { icon: Layers, title: 'Diện tích rừng qua các năm', state: 'Chưa có', tone: 'neutral', text: 'Phân loại ảnh Sentinel-2 (10 m) bằng Random Forest trên Google Earth Engine, xử lý ngoài ứng dụng. Đánh giá bằng 100–200 điểm kiểm chứng, so sánh với Global Mangrove Watch.' },
  { icon: Camera, title: 'Ghi nhận', state: 'Trên thiết bị', tone: 'neutral', text: 'Ở bản thử nghiệm, ghi nhận và ảnh được lưu trên thiết bị của bạn. Bản chính thức sẽ đồng bộ về máy chủ để giảng viên xác minh.' },
] as const)
</script>

<template>
  <div class="page about">
    <AppPageHeader title="Về dữ liệu" subtitle="Nguồn gốc, độ tin cậy và giới hạn của từng thông tin" back="/" back-label="Quay lại" />

    <section class="intro card">
      <p>Ứng dụng luôn ghi rõ thông tin nào là <strong>đo đạc thật</strong>, thông tin nào là <strong>minh họa</strong>, và thông tin nào <strong>đã được giảng viên xác minh</strong>. Không có số liệu nào được trình bày như thật khi chưa đo đạc.</p>
    </section>

    <h2 class="h2">Nguồn dữ liệu</h2>
    <ul class="sources">
      <li v-for="s in SOURCES" :key="s.title" class="src card">
        <span class="src-ic"><component :is="s.icon" aria-hidden="true" :stroke-width="2" /></span>
        <div>
          <div class="src-head">
            <h3>{{ s.title }}</h3>
            <UiBadge :tone="s.tone" size="sm">{{ s.state }}</UiBadge>
          </div>
          <p>{{ s.text }}</p>
        </div>
      </li>
    </ul>

    <h2 class="h2">Cách đọc mô hình</h2>
    <ul class="read card">
      <li><span class="sw line" aria-hidden="true" /><div><strong>Viền liền</strong> quanh khóm cây: đã được giảng viên xác minh.</div></li>
      <li><span class="sw dash" aria-hidden="true" /><div><strong>Viền đứt</strong>: chưa xác minh. Độ tin cậy (%) đi kèm trong phần chi tiết.</div></li>
      <li><span class="sw ex" aria-hidden="true">×2</span><div><strong>Phóng đại chiều cao</strong>: khi bật, ứng dụng luôn hiện nhãn cảnh báo. Mặc định là kích thước thật.</div></li>
      <li><span class="sw tide" aria-hidden="true" /><div><strong>Mô phỏng thủy triều</strong>: so mực nước với cao độ nền của từng khóm. Chưa tính sóng, gió, dòng chảy và địa hình chi tiết, nên chỉ dùng để hiểu xu hướng.</div></li>
    </ul>

    <h2 class="h2">Giới hạn</h2>
    <div class="limits card">
      <p>Ảnh vệ tinh miễn phí có độ phân giải 10–30 m, mỗi điểm ảnh chứa nhiều cây thuộc nhiều loài. Vì vậy vệ tinh chỉ cho biết <strong>đâu là rừng ngập mặn</strong>, không cho biết <strong>từng cây là loài gì</strong>. Bản đồ loài cần ảnh flycam hoặc khảo sát thực địa.</p>
      <p>Diện tích rừng ở Rú Chá nhỏ và phân mảnh; các con số diện tích sẽ được kiểm chứng trước khi công bố.</p>
    </div>

    <h2 class="h2">Mã nguồn mở được sử dụng</h2>
    <p class="credits">MapLibre GL JS (BSD-3) · Inter (SIL OFL) · Lucide icons (ISC) · Nuxt, Vue (MIT)</p>
  </div>
</template>

<style scoped>
.about { max-width: 820px; }
.intro { padding: 18px 20px; font: var(--t-callout); text-wrap: pretty; }
.h2 { font: var(--t-title3); margin: 28px 0 12px; }
.sources { display: flex; flex-direction: column; gap: 10px; }
.src { display: grid; grid-template-columns: 40px 1fr; gap: 14px; padding: 16px; align-items: start; }
.src-ic { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: var(--surface-2); color: var(--label-2); }
.src-ic svg { width: 20px; height: 20px; }
.src-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 4px; }
.src-head h3 { font: var(--t-headline); }
.src p { font: var(--t-subhead); color: var(--label-2); text-wrap: pretty; }
.read { display: flex; flex-direction: column; gap: 14px; padding: 18px; }
.read li { display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: start; font: var(--t-subhead); }
.read strong { font-weight: 600; }
.sw { width: 30px; height: 20px; border-radius: 5px; display: grid; place-items: center; margin-top: 1px; }
.sw.line { border: 2px solid var(--patch-outline); }
.sw.dash { border: 2px dashed var(--patch-outline); }
.sw.ex { background: var(--warn-tint); color: var(--warn); font: 700 11px/1 var(--font-sans); }
.sw.tide { background: color-mix(in srgb, var(--water) 35%, transparent); border-top: 2px solid var(--water); }
.limits { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; font: var(--t-subhead); text-wrap: pretty; }
.credits { font: var(--t-footnote); color: var(--label-2); }
</style>
