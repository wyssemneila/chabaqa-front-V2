export type CommunityTab =
  | 'feed' | 'courses' | 'challenges' | 'sessions'
  | 'products' | 'events' | 'reviews' | 'progress' | 'members'

export interface CommunityMember {
  id: string
  name: string
  handle: string
  email: string
  avatar: string | null
  initials: string
  color: string
  role: 'owner' | 'admin' | 'moderator' | 'member'
  isYou?: boolean
}

export interface CommunityPost {
  id: string
  authorName: string
  authorHandle: string
  authorAvatar: string | null
  authorInitials: string
  authorColor: string
  content: string
  timeAgo: string
  likes: number
  comments: number
  saves: number
}

export interface CommunityCourse {
  id: string
  title: string
  titleAr: string
  instructor: string
  studentsCount: number
  lessonsCount: number
  duration: string
  level: 'beginner' | 'intermediate' | 'advanced'
  rating: number
  thumbnail: string | null
  price: 'free' | number
  currency?: string
  enrolled?: boolean
  progress?: number
}

export interface CommunityChallenge {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  participantsCount: number
  startDate: string
  status: 'upcoming' | 'active' | 'ended'
  progress?: number
}

export interface CommunitySession {
  id: string
  title: string
  mentorName: string
  mentorAvatar: string | null
  mentorInitials: string
  mentorColor: string
  duration: number
  price: number
  currency: string
  rating: number
  reviewsCount: number
  availableSlots: number
  booked?: boolean
}

export interface CommunityProduct {
  id: string
  title: string
  description: string
  price: number | 'free'
  currency?: string
  type: 'ebook' | 'template' | 'preset' | 'other'
  thumbnail: string | null
  downloadsCount: number
  purchased?: boolean
}

export interface CommunityEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  type: 'online' | 'in-person'
  ticketsTotal: number
  ticketsSold: number
  price: number | 'free'
  currency?: string
  registered?: boolean
}

export interface CommunityReview {
  id: string
  authorName: string
  authorInitials: string
  authorColor: string
  rating: number
  comment: string
  date: string
}

export interface CommunityData {
  slug: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  banner: string | null
  avatarColor: string
  avatarInitials: string
  creatorName: string
  creatorHandle: string
  membersCount: number
  postsThisWeek: number
  activeTodayCount: number
  rating: number
  ratingCount: number
  isJoined: boolean
  tabs: CommunityTab[]
  members: CommunityMember[]
  posts: CommunityPost[]
  courses: CommunityCourse[]
  challenges: CommunityChallenge[]
  sessions: CommunitySession[]
  products: CommunityProduct[]
  events: CommunityEvent[]
  reviews: CommunityReview[]
}

