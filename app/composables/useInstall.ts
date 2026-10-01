// "Add to Home Screen": Chromium fires beforeinstallprompt; iOS needs the
// Share → Add to Home Screen instructions instead.
import { computed, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
const deferred = ref<BeforeInstallPromptEvent | null>(null)
const installed = ref(false)
let bound = false

export function useInstall() {
  if (import.meta.client && !bound) {
    bound = true
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred.value = e as BeforeInstallPromptEvent })
    window.addEventListener('appinstalled', () => { installed.value = true; deferred.value = null })
    installed.value = matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  }
  const isIOS = computed(() => import.meta.client && /iphone|ipad|ipod/i.test(navigator.userAgent))
  const canPrompt = computed(() => !!deferred.value)
  async function prompt() {
    if (!deferred.value) return false
    await deferred.value.prompt()
    const { outcome } = await deferred.value.userChoice
    deferred.value = null
    return outcome === 'accepted'
  }
  return { installed, canPrompt, isIOS, prompt }
}
