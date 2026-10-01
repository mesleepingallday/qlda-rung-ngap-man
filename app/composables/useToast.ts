import { ref } from 'vue'

export interface Toast {
  id: number
  text: string
  tone: 'neutral' | 'ok' | 'warn'
  action?: { label: string; run: () => void }
}

const toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function show(text: string, opts: Partial<Omit<Toast, 'id' | 'text'>> & { ms?: number } = {}) {
    const t: Toast = { id: ++seq, text, tone: opts.tone ?? 'neutral', action: opts.action }
    toasts.value = [...toasts.value.slice(-2), t]
    setTimeout(() => dismiss(t.id), opts.ms ?? 3600)
  }
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }
  return { toasts, show, dismiss }
}
