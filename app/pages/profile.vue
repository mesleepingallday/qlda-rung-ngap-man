<script setup lang="ts">
import { computed, ref } from 'vue'
import { BadgeCheck, BookOpen, Download, FileSpreadsheet, GraduationCap, House, Info, MonitorSmartphone, Moon, RotateCcw, Share, Sparkles, Trash2, UserRound } from '@lucide/vue'
import { ROLES, type Role } from '~/composables/useUser'
import type { ThemePref } from '~/composables/useTheme'

useHead({ title: 'Hồ sơ · Rừng ngập mặn Huế' })
const router = useRouter()
const { profile, displayName, setRole } = useUser()
const { mine, items } = useObservations()
const { pref, set } = useTheme()
const { patches, patchCollection, isDemo } = useForest()
const { installed, canPrompt, isIOS, prompt } = useInstall()
const { show } = useToast()

const verifiedMine = computed(() => mine.value.filter((o) => o.status === 'verified').length)
const reviewsByMe = computed(() => items.value.flatMap((o) => o.reviews).filter((r) => r.by === displayName.value).length)

const themeOptions = [{ value: 'system', label: 'Tự động' }, { value: 'light', label: 'Sáng' }, { value: 'dark', label: 'Tối' }] as const
const theme = computed({ get: () => pref.value, set: (v: ThemePref) => set(v) })

const roleOpen = ref(false)
const ROLE_ICONS: Record<Role, typeof House> = { local: House, student: GraduationCap, advisor: BadgeCheck }
function chooseRole(r: Role) {
  setRole(r)
  roleOpen.value = false
  show(`Đã chuyển sang vai trò ${ROLES[r].short}`, { tone: 'ok' })
}

const installHelp = ref(false)
async function install() {
  if (canPrompt.value) {
    if (await prompt()) show('Đã cài đặt ứng dụng', { tone: 'ok' })
  } else installHelp.value = true
}

const resetOpen = ref(false)
const baseURL = useRuntimeConfig().app.baseURL || '/'
function resetAll() {
  clearPersisted()
  resetOpen.value = false
  window.location.assign(baseURL + 'welcome')
}
</script>

