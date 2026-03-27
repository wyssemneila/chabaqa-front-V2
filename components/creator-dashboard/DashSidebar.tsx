'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashIcon from './DashIcon'

interface NavItem  { label: string; href: string; icon: string; soon?: boolean }
interface NavGroup { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Overview',    href: '/creator',            icon: 'grid'      },
      { label: 'Communities', href: '/creator/communities', icon: 'users'     },
      { label: 'Analytics',   href: '/creator/analytics',  icon: 'chart'     },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Courses',    href: '/creator/courses',    icon: 'book'     },
      { label: 'Challenges', href: '/creator/challenges', icon: 'bolt'     },
      { label: 'Sessions',   href: '/creator/sessions',   icon: 'calendar' },
      { label: 'Events',     href: '/creator/events',     icon: 'event'    },
      { label: 'Products',   href: '/creator/products',   icon: 'product'  },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { label: 'Subscriptions',   href: '/creator/subscriptions',   icon: 'creditcard' },
      { label: 'Payouts',         href: '/creator/payouts',         icon: 'dollar'     },
      { label: 'Manual Payments', href: '/creator/manual-payments', icon: 'creditcard' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Email Campaigns', href: '/creator/email',      icon: 'mail'    },
      { label: 'Affiliates',      href: '/creator/affiliates', icon: 'share'   },
      { label: 'Messages',        href: '/creator/messages',   icon: 'message', soon: true },
      { label: 'WhatsApp',        href: '/creator/whatsapp',   icon: 'message', soon: true },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Team & Roles',  href: '/creator/team',         icon: 'team'     },
      { label: 'Integrations',  href: '/creator/integrations', icon: 'settings', soon: true },
    ],
  },
]

const footerItems: NavItem[] = [
  { label: 'Help & Support', href: '/creator/help',    icon: 'help'   },
  { label: 'Profile',        href: '/creator/profile', icon: 'user'   },
  { label: 'Sign Out',       href: '/api/auth/signout', icon: 'logout' },
]

export default function DashSidebar() {
  const pathname = usePathname()
  // Strip locale prefix for comparison
  const bare = pathname.replace(/^\/(en|ar)/, '') || '/'

  return (
    <aside style={{ background: '#ffffff', borderRight: '1px solid #e4e2db' }}
      className="fixed top-0 left-0 h-screen w-[220px] flex flex-col overflow-y-auto z-50">

      {/* Brand */}
      <div style={{ borderBottom: '1px solid #e4e2db' }} className="px-4 pt-[18px] pb-[14px] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
          style={{ background: '#1a1916' }}>
          Ch
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: '#1a1916' }}>Motion Masters</p>
          <p className="text-[11px]" style={{ color: '#9a9890' }}>Demo Creator</p>
        </div>
      </div>

      {/* Create button */}
      <button className="mx-3 mt-3 mb-2 px-3 py-2 rounded-[10px] text-xs font-medium flex items-center gap-1.5 transition-opacity hover:opacity-85 w-[calc(100%-24px)]"
        style={{ background: '#1a1916', color: '#fff' }}>
        <DashIcon name="plus" size={13} color="white" />
        Create Community
      </button>

      {/* Nav groups */}
      <div className="flex-1">
        {navGroups.map((group) => (
          <div key={group.label} className="pt-2.5 pb-1">
            <p className="text-[10px] font-semibold tracking-[.07em] uppercase px-4 pb-1.5"
              style={{ color: '#9a9890' }}>
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = bare === item.href || bare.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-2 px-4 py-[7px] text-[13px] relative transition-colors"
                  style={{
                    background: active ? '#eef1ff' : 'transparent',
                    color: active ? '#2a5cff' : '#5a5850',
                    fontWeight: active ? 500 : 400,
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = '#f0efe9'; (e.currentTarget as HTMLElement).style.color = '#1a1916' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5a5850' } }}
                >
                  {active && <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-[3px]" style={{ background: '#2a5cff' }} />}
                  <DashIcon name={item.icon} size={15} color={active ? '#2a5cff' : 'currentColor'}
                    className={active ? 'opacity-100' : 'opacity-70'} />
                  {item.label}
                  {item.soon && (
                    <span className="ml-auto text-[9px] font-semibold tracking-[.04em] px-1.5 py-0.5 rounded-full"
                      style={{ background: '#f0efe9', color: '#9a9890', border: '1px solid #e4e2db' }}>
                      soon
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e4e2db' }} className="py-2">
        {footerItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-2 px-4 py-[7px] text-[13px] transition-colors"
            style={{ color: '#5a5850' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0efe9'; (e.currentTarget as HTMLElement).style.color = '#1a1916' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5a5850' }}
          >
            <DashIcon name={item.icon} size={15} className="opacity-70" />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
