import { effectScope, ref, watch, type Ref } from 'vue'

const PREFIX = 'rnm:'
const cache = new Map<string, Ref<unknown>>()
// Watchers live in a detached scope: whichever component calls persisted()
// first may unmount, but saving must keep working for the whole session.
const scope = effectScope(true)

/**
 * A ref mirrored to localStorage. Storage can be unavailable (private mode,
 * blocked site data), so every access is guarded and the app keeps working
 * in memory. Refs are shared per key across the app.
 */
export function persisted<T>(key: string, initial: () => T): Ref<T> {
  const existing = cache.get(key)
  if (existing) return existing as Ref<T>
  let value: T
  try {
    const raw = localStorage.getItem(PREFIX + key)
    value = raw === null ? initial() : (JSON.parse(raw) as T)
  } catch {
    value = initial()
  }
  const r = ref(value) as Ref<T>
  scope.run(() => watch(r, (v) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(v)) } catch { /* quota or blocked */ }
  }, { deep: true }))
  cache.set(key, r as Ref<unknown>)
  return r
}

export function clearPersisted() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k)
  } catch { /* ignore */ }
  cache.clear()
}
