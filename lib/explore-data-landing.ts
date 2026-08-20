// ── Types ─────────────────────────────────────────────────────────────────
export type ContentType = 'community' | 'course' | 'challenge' | 'product' | 'session' | 'event'
export type Category    = 'all' | 'fitness' | 'education' | 'technology' | 'business' | 'creative' | 'language'

export interface ExploreItem {
  id:               string
  type:             ContentType
  category:         Exclude<Category, 'all'>
  title:            string
  desc:             string
  creator:          string
  creatorInitials:  string
  creatorAvatar?:   string          // path to creator avatar image
  creatorColor:     string
  banner:           string          // path to banner image (required)
  price:            number | 'free'
  currency?:        string
  members?:         number
  rating?:          number
  ratingCount?:     number
  verified?:        boolean
  featured?:        boolean
  duration?:        string
  date?:            string
}

// ── Categories ────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = ['all', 'fitness', 'education', 'technology', 'business', 'creative', 'language']

// ── Content types ─────────────────────────────────────────────────────────
export const CONTENT_TYPES: ContentType[] = ['community', 'course', 'challenge', 'product', 'session', 'event']

export const TYPE_CONFIG: Record<ContentType, { label: string; bg: string; color: string; border: string }> = {
  community: { label: 'Community',   bg: 'rgba(71,199,234,0.12)',  color: '#47c7ea',  border: 'rgba(71,199,234,0.3)'  },
  course:    { label: 'Course',      bg: 'rgba(71,199,234,0.12)',  color: '#47c7ea',  border: 'rgba(71,199,234,0.3)'  },
  challenge: { label: 'Challenge',   bg: 'rgba(255,155,40,0.12)',  color: '#ff9b28',  border: 'rgba(255,155,40,0.3)'  },
  product:   { label: 'Product',     bg: 'rgba(142,120,251,0.12)', color: '#8e78fb',  border: 'rgba(142,120,251,0.3)' },
  session:   { label: '1:1 Session', bg: 'rgba(246,88,135,0.12)',  color: '#f65887',  border: 'rgba(246,88,135,0.3)'  },
  event:     { label: 'Event',       bg: 'rgba(142,120,251,0.12)', color: '#8e78fb',  border: 'rgba(142,120,251,0.3)' },
}

export const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most Popular'        },
  { value: 'newest',     label: 'Newest'              },
  { value: 'rating',     label: 'Top Rated'           },
  { value: 'price-low',  label: 'Price: Low to High'  },
  { value: 'price-high', label: 'Price: High to Low'  },
] as const

// ── Featured Communities ───────────────────────────────────────────────────
export const FEATURED_COMMUNITIES: ExploreItem[] = [
  {
    id: 'f1',
    type: 'community', category: 'business',
    title: 'RYEDA',
    desc: 'A business growth community by Ahmed Hatem. Courses, sessions, and challenges to help you scale your business.',
    creator: 'Ahmed Hatem', creatorInitials: 'AH', creatorColor: '#8e78fb',
    creatorAvatar: '/images/explore/banner8.webp',
    banner: '/images/explore/banner9.webp',
    price: 'free', members: 156, rating: 4.8, ratingCount: 42, verified: true, featured: true,
  },
  {
    id: 'f2',
    type: 'community', category: 'fitness',
    title: 'Runflow',
    desc: 'The #1 running community in Tunisia. Training plans, challenges, and a supportive community to keep you moving.',
    creator: 'Bassem Dridi', creatorInitials: 'BD', creatorColor: '#ff9b28',
    creatorAvatar: '/images/explore/banner7.webp',
    banner: '/images/explore/banner6.png',
    price: 'free', members: 89, rating: 4.9, ratingCount: 28, verified: true, featured: true,
  },
  {
    id: 'f3',
    type: 'community', category: 'creative',
    title: 'Motion Masters',
    desc: 'Learn motion design, After Effects, and animation from professional creators. Arabic content, global techniques.',
    creator: 'Mohamed Ismail', creatorInitials: 'MI', creatorColor: '#f65887',
    creatorAvatar: '/images/explore/banner2.jpeg',
    banner: '/images/explore/banner3.webp',
    price: 'free', members: 312, rating: 4.7, ratingCount: 67, verified: true, featured: true,
  },
  {
    id: 'f4',
    type: 'community', category: 'language',
    title: 'French Academy',
    desc: 'Master the French language with an Arabic-speaking teacher. Structured courses, live sessions, and practice challenges.',
    creator: 'Wyssem Neila', creatorInitials: 'WN', creatorColor: '#47c7ea',
    creatorAvatar: '/images/explore/banner1.jpeg',
    banner: '/images/explore/frensh1.png',
    price: 'free', members: 45, rating: 4.6, ratingCount: 11, verified: false, featured: true,
  },
]

