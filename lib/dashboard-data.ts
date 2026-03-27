// ── Types ──────────────────────────────────────────────

export type TrendDir = 'up' | 'down' | 'flat'

export interface KpiCard {
  label: string
  value: string
  trend: string
  trendDir: TrendDir
  iconColor: string
  iconBg: string
  icon: 'users' | 'book' | 'bolt' | 'calendar' | 'dollar' | 'pulse'
}

export interface ActivityItem {
  type: 'challenge' | 'course' | 'post'
  label: string
  name: string
  time: string
}

export interface ContentItem {
  emoji: string
  name: string
  type: 'Course' | 'Challenge' | 'Session' | 'Post'
  enrollPrompt: string
}

export interface Community {
  emoji: string
  name: string
  verified: boolean
  description: string
  members: number
  category: string
  plan: string
}

export interface OnboardStep {
  id: string
  label: string
  done: boolean
}

// ── Mock data ──────────────────────────────────────────

export const kpiCards: KpiCard[] = [
  {
    label: 'Total Members',
    value: '23',
    trend: '→ 0% from last month',
    trendDir: 'flat',
    iconColor: '#2a5cff',
    iconBg: '#eef1ff',
    icon: 'users',
  },
  {
    label: 'Total Courses',
    value: '1',
    trend: '→ 0% from last month',
    trendDir: 'flat',
    iconColor: '#1a7a4a',
    iconBg: '#eaf5ee',
    icon: 'book',
  },
  {
    label: 'Total Challenges',
    value: '1',
    trend: '↑ +100% from last month',
    trendDir: 'up',
    iconColor: '#8a5a00',
    iconBg: '#fef6e4',
    icon: 'bolt',
  },
  {
    label: 'Total Sessions',
    value: '0',
    trend: '— No sessions yet',
    trendDir: 'flat',
    iconColor: '#9a9890',
    iconBg: '#f5f4f0',
    icon: 'calendar',
  },
  {
    label: 'Total Revenue',
    value: '395.95',
    trend: '↑ +246% from last month',
    trendDir: 'up',
    iconColor: '#1a7a4a',
    iconBg: '#eaf5ee',
    icon: 'dollar',
  },
  {
    label: 'Avg. Engagement',
    value: '99%',
    trend: '↓ -4% from last month',
    trendDir: 'down',
    iconColor: '#2a5cff',
    iconBg: '#eef1ff',
    icon: 'pulse',
  },
]

export const activityItems: ActivityItem[] = [
  {
    type: 'challenge',
    label: 'New Challenge',
    name: 'rigging animation — 🏆 تحدي الـ ٧ أيام',
    time: '14 days ago',
  },
  {
    type: 'course',
    label: 'New Course',
    name: 'موشن غرافيك و أنيماشين',
    time: '20 days ago · 26 Feb at 15:46',
  },
]

export const contentItems: ContentItem[] = [
  {
    emoji: '🎬',
    name: 'موشن غرافيك و أنيماشين',
    type: 'Course',
    enrollPrompt: 'No students yet',
  },
  {
    emoji: '🏆',
    name: 'rigging animation — تحدي الـ ٧ أيام',
    type: 'Challenge',
    enrollPrompt: '0 participants',
  },
]

export const communities: Community[] = [
  {
    emoji: '🎬',
    name: 'Motion Masters',
    verified: true,
    description: 'تعلّم الأنيميشن من الصفر',
    members: 23,
    category: 'Art',
    plan: 'Free',
  },
]

export const onboardSteps: OnboardStep[] = [
  { id: 'community', label: 'Create a community',    done: true  },
  { id: 'course',    label: 'Add your first course',  done: true  },
  { id: 'share',     label: 'Share your invite link', done: false },
]
