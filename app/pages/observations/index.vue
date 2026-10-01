<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BadgeCheck, Camera, Plus, Users } from '@lucide/vue'
import type { Observation } from '~/composables/useObservations'

useHead({ title: 'Ghi nhận · Rừng ngập mặn Huế' })
const route = useRoute()
const router = useRouter()
const { isAdvisor } = useUser()
const { sorted, pending, mine } = useObservations()

type Tab = 'all' | 'mine' | 'queue'
const initial = (): Tab => {
  const t = route.query.tab
  if (t === 'queue' && isAdvisor.value) return 'queue'
  if (t === 'mine') return 'mine'
  return 'all'
}
const tab = ref<Tab>(initial())
watch(tab, (t) => router.replace({ query: t === 'all' ? {} : { tab: t } }))

const options = computed(() => [
  { value: 'all' as Tab, label: 'Cộng đồng' },
  { value: 'mine' as Tab, label: 'Của tôi' },
  ...(isAdvisor.value ? [{ value: 'queue' as Tab, label: 'Chờ xác minh', badge: pending.value.length }] : []),
])
const list = computed(() => (tab.value === 'mine' ? mine.value : tab.value === 'queue' ? pending.value : sorted.value))
const groups = computed(() => {
  const g = new Map<string, Observation[]>()
  for (const o of list.value) {
    const k = dayBucket(o.created_at)
    if (!g.has(k)) g.set(k, [])
    g.get(k)!.push(o)
  }
  return [...g.entries()]
})
const summary = computed(() => {
  const l = list.value
  return { pending: l.filter((o) => o.status === 'pending').length, verified: l.filter((o) => o.status === 'verified').length, needs: l.filter((o) => o.status === 'needs_info').length }
})
</script>

<template>
  <div class="page">
    <AppPageHeader title="Ghi nhận" subtitle="Quan sát từ sinh viên và người dân, được giảng viên xác minh">
      <template #trailing>
        <UiIconButton :icon="Plus" label="Ghi nhận mới" variant="filled" to="/observations/new" />
      </template>
      <UiSegmented v-model="tab" :options="options" label="Chọn danh sách" class="seg" />
    </AppPageHeader>

    <p v-if="list.length && tab !== 'queue'" class="summary">
      <span><i class="d warn" />{{ summary.pending }} chờ xác minh</span>
      <span><i class="d ok" />{{ summary.verified }} đã xác minh</span>
      <span v-if="summary.needs"><i class="d info" />{{ summary.needs }} cần bổ sung</span>
    </p>

    <div v-if="list.length" class="groups">
      <section v-for="[label, items] in groups" :key="label" :aria-label="label">
        <h2 class="g-title">{{ label }}</h2>
        <ul class="card list" role="list">
          <ObsRow v-for="o in items" :key="o.id" :obs="o" :show-author="tab !== 'mine'" :from="tab === 'queue' ? 'queue' : undefined" />
        </ul>
      </section>
    </div>

    <div v-else class="card">
      <UiEmpty v-if="tab === 'mine'" :icon="Camera" title="Bạn chưa có ghi nhận nào" text="Ghi nhận đầu tiên của bạn giúp giảng viên kiểm chứng dữ liệu khu rừng.">
        <UiButton to="/observations/new" :icon="Plus">Ghi nhận mới</UiButton>
      </UiEmpty>
      <UiEmpty v-else-if="tab === 'queue'" :icon="BadgeCheck" title="Không còn gì chờ xác minh" text="Bạn đã xem hết. Ghi nhận mới sẽ xuất hiện ở đây." />
      <UiEmpty v-else :icon="Users" title="Chưa có ghi nhận" text="Hãy là người đầu tiên ghi nhận về khu rừng." />
    </div>
  </div>
</template>

<style scoped>
.seg { margin-top: 18px; max-width: 520px; }
.summary { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: -4px 4px 18px; font: var(--t-footnote); color: var(--label-2); }
.summary span { display: inline-flex; align-items: center; gap: 6px; }
.d { width: 8px; height: 8px; border-radius: 50%; }
.d.warn { background: var(--warn); }
.d.ok { background: var(--ok); }
.d.info { background: var(--info); }
.groups { display: flex; flex-direction: column; gap: 22px; }
.g-title { margin: 0 0 8px 4px; font: 600 14px/1.3 var(--font-sans); color: var(--label-2); }
.list { overflow: hidden; }
@media (min-width: 1024px) { .groups, .summary { max-width: 860px; } }
</style>
