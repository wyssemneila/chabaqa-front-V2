export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: "creator" | "member" | "admin"
  verified: boolean
  communities: number[]
  createdAt: Date
  updatedAt: Date
}

export interface Community {
  id: string
  slug: string
  name: string
  // Primary logo image for the community (from backend transformCommunityForFrontend)
  logo?: string
  creator: string
  creatorId: string
  creatorAvatar: string
  description: string
  longDescription: string
  category: string
  members: number
  rating: number
  price: number
  priceType: string
  image: string
  coverImage: string
  tags: string[]
  featured: boolean
  verified: boolean
  createdDate: string
  updatedDate?: string
  settings: {
    primaryColor: string
    secondaryColor: string
    welcomeMessage: string
    features: string[]
    benefits: string[]
    template: string
    fontFamily: string
    borderRadius: number
    backgroundStyle: string
    heroLayout: string
    showStats: boolean
    showFeatures: boolean
    showTestimonials: boolean
    showPosts: boolean
    showFAQ: boolean
    enableAnimations: boolean
    enableParallax: boolean
    logo: string
    heroBackground: string
    gallery: string[]
    videoUrl?: string
    socialLinks: {
      twitter?: string
      instagram?: string
      linkedin?: string
      discord?: string
      github?: string
      behance?: string
      youtube?: string
    }
    customSections: Array<{
      id: number
      type: string
      title: string
      content: string
      visible: boolean
    }>
    metaTitle: string
    metaDescription: string
  }
  stats: {
    totalRevenue: number
    monthlyGrowth: number
    engagementRate: number
    retentionRate: number
  }
}

export interface Course {
  mongoId?: string
  id: string
  titre?: string
  title?: string
  description: string
  thumbnail: string
  communityId: string
  community?: Community
  creatorId: string
  creator?: User
  prix?: number
  price?: number
  devise?: string
  currency?: string
  isPublished: boolean
  sections?: CourseSection[]
  enrollments?: CourseEnrollment[]
  createdAt: string | Date
  updatedAt?: string | Date
  category?: string
  niveau?: string
  level?: string
  duree?: string
  duration?: string
  learningObjectives?: string[]
  requirements?: string[]
  notes?: string
  ressources?: CourseResource[]
  resources?: CourseResource[]
}

export interface CourseSection {
  id: string
  title: string
  description: string
  courseId: string
  order: number
  chapters: CourseChapter[]
  createdAt: Date
}

export interface CourseChapter {
  id: string
  title: string
  content: string
  videoUrl?: string
  duration: number
  sectionId: string
  order: number
  isPreview: boolean
  price?: number
  notes?: string
  resources?: CourseResource[]
  createdAt: Date
}

export interface CourseEnrollment {
  id: string
  userId: string
  user: User
  courseId: string
  course: Course
  progress: CourseProgress[]
  enrolledAt: Date
  isActive: boolean
}

export interface CourseProgress {
  id: string
  enrollmentId: string
  chapterId: string
  chapter: CourseChapter
  isCompleted: boolean
  watchTime: number
  completedAt?: Date
  lastAccessedAt: Date
}

export interface Challenge {
  id: string
  title: string
  description: string
  communityId: string
  community: Community
  creatorId: string
  creator: User
  startDate: Date
  endDate: Date
  isActive: boolean
  participants: ChallengeParticipant[]
  posts: Post[]
  createdAt: Date
  depositAmount: number
  maxParticipants: number
  completionReward: number
  topPerformerBonus: number
  streakBonus: number
  category: string
  difficulty: string
  duration: string
  thumbnail: string
  notes: string
  resources: ChallengeResource[]
  tasks?: ChallengeTask[]
}

export interface ChallengeParticipant {
  id: string
  userId: string
  user: User
  challengeId: string
  challenge: Challenge
  joinedAt: Date
  isActive: boolean
  progress: number
}

export interface Session {
  id: string
  title: string
  description: string
  thumbnail?: string
  duration: number
  price: number
  currency: string
  communityId: string
  community: Community
  creatorId: string
  creator: User
  isActive: boolean
  bookings: SessionBooking[]
  createdAt: Date
  category: string
  maxBookingsPerWeek: number
  notes: string
  resources: SessionResource[]
  updatedAt?: Date
}

export interface SessionBooking {
  id: string
  sessionId: string
  session: Session
  userId: string
  user: User
  scheduledAt: Date
  status: "pending" | "confirmed" | "cancelled" | "completed"
  meetingUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  thumbnail: string
  communityId: string
  community: Community
  authorId: string
  author: User
  isPublished: boolean
  likes: number
  comments: Comment[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  content: string
  postId: string
  authorId: string
  author: User
  createdAt: Date
}

export interface LandingPageConfig {
  id: string
  communityId: string
  community: Community
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  primaryColor: string
  secondaryColor: string
  features: Feature[]
  testimonials: Testimonial[]
  isActive: boolean
  updatedAt: Date
  createdAt: Date
}

export interface Feature {
  id: string
  title: string
  description: string
  icon: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Testimonial {
  id: string
  content: string
  authorName: string
  authorAvatar: string
  authorTitle: string
  rating: number
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface CommunityMember {
  id: string
  userId: string
  user: User
  communityId: string
  community: Community
  joinedAt: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChallengeTask {
  id: string
  challengeId: string
  day: number
  title: string
  description: string
  deliverable: string
  isCompleted: boolean
  isActive: boolean
  points: number
  resources: Array<{
    id: string
    title: string
    type: string
    url: string
    description: string
  }>
  instructions: string
  notes: string
}

export interface CourseResource {
  id: string
  title: string
  type: string
  url: string
  description: string
  order: number
}

export interface ChallengeResource {
  id: string
  title: string
  type: string
  url: string
  description: string
  order: number
}

export interface SessionResource {
  id: string
  title: string
  type: string
  url: string
  description: string
  order: number
}

export interface EventSpeaker {
  id: string
  name: string
  title: string
  bio: string
  photo?: string
}

export interface EventSession {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  speaker: string
  attendance?: number
  notes?: string
  isActive: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  image?: string
  startDate: Date
  endDate?: Date
  startTime: string
  endTime: string
  timezone: string
  location: string
  onlineUrl?: string
  category: string
  type: "Online" | "In-person" | "Hybrid"
  isActive: boolean
  isPublished?: boolean
  price: number
  notes?: string
  attendees: any[]
  sessions: EventSession[]
  tickets: Array<{
    id: string
    type: string
    name: string
    price: number
    description: string
    quantity?: number
    sold: number
  }>
  speakers: EventSpeaker[]
}

export interface Product {
  id: string
  communityId: string
  title: string
  description: string
  price: number
  isPublished: boolean
  sales: number
  category: string
  images: string[]
  variants: Array<{
    id: string
    name: string
    price: number
  }>
  files: Array<{
    id: string
    name: string
    url: string
    type: string
    size: string
  }>
  rating: number
  createdAt: string
  creator: {
    id: string
    name: string
    avatar: string
  }
  licenseTerms?: string
  features?: string[]
}

export interface Purchase {
  id: string
  userId: string
  productId: string
  purchasedAt: string
  downloadCount: number
}

export interface CommunitiesData {
  categories: string[]
  sortOptions: Array<{
    value: string
    label: string
  }>
  communities: Community[]
}

// Type aliases for backward compatibility
export type Participant = ChallengeParticipant
export type Resource = ChallengeResource | CourseResource | SessionResource
export interface Step {
  id: number | string
  title: string
  description?: string
  status?: 'pending' | 'current' | 'completed'
}
