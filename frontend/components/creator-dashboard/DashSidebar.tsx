'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashIcon from './DashIcon'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { resolveImageUrl } from '@/lib/resolve-image-url'
import { useAuthContext } from '@/app/providers/auth-provider'
import type { LucideIcon } from 'lucide-react'
import {
  Activity, Bell, BookOpen, CalendarCheck2, CalendarDays, ChartNoAxesCombined,
  CircleHelp, ContactRound, CreditCard, HandCoins, LayoutDashboard, Mail, MessageSquare,
  Network, PackageOpen, PlugZap, Share2, Swords, UsersRound, WandSparkles,
} from 'lucide-react'

type SidebarIcon = LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number }>
type NavItem = { label: { en: string; ar: string }; href: string; icon: SidebarIcon }

// ─── Nav data with translations ────────────────────────────────────────────────
const navGroups: Array<{ label: { en: string; ar: string }; items: NavItem[] }> = [
  {
    label: { en: 'Main', ar: 'الرئيسية' },
    items: [
      { label: { en: 'Overview',    ar: 'نظرة عامة'   }, href: '/creator/dashboard',    icon: LayoutDashboard },
      { label: { en: 'Communities', ar: 'المجتمعات'   }, href: '/creator/communities',  icon: Network },
      { label: { en: 'Analytics',   ar: 'التحليلات'   }, href: '/creator/analytics',    icon: ChartNoAxesCombined },
    ],
  },
  {
    label: { en: 'Content', ar: 'المحتوى' },
    items: [
      { label: { en: 'Courses',    ar: 'الدورات'    }, href: '/creator/courses',    icon: BookOpen },
      { label: { en: 'Challenges', ar: 'التحديات'   }, href: '/creator/challenges', icon: Swords },
      { label: { en: 'Sessions',   ar: 'الجلسات'    }, href: '/creator/sessions',   icon: CalendarCheck2 },
      { label: { en: 'Events',     ar: 'الأحداث'    }, href: '/creator/events',     icon: CalendarDays },
      { label: { en: 'Products',   ar: 'المنتجات'   }, href: '/creator/products',   icon: PackageOpen },
    ],
  },
  {
    label: { en: 'Revenue', ar: 'الإيرادات' },
    items: [
      { label: { en: 'Plan History', ar: 'سجل الخطة' }, href: '/creator/subscriptions', icon: CreditCard },
      { label: { en: 'Payouts', ar: 'المدفوعات' }, href: '/creator/payouts', icon: HandCoins },
      { label: { en: 'AI Writing Usage', ar: 'استخدام الكتابة بالذكاء' }, href: '/creator/usage', icon: WandSparkles },
    ],
  },
  {
    label: { en: 'Marketing', ar: 'التسويق' },
    items: [
      { label: { en: 'Email Campaigns', ar: 'حملات البريد' }, href: '/creator/email', icon: Mail },
      { label: { en: 'WhatsApp Campaign', ar: 'حملات واتساب' }, href: '/creator/whatsapp', icon: Activity },
      { label: { en: 'Contacts', ar: 'جهات الاتصال' }, href: '/creator/marketing/contacts', icon: ContactRound },
      { label: { en: 'Messages', ar: 'الرسائل' }, href: '/creator/messages', icon: MessageSquare },
      { label: { en: 'Affiliates', ar: 'الإحالات' }, href: '/creator/affiliates', icon: Share2 },
    ],
  },
  {
    label: { en: 'Settings', ar: 'الإعدادات' },
    items: [
      { label: { en: 'Notifications', ar: 'الإشعارات' }, href: '/creator/notifications', icon: Bell },
      { label: { en: 'Team & Roles', ar: 'الفريق والأدوار' }, href: '/creator/team', icon: UsersRound },
      { label: { en: 'Integrations', ar: 'التكاملات' }, href: '/creator/integrations', icon: PlugZap },
      { label: { en: 'Help & Support', ar: 'المساعدة والدعم' }, href: '/creator/help', icon: CircleHelp },
    ],
  },
]

