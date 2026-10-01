import { Camera, House, Leaf, Map } from '@lucide/vue'

/** Primary destinations, shared by the tab bar and the sidebar. */
export const NAV = [
  { to: '/', label: 'Tổng quan', icon: House, match: (p: string) => p === '/' },
  { to: '/explore', label: 'Bản đồ', icon: Map, match: (p: string) => p.startsWith('/explore') },
  { to: '/species', label: 'Loài', icon: Leaf, match: (p: string) => p.startsWith('/species') || p.startsWith('/identify') },
  { to: '/observations', label: 'Ghi nhận', icon: Camera, match: (p: string) => p.startsWith('/observations') },
] as const