// ── Content Items ──────────────────────────────────────────────────────────
export const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: '1',
    type: 'community', category: 'creative',
    title: 'موشن غرافيك و أنيماشين',
    desc: 'تعلم الحركة والتصميم بالعربية مع أفضل المحترفين في المنطقة.',
    creator: 'Mohamed Ismail', creatorInitials: 'MI', creatorColor: '#f65887',
    creatorAvatar: '/images/explore/banner2.jpeg',
    banner: '/images/explore/banner4.webp',
    price: 20, currency: 'TND', members: 23, rating: 4.5, ratingCount: 14, verified: true,
  },
  {
    id: '2',
    type: 'course', category: 'creative',
    title: 'After Effect Template Rigging',
    desc: 'Complete rigging course for After Effects — create dynamic, reusable character rigs from scratch.',
    creator: 'Mohamed Ismail', creatorInitials: 'MI', creatorColor: '#f65887',
    creatorAvatar: '/images/explore/banner2.jpeg',
    banner: '/images/explore/maxresdefault.jpg',
    price: 13, currency: 'TND', members: 14, rating: 4.0, ratingCount: 1, duration: '6 weeks', verified: true,
  },
  {
    id: '3',
    type: 'challenge', category: 'creative',
    title: 'rigging animation — 🏆 تحدي الـ ٧ أيام — تعلم تحريك الشخصيات',
    desc: '7-day character animation challenge. Build your rigging skills one day at a time.',
    creator: 'Mohamed Ismail', creatorInitials: 'MI', creatorColor: '#f65887',
    creatorAvatar: '/images/explore/banner2.jpeg',
    banner: '/images/explore/banner5.jpeg',
    price: 'free', members: 11, rating: 4.6, ratingCount: 7, verified: true,
  },
  {
    id: '4',
    type: 'session', category: 'business',
    title: '👑 جلسة تشخيص وتوسيع بيزنسك — من أين تبدأ؟',
    desc: 'Personalized 1:1 business diagnosis session. Get a clear roadmap for scaling your revenue.',
    creator: 'Ahmed Hatem', creatorInitials: 'AH', creatorColor: '#8e78fb',
    creatorAvatar: '/images/explore/banner8.webp',
    banner: '/images/explore/banner11.png',
    price: 'free', members: 4, rating: 4.9, ratingCount: 8, verified: true,
  },
  {
    id: '5',
    type: 'course', category: 'business',
    title: 'دليلك الكامل لتوسيع بيزنسك',
    desc: 'A complete Arabic guide to expanding your business — strategy, marketing, and monetization.',
    creator: 'Ahmed Hatem', creatorInitials: 'AH', creatorColor: '#8e78fb',
    creatorAvatar: '/images/explore/banner8.webp',
    banner: '/images/explore/banner10.webp',
    price: 'free', members: 12, rating: 4.5, ratingCount: 6, verified: true,
  },
  {
    id: '6',
    type: 'session', category: 'business',
    title: 'Strategy Session — Scale Your Online Business',
    desc: 'Book a private 1-on-1 session with Ahmed Hatem to map out your growth strategy.',
    creator: 'Ahmed Hatem', creatorInitials: 'AH', creatorColor: '#8e78fb',
    creatorAvatar: '/images/explore/banner8.webp',
    banner: '/images/explore/banner12.png',
    price: 80, currency: 'TND', members: 3, rating: 5.0, ratingCount: 5, verified: true,
  },
  {
    id: '7',
    type: 'product', category: 'creative',
    title: 'Motion Design Pack — After Effects Templates',
    desc: 'Professional After Effects templates for motion designers. 30+ ready-to-use animations.',
    creator: 'Mohamed Ismail', creatorInitials: 'MI', creatorColor: '#f65887',
    creatorAvatar: '/images/explore/banner2.jpeg',
    banner: '/images/explore/banner2.jpeg',
    price: 30, currency: 'TND', rating: 4.8, ratingCount: 12, verified: true,
  },
  {
    id: '8',
    type: 'challenge', category: 'fitness',
    title: '30-Day Runflow Challenge',
    desc: 'Build a daily running habit in 30 days. Daily goals, progress tracking, and community support.',
    creator: 'Bassem Dridi', creatorInitials: 'BD', creatorColor: '#ff9b28',
    creatorAvatar: '/images/explore/banner7.webp',
    banner: '/images/explore/banner7.webp',
    price: 'free', members: 23, rating: 4.7, ratingCount: 10, verified: true,
  },
  {
    id: '9',
    type: 'event', category: 'business',
    title: 'Live Workshop: Business Growth in 2025',
    desc: 'Join Ahmed Hatem for a live workshop on scaling your business in the digital age.',
    creator: 'Ahmed Hatem', creatorInitials: 'AH', creatorColor: '#8e78fb',
    creatorAvatar: '/images/explore/banner8.webp',
    banner: '/images/explore/banner9.webp',
    price: 'free', members: 8, rating: 4.7, ratingCount: 19, verified: true,
  },
  {
    id: '10',
    type: 'course', category: 'language',
    title: 'تعلم الفرنسية من الصفر — المستوى الأول',
    desc: 'Complete beginner French course taught in Arabic. Master the basics in 4 weeks.',
    creator: 'Wyssem Neila', creatorInitials: 'WN', creatorColor: '#47c7ea',
    creatorAvatar: '/images/explore/banner1.jpeg',
    banner: '/images/explore/frensh1.png',
    price: 49, currency: 'TND', members: 45, rating: 4.4, ratingCount: 9, verified: false,
  },
  {
    id: '11',
    type: 'product', category: 'fitness',
    title: 'Runflow Training Program Bundle',
    desc: '12-week structured training program with nutrition guides and weekly live Q&A sessions.',
    creator: 'Bassem Dridi', creatorInitials: 'BD', creatorColor: '#ff9b28',
    creatorAvatar: '/images/explore/banner7.webp',
    banner: '/images/explore/banner6.png',
    price: 59, currency: 'TND', rating: 4.9, ratingCount: 23, verified: true,
  },
  {
    id: '12',
    type: 'community', category: 'business',
    title: 'RYEDA — Business Growth Network',
    desc: 'The RYEDA inner circle. Exclusive content, weekly calls, and direct access to Ahmed Hatem.',
    creator: 'Ahmed Hatem', creatorInitials: 'AH', creatorColor: '#8e78fb',
    creatorAvatar: '/images/explore/banner8.webp',
    banner: '/images/explore/banner9.webp',
    price: 'free', members: 5, rating: 4.3, ratingCount: 3, verified: true,
  },
]
