// ── Types ─────────────────────────────────────────────────────────────────
export type ContentType = 'community' | 'course' | 'challenge' | 'product' | 'session' | 'event'
export type Category = 'all' | 'fitness' | 'education' | 'technology' | 'business' | 'creative' | 'language'

export interface ExploreItem {
  id: string
  type: ContentType
  category: Exclude<Category, 'all'>
  title: string
  desc: string
  creator: string
  creatorInitials: string
  creatorAvatar?: string
  creatorColor: string
  banner: string
  price: number | 'free'
  currency?: string
  members?: number
  rating?: number
  ratingCount?: number
  verified?: boolean
  featured?: boolean
  duration?: string
  date?: string
  url: string
  // Access-aware routing fields
  slug?: string
  mongoId?: string
  communitySlug?: string
  creatorSlug?: string
  communityId?: string
  isMember?: boolean
  hasContentAccess?: boolean
}

// ── Categories ────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = ['all', 'fitness', 'education', 'technology', 'business', 'creative', 'language']

// ── Content types ─────────────────────────────────────────────────────────
export const CONTENT_TYPES: ContentType[] = ['community', 'course', 'challenge', 'product', 'session', 'event']

export const TYPE_CONFIG: Record<ContentType, { label: string; bg: string; color: string; border: string }> = {
  community: { label: 'Community', bg: 'rgba(71,199,234,0.12)', color: '#47c7ea', border: 'rgba(71,199,234,0.3)' },
  course: { label: 'Course', bg: 'rgba(71,199,234,0.12)', color: '#47c7ea', border: 'rgba(71,199,234,0.3)' },
  challenge: { label: 'Challenge', bg: 'rgba(255,155,40,0.12)', color: '#ff9b28', border: 'rgba(255,155,40,0.3)' },
  product: { label: 'Product', bg: 'rgba(142,120,251,0.12)', color: '#8e78fb', border: 'rgba(142,120,251,0.3)' },
  session: { label: '1:1 Session', bg: 'rgba(246,88,135,0.12)', color: '#f65887', border: 'rgba(246,88,135,0.3)' },
  event: { label: 'Event', bg: 'rgba(142,120,251,0.12)', color: '#8e78fb', border: 'rgba(142,120,251,0.3)' },
}

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
] as const
