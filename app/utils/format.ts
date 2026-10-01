// Vietnamese formatting: "1.234,5", "12 tháng 9, 2026", "3 ngày trước".

const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function num(n: number, digits: 0 | 1 | 2 = 0) {
  return (digits === 2 ? nf2 : digits === 1 ? nf1 : nf0).format(n)
}

export function pct(fraction: number) {
  return `${nf0.format(Math.round(fraction * 100))}%`
}

/** m² below one hectare, ha above. */
export function area(m2: number) {
  if (m2 >= 10_000) return { value: nf2.format(m2 / 10_000), unit: 'ha' }
  return { value: nf0.format(m2), unit: 'm²' }
}
export function areaText(m2: number) {
  const a = area(m2)
  return `${a.value} ${a.unit}`
}

export function metres(m: number, digits: 0 | 1 | 2 = 1) {
  return `${num(m, digits)} m`
}

const dateLong = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
const dateShort = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

export const dateText = (iso: string) => dateLong.format(new Date(iso))
export const dateShortText = (iso: string) => dateShort.format(new Date(iso))
export const timeText = (iso: string) => time.format(new Date(iso))
export function todayText(d = new Date()) {
  const s = weekday.format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })
export function relativeText(iso: string, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  const abs = Math.abs(diff)
  const min = 60_000, hour = 60 * min, day = 24 * hour
  if (abs < min) return 'Vừa xong'
  if (abs < hour) return rtf.format(Math.round(diff / min), 'minute')
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour')
  if (abs < 7 * day) return rtf.format(Math.round(diff / day), 'day')
  return dateLong.format(new Date(iso))
}

/** Bucket for grouping lists: Hôm nay / Tuần này / Trước đó. */
export function dayBucket(iso: string, now = new Date()) {
  const d = new Date(iso)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (d.getTime() >= start) return 'Hôm nay'
  if (d.getTime() >= start - 6 * 86_400_000) return 'Tuần này'
  return 'Trước đó'
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const last = parts[parts.length - 1]!
  return (parts.length > 1 ? parts[0]!.charAt(0) + last.charAt(0) : last.slice(0, 2)).toUpperCase()
}
