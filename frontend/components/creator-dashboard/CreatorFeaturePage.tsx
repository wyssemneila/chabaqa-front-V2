'use client'

import Link from 'next/link'
import {
  Bell,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Megaphone,
  Paintbrush,
  PlugZap,
  ReceiptText,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Wand2,
} from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'

type FeatureVariant =
  | 'ai'
  | 'ai-create'
  | 'ai-cofounder'
  | 'ai-staff'
  | 'ai-agent'
  | 'ai-staff-new'
  | 'billing'
  | 'community-customize'
  | 'customize'
  | 'integrations'
  | 'marketing-contacts'
  | 'notifications'
  | 'fallback'

interface FeatureMetric {
  label: string
  value: string
  detail: string
}

interface FeatureAction {
  label: string
  href: string
  primary?: boolean
}

interface FeatureConfig {
  title: string
  subtitle: string
  icon: typeof Sparkles
  accent: string
  metrics: FeatureMetric[]
  panels: Array<{
    title: string
    description: string
    items: string[]
    icon: typeof Sparkles
  }>
  actions: FeatureAction[]
}

const configs: Record<FeatureVariant, FeatureConfig> = {
  ai: {
    title: 'AI Workspace',
    subtitle: 'Plan, write, automate, and review creator operations from one place.',
    icon: BrainCircuit,
    accent: 'from-violet-600 to-cyan-500',
    metrics: [
      { label: 'Assistants', value: '4', detail: 'Ready presets' },
      { label: 'Workflows', value: '12', detail: 'Suggested automations' },
      { label: 'Drafts', value: '0', detail: 'Waiting for creator input' },
    ],
    panels: [
      {
        title: 'Content copilot',
        description: 'Create posts, lesson outlines, emails, and launch briefs with structured prompts.',
        icon: Wand2,
        items: ['Post planner', 'Course outline builder', 'Launch announcement drafts'],
      },
      {
        title: 'Operations assistant',
        description: 'Summarize community activity and prepare follow-ups for members.',
        icon: Bot,
        items: ['Member summaries', 'Support reply drafts', 'Weekly action list'],
      },
    ],
    actions: [
      { label: 'Create assistant', href: '/creator/ai/create', primary: true },
      { label: 'Open staff', href: '/creator/ai/staff' },
    ],
  },
  'ai-create': {
    title: 'Create AI Assistant',
    subtitle: 'Configure a creator assistant with a role, tone, knowledge, and first workflow.',
    icon: Wand2,
    accent: 'from-indigo-600 to-sky-500',
    metrics: [
      { label: 'Steps', value: '4', detail: 'Role, tone, sources, workflow' },
      { label: 'Templates', value: '8', detail: 'Creator-ready starting points' },
      { label: 'Status', value: 'Draft', detail: 'Not published yet' },
    ],
    panels: [
      {
        title: 'Assistant blueprint',
        description: 'Start from a focused assistant type, then adjust language and response boundaries.',
        icon: FileText,
        items: ['Community manager', 'Launch writer', 'Support assistant'],
      },
      {
        title: 'Knowledge sources',
        description: 'Attach community rules, product notes, FAQs, and session policies.',
        icon: ShieldCheck,
        items: ['Creator profile', 'Community guidelines', 'Offer catalog'],
      },
    ],
    actions: [
      { label: 'Back to AI', href: '/creator/ai', primary: true },
      { label: 'View staff', href: '/creator/ai/staff' },
    ],
  },
  'ai-cofounder': {
    title: 'AI Cofounder',
    subtitle: 'A strategy desk for decisions, growth experiments, and weekly operating notes.',
    icon: Sparkles,
    accent: 'from-fuchsia-600 to-amber-500',
    metrics: [
      { label: 'Ideas', value: '24', detail: 'Growth prompts' },
      { label: 'Reviews', value: '7', detail: 'Weekly checkpoints' },
      { label: 'Focus', value: 'Revenue', detail: 'Current priority' },
    ],
    panels: [
      {
        title: 'Growth board',
        description: 'Turn analytics, content, and sales data into practical experiments.',
        icon: Megaphone,
        items: ['Offer audit', 'Retention experiments', 'Pricing review'],
      },
      {
        title: 'Decision notes',
        description: 'Keep crisp tradeoffs and next actions attached to creator goals.',
        icon: CheckCircle2,
        items: ['This week', 'Risks', 'Next decisions'],
      },
    ],
    actions: [
      { label: 'Open dashboard', href: '/creator/dashboard', primary: true },
      { label: 'View analytics', href: '/creator/analytics' },
    ],
  },
  'ai-staff': {
    title: 'AI Staff',
    subtitle: 'Manage specialized assistants for content, community, support, and marketing work.',
    icon: Bot,
    accent: 'from-cyan-600 to-blue-500',
    metrics: [
      { label: 'Staff roles', value: '6', detail: 'Available presets' },
      { label: 'Queues', value: '3', detail: 'Content, support, launch' },
      { label: 'Health', value: 'Good', detail: 'No blocked workflows' },
    ],
    panels: [
      {
        title: 'Role library',
        description: 'Choose focused assistants instead of one vague general bot.',
        icon: Users,
        items: ['Community moderator', 'Email marketer', 'Session coordinator'],
      },
      {
        title: 'Workflow coverage',
        description: 'See where assistants can help without taking over creator approvals.',
        icon: LayoutDashboard,
        items: ['Draft only', 'Needs approval', 'Ready to publish'],
      },
    ],
    actions: [
      { label: 'New staff member', href: '/creator/ai/staff/new', primary: true },
      { label: 'Open AI workspace', href: '/creator/ai' },
    ],
  },
  'ai-agent': {
    title: 'AI Staff Member',
    subtitle: 'Review assistant purpose, guardrails, knowledge, and workflow readiness.',
    icon: Bot,
    accent: 'from-blue-600 to-violet-500',
    metrics: [
      { label: 'Readiness', value: '82%', detail: 'Profile completeness' },
      { label: 'Sources', value: '5', detail: 'Connected knowledge areas' },
      { label: 'Mode', value: 'Review', detail: 'Creator approval required' },
    ],
    panels: [
      {
        title: 'Role profile',
        description: 'Define what this assistant should answer, draft, and escalate.',
        icon: FileText,
        items: ['Role summary', 'Tone guide', 'Escalation rules'],
      },
      {
        title: 'Quality controls',
        description: 'Keep assistant output bounded with clear creator review states.',
        icon: ShieldCheck,
        items: ['Draft review', 'Approval required', 'Audit trail'],
      },
    ],
    actions: [
      { label: 'Back to staff', href: '/creator/ai/staff', primary: true },
      { label: 'Open AI workspace', href: '/creator/ai' },
    ],
  },
  'ai-staff-new': {
    title: 'New AI Staff Member',
    subtitle: 'Select a role, define responsibilities, and prepare the first workflow.',
    icon: Bot,
    accent: 'from-sky-600 to-emerald-500',
    metrics: [
      { label: 'Role types', value: '6', detail: 'Available templates' },
      { label: 'Setup time', value: '5m', detail: 'Typical configuration' },
      { label: 'Approval', value: 'On', detail: 'Creator reviews output' },
    ],
    panels: [
      {
        title: 'Recommended roles',
        description: 'Start with a practical assistant matched to common creator work.',
        icon: Sparkles,
        items: ['Support triage', 'Content repurposer', 'Launch coordinator'],
      },
      {
        title: 'Setup checklist',
        description: 'A useful assistant needs a narrow job and reliable source material.',
        icon: CheckCircle2,
        items: ['Pick a role', 'Attach sources', 'Define approval flow'],
      },
    ],
    actions: [
      { label: 'Back to staff', href: '/creator/ai/staff', primary: true },
      { label: 'Open AI workspace', href: '/creator/ai' },
    ],
  },
  billing: {
    title: 'Billing',
    subtitle: 'Track plan status, invoices, payment methods, and creator billing controls.',
    icon: CreditCard,
    accent: 'from-emerald-600 to-teal-500',
    metrics: [
      { label: 'Plan', value: 'Creator', detail: 'Current workspace tier' },
      { label: 'Invoices', value: '0', detail: 'Open invoices' },
      { label: 'Status', value: 'Active', detail: 'Billing healthy' },
    ],
    panels: [
      {
        title: 'Payment method',
        description: 'Keep billing details ready for subscriptions, platform fees, and upgrades.',
        icon: WalletCards,
        items: ['Primary card', 'Billing email', 'Tax details'],
      },
      {
        title: 'Invoice center',
        description: 'Review creator invoices and export records for accounting.',
        icon: ReceiptText,
        items: ['Monthly invoices', 'Payment history', 'Export records'],
      },
    ],
    actions: [
      { label: 'Open payouts', href: '/creator/payouts', primary: true },
      { label: 'View subscriptions', href: '/creator/subscriptions' },
    ],
  },
  'community-customize': {
    title: 'Community Studio',
    subtitle: 'Tune branding, access, navigation, and member-facing community settings.',
    icon: Paintbrush,
    accent: 'from-rose-600 to-orange-500',
    metrics: [
      { label: 'Sections', value: '8', detail: 'Customizable areas' },
      { label: 'Branding', value: 'Ready', detail: 'Visual settings available' },
      { label: 'Access', value: 'Managed', detail: 'Public/private controls' },
    ],
    panels: [
      {
        title: 'Brand surface',
        description: 'Control logo, cover image, colors, description, and community identity.',
        icon: Paintbrush,
        items: ['Logo and cover', 'Theme colors', 'Community copy'],
      },
      {
        title: 'Member experience',
        description: 'Choose what members see first and how they navigate content.',
        icon: Users,
        items: ['Home sections', 'Navigation items', 'Join experience'],
      },
    ],
    actions: [
      { label: 'All communities', href: '/creator/communities', primary: true },
      { label: 'Creator dashboard', href: '/creator/dashboard' },
    ],
  },
  customize: {
    title: 'Creator Studio',
    subtitle: 'Shape your creator profile, public brand, links, and dashboard defaults.',
    icon: Paintbrush,
    accent: 'from-pink-600 to-indigo-500',
    metrics: [
      { label: 'Profile', value: 'Live', detail: 'Public creator surface' },
      { label: 'Links', value: '6', detail: 'Recommended link slots' },
      { label: 'Theme', value: 'Default', detail: 'Dashboard style' },
    ],
    panels: [
      {
        title: 'Public identity',
        description: 'Keep your name, bio, avatar, and social links consistent across communities.',
        icon: Globe2,
        items: ['Creator bio', 'Avatar and banner', 'Social links'],
      },
      {
        title: 'Dashboard defaults',
        description: 'Set preferred creator workspace shortcuts and presentation details.',
        icon: LayoutDashboard,
        items: ['Default community', 'Quick actions', 'Profile preview'],
      },
    ],
    actions: [
      { label: 'Open profile', href: '/profile', primary: true },
      { label: 'Creator dashboard', href: '/creator/dashboard' },
    ],
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect calendar, marketing, payments, and workflow tools to your creator workspace.',
    icon: PlugZap,
    accent: 'from-slate-700 to-cyan-500',
    metrics: [
      { label: 'Available', value: '9', detail: 'Integration categories' },
      { label: 'Connected', value: '0', detail: 'Detected in this session' },
      { label: 'Health', value: 'Review', detail: 'Check auth status' },
    ],
    panels: [
      {
        title: 'Core connections',
        description: 'Start with the integrations that directly affect paid creator operations.',
        icon: Link2,
        items: ['Google Calendar', 'Payment provider', 'Email sender'],
      },
      {
        title: 'Automation layer',
        description: 'Route events from bookings, purchases, and community activity into workflows.',
        icon: PlugZap,
        items: ['Webhooks', 'Campaign triggers', 'Member events'],
      },
    ],
    actions: [
      { label: 'Open sessions', href: '/creator/sessions', primary: true },
      { label: 'Open email tools', href: '/creator/email' },
    ],
  },
  'marketing-contacts': {
    title: 'Marketing Contacts',
    subtitle: 'Organize audience segments for email, WhatsApp, launches, and creator campaigns.',
    icon: Users,
    accent: 'from-blue-600 to-emerald-500',
    metrics: [
      { label: 'Contacts', value: '0', detail: 'Loaded from campaigns' },
      { label: 'Segments', value: '4', detail: 'Suggested groups' },
      { label: 'Health', value: 'Clean', detail: 'No duplicates shown' },
    ],
    panels: [
      {
        title: 'Audience segments',
        description: 'Group members by purchase intent, activity, content interest, and lifecycle.',
        icon: Megaphone,
        items: ['New members', 'Inactive users', 'Buyers', 'Event attendees'],
      },
      {
        title: 'Campaign readiness',
        description: 'Prepare clean recipient lists before sending creator campaigns.',
        icon: CheckCircle2,
        items: ['Consent status', 'Preferred channel', 'Last contacted'],
      },
    ],
    actions: [
      { label: 'Open email', href: '/creator/email', primary: true },
      { label: 'Open WhatsApp', href: '/creator/whatsapp' },
    ],
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Monitor creator alerts for bookings, sales, community activity, and support events.',
    icon: Bell,
    accent: 'from-red-600 to-fuchsia-500',
    metrics: [
      { label: 'Unread', value: '0', detail: 'No local alerts loaded' },
      { label: 'Channels', value: '4', detail: 'Dashboard, email, mobile, web' },
      { label: 'Priority', value: 'Normal', detail: 'No critical alert visible' },
    ],
    panels: [
      {
        title: 'Alert center',
        description: 'Keep booking, payment, community, and support notifications in one scan.',
        icon: Bell,
        items: ['Booking updates', 'Payment events', 'Community reports'],
      },
      {
        title: 'Preferences',
        description: 'Separate important creator operations from noisy status updates.',
        icon: SettingsIcon,
        items: ['Priority rules', 'Channel routing', 'Quiet hours'],
      },
    ],
    actions: [
      { label: 'Creator dashboard', href: '/creator/dashboard', primary: true },
      { label: 'Open support', href: '/creator/help' },
    ],
  },
  fallback: {
    title: 'Creator Workspace',
    subtitle: 'This creator route now resolves to a useful dashboard surface instead of a placeholder.',
    icon: LayoutDashboard,
    accent: 'from-slate-700 to-indigo-500',
    metrics: [
      { label: 'Status', value: 'Ready', detail: 'Route is available' },
      { label: 'Dashboard', value: 'Live', detail: 'Connected navigation' },
      { label: 'Next', value: 'Review', detail: 'Choose a creator workflow' },
    ],
    panels: [
      {
        title: 'Available workflows',
        description: 'Continue from a connected creator dashboard area.',
        icon: LayoutDashboard,
        items: ['Content management', 'Community operations', 'Revenue tools'],
      },
      {
        title: 'Support path',
        description: 'Use the main dashboard links to reach the relevant workflow quickly.',
        icon: LifeBuoy,
        items: ['Dashboard', 'Analytics', 'Communities'],
      },
    ],
    actions: [
      { label: 'Creator dashboard', href: '/creator/dashboard', primary: true },
      { label: 'Analytics', href: '/creator/analytics' },
    ],
  },
}

