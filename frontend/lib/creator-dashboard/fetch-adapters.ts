import type { ActivityItem, Community, ContentItem, KpiCard, OnboardStep } from '@/lib/dashboard-data'
import type { CourseCardData } from '@/components/courses/course-card'
import { resolveImageUrl } from '@/lib/resolve-image-url'

export type CreatorListStatus = 'idle' | 'loading' | 'success' | 'error'

export interface CreatorDashboardOverviewVm {
  kpis: KpiCard[]
  onboarding: OnboardStep[]
  activity: ActivityItem[]
  content: ContentItem[]
  communities: Community[]
}

export interface CreatorChallengeCard {
  id: string
  mongoId?: string
  publicId?: string
  title: string
  description: string
  category: string
  difficulty: string
  durationDays: number
  sequential: boolean
  maxParticipants: number | 'unlimited'
  startDate: string
  completionReward: string
  topPerformerReward: string
  priceType: 'free' | 'paid'
  price: number
  isPublished: boolean
  steps: any[]
  banner?: string
}

export interface CreatorEventCard {
  id: string
  mongoId?: string
  publicId?: string
  title: string
  description: string
  category: string
  format: 'online' | 'offline' | 'hybrid'
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  coverPreview: string
  status: 'draft' | 'published'
  tickets: { id: string; pricing: 'free' | 'paid'; price: number }[]
  capacity: number | 'unlimited'
}

export interface CreatorProductCard {
  id: string
  title: string
  description: string
  category: string
  thumbnail: string
  license: string
  priceType: 'free' | 'paid'
  price: number
  hasTiers: boolean
  tiers: any[]
  isPublished: boolean
  files: any[]
  whatIncluded: string[]
}

export interface CreatorSessionCard {
  _id: string
  id?: string
  mongoId?: string
  publicId?: string
  title: string
  banner?: string
  duration: number
  priceType: 'free' | 'paid'
  price?: number
  isActive: boolean
  availabilityDays: number
  totalSlots: number
}

export interface CreatorBookingCard {
  _id: string
  studentName: string
  studentEmail: string
  sessionId: string
  sessionTitle: string
  duration: number
  price: number
  date: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed'
  meetLink?: string
}

const asArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.data?.data)) return raw.data.data
  if (Array.isArray(raw?.data?.items)) return raw.data.items
  if (Array.isArray(raw?.data?.results)) return raw.data.results
  if (Array.isArray(raw?.data?.docs)) return raw.data.docs
  if (Array.isArray(raw?.data?.data?.items)) return raw.data.data.items
  if (Array.isArray(raw?.data?.data?.results)) return raw.data.data.results
  if (Array.isArray(raw?.data?.data?.docs)) return raw.data.data.docs
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.results)) return raw.results
  if (Array.isArray(raw?.docs)) return raw.docs

  const pluralKeys = [
    'communities',
    'courses',
    'cours',
    'challenges',
    'events',
    'products',
    'sessions',
    'posts',
    'bookings',
    'payouts',
    'campaigns',
    'data',
  ]

  for (const key of pluralKeys) {
    if (Array.isArray(raw?.[key])) return raw[key]
    if (Array.isArray(raw?.data?.[key])) return raw.data[key]
    if (Array.isArray(raw?.data?.data?.[key])) return raw.data.data[key]
  }

  return []
}

export const unwrapArray = asArray

export const unwrapRequiredArray = (raw: any): any[] => {
  const list = asArray(raw)
  if (list.length > 0 || Array.isArray(raw)) return list

  const hasListShape = [
    raw?.data,
    raw?.data?.data,
    raw?.items,
    raw?.results,
    raw?.docs,
    ...['communities', 'courses', 'cours', 'challenges', 'events', 'products', 'sessions', 'posts', 'bookings']
      .flatMap((key) => [raw?.[key], raw?.data?.[key], raw?.data?.data?.[key]]),
  ].some(Array.isArray)

  if (!hasListShape) throw new Error('The server returned an invalid list response.')
  return list
}

export const unwrapData = <T = any>(raw: any, fallback: T): T => {
  if (raw?.data?.data !== undefined) return raw.data.data as T
  if (raw?.data !== undefined) return raw.data as T
  if (raw !== undefined && raw !== null) return raw as T
  return fallback
}

const text = (...values: any[]) => {
  const found = values.find((value) => typeof value === 'string' && value.trim().length > 0)
  return found ? String(found) : ''
}

const number = (...values: any[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

const bool = (...values: any[]) => {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value > 0
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'yes', 'published', 'active', 'live'].includes(normalized)) return true
      if (['false', '0', 'no', 'draft', 'inactive', 'archived'].includes(normalized)) return false
    }
  }
  return false
}

