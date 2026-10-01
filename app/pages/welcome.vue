<script setup lang="ts">
// Onboarding: welcome → what you can do → role → name. Four short steps,
// one decision each. Permissions (camera, location) are asked later, in
// context, never up front.
import { computed, nextTick, ref } from 'vue'
import { BadgeCheck, Box, Camera, Check, ChevronLeft, GraduationCap, House, Info, ScanSearch, ShieldCheck } from '@lucide/vue'
import { ROLES, type Role } from '~/composables/useUser'

definePageMeta({ layout: 'bare' })
useHead({ title: 'Chào mừng · Rừng ngập mặn Huế' })

const route = useRoute()
const { profile, complete } = useUser()
const { show } = useToast()

const step = ref(0)
const dir = ref<'fwd' | 'back'>('fwd')
const role = ref<Role | null>(profile.value.onboardedAt ? profile.value.role : null)
const name = ref(profile.value.name)
const classCode = ref(profile.value.classCode ?? '')
const org = ref(profile.value.org ?? '')
const heading = ref<HTMLElement | null>(null)

const FEATURES = [
  { icon: Box, title: 'Khám phá rừng 3D', text: 'Chạm vào từng khóm cây để biết đó là loài gì, cao bao nhiêu và ngập khi triều lên đến đâu.' },
  { icon: ScanSearch, title: 'Nhận dạng qua vài câu hỏi', text: 'Trả lời về dạng cây, lá, rễ; ứng dụng gợi ý loài phù hợp và giải thích vì sao.' },
  { icon: Camera, title: 'Ghi nhận ngoài thực địa', text: 'Chụp ảnh, đánh dấu vị trí và gửi cho giảng viên xác minh.' },
  { icon: ShieldCheck, title: 'Dữ liệu minh bạch', text: 'Mỗi thông tin đều ghi rõ nguồn và đã được xác minh hay chưa.' },
]
const ROLE_ICONS: Record<Role, typeof House> = { local: House, student: GraduationCap, advisor: BadgeCheck }
const ROLE_ORDER: Role[] = ['local', 'student', 'advisor']

async function go(to: number) {
  dir.value = to > step.value ? 'fwd' : 'back'
  step.value = to
  await nextTick()
  heading.value?.focus({ preventScroll: true })
}

function finish() {
  if (!role.value) return
  complete({
    name: name.value,
    role: role.value,
    classCode: role.value === 'student' ? classCode.value.trim() || undefined : undefined,
    org: role.value === 'advisor' ? org.value.trim() || undefined : undefined,
  })
  const who = name.value.trim()
  show(who ? `Chào mừng, ${who}!` : 'Chào mừng bạn!', { tone: 'ok' })
  const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/'
  navigateTo(next, { replace: true })
}

const nameLabel = computed(() => (role.value === 'advisor' ? 'Họ và tên' : 'Tên hiển thị'))
</script>

