import { computed, ref } from 'vue'
import { persisted } from './persisted'

export type ThemePref = 'system' | 'light' | 'dark'

const systemDark = ref(false)
let listening = false

function apply(pref: ThemePref) {
  const root = document.documentElement
  if (pref === 'system') delete root.dataset.theme
  else root.dataset.theme = pref
}

export function useTheme() {
  const pref = persisted<ThemePref>('theme', () => 'system')
  if (!listening && typeof window !== 'undefined') {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mq.matches
    mq.addEventListener('change', (e) => { systemDark.value = e.matches })
    listening = true
  }
  const resolved = computed<'light' | 'dark'>(() =>
    pref.value === 'system' ? (systemDark.value ? 'dark' : 'light') : pref.value)

  function set(p: ThemePref) {
    pref.value = p
    apply(p)
  }
  return { pref, resolved, set, apply: () => apply(pref.value) }
}