export function CreatorFeaturePage({ variant }: { variant: FeatureVariant }) {
  const config = configs[variant] || configs.fallback
  const Icon = config.icon

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar title={config.title} subtitle={config.subtitle} />

        <main id="main-content" className="flex-1 p-6 lg:p-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className={`h-2 bg-gradient-to-r ${config.accent}`} />
            <div className="grid gap-6 p-5 lg:grid-cols-[1fr_360px] lg:p-7">
              <div className="min-w-0">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.accent} text-white shadow-sm`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-black text-slate-950 md:text-3xl" style={{ textWrap: 'balance' }}>
                      {config.title}
                    </h1>
                    <p className="mt-2 max-w-3xl text-[14px] leading-6 text-slate-600" style={{ textWrap: 'pretty' }}>
                      {config.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {config.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                      <p className="mt-1 text-2xl font-black tabular-nums text-slate-950">Unavailable</p>
                      <p className="mt-1 text-[12px] font-medium text-slate-500">Backend integration required</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[12px] font-black uppercase tracking-wide text-slate-500">Primary actions</p>
                <div className="mt-3 grid gap-2">
                  {config.actions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={
                        action.primary
                          ? 'inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-[13px] font-black text-white transition-[background-color,transform] duration-150 hover:bg-slate-800 active:scale-[0.98]'
                          : 'inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-black text-slate-700 transition-[background-color,transform] duration-150 hover:bg-slate-100 active:scale-[0.98]'
                      }
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="text-[14px] font-black text-amber-900">Backend data unavailable</p>
                <p className="mt-1 text-[13px] leading-6 text-amber-800">
                  This route is a navigation shell only. Metrics, panels, and actions here are not fetched from production creator data yet.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            {config.panels.map((panel) => {
              const PanelIcon = panel.icon
              return (
                <article key={panel.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <PanelIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[16px] font-black text-slate-950">{panel.title}</h2>
                      <p className="mt-1 text-[13px] leading-6 text-slate-600" style={{ textWrap: 'pretty' }}>
                        {panel.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {panel.items.map((item) => (
                      <div key={item} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-[13px] font-bold text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </section>

          <section className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[14px] font-black text-slate-900">Navigation-only page</p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Use a connected creator dashboard route for live backend data.
                </p>
              </div>
              <Link
                href="/creator/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-[13px] font-black text-slate-700 transition-colors duration-150 hover:bg-slate-50"
              >
                Back to dashboard
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