const id = (item: any) => text(item?._id, item?.id, item?.mongoId, item?.slug) || `item-${Math.random().toString(36).slice(2)}`
const mongoId = (item: any) => text(item?.mongoId, item?._id, item?.id, item?.slug) || `item-${Math.random().toString(36).slice(2)}`

const dateOnly = (value: any) => {
  const raw = text(value)
  if (!raw) return ''
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? raw : date.toISOString().slice(0, 10)
}

const daysBetween = (from: any, to: any) => {
  const start = new Date(text(from))
  const end = new Date(text(to))
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
}

const isPlaceholderImage = (value: string) => {
  const raw = value.trim().toLowerCase()
  return (
    raw.includes('/placeholder') ||
    raw.includes('placeholder.svg') ||
    raw.includes('placeholder-logo') ||
    raw.includes('placehold.co') ||
    raw.includes('dummyimage.com') ||
    raw.includes('ui-avatars.com')
  )
}

const imageStrings = (value: any): string[] => {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(imageStrings)
  if (typeof value !== 'object') return []

  return [
    value.url,
    value.secureUrl,
    value.secure_url,
    value.image,
    value.imageUrl,
    value.thumbnail,
    value.thumbnailUrl,
    value.coverImage,
    value.coverImageUrl,
    value.banner,
    value.bannerUrl,
    value.photo,
    value.path,
    value.src,
    value.location,
    value.href,
    value.fileUrl,
    value.downloadUrl,
    value.storageKey,
    value.key,
    value.filename,
  ].flatMap(imageStrings)
}

const firstImage = (item: any) => {
  const candidates = [
    item?.imageUrl,
    item?.thumbnailUrl,
    item?.coverImageUrl,
    item?.bannerUrl,
    item?.thumbnail,
    item?.image,
    item?.coverImage,
    item?.photo,
    item?.photo_de_couverture,
    item?.banner,
    item?.cover,
    item?.logo,
    item?.logoUrl,
    item?.images,
    item?.media,
    item?.attachments,
    item?.file,
    item?.asset,
  ].flatMap(imageStrings)

  const realImage = candidates.find((candidate) => candidate.trim() && !isPlaceholderImage(candidate))
  const fallback = candidates.find((candidate) => candidate.trim())
  return resolveImageUrl(realImage || fallback) || ''
}

export const mapCommunity = (item: any): Community => ({
  emoji: text(item?.emoji) || '◎',
  name: text(item?.name, item?.title) || 'Untitled community',
  verified: bool(item?.verified, item?.isVerified),
  description: text(item?.description, item?.bio, item?.longDescription) || 'No description yet',
  members: number(item?.membersCount, item?.members, item?.memberCount),
  category: text(item?.category) || 'Community',
  plan: text(item?.plan, item?.subscriptionPlan) || (number(item?.price, item?.feeAmount) > 0 ? 'Paid' : 'Free'),
})

export const mapCourse = (item: any): CourseCardData => {
  const duration = number(item?.duration, item?.duree)
  const itemId = mongoId(item)
  const publicId = text(item?.id)
  return {
    _id: itemId,
    id: itemId,
    mongoId: itemId,
    publicId: publicId && publicId !== itemId ? publicId : undefined,
    title: text(item?.title, item?.titre, item?.name) || 'Untitled course',
    description: text(item?.description, item?.summary),
    thumbnail: firstImage(item),
    level: text(item?.level, item?.niveau) || 'beginner',
    duration: duration > 60 ? Math.round(duration / 60) : duration,
    priceType: number(item?.price, item?.prix) > 0 ? 'paid' : (item?.priceType || 'free'),
    price: number(item?.price, item?.prix),
    isPublished: bool(item?.isPublished, item?.published, item?.status),
    sectionsCount: number(item?.sectionsCount, item?.sections?.length),
    chaptersCount: number(item?.chaptersCount, item?.chapters?.length),
    enrollmentsCount: number(item?.enrollmentsCount, item?.enrollmentCount, item?.studentsCount),
  }
}

