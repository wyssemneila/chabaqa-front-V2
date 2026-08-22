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

export interface CourseChapter {
  id: string
  title: string
  titleAr?: string
  duration: string
  isPreview?: boolean
  isPaid?: boolean
  videoUrl?: string
  done?: boolean
  description?: string
  descriptionAr?: string
  resources?: { id: string; title: string; type: 'pdf' | 'zip' | 'link' | 'image'; url: string; sizeLabel?: string }[]
}

export interface CourseSection {
  id: string
  title: string
  titleAr?: string
  chapters: CourseChapter[]
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
  description?: string
  descriptionAr?: string
  objectives?: string[]
  objectivesAr?: string[]
  requirements?: string[]
  requirementsAr?: string[]
  sections?: CourseSection[]
}

export interface ChallengeStep {
  order: number
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  done?: boolean
  submission?: string
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
  endDate?: string
  status: 'upcoming' | 'active' | 'ended'
  progress?: number
  joined?: boolean
  reward?: string
  rewardAr?: string
  banner?: string
  steps?: ChallengeStep[]
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
  channels?: string[]
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
    {
      id:'1',
      title:'Motion Graphics & Animation from Zero to Pro',
      titleAr:'الموشن جرافيكس والأنيميشن من الصفر للاحتراف',
      instructor:'Mohamed Trabelsi',
      studentsCount:4,
      lessonsCount:12,
      duration:'8h 30m',
      level:'beginner',
      rating:5.0,
      thumbnail:null,
      price:'free',
      enrolled:true,
      progress:35,
      description:'A hands-on journey from zero to pro. You will learn the fundamentals of motion design, After Effects timeline & keyframes, easing, and how to ship your first animation portfolio pieces.',
      descriptionAr:'رحلة عملية من الصفر إلى الاحتراف. ستتعلم أساسيات تصميم الحركة، والجدول الزمني والإطارات المفتاحية في أفتر إفكتس، والتخفيف، وكيفية إنتاج أول أعمالك الاحترافية.',
      objectives: [
        'Master the After Effects timeline, layers and keyframes',
        'Craft smooth easing and secondary motion that feels alive',
        'Design animated logos and brand-driven kinetic type',
        'Export web-ready and social-ready deliverables',
      ],
      requirements: [
        'A laptop that can run After Effects (any version 2022+)',
        'No prior animation experience needed — we start from zero',
      ],
      sections: [
        {
          id: 's1', title: 'Getting Started', titleAr: 'البداية',
          chapters: [
            { id: 'c1', title: 'Welcome & how this course works', titleAr: 'مرحبًا وكيف يعمل هذا الكورس', duration: '4:12', isPreview: true, done: true, videoUrl: '/videos/test.mp4',
              description: "Quick walkthrough of what we'll build over 12 chapters. I'll show the roadmap, how to get the most out of each lesson, and how to use the community feed to ask questions.",
              descriptionAr: 'جولة سريعة على ما ستبنيه في 12 فصلاً. سأعرض لك الخارطة وطريقة الاستفادة القصوى من كل درس واستخدام المجتمع لطرح الأسئلة.',
              resources: [
                { id: 'r0', title: 'Course Roadmap.pdf', type: 'pdf', url: '/videos/test.mp4', sizeLabel: '820 KB' },
                { id: 'r0b', title: 'Community Guidelines', type: 'link', url: '#', sizeLabel: 'External link' },
              ] },
            { id: 'c2', title: 'Installing After Effects & workspace setup', titleAr: 'تثبيت أفتر إفكتس وإعداد بيئة العمل', duration: '8:45', done: true, videoUrl: '/videos/test.mp4',
              description: 'Step-by-step install (Creative Cloud or standalone) plus the exact panel layout I use every day. Save the workspace preset to jump right in next time.',
              descriptionAr: 'التثبيت خطوة بخطوة (كلاود أو مستقل) مع تخطيط اللوحات الذي أستخدمه يومياً. احفظ إعداد بيئة العمل لبدء العمل بسرعة.',
              resources: [
                { id: 'r1', title: 'Workspace Layout.pdf', type: 'pdf', url: '/videos/test.mp4', sizeLabel: '1.2 MB' },
                { id: 'r2', title: 'Starter Project Files.zip', type: 'zip', url: '/videos/test.mp4', sizeLabel: '18 MB' },
                { id: 'r2b', title: 'Reference Screenshot.png', type: 'image', url: '/videos/test.mp4', sizeLabel: '540 KB' },
                { id: 'r2c', title: 'Adobe Download Page', type: 'link', url: '#', sizeLabel: 'adobe.com' },
              ] },
          ],
        },
        {
          id: 's2', title: 'Fundamentals', titleAr: 'الأساسيات',
          chapters: [
            { id: 'c3', title: 'The Timeline explained', titleAr: 'شرح الجدول الزمني', duration: '12:30', done: true, videoUrl: '/videos/test.mp4' },
            { id: 'c4', title: 'Keyframes 101 — position, scale, rotation', titleAr: 'الإطارات المفتاحية 101', duration: '15:20', done: true, videoUrl: '',
              resources: [
                { id: 'r3', title: 'Keyframe Cheatsheet (PDF)', type: 'pdf', url: '#', sizeLabel: '640 KB' },
              ] },
            { id: 'c5', title: 'Easing that feels natural', titleAr: 'تخفيف يبدو طبيعيًا', duration: '18:00', videoUrl: '/videos/test.mp4' },
            { id: 'c6', title: 'Anticipation & follow-through', titleAr: 'التوقع والمتابعة', duration: '14:10', videoUrl: '/videos/test.mp4' },
          ],
        },
        {
          id: 's3', title: 'Real Projects', titleAr: 'مشاريع حقيقية',
          chapters: [
            { id: 'c7', title: 'Animating your first logo', titleAr: 'تحريك أول شعار', duration: '22:40', videoUrl: '/videos/test.mp4' },
            { id: 'c8', title: 'Kinetic typography techniques', titleAr: 'تقنيات الطباعة الحركية', duration: '19:15', videoUrl: '/videos/test.mp4' },
            { id: 'c9', title: 'Exporting for web & social', titleAr: 'التصدير للويب والسوشيال', duration: '11:05', videoUrl: '/videos/test.mp4' },
          ],
        },
        {
          id: 's4', title: 'Ship Your Portfolio', titleAr: 'أنشر أعمالك',
          chapters: [
            { id: 'c10', title: 'Case study — a brand animation', titleAr: 'دراسة حالة — تحريك علامة', duration: '26:00', isPaid: true, videoUrl: '/videos/test.mp4' },
            { id: 'c11', title: 'Feedback loops & iteration', titleAr: 'حلقات الملاحظات والتكرار', duration: '13:30', isPaid: true, videoUrl: '/videos/test.mp4' },
            { id: 'c12', title: 'Landing your first paid project', titleAr: 'الحصول على أول مشروع مدفوع', duration: '17:20', isPaid: true, videoUrl: '/videos/test.mp4' },
          ],
        },
      ],
    },
  ],
  challenges: [
    {
      id:'1', title:'Character Rigging in 7 Days',
      titleAr:'تعلم ريقينق الشخصيات في 7 أيام',
      description:'A 7-day guided sprint: rig a character from scratch in After Effects with Duik. Ship one polished walk cycle by the end of the week.',
      descriptionAr:'تحدٍ إرشادي مدته 7 أيام: ريغ شخصية من الصفر في أفتر إفكتس باستخدام Duik. اصنع دورة مشي واحدة مصقولة بنهاية الأسبوع.',
      duration:'7 days', difficulty:'beginner', participantsCount:24,
      startDate:'Apr 24, 2026', endDate:'May 1, 2026',
      status:'active', progress:40, joined:true,
      reward:'Feature on the community showcase + 1 free mentorship session',
      rewardAr:'الظهور في معرض المجتمع + جلسة إرشاد مجانية',
      steps: [
        { order:1, title:'Pick your character', description:"Choose a simple 2D character illustration. Anything on 2 legs works. Post your pick in the challenge feed so others can react.", done:true },
        { order:2, title:'Split into layers', description:'Break the illustration into rig-ready layers in Illustrator: head, torso, arms, legs. Name your layers cleanly.', done:true },
        { order:3, title:'Install & set up Duik', description:'Install Duik Angela (free) and open your layered PSD/AI in After Effects. Auto-rig the structure.', done:true },
        { order:4, title:'Attach controllers', description:'Add IK to the arms and legs. Test each joint rotation with a controller.', done:false },
        { order:5, title:'Animate a walk cycle', description:'Block a 12-frame walk cycle. Focus on hip movement + arm swing.', done:false },
        { order:6, title:'Add secondary motion', description:'Layer in overlap and follow-through: hair, cloth, floppy ears. Small polish, big life.', done:false },
        { order:7, title:'Export & submit', description:'Render a 4-second loop as MP4 or GIF. Submit it below to complete the challenge.', done:false },
      ],
    },
    {
      id:'2', title:'Kinetic Type Battle',
      titleAr:'معركة الطباعة الحركية',
      description:'A 5-day head-to-head: animate one lyric of your choice. Winner picked by community vote.',
      descriptionAr:'تحدٍ من 5 أيام: حرّك سطراً واحداً من أغنية. الفائز باختيار المجتمع.',
      duration:'5 days', difficulty:'intermediate', participantsCount:0,
      startDate:'May 10, 2026', endDate:'May 15, 2026',
      status:'upcoming',
      reward:'50 TND cash prize + winner badge',
      rewardAr:'جائزة نقدية 50 دينار + شارة الفائز',
      steps: [
        { order:1, title:'Sign up & pick your lyric', description:'Choose any short lyric (max 12 words). Post it in the challenge thread.' },
        { order:2, title:'Storyboard the beats', description:'Sketch how each word hits — timing is everything.' },
        { order:3, title:'Animate in AE', description:'Bring the words to life. Motion should follow the rhythm.' },
        { order:4, title:'Sound + polish', description:'Sync to the track. Add micro details.' },
        { order:5, title:'Submit for community vote', description:'Upload your entry. Voting opens for 24h.' },
      ],
    },
    {
      id:'3', title:'Loop Master — 30-day daily animation',
      titleAr:'تحدي الحلقات — 30 يوماً من الرسوم اليومية',
      description:'One tiny animated loop every day for 30 days. Build the habit that ships portfolios.',
      descriptionAr:'حلقة متحركة صغيرة كل يوم لمدة 30 يوماً. ابنِ العادة التي تصنع البورتفوليو.',
      duration:'30 days', difficulty:'advanced', participantsCount:47,
      startDate:'Feb 1, 2026', endDate:'Mar 2, 2026',
      status:'ended', joined:true, progress:100,
      reward:'Certificate + featured spotlight',
      rewardAr:'شهادة + إبراز مميز',
    },
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
  isJoined: true,
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