<template>
  <div class="welcome" :class="`step-${step}`">
    <!-- Visual panel: the forest model, always the live dataset -->
    <section class="visual" aria-hidden="true">
      <div class="glow" />
      <figure class="figure">
        <div class="dio"><ForestDiorama reveal :exaggeration="3.2" /></div>
        <figcaption class="visual-caption">Mô hình minh họa từ dữ liệu demo · chiều cao ×3</figcaption>
      </figure>
    </section>

    <section class="panel">
      <div v-if="step > 0" class="topbar">
        <button type="button" class="back" @click="go(step - 1)">
          <ChevronLeft aria-hidden="true" :stroke-width="2.4" /><span>Quay lại</span>
        </button>
        <div class="progress" role="progressbar" :aria-valuenow="step" aria-valuemin="1" aria-valuemax="3" :aria-label="`Bước ${step} trên 3`">
          <span v-for="i in 3" :key="i" :class="{ on: i <= step }" />
        </div>
      </div>

      <Transition :name="dir === 'fwd' ? 'push' : 'pop'" mode="out-in">
        <!-- 0 · Welcome -->
        <div v-if="step === 0" key="0" class="step">
          <div class="step-body hero-copy">
            <p class="eyebrow">Rú Chá · Hương Phong, Huế</p>
            <h1 ref="heading" tabindex="-1" class="t-hero">Rừng ngập mặn Huế</h1>
            <p class="lead">Khám phá Rú Chá như một mô hình sống: nhận dạng từng loài cây, theo dõi thủy triều và cùng góp dữ liệu cho khu rừng.</p>
          </div>
          <div class="step-foot">
            <UiButton size="lg" block @click="go(1)">Bắt đầu</UiButton>
            <p class="fine"><Info aria-hidden="true" :stroke-width="2.2" /> Bản thử nghiệm. Dữ liệu khu rừng hiện là minh họa.</p>
          </div>
        </div>

        <!-- 1 · What you can do -->
        <div v-else-if="step === 1" key="1" class="step">
          <div class="step-body">
            <h1 ref="heading" tabindex="-1" class="t-title1 step-title">Mọi điều về khu rừng, trong một ứng dụng</h1>
            <ul class="features">
              <li v-for="f in FEATURES" :key="f.title">
                <component :is="f.icon" class="f-ic" aria-hidden="true" :stroke-width="1.9" />
                <div>
                  <p class="f-title">{{ f.title }}</p>
                  <p class="f-text">{{ f.text }}</p>
                </div>
              </li>
            </ul>
          </div>
          <div class="step-foot">
            <UiButton size="lg" block @click="go(2)">Tiếp tục</UiButton>
          </div>
        </div>

        <!-- 2 · Role -->
        <form v-else-if="step === 2" key="2" class="step" @submit.prevent="role && go(3)">
          <div class="step-body">
            <h1 ref="heading" tabindex="-1" class="t-title1 step-title">Bạn tham gia với vai trò nào?</h1>
            <p class="step-sub">Ứng dụng sẽ ưu tiên những gì bạn cần. Có thể đổi bất cứ lúc nào trong Hồ sơ.</p>
            <div class="roles" role="radiogroup" aria-label="Vai trò">
              <button
                v-for="r in ROLE_ORDER"
                :key="r"
                type="button"
                role="radio"
                class="role"
                :aria-checked="role === r"
                @click="role = r"
              >
                <span class="role-ic"><component :is="ROLE_ICONS[r]" aria-hidden="true" :stroke-width="2" /></span>
                <span class="role-text">
                  <span class="role-title">{{ ROLES[r].label }}</span>
                  <span class="role-desc">{{ ROLES[r].description }}</span>
                </span>
                <span class="role-check" aria-hidden="true"><Check :stroke-width="3" /></span>
              </button>
            </div>
          </div>
          <div class="step-foot">
            <UiButton size="lg" block type="submit" :disabled="!role">Tiếp tục</UiButton>
          </div>
        </form>

        <!-- 3 · Name -->
        <form v-else key="3" class="step" @submit.prevent="finish">
          <div class="step-body">
            <h1 ref="heading" tabindex="-1" class="t-title1 step-title">Chúng tôi nên gọi bạn là gì?</h1>
            <p class="step-sub">Tên sẽ hiển thị cùng các ghi nhận bạn gửi.</p>
            <div class="fields">
              <label class="field">
                <span class="field-label">{{ nameLabel }}</span>
                <input v-model="name" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="done" placeholder="Ví dụ: Minh Anh" maxlength="60">
              </label>
              <label v-if="role === 'student'" class="field">
                <span class="field-label">Mã lớp <span class="opt">không bắt buộc</span></span>
                <input v-model="classCode" type="text" autocapitalize="characters" placeholder="Ví dụ: SH-K46" maxlength="24">
                <span class="field-help">Giảng viên của lớp sẽ thấy các ghi nhận của bạn.</span>
              </label>
              <label v-if="role === 'advisor'" class="field">
                <span class="field-label">Đơn vị công tác <span class="opt">không bắt buộc</span></span>
                <input v-model="org" type="text" placeholder="Ví dụ: Khoa Sinh học" maxlength="80">
              </label>
              <p v-if="role === 'advisor'" class="note">
                <ShieldCheck aria-hidden="true" :stroke-width="2" />
                Bản thử nghiệm: quyền xác minh được bật ngay. Ở bản chính thức, tài khoản giảng viên sẽ được quản trị viên duyệt.
              </p>
            </div>
          </div>
          <div class="step-foot">
            <UiButton size="lg" block type="submit">Hoàn tất</UiButton>
          </div>
        </form>
      </Transition>
    </section>
  </div>
</template>

<style scoped>
.welcome {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  overflow-x: hidden;
}

/* Visual */
.visual {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--safe-top) + 20px) 12px 8px;
  min-height: 0;
}
.glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(55% 45% at 50% 50%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 72%),
    radial-gradient(35% 30% at 62% 62%, color-mix(in srgb, var(--water) 10%, transparent), transparent 70%);
  pointer-events: none;
}
.figure { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; }
.dio { width: min(100%, 560px); }
.visual-caption { font: var(--t-caption2); color: var(--label-2); text-align: center; }
.welcome:not(.step-0) .visual { display: none; }

/* Panel */
.panel {
  flex: none;
  display: flex;
  flex-direction: column;
  padding: 0 max(24px, var(--safe-left)) calc(var(--safe-bottom) + 20px);
  min-height: 0;
}
.welcome:not(.step-0) .panel { flex: 1 1 auto; }
.welcome:not(.step-0) .panel { padding-top: calc(var(--safe-top) + 8px); }
.topbar { display: flex; align-items: center; justify-content: space-between; height: 48px; margin: 0 -8px 8px; }
.back { display: inline-flex; align-items: center; gap: 2px; padding: 8px; border-radius: 10px; color: var(--accent-text); font: 500 16px/1 var(--font-sans); }
.back svg { width: 22px; height: 22px; }
.progress { display: flex; gap: 6px; padding-right: 8px; }
.progress span { width: 22px; height: 5px; border-radius: 3px; background: var(--surface-3); transition: background-color var(--dur-3); }
.progress span.on { background: var(--accent); }

