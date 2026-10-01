<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Camera, Check, ChevronRight, CircleHelp, ListFilter, RotateCcw, TriangleAlert, X } from '@lucide/vue'
import { SPECIES, SPECIES_BY_ZONE, type SpeciesId } from '~/data/species'
import { KEY } from '~/data/key'

definePageMeta({ layout: 'bare' })
useHead({ title: 'Nhận dạng cây · Rừng ngập mặn Huế' })

const router = useRouter()
const k = useKey()
const { answers, answered, candidates, closest, next, done, confidence, canConfirm, confirming } = k
const chosen = ref<string | null>(null)
const pickerOpen = ref(false)
const manual = ref<string | null>(null)
const heading = ref<HTMLElement | null>(null)

const question = computed(() => (manual.value ? k.KEY_BY_ID[manual.value] : next.value) ?? null)
const showResult = computed(() => !manual.value && (done.value || candidates.value.length === 0))
const result = computed<SpeciesId | null>(() => (candidates.value.length === 1 ? candidates.value[0]! : null))
const step = computed(() => answered.value.length + Object.values(answers.value).filter((a) => a === 'skip').length + 1)

function pick(optionId: string) {
  if (!question.value) return
  chosen.value = optionId
  const qid = question.value.id
  setTimeout(() => {
    k.answer(qid, optionId)
    chosen.value = null
    manual.value = null
  }, 220)
}
function skip() {
  if (!question.value) return
  k.answer(question.value.id, 'skip')
  manual.value = null
}
function edit(qid: string) {
  k.clear(qid)
  manual.value = qid
}
function close() {
  if (window.history.state?.back) router.back()
  else router.push('/species')
}
function optionLabel(qid: string, a: string) {
  return k.KEY_BY_ID[qid]?.options.find((o) => o.id === a)?.label ?? ''
}
watch([question, showResult], async () => { await nextTick(); heading.value?.focus({ preventScroll: true }) })

const matched = computed(() => {
  if (!result.value) return []
  return answered.value.map((q) => ({ q: q.short, a: optionLabel(q.id, answers.value[q.id] as string) }))
})
</script>

