import { computed } from 'vue'
import { persisted } from './persisted'

export type Role = 'local' | 'student' | 'advisor'

export interface Profile {
  name: string
  role: Role
  classCode?: string
  org?: string
  onboardedAt: string | null
}

export const ROLES: Record<Role, { label: string; short: string; description: string }> = {
  local: {
    label: 'Người dân địa phương',
    short: 'Người dân',
    description: 'Tìm hiểu khu rừng, báo cáo hiện trạng, chia sẻ hiểu biết bản địa.',
  },
  student: {
    label: 'Sinh viên',
    short: 'Sinh viên',
    description: 'Học nhận dạng loài, ghi nhận thực địa cho môn học, tải dữ liệu nghiên cứu.',
  },
  advisor: {
    label: 'Giảng viên · Cố vấn',
    short: 'Giảng viên',
    description: 'Xác minh ghi nhận, hiệu chỉnh dữ liệu loài, theo dõi chất lượng dữ liệu.',
  },
}

const blank = (): Profile => ({ name: '', role: 'local', onboardedAt: null })

export function useUser() {
  const profile = persisted<Profile>('profile', blank)
  const isOnboarded = computed(() => !!profile.value.onboardedAt)
  const isAdvisor = computed(() => profile.value.role === 'advisor')
  const displayName = computed(() => profile.value.name.trim() || 'Khách')

  function complete(p: Omit<Profile, 'onboardedAt'>) {
    profile.value = { ...p, name: p.name.trim(), onboardedAt: new Date().toISOString() }
  }
  function setRole(role: Role) {
    profile.value = { ...profile.value, role }
  }

  return { profile, isOnboarded, isAdvisor, displayName, complete, setRole }
}
