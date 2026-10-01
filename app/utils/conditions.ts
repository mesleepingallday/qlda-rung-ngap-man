import { Axe, Leaf, Sprout, Trash2, TriangleAlert, Waves } from '@lucide/vue'
import type { ConditionId } from '~/data/species'

/** Icon + neutral tint for each condition-report type. */
export const CONDITION_ICON: Record<ConditionId, typeof Axe> = {
  erosion: Waves,
  cutting: Axe,
  waste: Trash2,
  dieback: Leaf,
  seedlings: Sprout,
  other: TriangleAlert,
}