export function resolveActiveSidebarHref(pathname: string): string | undefined {
  const bare = pathname.replace(/^\/(en|ar)/, '') || '/'
  return navGroups
    .flatMap(group => group.items)
    .filter(item => bare === item.href || bare.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}

export default function DashSidebar() {
  const pathname = usePathname()
  const { lang } = useDashPrefs()
  const { logout } = useAuthContext()
  const { selectedCommunity, isLoading: communityLoading } = useCreatorCommunity()
  const bare = pathname.replace(/^\/(en|ar)/, '') || '/'
  const activeHref = resolveActiveSidebarHref(pathname)

  const soon = lang === 'ar' ? 'قريباً' : 'soon'
  const createCommunity = lang === 'ar' ? 'إنشاء مجتمع' : 'Create Community'

  const communityName = String(selectedCommunity?.name || selectedCommunity?.nom || selectedCommunity?.title || (communityLoading ? 'Loading...' : 'Select community'))
  const communitySlug = String(selectedCommunity?.slug || selectedCommunity?.handle || selectedCommunity?._id || selectedCommunity?.id || '')
  const communityImage = resolveImageUrl(
    selectedCommunity?.logoUrl ||
    selectedCommunity?.logo ||
    selectedCommunity?.image ||
    selectedCommunity?.coverImage ||
    selectedCommunity?.thumbnailUrl ||
    selectedCommunity?.thumbnail ||
    '',
  )
  const communityInitials = communityName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'C'

  return (
    <aside style={{ background: 'var(--white)', borderRight: '1px solid var(--bd)' }}
      className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[220px] z-50">

      {/* Brand */}
      <div style={{ borderBottom: '1px solid var(--bd)' }} className="px-4 pt-[18px] pb-[14px] flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
          style={{ background: 'var(--p)' }}>
          {communityImage
            ? <img src={communityImage} alt="" className="h-full w-full object-cover" loading="lazy" />
            : communityInitials}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{communityName}</p>
          <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>
            {communitySlug ? `/${communitySlug}` : 'Creator community'}
          </p>
        </div>
      </div>

      {/* Create button */}
      <Link href="/creator/create-community"
        aria-label="Create a new community"
        className="mx-3 mt-3 mb-2 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-opacity hover:opacity-85 w-[calc(100%-24px)] shrink-0"
        style={{ background: 'var(--p)', color: '#fff' }}>
        <DashIcon name="plus" size={13} color="white" />
        {createCommunity}
      </Link>

      {/* Nav groups — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label.en} className="pt-2.5 pb-1">
            <p className="text-[11px] font-semibold tracking-[.07em] uppercase px-4 pb-1.5"
              style={{ color: 'var(--t3)' }}>
              {group.label[lang]}
            </p>
            {group.items.map((item) => {
              const active = item.href === activeHref
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-2 px-4 py-[7px] text-[13px] relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)] focus-visible:ring-offset-1"
                  style={{
                    background: active ? 'var(--p2)' : 'transparent',
                    color: active ? 'var(--p)' : 'var(--t2)',
                    fontWeight: active ? 500 : 400,
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--t1)' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--t2)' } }}>
                  {active && <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-[3px]" style={{ background: 'var(--p)' }} />}
                  <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`} strokeWidth={1.8} />
                  {item.label[lang]}
                  {'soon' in item && Boolean(item.soon) && (
                    <span className="ml-auto text-[11px] font-semibold tracking-[.04em] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--p2)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                      {soon}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Fixed footer — Profile + Sign Out side by side */}
      <div className="shrink-0 p-3" style={{ borderTop: '1px solid var(--bd)' }}>
        <div className="flex gap-2">
          <Link href="/profile"
            aria-label="View profile"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'var(--p2)', color: 'var(--p)' }}>
            <DashIcon name="user" size={13} color="var(--p)" />
            {lang === 'ar' ? 'الملف' : 'Profile'}
          </Link>
          <button type="button"
            aria-label="Sign out"
            onClick={() => void logout()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'rgba(239,68,68,.09)', color: '#ef4444' }}>
            <DashIcon name="logout" size={13} color="#ef4444" />
            {lang === 'ar' ? 'خروج' : 'Sign Out'}
          </button>
        </div>
      </div>
    </aside>
  )
}