<template>
  <div class="identify">
    <header class="bar">
      <UiIconButton :icon="X" label="Đóng" variant="gray" @click="close" />
      <div class="bar-title">
        <p class="t-headline">Nhận dạng cây</p>
        <p class="t-caption muted">Khóa định loại · 4 loài tại Rú Chá</p>
      </div>
      <UiButton v-if="Object.keys(answers).length" variant="plain" size="sm" :icon="RotateCcw" @click="k.reset(); manual = null">Làm lại</UiButton>
      <span v-else class="bar-spacer" />
    </header>

    <main class="main">
      <!-- Candidates: always visible, so every answer's effect is obvious -->
      <section class="cands" aria-live="polite" :aria-label="`Còn ${candidates.length} loài phù hợp`">
        <ul class="cand-row">
          <li v-for="id in SPECIES_BY_ZONE" :key="id" :class="{ out: !candidates.includes(id) }">
            <SpeciesThumb :id="id" :size="52" shape="circle" decorative />
            <span>{{ SPECIES[id].name }}</span>
          </li>
        </ul>
        <p class="cand-text">
          <template v-if="candidates.length === 0">Không có loài nào khớp hoàn toàn</template>
          <template v-else-if="candidates.length === 1">Có thể là <strong>{{ SPECIES[candidates[0]!].name }}</strong></template>
          <template v-else>Còn <strong>{{ candidates.length }}</strong> loài phù hợp</template>
        </p>
      </section>

      <!-- Answers so far: tap to change -->
      <ul v-if="Object.keys(answers).length" class="answers" aria-label="Câu trả lời của bạn">
        <li v-for="q in KEY.filter((x) => x.id in answers)" :key="q.id">
          <button type="button" class="answer-chip" :class="{ skipped: answers[q.id] === 'skip' }" :aria-label="`Sửa câu trả lời: ${q.short}`" @click="edit(q.id)">
            <span class="ac-q">{{ q.short }}</span>
            <span class="ac-a">{{ answers[q.id] === 'skip' ? 'Không chắc' : optionLabel(q.id, answers[q.id]!) }}</span>
          </button>
        </li>
      </ul>

      <Transition name="swap" mode="out-in">
        <!-- Question -->
        <section v-if="!showResult && question" :key="question.id" class="question">
          <p class="q-step">Câu {{ step }}<template v-if="question.seasonal"> · nếu có</template></p>
          <h1 ref="heading" tabindex="-1" class="t-title1 q-title">{{ question.title }}</h1>
          <p v-if="question.help" class="q-help">{{ question.help }}</p>
          <p v-if="question.warning" class="q-warn"><TriangleAlert aria-hidden="true" :stroke-width="2.2" />{{ question.warning }}</p>

          <div class="options" role="radiogroup" :aria-label="question.title" :class="`n${question.options.length}`">
            <button
              v-for="o in question.options"
              :key="o.id"
              type="button"
              role="radio"
              class="option"
              :aria-checked="chosen === o.id"
              @click="pick(o.id)"
            >
              <span class="o-art"><CharacterArt :art="o.art" /></span>
              <span class="o-label">{{ o.label }}</span>
              <span v-if="o.hint" class="o-hint">{{ o.hint }}</span>
              <span class="o-check" aria-hidden="true"><Check :stroke-width="3" /></span>
            </button>
          </div>

          <div class="q-foot">
            <UiButton variant="gray" size="md" :icon="CircleHelp" @click="skip">Không chắc, bỏ qua</UiButton>
            <UiButton variant="plain" size="md" :icon="ListFilter" @click="pickerOpen = true">Câu hỏi khác</UiButton>
          </div>
        </section>

        <!-- Result -->
        <section v-else-if="result" key="result" class="result">
          <div class="res-card card" :style="{ '--c': `var(--species-${result})` }">
            <SpeciesThumb :id="result" :size="88" />
            <p class="res-kicker">Có thể là</p>
            <h1 ref="heading" tabindex="-1" class="t-large">{{ SPECIES[result].name }}</h1>
            <p class="res-sci">{{ SPECIES[result].scientific }} · {{ SPECIES[result].familyVi }}</p>
            <UiBadge v-if="confidence" :tone="confidence.level >= 2 ? 'ok' : 'neutral'" size="md">{{ confidence.label }} · khớp {{ answered.length }}/{{ answered.length }} đặc điểm</UiBadge>
            <ul class="evidence">
              <li v-for="m in matched" :key="m.q"><Check aria-hidden="true" :stroke-width="2.6" /><span class="ev-q">{{ m.q }}</span><span class="ev-a">{{ m.a }}</span></li>
            </ul>
            <p v-if="SPECIES[result].safety" class="res-safety" :class="SPECIES[result].safety!.level"><TriangleAlert aria-hidden="true" :stroke-width="2.2" />{{ SPECIES[result].safety!.text }}</p>
          </div>

          <div class="res-actions">
            <UiButton v-if="canConfirm" size="lg" variant="tinted" block :icon-right="ChevronRight" @click="confirming = true">Kiểm tra thêm để chắc chắn hơn</UiButton>
            <UiButton :to="`/observations/new?species=${result}`" size="lg" block :icon="Camera">Ghi nhận cây này</UiButton>
            <UiButton :to="`/species/${result}`" size="lg" variant="gray" block>Xem thông tin loài</UiButton>
          </div>
          <p class="disclaimer">Kết quả là gợi ý từ khóa định loại tạm thời gồm 4 loài, chưa được giảng viên duyệt. Nếu cây không giống loài nào, hãy gửi ghi nhận để giảng viên xác định.</p>
        </section>

        <!-- No match -->
        <section v-else key="none" class="result">
          <div class="res-card card none">
            <span class="none-ic"><CircleHelp aria-hidden="true" :stroke-width="1.8" /></span>
            <h1 ref="heading" tabindex="-1" class="t-title1">Chưa khớp loài nào</h1>
            <p class="muted">Các câu trả lời mâu thuẫn với nhau, hoặc cây không thuộc danh mục 4 loài. Gần đúng nhất:</p>
            <ul class="closest">
              <li v-for="id in closest" :key="id">
                <NuxtLink :to="`/species/${id}`" class="closest-row">
                  <SpeciesThumb :id="id" :size="40" decorative />
                  <span><strong>{{ SPECIES[id].name }}</strong><br><span class="sci muted">{{ SPECIES[id].scientific }}</span></span>
                  <ChevronRight aria-hidden="true" :stroke-width="2.2" />
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="res-actions">
            <UiButton to="/observations/new" size="lg" block :icon="Camera">Gửi ghi nhận để giảng viên xác định</UiButton>
            <UiButton size="lg" variant="gray" block :icon="RotateCcw" @click="k.reset()">Làm lại từ đầu</UiButton>
          </div>
        </section>
      </Transition>
    </main>

    <UiSheet v-model:open="pickerOpen" title="Chọn câu hỏi">
      <p class="muted picker-intro">Trả lời theo bất kỳ thứ tự nào, bắt đầu từ đặc điểm bạn nhìn rõ nhất.</p>
      <UiList>
        <UiListRow
          v-for="q in KEY"
          :key="q.id"
          :title="q.title"
          :subtitle="q.id in answers ? `Đã trả lời: ${answers[q.id] === 'skip' ? 'Không chắc' : optionLabel(q.id, answers[q.id]!)}` : (q.seasonal ? 'Chỉ khi cây đang có hoa hoặc quả' : undefined)"
          button
          chevron
          @click="edit(q.id); pickerOpen = false"
        />
      </UiList>
    </UiSheet>
  </div>
