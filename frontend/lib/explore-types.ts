export type Explore = {
  id: string
  mongoId?: string
  type: 'community' | 'course' | 'challenge' | 'product' | 'oneToOne' | 'event'
  name: string
  slug: string
  creator: string
  creatorSlug?: string
  creatorAvatar: string
  description: string
  category: string
  members: number
  rating: number
  ratingCount?: number
  tags: string[]
  verified: boolean
  price: number
  priceType: 'free' | 'paid' | 'monthly' | 'yearly' | 'hourly'
  image: string
  featured: boolean
  link: string
  isMember?: boolean
  hasContentAccess?: boolean
  communityId?: string
  communityName?: string
  communitySlug?: string
}
