// Species knowledge base. Every entry is a DRAFT until an advisor confirms it
// (status: 'draft'); the UI shows that state wherever the text appears.
// Later this comes from SQLite via /api/species.

export type SpeciesId = 'excoecaria' | 'acanthus' | 'pandanus' | 'derris'
export type TraitKey = 'form' | 'leaf' | 'margin' | 'sap' | 'roots' | 'flower' | 'fruit'

export interface Species {
  id: SpeciesId
  name: string
  altNames: string[]
  scientific: string
  author?: string
  family: string
  familyVi: string
  /** 'true' = true mangrove, 'associate' = mangrove associate */
  group: 'true' | 'associate'
  /** Typical position from the water's edge inland (0 = water side). */
  zoneOrder: number
  zone: string
  summary: string
  traits: Partial<Record<TraitKey, string>>
  safety?: { level: 'caution' | 'danger'; text: string }
  confusions?: { with: SpeciesId; tip: string }[]
  status: 'draft' | 'verified'
}

export const TRAIT_LABEL: Record<TraitKey, string> = {
  form: 'Dạng sống',
  leaf: 'Lá',
  margin: 'Mép lá',
  sap: 'Nhựa',
  roots: 'Rễ',
  flower: 'Hoa',
  fruit: 'Quả',
}
export const TRAIT_ORDER: TraitKey[] = ['form', 'leaf', 'margin', 'roots', 'sap', 'flower', 'fruit']

export const GROUP_LABEL = {
  true: 'Cây ngập mặn thực thụ',
  associate: 'Cây tham gia rừng ngập mặn',
} as const

export const SPECIES: Record<SpeciesId, Species> = {
  excoecaria: {
    id: 'excoecaria',
    name: 'Giá',
    altNames: ['Chà'],
    scientific: 'Excoecaria agallocha',
    author: 'L.',
    family: 'Euphorbiaceae',
    familyVi: 'Họ Thầu dầu',
    group: 'true',
    zoneOrder: 1,
    zone: 'Vùng giữa, nền đất cao hơn mép nước',
    summary:
      'Cây gỗ nhỏ, chiếm phần lớn khu rừng. Nhựa mủ trắng của cây có độc. Theo cách gọi địa phương, tên “Rú Chá” được cho là bắt nguồn từ loài cây này (cần kiểm chứng).',
    traits: {
      form: 'Cây gỗ nhỏ, có một thân chính rõ.',
      leaf: 'Lá đơn, mọc cách; lá già chuyển đỏ cam trước khi rụng.',
      margin: 'Mép lá nguyên hoặc có răng rất nhỏ, không có gai.',
      sap: 'Nhựa mủ trắng như sữa chảy ra ở vết gãy.',
      roots: 'Không có rễ chống hay rễ thở rõ rệt.',
      flower: 'Cụm hoa nhỏ dạng đuôi sóc, màu vàng lục; cây đực và cây cái riêng biệt.',
      fruit: 'Quả nang nhỏ, chia 3 thùy.',
    },
    safety: {
      level: 'danger',
      text: 'Nhựa cây có độc, có thể gây bỏng rát da và tổn thương mắt. Không bẻ cành, ngắt lá. Nếu nhựa dính vào mắt, rửa ngay bằng nhiều nước sạch và đến cơ sở y tế gần nhất.',
    },
    status: 'draft',
  },
  acanthus: {
    id: 'acanthus',
    name: 'Ô rô',
    altNames: ['Ô rô nước'],
    scientific: 'Acanthus ilicifolius',
    author: 'L.',
    family: 'Acanthaceae',
    familyVi: 'Họ Ô rô',
    group: 'true',
    zoneOrder: 0,
    zone: 'Sát mép nước và bờ lạch triều',
    summary:
      'Cây bụi thấp, mọc thành đám dày trên bùn ở nơi ngập triều thường xuyên. Dễ nhận ra nhờ lá có gai và bông hoa tím nhạt.',
    traits: {
      form: 'Cây bụi thấp, thường cao dưới 2 m, mọc thành đám.',
      leaf: 'Lá đơn, mọc đối, phiến lá dày và cứng.',
      margin: 'Mép lá lượn thùy, mỗi thùy kết thúc bằng một gai nhọn.',
      sap: 'Không có nhựa mủ trắng.',
      flower: 'Hoa màu tím nhạt, xếp thành bông ở ngọn cành.',
      fruit: 'Quả nang hình thuôn, dài khoảng 2–3 cm.',
    },
    safety: { level: 'caution', text: 'Mép lá có gai nhọn. Mặc quần áo dài và đi chậm khi qua các đám ô rô.' },
    confusions: [
      {
        with: 'pandanus',
        tip: 'Cả hai đều có lá gai. Ô rô là cây bụi thấp, lá ngắn mọc đối; Dứa dại có lá dài như dải băng xếp xoắn ốc ở đầu cành và có rễ chống.',
      },
    ],
    status: 'draft',
  },
  pandanus: {
    id: 'pandanus',
    name: 'Dứa dại',
    altNames: ['Dứa gai'],
    scientific: 'Pandanus tectorius',
    family: 'Pandanaceae',
    familyVi: 'Họ Dứa dại',
    group: 'associate',
    zoneOrder: 2,
    zone: 'Phía đất liền, nền đất cao, ít ngập',
    summary:
      'Dáng như một cây dừa thu nhỏ: lá dài tụ thành chùm ở đầu cành, gốc có nhiều rễ chống. Thường mọc ở phần đất cao phía trong, nơi ít bị ngập.',
    traits: {
      form: 'Cây nhỏ phân nhánh, lá mọc thành chùm ở đầu cành.',
      leaf: 'Lá dài, hẹp như dải băng, xếp xoắn ốc.',
      margin: 'Mép lá và gân giữa mặt dưới có gai sắc.',
      sap: 'Không có nhựa mủ trắng.',
      roots: 'Nhiều rễ chống mọc từ thân, cắm xuống đất.',
      flower: 'Cây đực có cụm hoa với các mo (lá bắc) màu trắng, thơm.',
      fruit: 'Quả kép to, hình cầu, sần như quả dứa; chín màu vàng cam.',
    },
    safety: { level: 'caution', text: 'Mép lá có gai sắc, dễ gây trầy xước.' },
    confusions: [
      {
        with: 'acanthus',
        tip: 'Cả hai đều có lá gai. Dứa dại có lá dài như dải băng và rễ chống; Ô rô là cây bụi thấp, lá ngắn, mọc đối.',
      },
    ],
    status: 'draft',
  },
  derris: {
    id: 'derris',
    name: 'Cóc kèn',
    altNames: [],
    scientific: 'Derris trifoliata',
    author: 'Lour.',
    family: 'Fabaceae',
    familyVi: 'Họ Đậu',
    group: 'associate',
    zoneOrder: 1.5,
    zone: 'Rải rác, leo bám lên tán cây khác',
    summary:
      'Dây leo thân gỗ, vắt lên tán các cây khác nên thường chỉ thấy rải rác. Nhận biết qua lá kép và chùm quả dẹt, mỏng.',
    traits: {
      form: 'Dây leo thân gỗ, quấn lên cây khác.',
      leaf: 'Lá kép lông chim lẻ, thường 3–5 lá chét.',
      margin: 'Mép lá chét nguyên, không có gai.',
      sap: 'Không có nhựa mủ trắng.',
      flower: 'Hoa nhỏ dạng hoa đậu, màu trắng đến hồng nhạt, mọc thành chùm.',
      fruit: 'Quả đậu dẹt, mỏng, có cánh hẹp dọc mép.',
    },
    status: 'draft',
  },
}

