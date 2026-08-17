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
  slug?: string
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
