// Multi-access identification key logic. Transparent and rule-based:
// a species stays a candidate while every answer lists it; the next question
// is the one expected to leave the fewest candidates.
import { computed, ref } from 'vue'
import { KEY, KEY_BY_ID, type KeyQuestion } from '~/data/key'
import { SPECIES_IDS, type SpeciesId } from '~/data/species'

export type Answer = string | 'skip'

export function useKey() {
  const answers = ref<Record<string, Answer>>({})
  const confirming = ref(false)

  const answered = computed(() => KEY.filter((q) => answers.value[q.id] && answers.value[q.id] !== 'skip'))

  function fits(s: SpeciesId, q: KeyQuestion, optionId: string) {
    return q.options.find((o) => o.id === optionId)?.species.includes(s) ?? true
  }

  const scores = computed(() => SPECIES_IDS.map((s) => {
    let match = 0, miss = 0
    for (const q of answered.value) (fits(s, q, answers.value[q.id] as string) ? match++ : miss++)
    return { id: s, match, miss }
  }))
  const candidates = computed(() => scores.value.filter((x) => x.miss === 0).map((x) => x.id))
  const closest = computed(() => {
    const min = Math.min(...scores.value.map((x) => x.miss))
    return scores.value.filter((x) => x.miss === min).sort((a, b) => b.match - a.match).map((x) => x.id)
  })

  /** Expected candidates left after asking q (lower = more useful). */
  function cost(q: KeyQuestion, pool: SpeciesId[]) {
    const n = pool.length
    if (!n) return Infinity
    let e = 0, informative = false
    for (const o of q.options) {
      const k = pool.filter((s) => o.species.includes(s)).length
      if (k > 0 && k < n) informative = true
      e += (k / n) * k
    }
    if (!informative) return Infinity
    return e + (q.seasonal ? 0.75 : 0) + (q.id === 'sap' ? 0.4 : 0)
  }

  const unasked = computed(() => KEY.filter((q) => !(q.id in answers.value)))

  const next = computed<KeyQuestion | null>(() => {
    // Confirm mode: keep asking anything that separates the suggestion from
    // the other species, so a wrong early answer can still be caught.
    const pool = confirming.value ? SPECIES_IDS : candidates.value
    if (!confirming.value && candidates.value.length <= 1) return null
    let best: KeyQuestion | null = null, bestCost = Infinity
    for (const q of unasked.value) {
      const c = cost(q, pool)
      if (c < bestCost) { bestCost = c; best = q }
    }
    return best
  })

  const done = computed(() => next.value === null)

  /** How strongly the answers support the top candidate. */
  const confidence = computed(() => {
    const n = answered.value.length
    if (candidates.value.length !== 1) return null
    return n >= 3 ? { label: 'Rất phù hợp', level: 3 } : n === 2 ? { label: 'Khá phù hợp', level: 2 } : { label: 'Gợi ý ban đầu', level: 1 }
  })

  const canConfirm = computed(() => candidates.value.length === 1 && !confirming.value
    && unasked.value.some((q) => cost(q, SPECIES_IDS) < Infinity))

  function answer(qid: string, a: Answer) { answers.value = { ...answers.value, [qid]: a } }
  function clear(qid: string) {
    const { [qid]: _, ...rest } = answers.value
    answers.value = rest
  }
  function reset() { answers.value = {}; confirming.value = false }

  return { answers, answered, candidates, closest, scores, next, done, confidence, canConfirm, confirming, unasked, answer, clear, reset, KEY_BY_ID }
}