export const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[]
/** Water's edge → inland: the order used in every legend and chart. */
export const SPECIES_BY_ZONE = [...SPECIES_IDS].sort((a, b) => SPECIES[a].zoneOrder - SPECIES[b].zoneOrder)

export const speciesColorVar = (id: SpeciesId) => `var(--species-${id})`

/** Optional illustration dropped into public/images/species/<id>.webp. */
export const speciesImage = (id: SpeciesId) => `/images/species/${id}.webp`

// ---------------------------------------------------------------------------
// Condition reports (what local people most often need to flag)
// ---------------------------------------------------------------------------
export type ConditionId = 'erosion' | 'cutting' | 'waste' | 'dieback' | 'seedlings' | 'other'
export const CONDITIONS: Record<ConditionId, { label: string; hint: string }> = {
  erosion: { label: 'Sạt lở bờ', hint: 'Bờ đất, bờ lạch bị xói, cây nghiêng đổ' },
  cutting: { label: 'Chặt phá', hint: 'Cây bị chặt, bẻ cành, lấn chiếm' },
  waste: { label: 'Rác thải', hint: 'Rác dạt vào hoặc bị đổ trong rừng' },
  dieback: { label: 'Cây chết, khô héo', hint: 'Tán lá vàng, khô hoặc cây chết đứng' },
  seedlings: { label: 'Cây con mới mọc', hint: 'Cây con, trụ mầm mới bám rễ' },
  other: { label: 'Khác', hint: 'Điều gì đó cần người quản lý biết' },
}
export const CONDITION_IDS = Object.keys(CONDITIONS) as ConditionId[]
