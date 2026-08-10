import type {
  BlockDef,
  LandingContent,
  LandingDesign,
  MediaItem,
  Review,
} from '@/components/creator-dashboard/landing-renderer'
import { DEFAULT_CONTENT, DEFAULT_DESIGN } from '@/components/creator-dashboard/landing-renderer'

export type CommunityLandingState = {
  schemaVersion: 1
  blocks: BlockDef[]
  content: LandingContent
  design: LandingDesign
  media: MediaItem[]
  reviews: Review[]
}

export function normalizeCommunityLandingState(value: unknown): CommunityLandingState | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Partial<CommunityLandingState>
  if (!Array.isArray(source.blocks) || !source.content || !source.design) return null
  return {
    schemaVersion: 1,
    blocks: source.blocks,
    // New builder controls are added over time. Merge defaults so previously
    // saved landing pages continue to render safely and receive new controls.
    content: { ...DEFAULT_CONTENT, ...source.content },
    design: { ...DEFAULT_DESIGN, ...source.design },
    media: Array.isArray(source.media) ? source.media : [],
    reviews: Array.isArray(source.reviews) ? source.reviews : [],
  }
}