export const mapChallenge = (item: any): CreatorChallengeCard => {
  const price = number(item?.participationFee, item?.pricing?.participationFee, item?.price)
  const itemId = mongoId(item)
  const publicId = text(item?.id)
  return {
    id: itemId,
    mongoId: itemId,
    publicId: publicId && publicId !== itemId ? publicId : undefined,
    title: text(item?.title, item?.name) || 'Untitled challenge',
    description: text(item?.description) || 'No description yet',
    category: text(item?.category) || 'Challenge',
    difficulty: text(item?.difficulty) || 'beginner',
    durationDays: number(item?.durationDays) || daysBetween(item?.startDate, item?.endDate) || number(item?.tasks?.length),
    sequential: bool(item?.sequentialProgression),
    maxParticipants: number(item?.maxParticipants) || 'unlimited',
    startDate: dateOnly(item?.startDate),
    completionReward: String(number(item?.completionReward, item?.pricing?.completionReward)),
    topPerformerReward: String(number(item?.topPerformerBonus, item?.pricing?.topPerformerBonus)),
    priceType: price > 0 ? 'paid' : 'free',
    price,
    isPublished: bool(item?.isPublished, item?.published, item?.isActive, item?.status),
    steps: asArray(item?.tasks || item?.steps),
    banner: firstImage(item),
  }
}

export const mapEvent = (item: any): CreatorEventCard => {
  const type = text(item?.type, item?.format).toLowerCase()
  const isOnline = bool(item?.isVirtual) || type.includes('online')
  const format: CreatorEventCard['format'] = type.includes('hybrid') ? 'hybrid' : isOnline ? 'online' : 'offline'
  const itemMongoId = mongoId(item)
  const itemPublicId = text(item?.id)
  const tickets = asArray(item?.tickets || item?.ticketTypes).map((ticket: any, index) => ({
    id: text(ticket?._id, ticket?.id, ticket?.mongoId) || `ticket-${index}`,
    pricing: number(ticket?.price) > 0 ? 'paid' as const : 'free' as const,
    price: number(ticket?.price),
  }))

  return {
    id: itemMongoId,
    mongoId: itemMongoId,
    publicId: itemPublicId && itemPublicId !== itemMongoId ? itemPublicId : undefined,
    title: text(item?.title, item?.name) || 'Untitled event',
    description: text(item?.description) || 'No description yet',
    category: text(item?.category) || 'Event',
    format,
    startDate: dateOnly(item?.startDate),
    startTime: text(item?.startTime),
    endDate: dateOnly(item?.endDate),
    endTime: text(item?.endTime),
    coverPreview: firstImage(item),
    status: bool(item?.isPublished, item?.published, item?.status) ? 'published' : 'draft',
    tickets,
    capacity: number(item?.maxAttendees, item?.capacity) || 'unlimited',
  }
}

export const mapProduct = (item: any): CreatorProductCard => {
  const price = number(item?.price)
  const tiers = asArray(item?.tiers || item?.variants)
  const itemId = id(item)
  return {
    id: itemId,
    title: text(item?.title, item?.name) || 'Untitled product',
    description: text(item?.description) || 'No description yet',
    category: text(item?.category, item?.type) || 'Digital',
    thumbnail: firstImage(item),
    license: text(item?.license, item?.licenseTerms) || 'standard',
    priceType: price > 0 ? 'paid' : 'free',
    price,
    hasTiers: tiers.length > 0,
    tiers,
    isPublished: bool(item?.isPublished, item?.published, item?.status),
    files: asArray(item?.files),
    whatIncluded: asArray(item?.features || item?.whatIncluded).map(String),
  }
}

export const mapSession = (item: any): CreatorSessionCard => {
  const itemId = mongoId(item)
  const publicId = text(item?.id)
  return {
    _id: itemId,
    id: itemId,
    mongoId: itemId,
    publicId: publicId && publicId !== itemId ? publicId : undefined,
    title: text(item?.title, item?.name) || 'Untitled session',
    banner: firstImage(item),
    duration: number(item?.duration),
    priceType: number(item?.price) > 0 ? 'paid' : 'free',
    price: number(item?.price),
    // The creator API exposes publication through isActive; status is only
    // the session's upcoming/past scheduling state.
    isActive: bool(item?.isActive),
    availabilityDays: number(item?.availabilityDays, item?.availableDays),
    totalSlots: number(item?.totalSlots, item?.availableSlots),
  }
}

export const mapBooking = (item: any): CreatorBookingCard => {
  const rawStatus = text(item?.status)
  const status = rawStatus === 'cancelled' ? 'rejected' : rawStatus
  return {
    _id: id(item),
    studentName: text(item?.studentName, item?.userName, item?.user?.name) || 'Student',
    studentEmail: text(item?.studentEmail, item?.userEmail, item?.user?.email),
    sessionId: text(item?.sessionId, item?.session?.id),
    sessionTitle: text(item?.sessionTitle, item?.session?.title) || 'Session',
    duration: number(item?.duration, item?.sessionDuration, item?.session?.duration),
    price: number(item?.price, item?.sessionPrice, item?.session?.price),
    date: text(item?.date, item?.scheduledAt, item?.createdAt) || new Date().toISOString(),
    status: ['pending', 'confirmed', 'rejected', 'completed'].includes(status) ? status as CreatorBookingCard['status'] : 'pending',
    meetLink: text(item?.meetLink, item?.meetingLink, item?.meetingUrl),
  }
}

