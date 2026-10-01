import { computed } from 'vue'
import { del, get, set } from 'idb-keyval'
import type { ConditionId, SpeciesId } from '~/data/species'
import type { Role } from './useUser'
import { persisted } from './persisted'

export type ObsKind = 'species' | 'condition'
export type ObsStatus = 'pending' | 'verified' | 'needs_info'
export type Certainty = 'sure' | 'likely' | 'guess'

export interface Review {
  by: string
  at: string
  decision: 'verified' | 'needs_info'
  species_id: SpeciesId | null
  comment: string
}

export interface Observation {
  id: string
  kind: ObsKind
  species_id: SpeciesId | null
  certainty: Certainty | null
  condition: ConditionId | null
  note: string
  /** IndexedDB keys of the photos (blobs live outside localStorage). */
  photos: string[]
  lng: number | null
  lat: number | null
  accuracy_m: number | null
  patch_id: string | null
  created_at: string
  author: { name: string; role: Role }
  status: ObsStatus
  reviews: Review[]
  /** Seeded example data, shown with a demo label. */
  demo?: boolean
  mine?: boolean
}

export const STATUS: Record<ObsStatus, { label: string; tone: 'warn' | 'ok' | 'info' }> = {
  pending: { label: 'Chờ xác minh', tone: 'warn' },
  verified: { label: 'Đã xác minh', tone: 'ok' },
  needs_info: { label: 'Cần bổ sung', tone: 'info' },
}

export const CERTAINTY: Record<Certainty, string> = {
  sure: 'Chắc chắn',
  likely: 'Khá chắc',
  guess: 'Chỉ đoán',
}

const daysAgo = (d: number, h = 9) => {
  const t = new Date()
  t.setDate(t.getDate() - d)
  t.setHours(h, (d * 17) % 60, 0, 0)
  return t.toISOString()
}

/** Example observations so a first-time visitor sees how the flow works. */
function seed(): Observation[] {
  const base = { photos: [], accuracy_m: 8, reviews: [], demo: true }
  return [
    {
      ...base, id: 'demo-1', kind: 'species', species_id: 'acanthus', certainty: 'sure', condition: null,
      note: 'Đám ô rô đang ra hoa tím dọc bờ lạch.', lng: 107.59378, lat: 16.54765, patch_id: null,
      created_at: daysAgo(0, 8), author: { name: 'Thảo Vy', role: 'student' }, status: 'pending',
    },
    {
      ...base, id: 'demo-2', kind: 'condition', species_id: null, certainty: null, condition: 'seedlings',
      note: 'Nhiều cây con mới mọc ở bãi bùn phía tây, khoảng 20–30 cây.', lng: 107.59163, lat: 16.5474, patch_id: null,
      created_at: daysAgo(1, 16), author: { name: 'Bác Hòa', role: 'local' }, status: 'pending',
    },
    {
      ...base, id: 'demo-3', kind: 'species', species_id: 'derris', certainty: 'guess', condition: null,
      note: 'Dây leo có lá kép, chưa thấy quả.', lng: 107.59491, lat: 16.5485, patch_id: null,
      created_at: daysAgo(2, 10), author: { name: 'Minh Khoa', role: 'student' }, status: 'needs_info',
      reviews: [{ by: 'Giảng viên (demo)', at: daysAgo(1, 20), decision: 'needs_info', species_id: null, comment: 'Em chụp thêm ảnh cận lá và quả (nếu có) để xác định chắc hơn nhé.' }],
    },
    {
      ...base, id: 'demo-4', kind: 'species', species_id: 'excoecaria', certainty: 'likely', condition: null,
      note: 'Lá già chuyển đỏ, thân có vết nhựa trắng khô.', lng: 107.59303, lat: 16.54841, patch_id: null,
      created_at: daysAgo(4, 9), author: { name: 'Thảo Vy', role: 'student' }, status: 'verified',
      reviews: [{ by: 'Giảng viên (demo)', at: daysAgo(3, 19), decision: 'verified', species_id: 'excoecaria', comment: 'Đúng là cây Giá. Lưu ý không chạm vào nhựa.' }],
    },
    {
      ...base, id: 'demo-5', kind: 'condition', species_id: null, certainty: null, condition: 'waste',
      note: 'Rác nhựa dạt vào mép rừng sau đợt triều cường.', lng: 107.59256, lat: 16.54735, patch_id: null,
      created_at: daysAgo(6, 7), author: { name: 'Anh Tuấn', role: 'local' }, status: 'verified',
      reviews: [{ by: 'Giảng viên (demo)', at: daysAgo(5, 15), decision: 'verified', species_id: null, comment: 'Đã chuyển thông tin cho tổ bảo vệ rừng.' }],
    },
    {
      ...base, id: 'demo-6', kind: 'species', species_id: 'pandanus', certainty: 'sure', condition: null,
      note: 'Quả kép chín vàng cam, nhiều rễ chống.', lng: 107.59209, lat: 16.54886, patch_id: null,
      created_at: daysAgo(9, 15), author: { name: 'Lan Anh', role: 'student' }, status: 'verified',
      reviews: [{ by: 'Giảng viên (demo)', at: daysAgo(8, 9), decision: 'verified', species_id: 'pandanus', comment: '' }],
    },
  ]
}

function uid() {
  return `obs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Downscale a photo to ≤ 1600 px JPEG before storing it. */
async function compress(file: Blob, max = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * k)
    canvas.height = Math.round(bmp.height * k)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    return await new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', quality))
  } catch {
    return file
  }
}

export function useObservations() {
  const items = persisted<Observation[]>('observations', seed)

  const sorted = computed(() => [...items.value].sort((a, b) => b.created_at.localeCompare(a.created_at)))
  const pending = computed(() => sorted.value.filter((o) => o.status === 'pending'))
  const mine = computed(() => sorted.value.filter((o) => o.mine))

  const get = (id: string) => items.value.find((o) => o.id === id)

  async function add(input: Omit<Observation, 'id' | 'photos' | 'created_at' | 'status' | 'reviews'>, files: Blob[]) {
    const id = uid()
    const photos: string[] = []
    for (const [i, f] of files.entries()) {
      const key = `photo:${id}:${i}`
      try { await set(key, await compress(f)); photos.push(key) } catch { /* storage unavailable */ }
    }
    const obs: Observation = { ...input, id, photos, created_at: new Date().toISOString(), status: 'pending', reviews: [], mine: true }
    items.value = [obs, ...items.value]
    return obs
  }

  function review(id: string, r: Omit<Review, 'at'>) {
    items.value = items.value.map((o) => o.id !== id ? o : {
      ...o,
      status: r.decision,
      species_id: r.decision === 'verified' && o.kind === 'species' && r.species_id ? r.species_id : o.species_id,
      reviews: [...o.reviews, { ...r, at: new Date().toISOString() }],
    })
  }

  async function remove(id: string) {
    const o = get(id)
    if (o) for (const key of o.photos) { try { await del(key) } catch { /* ignore */ } }
    items.value = items.value.filter((x) => x.id !== id)
  }

  return { items, sorted, pending, mine, get, add, review, remove }
}

/** Object URL for a stored photo (revoke when done). */
export async function photoUrl(key: string) {
  try {
    const blob = await get<Blob>(key)
    return blob ? URL.createObjectURL(blob) : null
  } catch {
    return null
  }
}