<template>
  <div class="page">
    <AppPageHeader title="Hồ sơ" back="/" back-label="Tổng quan" />

    <section class="me card">
      <AppAvatar :name="displayName" :role="profile.role" :size="64" />
      <div class="me-text">
        <h2 class="t-title2">{{ displayName }}</h2>
        <p class="muted">{{ ROLES[profile.role].label }}<template v-if="profile.classCode"> · Lớp {{ profile.classCode }}</template><template v-if="profile.org"> · {{ profile.org }}</template></p>
      </div>
    </section>

    <div class="stats">
      <UiStat label="Ghi nhận đã gửi" :value="String(mine.length)" />
      <UiStat label="Được xác minh" :value="String(verifiedMine)" />
      <UiStat v-if="profile.role === 'advisor'" label="Bạn đã xem xét" :value="String(reviewsByMe)" />
    </div>

    <div class="groups">
      <UiList header="Giao diện">
        <li class="seg-row">
          <Moon aria-hidden="true" :stroke-width="2" class="seg-ic" />
          <UiSegmented v-model="theme" :options="[...themeOptions]" label="Chế độ màu" class="seg" />
        </li>
      </UiList>

      <UiList header="Vai trò" footer="Bản thử nghiệm cho phép đổi vai trò để xem trải nghiệm của người dân, sinh viên và giảng viên.">
        <UiListRow :icon="UserRound" tint="#5b6b7a" title="Vai trò hiện tại" :value="ROLES[profile.role].short" button chevron @click="roleOpen = true" />
      </UiList>

      <UiList header="Ứng dụng">
        <UiListRow v-if="!installed" :icon="MonitorSmartphone" tint="#2f7fb0" title="Cài lên màn hình chính" subtitle="Mở nhanh như ứng dụng, dùng được khi sóng yếu" button chevron @click="install" />
        <UiListRow v-else :icon="MonitorSmartphone" tint="#2f7fb0" title="Đã cài trên thiết bị này" />
        <UiListRow :icon="Sparkles" tint="#8a5cc4" title="Xem lại giới thiệu" to="/welcome" />
      </UiList>

      <UiList header="Dữ liệu" :footer="isDemo ? 'Tệp tải về chứa dữ liệu minh họa, đã đánh dấu source = demo.' : undefined">
        <UiListRow :icon="BookOpen" tint="#0d6b4f" title="Về dữ liệu và phương pháp" to="/about" />
        <UiListRow :icon="Download" tint="#6b7280" title="Tải dữ liệu khóm cây (GeoJSON)" subtitle="Mở được bằng QGIS" button @click="exportGeoJSON(patchCollection)" />
        <UiListRow :icon="FileSpreadsheet" tint="#16794f" title="Tải bảng số liệu (CSV)" subtitle="Mở được bằng Excel, Google Sheets" button @click="exportCSV(patches)" />
      </UiList>

      <UiList>
        <UiListRow :icon="Trash2" tint="#b8322a" title="Xóa dữ liệu trên thiết bị" destructive button @click="resetOpen = true" />
      </UiList>
    </div>

    <p class="version"><Info aria-hidden="true" :stroke-width="2" />Rừng ngập mặn Huế · bản thử nghiệm 0.2 · Dự án nghiên cứu rừng ngập mặn Rú Chá</p>

    <UiSheet v-model:open="roleOpen" title="Đổi vai trò">
      <div class="roles">
        <button v-for="r in (['local', 'student', 'advisor'] as Role[])" :key="r" type="button" class="role" :aria-pressed="profile.role === r" @click="chooseRole(r)">
          <span class="role-ic"><component :is="ROLE_ICONS[r]" aria-hidden="true" :stroke-width="2" /></span>
          <span class="role-text"><span class="role-title">{{ ROLES[r].label }}</span><span class="role-desc">{{ ROLES[r].description }}</span></span>
        </button>
      </div>
    </UiSheet>

    <UiSheet v-model:open="installHelp" title="Cài lên màn hình chính">
      <ol class="steps">
        <template v-if="isIOS">
          <li><Share aria-hidden="true" :stroke-width="2" />Chạm nút <strong>Chia sẻ</strong> ở thanh dưới của Safari.</li>
          <li><MonitorSmartphone aria-hidden="true" :stroke-width="2" />Chọn <strong>Thêm vào MH chính</strong>, rồi chạm <strong>Thêm</strong>.</li>
        </template>
        <template v-else>
          <li><MonitorSmartphone aria-hidden="true" :stroke-width="2" />Mở menu trình duyệt (dấu ⋮).</li>
          <li><Download aria-hidden="true" :stroke-width="2" />Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong>.</li>
        </template>
      </ol>
    </UiSheet>

    <UiSheet v-model:open="resetOpen" title="Xóa dữ liệu trên thiết bị?">
      <p class="muted">Hồ sơ, ghi nhận của bạn và các tùy chọn sẽ bị xóa. Ứng dụng sẽ quay lại màn hình giới thiệu.</p>
      <template #footer>
        <div class="confirm-row">
          <UiButton variant="gray" block @click="resetOpen = false">Hủy</UiButton>
          <UiButton variant="danger" block :icon="RotateCcw" @click="resetAll">Xóa và bắt đầu lại</UiButton>
        </div>
      </template>
    </UiSheet>
  </div>
</template>

<style scoped>
.me { display: flex; align-items: center; gap: 16px; padding: 18px; }
.me-text .muted { font: var(--t-subhead); margin-top: 2px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 16px 0 24px; }
.groups { display: flex; flex-direction: column; gap: 24px; max-width: 720px; }
.seg-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
.seg-ic { width: 20px; height: 20px; color: var(--label-2); flex: none; }
.seg { flex: 1; }
.version { display: flex; align-items: center; gap: 8px; margin: 28px 4px 0; font: var(--t-caption); color: var(--label-2); }
.version svg { width: 14px; height: 14px; flex: none; }
.roles { display: flex; flex-direction: column; gap: 10px; }
.role { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: center; padding: 14px; border-radius: var(--r-lg); background: var(--surface-2); text-align: left; }
.role[aria-pressed='true'] { background: var(--accent-tint); box-shadow: inset 0 0 0 2px var(--accent); }
.role-ic { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: var(--surface); }
.role-ic svg { width: 22px; height: 22px; }
.role-text { display: flex; flex-direction: column; gap: 2px; }
.role-title { font: var(--t-headline); }
.role-desc { font: var(--t-footnote); color: var(--label-2); }
.steps { display: flex; flex-direction: column; gap: 14px; }
.steps li { display: flex; gap: 12px; align-items: flex-start; font: var(--t-callout); }
.steps svg { width: 22px; height: 22px; flex: none; color: var(--accent-text); }
.confirm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
</style>