</template>

<style scoped>
.identify { min-height: 100dvh; background: var(--bg); }
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: calc(var(--safe-top) + 10px) 16px 10px;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}
.bar-title { text-align: center; min-width: 0; }
.bar-spacer { width: 40px; }
.main { width: 100%; max-width: 720px; margin: 0 auto; padding: 8px 20px calc(var(--safe-bottom) + 40px); }

.cands { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px 0 8px; }
.cand-row { display: flex; gap: 14px; justify-content: center; }
.cand-row li { display: flex; flex-direction: column; align-items: center; gap: 6px; font: 600 12px/1.2 var(--font-sans); transition: opacity var(--dur-3), filter var(--dur-3), transform var(--dur-3) var(--ease-spring); }
.cand-row li.out { opacity: 0.28; filter: grayscale(1); transform: scale(0.88); }
.cand-text { font: var(--t-callout); color: var(--label-2); }
.cand-text strong { color: var(--label); }

.answers { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 6px 0 4px; }
.answer-chip { display: inline-flex; gap: 6px; align-items: baseline; height: 32px; padding: 0 12px; border-radius: 999px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--separator-strong); font: 13px/32px var(--font-sans); }
.answer-chip:hover { box-shadow: inset 0 0 0 1.5px var(--accent); }
.ac-q { color: var(--label-2); }
.ac-a { font-weight: 600; }
.skipped .ac-a { font-weight: 400; color: var(--label-2); }

.question { padding-top: 18px; }
.q-step { font: 600 13px/1.3 var(--font-sans); color: var(--accent-text); }
.q-title { margin-top: 4px; text-wrap: balance; }
.q-title:focus, .result h1:focus { outline: none; }
.q-help { margin-top: 6px; font: var(--t-callout); color: var(--label-2); }
.q-warn { display: flex; gap: 10px; margin-top: 12px; padding: 12px 14px; border-radius: var(--r-md); background: var(--warn-tint); color: var(--warn); font: 500 14px/1.45 var(--font-sans); }
.q-warn svg { width: 18px; height: 18px; flex: none; margin-top: 1px; }