const MOTION_SCHOOL: CommunityData = {
  slug: 'motion-school',
  name: 'Motion School',
  nameAr: 'مدرسة الموشن',
  description: 'A creative community specialized in motion arts & digital creativity — video editing, animation, and 3D for all levels.',
  descriptionAr: 'مجتمع إبداعي متخصص في تعليم فنون الحركة والإبداع الرقمي — تحرير الفيديو والأنيميشن والثلاثي الأبعاد لجميع المستويات.',
  banner: null,
  avatarColor: '#8e78fb',
  avatarInitials: 'MS',
  creatorName: 'Mohamed Trabelsi',
  creatorHandle: 'mohamedtrabelsi',
  membersCount: 8,
  postsThisWeek: 1,
  activeTodayCount: 1,
  rating: 5.0,
  ratingCount: 1,
  isJoined: true,
  tabs: ['feed','courses','challenges','sessions','products','events','reviews','progress','members'],
  members: [
    { id:'1', name:'Wyssem Neila', handle:'wys-sem', email:'clashwissem49@gmail.com', avatar:null, initials:'WN', color:'#8e78fb', role:'member', isYou:true },
    { id:'2', name:'Mohamed Trabelsi', handle:'mohamedtrabelsi', email:'', avatar:null, initials:'MT', color:'#47c7ea', role:'owner' },
    { id:'3', name:'Louay Rjili', handle:'louay-rjili', email:'', avatar:null, initials:'LR', color:'#f65887', role:'member' },
    { id:'4', name:'Ghassen Zaouali', handle:'ghassen-zaouali', email:'', avatar:null, initials:'GZ', color:'#ff9b28', role:'member' },
    { id:'5', name:'Ahmed Ben Ali', handle:'ahmedbenali', email:'', avatar:null, initials:'AB', color:'#8e78fb', role:'member' },
    { id:'6', name:'Maryem Yousfi', handle:'maryem-yousfi', email:'', avatar:null, initials:'MY', color:'#47c7ea', role:'member' },
    { id:'7', name:'Chabaqa Contact', handle:'chabaqa-contact', email:'', avatar:null, initials:'CC', color:'#c4b8fd', role:'member' },
    { id:'8', name:'Yassine Aniba', handle:'yassine-aniba', email:'', avatar:null, initials:'YA', color:'#f65887', role:'member' },
  ],
  posts: [
    { id:'1', authorName:'Ahmed Ben Ali', authorHandle:'ahmedbenali', authorAvatar:null, authorInitials:'AB', authorColor:'#8e78fb', content:'hello everyone! i have a problem with After Effects 2019, does anyone have the 2025 or similar version? thank you 🙂', timeAgo:'4d ago', likes:2, comments:1, saves:0 },
  ],
  courses: [
    { id:'1', title:'Motion Graphics & Animation from Zero to Pro', titleAr:'الموشن جرافيكس والأنيميشن من الصفر للاحتراف', instructor:'Mohamed Trabelsi', studentsCount:4, lessonsCount:12, duration:'8h 30m', level:'beginner', rating:5.0, thumbnail:null, price:'free', enrolled:true, progress:35 },
  ],
  challenges: [
    { id:'1', title:'Character Rigging in 7 Days', titleAr:'تعلم ريقينق الشخصيات في 7 أيام', description:'7-day challenge to learn professional character rigging in After Effects.', descriptionAr:'تحدي مدته 7 أيام ستتعلم فيه كيف تعمل ريقينق احترافي للشخصيات في After Effects.', duration:'7 days', difficulty:'beginner', participantsCount:3, startDate:'Apr 24, 2026', status:'active', progress:40 },
  ],
  sessions: [
    { id:'1', title:'1-on-1 After Effects Mentorship', mentorName:'Mohamed Trabelsi', mentorAvatar:null, mentorInitials:'MT', mentorColor:'#47c7ea', duration:60, price:50, currency:'TND', rating:5.0, reviewsCount:2, availableSlots:3, booked:false },
  ],
  products: [
    { id:'1', title:'After Effects Motion Presets Pack', description:'50+ professional motion presets for After Effects.', price:29, currency:'TND', type:'preset', thumbnail:null, downloadsCount:12, purchased:false },
    { id:'2', title:'Motion Design Starter Template', description:'Complete project template for motion designers.', price:'free', type:'template', thumbnail:null, downloadsCount:45, purchased:false },
  ],
  events: [
    { id:'1', title:'Motion Design Live Workshop', description:'Hands-on live workshop on advanced motion techniques.', date:'May 15, 2026', time:'19:00', type:'online', ticketsTotal:50, ticketsSold:18, price:0, currency:'TND', registered:false },
  ],
  reviews: [
    { id:'1', authorName:'Ahmed Ben Ali', authorInitials:'AB', authorColor:'#8e78fb', rating:5, comment:'Amazing community! Mohamed is a fantastic mentor. The course quality is outstanding and the community is very supportive.', date:'Apr 28, 2026' },
  ],
}

const MOTION_MASTERS: CommunityData = {
  ...MOTION_SCHOOL,
  slug: 'motion-masters',
  name: 'Motion Masters',
  nameAr: 'أساتذة الحركة',
  description: 'Master the art of motion design. Professional community for animators and motion designers at all levels.',
  descriptionAr: 'اتقن فن تصميم الحركة. مجتمع احترافي للمحركين ومصممي الحركة من جميع المستويات.',
  avatarColor: '#ff9b28',
  avatarInitials: 'MM',
  membersCount: 124,
  postsThisWeek: 7,
  activeTodayCount: 12,
  rating: 4.8,
  ratingCount: 32,
  isJoined: false,
}

export const COMMUNITY_MAP: Record<string, CommunityData> = {
  'motion-school': MOTION_SCHOOL,
  'motion-masters': MOTION_MASTERS,
}

export function getCommunity(slug: string): CommunityData | null {
  return COMMUNITY_MAP[slug] ?? null
}

export const LEVEL_CONFIG = {
  beginner:     { label: 'Beginner',     labelAr: 'مبتدئ',     color: '#10b981', bg: '#d1fae5' },
  intermediate: { label: 'Intermediate', labelAr: 'متوسط',     color: '#f59e0b', bg: '#fef3c7' },
  advanced:     { label: 'Advanced',     labelAr: 'متقدم',      color: '#ef4444', bg: '#fee2e2' },
}

export const ROLE_CONFIG = {
  owner:     { label: 'Owner',     labelAr: 'المالك',    color: '#8e78fb', bg: '#ede9ff' },
  admin:     { label: 'Admin',     labelAr: 'مشرف',      color: '#ff9b28', bg: '#fff4e5' },
  moderator: { label: 'Moderator', labelAr: 'محرر',      color: '#47c7ea', bg: '#e0f7fc' },
  member:    { label: 'Member',    labelAr: 'عضو',       color: '#9ca3af', bg: '#f3f4f6' },
}
