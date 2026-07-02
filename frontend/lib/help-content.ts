import type { LucideIcon } from 'lucide-react'
import { BookOpen, Download, FileText, Globe, Mail, Users } from 'lucide-react'

export interface HelpArticle {
  id: number
  category: string
  title: string
  readTime: number
  featured: boolean
}

export interface HelpVideo {
  id: number
  title: string
  duration: string
  category: string
  featured: boolean
}

export interface HelpFaq {
  id: number
  category: string
  q: string
  a: string
}

export interface HelpResource {
  id: number
  title: string
  type: string
  size: string | null
  category: string
  icon: LucideIcon
  url?: string
  comingSoon?: boolean
}

export const HELP_STATIC_DISCLAIMER =
  'Static documentation — articles and videos are being published. Contact support for live help.'

export const HELP_FAQ_FOOTNOTE =
  'Answers reflect general product guidance and may change with your account settings or region.'

export const PUBLIC_HELP_CATEGORIES = [
  { title: 'Getting started', description: 'Create an account, join a community, and set up your profile.' },
  { title: 'Creator setup', description: 'Launch a community, publish content, invite members, and price offers.' },
  { title: 'Payments & refunds', description: 'Understand checkout, refunds, payouts, subscriptions, and trials.' },
  { title: 'Safety & moderation', description: 'Learn how reporting, AI checks, appeals, and admin review work.' },
]

export const PUBLIC_HELP_ARTICLES = [
  'How to create your first community',
  'What happens after a member buys an event ticket?',
  'How refunds and manual review work',
  'How AI moderation protects communities',
  'How to invite your first 100 members',
]

export const HELP_ARTICLES: HelpArticle[] = [
  { id: 1, category: 'Getting Started', title: 'Getting started with Chabaqa', readTime: 4, featured: true },
  { id: 2, category: 'Getting Started', title: 'How to create your first community', readTime: 6, featured: true },
  { id: 3, category: 'Courses', title: 'Creating and structuring a course', readTime: 8, featured: false },
  { id: 4, category: 'Courses', title: 'Managing course enrollments and access', readTime: 5, featured: false },
  { id: 5, category: 'Revenue', title: 'Understanding your payouts and revenue', readTime: 7, featured: false },
  { id: 6, category: 'Revenue', title: 'Setting up subscription plans', readTime: 6, featured: false },
  { id: 7, category: 'Marketing', title: 'How to run an email campaign', readTime: 5, featured: false },
  { id: 8, category: 'Marketing', title: 'Setting up affiliate links for your community', readTime: 9, featured: false },
  { id: 9, category: 'Analytics', title: 'Reading your analytics dashboard', readTime: 6, featured: false },
  { id: 10, category: 'Settings', title: 'Managing team roles and permissions', readTime: 4, featured: false },
  { id: 11, category: 'Settings', title: 'Integrating third-party tools with Chabaqa', readTime: 7, featured: false },
  { id: 12, category: 'Challenges', title: 'Creating challenges that drive engagement', readTime: 5, featured: false },
]

export const HELP_VIDEOS: HelpVideo[] = [
  { id: 1, title: 'Complete Platform Walkthrough', duration: '12:30', category: 'Getting Started', featured: true },
  { id: 2, title: 'Creating Your First Course', duration: '8:45', category: 'Courses', featured: true },
  { id: 3, title: 'Setting Up Your Community', duration: '6:20', category: 'Communities', featured: false },
  { id: 4, title: 'Analytics Deep Dive', duration: '10:15', category: 'Analytics', featured: false },
  { id: 5, title: 'Email Marketing Best Practices', duration: '7:30', category: 'Marketing', featured: false },
  { id: 6, title: 'Revenue & Payout Setup', duration: '5:50', category: 'Revenue', featured: false },
  { id: 7, title: 'Managing Challenges & Events', duration: '9:00', category: 'Content', featured: false },
  { id: 8, title: 'WhatsApp Campaign Tutorial', duration: '6:45', category: 'Marketing', featured: false },
]

export const HELP_FAQS: HelpFaq[] = [
  {
    id: 1, category: 'Billing',
    q: 'When do I receive my payouts?',
    a: 'Payouts are processed on a recurring schedule configured for your account. Funds are transferred to your connected payout method after processing completes.',
  },
  {
    id: 2, category: 'Courses',
    q: 'How many students can enroll in my course?',
    a: 'There is no fixed enrollment cap on standard plans. Capacity may vary by plan and infrastructure limits.',
  },
  {
    id: 3, category: 'Communities',
    q: 'Can I have multiple communities on one account?',
    a: 'Yes. You can create and manage multiple communities from a single creator account. Each community has its own members, content, and analytics.',
  },
  {
    id: 4, category: 'Billing',
    q: 'What payment methods do subscribers use?',
    a: 'Available payment methods depend on your region and enabled integrations. Check Billing settings for the methods active on your account.',
  },
  {
    id: 5, category: 'Settings',
    q: 'How do I add a team member to my account?',
    a: 'Go to Team & Roles, invite a member by email, and assign a role (Admin, Moderator, Support, etc.). They receive an invitation email.',
  },
  {
    id: 6, category: 'Marketing',
    q: 'What is the open rate for email campaigns?',
    a: 'Open rates vary widely by niche, list quality, and send timing. Use your campaign analytics dashboard for real performance data.',
  },
  {
    id: 7, category: 'Content',
    q: 'What video formats are supported for courses?',
    a: 'MP4 is recommended. Other common formats may be supported depending on your upload settings. Check the upload UI for current size limits.',
  },
  {
    id: 8, category: 'Communities',
    q: 'Can members access content from multiple communities?',
    a: 'Yes. A member can join multiple communities. Each community typically has its own subscription or access rules.',
  },
]

export const HELP_RESOURCES: HelpResource[] = [
  { id: 1, title: 'Creator Starter Kit', type: 'PDF', size: null, category: 'Getting Started', icon: FileText, comingSoon: true },
  { id: 2, title: 'Course Curriculum Template', type: 'DOCX', size: null, category: 'Courses', icon: FileText, comingSoon: true },
  { id: 3, title: 'Community Growth Playbook', type: 'PDF', size: null, category: 'Communities', icon: FileText, comingSoon: true },
  { id: 4, title: 'Email Templates Pack (10)', type: 'ZIP', size: null, category: 'Marketing', icon: Mail, comingSoon: true },
  { id: 5, title: 'Analytics Metrics Glossary', type: 'PDF', size: null, category: 'Analytics', icon: FileText, comingSoon: true },
  { id: 6, title: 'Chabaqa API Documentation', type: 'Link', size: null, category: 'Integrations', icon: Globe, url: 'https://docs.chabaqa.io', comingSoon: false },
  { id: 7, title: 'Branding & Logo Assets', type: 'ZIP', size: null, category: 'Branding', icon: Download, comingSoon: true },
  { id: 8, title: 'Affiliate Program Guide', type: 'PDF', size: null, category: 'Marketing', icon: Users, comingSoon: true },
]

export const HELP_CATEGORY_COLORS: Record<string, string> = {
  'Getting Started': '#7c3aed', Courses: '#0891b2', Revenue: '#16a34a',
  Marketing: '#ea580c', Analytics: '#6366f1', Settings: '#64748b',
  Communities: '#db2777', Challenges: '#d97706', Billing: '#16a34a',
  Content: '#0891b2', Integrations: '#6366f1', Branding: '#7c3aed',
}

export const SUPPORT_EMAIL = 'support@chabaqa.io'
