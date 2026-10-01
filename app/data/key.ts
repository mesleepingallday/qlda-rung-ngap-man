// Interactive identification key (multi-access, rule-based, transparent).
// Each option lists the species that show that state. A species whose state
// is variable or unknown is listed under every option of that question, so a
// question can never wrongly eliminate it. DRAFT pending advisor review.
import type { SpeciesId } from './species'

export type ArtId =
  | 'form-tree' | 'form-shrub' | 'form-climber' | 'form-tuft'
  | 'leaf-simple' | 'leaf-compound' | 'leaf-strap'
  | 'margin-spiny' | 'margin-smooth'
  | 'roots-prop' | 'roots-none'
  | 'sap-yes' | 'sap-no'
  | 'flower-spike' | 'flower-pea' | 'flower-catkin' | 'flower-bract'
  | 'fruit-multiple' | 'fruit-pod' | 'fruit-lobed' | 'fruit-capsule'

export interface KeyOption {
  id: string
  label: string
  hint?: string
  art: ArtId
  species: SpeciesId[]
}

export interface KeyQuestion {
  id: string
  /** Short name used in the answer summary ("Dạng cây: Cây gỗ"). */
  short: string
  title: string
  help?: string
  warning?: string
  /** Seasonal characters: only answerable when flowers/fruit are present. */
  seasonal?: boolean
  options: KeyOption[]
}

export const KEY: KeyQuestion[] = [
  {
    id: 'form',
    short: 'Dạng cây',
    title: 'Cây trông như thế nào?',
    help: 'Đứng lùi lại và nhìn tổng thể cả cây.',
    options: [
      { id: 'tree', label: 'Cây gỗ', hint: 'Có một thân chính rõ ràng', art: 'form-tree', species: ['excoecaria'] },
      { id: 'shrub', label: 'Cây bụi thấp', hint: 'Nhiều nhánh từ gốc, cao dưới 2 m', art: 'form-shrub', species: ['acanthus'] },
      { id: 'climber', label: 'Dây leo', hint: 'Quấn hoặc vắt lên cây khác', art: 'form-climber', species: ['derris'] },
      { id: 'tuft', label: 'Lá chụm ở đầu cành', hint: 'Dáng như một cây dừa nhỏ', art: 'form-tuft', species: ['pandanus'] },
    ],
  },
  {
    id: 'leaf',
    short: 'Kiểu lá',
    title: 'Một chiếc lá trông như thế nào?',
    help: 'Chọn hình gần giống nhất với một lá trưởng thành.',
    options: [
      { id: 'simple', label: 'Lá đơn, phiến rộng', art: 'leaf-simple', species: ['excoecaria', 'acanthus'] },
      { id: 'compound', label: 'Lá kép', hint: 'Nhiều lá chét trên một cuống chung', art: 'leaf-compound', species: ['derris'] },
      { id: 'strap', label: 'Lá dài như dải băng', hint: 'Hẹp, dài, xếp xoắn ốc', art: 'leaf-strap', species: ['pandanus'] },
    ],
  },
  {
    id: 'margin',
    short: 'Mép lá',
    title: 'Mép lá có gai không?',
    help: 'Quan sát bằng mắt, không cần chạm tay.',
    options: [
      { id: 'spiny', label: 'Có gai nhọn', art: 'margin-spiny', species: ['acanthus', 'pandanus'] },
      { id: 'smooth', label: 'Không có gai', art: 'margin-smooth', species: ['excoecaria', 'derris'] },
    ],
  },
  {
    id: 'roots',
    short: 'Rễ',
    title: 'Ở gốc cây có rễ chống không?',
    help: 'Rễ chống mọc ra từ thân, cong xuống và cắm vào đất.',
    options: [
      { id: 'prop', label: 'Có rễ chống', art: 'roots-prop', species: ['pandanus', 'acanthus'] },
      { id: 'none', label: 'Không thấy rễ chống', art: 'roots-none', species: ['excoecaria', 'derris', 'acanthus'] },
    ],
  },
  {
    id: 'sap',
    short: 'Nhựa',
    title: 'Ở vết gãy có sẵn, có nhựa trắng như sữa không?',
    warning: 'Đừng bẻ cành hay ngắt lá để thử. Nhựa cây Giá có độc và có thể gây tổn thương mắt. Chỉ quan sát vết gãy có sẵn.',
    options: [
      { id: 'yes', label: 'Có nhựa trắng', art: 'sap-yes', species: ['excoecaria'] },
      { id: 'no', label: 'Không có nhựa trắng', art: 'sap-no', species: ['acanthus', 'pandanus', 'derris'] },
    ],
  },
  {
    id: 'flower',
    short: 'Hoa',
    title: 'Nếu cây đang có hoa, hoa trông thế nào?',
    seasonal: true,
    options: [
      { id: 'spike', label: 'Bông hoa tím nhạt ở ngọn', art: 'flower-spike', species: ['acanthus'] },
      { id: 'pea', label: 'Chùm hoa nhỏ trắng hồng', hint: 'Dạng hoa đậu', art: 'flower-pea', species: ['derris'] },
      { id: 'catkin', label: 'Cụm hoa vàng lục, dạng đuôi sóc', art: 'flower-catkin', species: ['excoecaria'] },
      { id: 'bract', label: 'Mo hoa màu trắng, thơm', art: 'flower-bract', species: ['pandanus'] },
    ],
  },
  {
    id: 'fruit',
    short: 'Quả',
    title: 'Nếu cây đang có quả, quả trông thế nào?',
    seasonal: true,
    options: [
      { id: 'multiple', label: 'Quả to, sần như quả dứa', art: 'fruit-multiple', species: ['pandanus'] },
      { id: 'pod', label: 'Quả dẹt, mỏng, có cánh', art: 'fruit-pod', species: ['derris'] },
      { id: 'lobed', label: 'Quả nhỏ chia 3 thùy', art: 'fruit-lobed', species: ['excoecaria'] },
      { id: 'capsule', label: 'Quả nang thuôn, dài 2–3 cm', art: 'fruit-capsule', species: ['acanthus'] },
    ],
  },
]

export const KEY_BY_ID = Object.fromEntries(KEY.map((q) => [q.id, q])) as Record<string, KeyQuestion>