export const makeDashboardOverview = (input: {
  overview?: any
  communities?: any[]
  courses?: any[]
  challenges?: any[]
  sessions?: any[]
  events?: any[]
  products?: any[]
  posts?: any[]
  payouts?: any
  balance?: any
}): CreatorDashboardOverviewVm => {
  const overview = input.overview || {}
  const communities = (input.communities || []).map(mapCommunity)
  const courses = (input.courses || []).map(mapCourse)
  const challenges = (input.challenges || []).map(mapChallenge)
  const sessions = (input.sessions || []).map(mapSession)
  const events = (input.events || []).map(mapEvent)
  const products = (input.products || []).map(mapProduct)
  const posts = input.posts || []

  const members = number(overview?.totalMembers, overview?.members, overview?.membersCount, communities.reduce((sum, c) => sum + c.members, 0))
  const revenue = number(input.balance?.availableBalance, input.balance?.balance, input.payouts?.totalRevenue, overview?.totalRevenue, overview?.revenue)
  const engagement = number(overview?.avgEngagement, overview?.engagementRate, overview?.engagement)

  const content: ContentItem[] = [
    ...courses.slice(0, 3).map((course) => ({
      emoji: '',
      name: course.title,
      type: 'Course' as const,
      enrollPrompt: `${course.enrollmentsCount ?? 0} enrolled`,
    })),
    ...challenges.slice(0, 3).map((challenge) => ({
      emoji: '',
      name: challenge.title,
      type: 'Challenge' as const,
      enrollPrompt: `${challenge.maxParticipants === 'unlimited' ? 0 : challenge.maxParticipants} participants`,
    })),
    ...sessions.slice(0, 2).map((session) => ({
      emoji: '',
      name: session.title,
      type: 'Session' as const,
      enrollPrompt: `${session.totalSlots} slots`,
    })),
    ...posts.slice(0, 2).map((post: any) => ({
      emoji: '',
      name: text(post?.title, post?.content) || 'Post',
      type: 'Post' as const,
      enrollPrompt: `${number(post?.commentsCount, post?.reactionsCount)} interactions`,
    })),
  ].slice(0, 8)

  const activity: ActivityItem[] = [
    ...challenges.slice(0, 2).map((challenge) => ({
      type: 'challenge' as const,
      label: 'New Challenge',
      name: challenge.title,
      time: challenge.startDate || 'Recently',
    })),
    ...courses.slice(0, 2).map((course) => ({
      type: 'course' as const,
      label: 'New Course',
      name: course.title,
      time: 'Recently',
    })),
  ].slice(0, 5)

  return {
    kpis: [
      { label: 'Total Members', value: String(members), trend: 'Live data', trendDir: 'flat', iconColor: '#2a5cff', iconBg: '#eef1ff', icon: 'users' },
      { label: 'Total Courses', value: String(courses.length), trend: 'From API', trendDir: 'flat', iconColor: '#1a7a4a', iconBg: '#eaf5ee', icon: 'book' },
      { label: 'Total Challenges', value: String(challenges.length), trend: 'From API', trendDir: 'flat', iconColor: '#8a5a00', iconBg: '#fef6e4', icon: 'bolt' },
      { label: 'Total Sessions', value: String(sessions.length), trend: 'From API', trendDir: 'flat', iconColor: '#9a9890', iconBg: '#f5f4f0', icon: 'calendar' },
      { label: 'Total Revenue', value: revenue.toFixed(2), trend: 'Available balance', trendDir: revenue > 0 ? 'up' : 'flat', iconColor: '#1a7a4a', iconBg: '#eaf5ee', icon: 'dollar' },
      { label: 'Avg. Engagement', value: `${Math.round(engagement)}%`, trend: engagement ? 'Tracked' : 'No activity yet', trendDir: engagement ? 'up' : 'flat', iconColor: '#2a5cff', iconBg: '#eef1ff', icon: 'pulse' },
    ],
    onboarding: [
      { id: 'community', label: 'Create a community', done: communities.length > 0 },
      { id: 'course', label: 'Add your first course', done: courses.length > 0 },
      { id: 'share', label: 'Share your invite link', done: members > 1 },
    ],
    activity,
    content,
    communities,
  }
}