.step { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; }
.step-body { flex: 1 1 auto; }
.step-foot { flex: none; display: flex; flex-direction: column; gap: 12px; padding-top: 24px; }
.hero-copy { display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; padding-top: 8px; }
.hero-copy .eyebrow { color: var(--accent-text); }
h1:focus { outline: none; }
.lead { font: var(--t-body); color: var(--label-2); max-width: 34ch; text-wrap: pretty; }
.fine { display: flex; align-items: center; justify-content: center; gap: 6px; font: var(--t-footnote); color: var(--label-2); text-align: center; }
.fine svg { width: 15px; height: 15px; flex: none; }
.step-title { margin-top: 8px; text-wrap: balance; }
.step-sub { margin-top: 8px; font: var(--t-callout); color: var(--label-2); text-wrap: pretty; }

.features { display: flex; flex-direction: column; gap: 22px; margin-top: 30px; }
.features li { display: grid; grid-template-columns: 40px 1fr; gap: 14px; align-items: start; }
.f-ic { width: 32px; height: 32px; color: var(--accent-text); margin-top: 2px; }
.f-title { font: var(--t-headline); }
.f-text { margin-top: 2px; font: var(--t-subhead); color: var(--label-2); text-wrap: pretty; }

.roles { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
.role {
  display: grid;
  grid-template-columns: 44px 1fr 24px;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm), inset 0 0 0 1px var(--separator);
  text-align: left;
  transition: box-shadow var(--dur-2), background-color var(--dur-2), transform var(--dur-1);
}
.role:active { transform: scale(0.99); }
.role[aria-checked='true'] { box-shadow: var(--shadow-sm), inset 0 0 0 2px var(--accent); background: color-mix(in srgb, var(--accent-tint) 55%, var(--surface)); }
.role-ic { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: var(--surface-2); color: var(--label); }
.role[aria-checked='true'] .role-ic { background: var(--accent); color: var(--accent-ink); }
.role-ic svg { width: 22px; height: 22px; }
.role-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.role-title { font: var(--t-headline); }
.role-desc { font: var(--t-footnote); color: var(--label-2); text-wrap: pretty; }
.role-check { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--separator-strong); color: transparent; transition: all var(--dur-2); }
.role-check svg { width: 14px; height: 14px; }
.role[aria-checked='true'] .role-check { background: var(--accent); box-shadow: none; color: var(--accent-ink); }

.fields { display: flex; flex-direction: column; gap: 18px; margin-top: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font: 600 14px/1.3 var(--font-sans); color: var(--label-2); }
.opt { font-weight: 400; color: var(--label-2); margin-left: 4px; }
.field input {
  height: 52px;
  padding: 0 16px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--separator-strong);
  font: var(--t-body);
  transition: box-shadow var(--dur-2);
}
.field input::placeholder { color: var(--label-3); }
.field input:focus { outline: none; box-shadow: inset 0 0 0 2px var(--accent); }
.field-help { font: var(--t-footnote); color: var(--label-2); }
.note { display: flex; gap: 10px; padding: 12px 14px; border-radius: var(--r-md); background: var(--accent-tint); color: var(--accent-text); font: var(--t-footnote); }
.note svg { flex: none; width: 18px; height: 18px; margin-top: 1px; }

/* Step transitions (push / pop) */
.push-enter-active, .push-leave-active, .pop-enter-active, .pop-leave-active { transition: opacity var(--dur-2) var(--ease-out), transform var(--dur-3) var(--ease-spring); }
.push-enter-from { opacity: 0; transform: translateX(28px); }
.push-leave-to { opacity: 0; transform: translateX(-20px); }
.pop-enter-from { opacity: 0; transform: translateX(-28px); }
.pop-leave-to { opacity: 0; transform: translateX(20px); }

/* Wide screens: the forest on the left, the conversation on the right */
@media (min-width: 900px) {
  .welcome { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(460px, 1fr); }
  .visual, .welcome:not(.step-0) .visual {
    display: flex;
    padding: 48px 40px;
    background: color-mix(in srgb, var(--surface) 50%, var(--bg));
    border-right: 0.5px solid var(--separator);
  }
  .dio { width: min(100%, 820px); }
  .visual-caption { margin-top: 12px; }
  .panel, .welcome:not(.step-0) .panel { justify-content: center; padding: 48px clamp(32px, 5vw, 80px); }
  .step { flex: 0 1 auto; max-width: 460px; width: 100%; }
  .step-0 .hero-copy .t-hero { font-size: 48px; }
  .topbar { max-width: 460px; }
}
</style>