.options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.options.n3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 18px 12px 16px;
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm), inset 0 0 0 1px var(--separator);
  text-align: center;
  transition: box-shadow var(--dur-2), transform var(--dur-1) var(--ease-out), background-color var(--dur-2);
}
.option:hover { box-shadow: var(--shadow-md), inset 0 0 0 1.5px var(--accent); }
.option:active { transform: scale(0.97); }
.option[aria-checked='true'] { background: var(--accent-tint); box-shadow: inset 0 0 0 2px var(--accent); }
.o-art { width: 72px; height: 72px; color: var(--accent-text); margin-bottom: 6px; }
.o-label { font: var(--t-headline); font-size: 16px; }
.o-hint { font: var(--t-footnote); color: var(--label-2); }
.o-check { position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; background: var(--accent); color: var(--accent-ink); opacity: 0; transform: scale(0.6); transition: all var(--dur-2) var(--ease-spring); }
.o-check svg { width: 13px; height: 13px; }
.option[aria-checked='true'] .o-check { opacity: 1; transform: none; }
.q-foot { display: flex; justify-content: center; gap: 8px; margin-top: 20px; flex-wrap: wrap; }

.result { padding-top: 16px; display: flex; flex-direction: column; gap: 16px; }
.res-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 28px 20px 22px;
  background:
    radial-gradient(80% 60% at 50% 0%, color-mix(in srgb, var(--c, var(--accent)) 16%, transparent), transparent 70%),
    var(--surface);
}
.res-kicker { margin-top: 8px; font: 600 14px/1.3 var(--font-sans); color: var(--label-2); }
.res-sci { font: var(--t-callout); font-style: italic; color: var(--label-2); margin-bottom: 8px; }
.evidence { width: 100%; max-width: 420px; margin-top: 12px; display: flex; flex-direction: column; gap: 6px; text-align: left; }
.evidence li { display: grid; grid-template-columns: 20px 92px 1fr; gap: 8px; align-items: baseline; font: var(--t-subhead); }
.evidence svg { width: 16px; height: 16px; color: var(--ok); align-self: center; }
.ev-q { color: var(--label-2); }
.res-safety { display: flex; gap: 8px; margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: var(--danger-tint); color: var(--danger); font: 500 13px/1.45 var(--font-sans); text-align: left; }
.res-safety svg { width: 16px; height: 16px; flex: none; margin-top: 2px; }
.res-safety.caution { background: var(--warn-tint); color: var(--warn); }
.res-actions { display: flex; flex-direction: column; gap: 10px; }
.disclaimer { font: var(--t-footnote); color: var(--label-2); text-align: center; text-wrap: pretty; }
.none-ic { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; background: var(--surface-2); color: var(--label-2); margin-bottom: 6px; }
.none-ic svg { width: 30px; height: 30px; }
.closest { width: 100%; margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.closest-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); color: var(--label); text-align: left; text-decoration: none !important; }
.closest-row svg { width: 18px; height: 18px; color: var(--label-3); }
.picker-intro { font: var(--t-subhead); margin-bottom: 12px; }

@media (min-width: 768px) {
  .options { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .options.n2 { grid-template-columns: repeat(2, minmax(0, 220px)); justify-content: center; }
  .options.n3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .question { text-align: center; }
  .q-warn { text-align: left; max-width: 560px; margin-inline: auto; }
  .res-actions { flex-direction: row; flex-wrap: wrap; }
  .res-actions > * { flex: 1 1 200px; }
}

.swap-enter-active, .swap-leave-active { transition: opacity var(--dur-2), transform var(--dur-3) var(--ease-spring); }
.swap-enter-from { opacity: 0; transform: translateY(10px); }
.swap-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
