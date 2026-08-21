'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashIcon from './DashIcon'
import { useDashPrefs } from '@/hooks/use-dash-prefs'

// ─── Nav data with translations ────────────────────────────────────────────────
const navGroups = [
  {
    label: { en: 'Main', ar: 'الرئيسية' },
    items: [
      { label: { en: 'Overview',    ar: 'نظرة عامة'   }, href: '/creator',                    icon: 'grid'      },
      { label: { en: 'Settings',    ar: 'الإعدادات'   }, href: '/creator/community-settings', icon: 'gear'      },
      { label: { en: 'Analytics',   ar: 'التحليلات'   }, href: '/creator/analytics',          icon: 'chart'     },
    ],
  },
  {
    label: { en: 'Content', ar: 'المحتوى' },
    items: [
      { label: { en: 'Courses',    ar: 'الدورات'    }, href: '/creator/courses',    icon: 'book'     },
      { label: { en: 'Challenges', ar: 'التحديات'   }, href: '/creator/challenges', icon: 'bolt'     },
      { label: { en: 'Sessions',   ar: 'الجلسات'    }, href: '/creator/sessions',   icon: 'calendar' },
      { label: { en: 'Events',     ar: 'الأحداث'    }, href: '/creator/events',     icon: 'event'    },
      { label: { en: 'Products',   ar: 'المنتجات'   }, href: '/creator/products',   icon: 'product'  },
    ],
  },
  {
    label: { en: 'Revenue', ar: 'الإيرادات' },
    items: [
      { label: { en: 'Subscriptions',   ar: 'الاشتراكات'    }, href: '/creator/subscriptions',   icon: 'creditcard' },
      { label: { en: 'Payouts',         ar: 'المدفوعات'     }, href: '/creator/payouts',         icon: 'dollar'     },
      { label: { en: 'Manual Payments', ar: 'المدفوعات اليدوية' }, href: '/creator/manual-payments', icon: 'creditcard' },
    ],
  },
  {
    label: { en: 'Marketing', ar: 'التسويق' },
    items: [
      { label: { en: 'Email Campaigns',    ar: 'حملات البريد'    }, href: '/creator/email',      icon: 'mail'      },
      { label: { en: 'WhatsApp Campaign',  ar: 'حملات واتساب'   }, href: '/creator/whatsapp',   icon: 'whatsapp'  },
      { label: { en: 'Messages',           ar: 'الرسائل'         }, href: '/creator/messages',   icon: 'message'   },
      { label: { en: 'Affiliates',         ar: 'الإحالات'        }, href: '/creator/affiliates', icon: 'share'     },
    ],
  },
  {
    label: { en: 'Tools', ar: 'أدوات' },
    items: [
      { label: { en: 'Integrations',  ar: 'التكاملات'       }, href: '/creator/integrations', icon: 'settings', soon: true },
      { label: { en: 'Help & Support', ar: 'المساعدة والدعم' }, href: '/creator/help',        icon: 'help'               },
    ],
  },
]

export default function DashSidebar() {
  const pathname = usePathname()
  const { lang } = useDashPrefs()
  const bare = pathname.replace(/^\/(en|ar)/, '') || '/'

  const soon = lang === 'ar' ? 'قريباً' : 'soon'
  const createCommunity = lang === 'ar' ? 'إنشاء مجتمع' : 'Create Community'

  return (
    <aside style={{ background: 'var(--white)', borderRight: '1px solid var(--bd)' }}
      className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[220px] z-50">

      {/* Brand */}
      <div style={{ borderBottom: '1px solid var(--bd)' }} className="px-4 pt-[18px] pb-[14px] flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
          style={{ background: 'var(--p)' }}>
          Ch
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>Motion Masters</p>
          <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
            {lang === 'ar' ? 'منشئ تجريبي' : 'Demo Creator'}
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
              const active = item.href === '/creator'
                ? bare === '/creator'
                : bare === item.href || bare.startsWith(item.href + '/')
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
                  <DashIcon name={item.icon} size={15} color={active ? 'var(--p)' : 'currentColor'}
                    className={active ? 'opacity-100' : 'opacity-70'} />
                  {item.label[lang]}
                  {'soon' in item && item.soon && (
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
          <Link href="/api/auth/signout"
            aria-label="Sign out"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'rgba(239,68,68,.09)', color: '#ef4444' }}>
            <DashIcon name="logout" size={13} color="#ef4444" />
            {lang === 'ar' ? 'خروج' : 'Sign Out'}
          </Link>
        </div>
      </div>
    </aside>
  )
}
