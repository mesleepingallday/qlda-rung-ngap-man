import { onScopeDispose, ref } from 'vue'

/** Reactive matchMedia. */
export function useMediaQuery(query: string) {
  const mq = matchMedia(query)
  const matches = ref(mq.matches)
  const on = (e: MediaQueryListEvent) => { matches.value = e.matches }
  mq.addEventListener('change', on)
  onScopeDispose(() => mq.removeEventListener('change', on))
  return matches
}

/** Layout classes shared by the shell: compact (phone) vs regular (tablet/desktop). */
export function useViewport() {
  const regular = useMediaQuery('(min-width: 768px)')
  const wide = useMediaQuery('(min-width: 1200px)')
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  return { regular, wide, canHover, reducedMotion }
}
