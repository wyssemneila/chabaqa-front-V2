'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  Pencil, MapPin, Mail, Search, Camera,
  BookOpen, Calendar, Trophy, Zap, Package, Users,
  Check, X, Eye, EyeOff, Trash2, AlertTriangle,
  Bell, CreditCard, LogOut, ChevronDown, ArrowRight, Shield,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialLinks {
  twitter: string; linkedin: string; instagram: string; youtube: string
  tiktok: string; github: string; facebook: string; website: string
}

interface Country { code: string; name: string }

interface ProfileData {
  name: string; email: string; bio: string; handle: string
  location: Country | null; avatar: string | null
  socials: SocialLinks
}

// ─── Brand SVG icons ──────────────────────────────────────────────────────────

function SocialSvg({ platform, size = 16 }: { platform: string; size?: number }) {
  const s = { width: size, height: size, display: 'block' as const, flexShrink: 0 }
  if (platform === 'twitter')   return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  if (platform === 'linkedin')  return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  if (platform === 'instagram') return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  if (platform === 'youtube')   return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  if (platform === 'tiktok')    return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
  if (platform === 'github')    return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
  if (platform === 'facebook')  return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  if (platform === 'website')   return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  return null
}

// ─── Social platforms ─────────────────────────────────────────────────────────

const SOCIALS = [
  { id: 'twitter',   label: 'X / Twitter', color: '#000000', placeholder: 'https://x.com/yourhandle'             },
  { id: 'linkedin',  label: 'LinkedIn',    color: '#0077B5', placeholder: 'https://linkedin.com/in/yourname'     },
  { id: 'instagram', label: 'Instagram',   color: '#E1306C', placeholder: 'https://instagram.com/yourhandle'     },
  { id: 'youtube',   label: 'YouTube',     color: '#FF0000', placeholder: 'https://youtube.com/@yourchannel'     },
  { id: 'tiktok',    label: 'TikTok',      color: '#111111', placeholder: 'https://tiktok.com/@yourhandle'       },
  { id: 'github',    label: 'GitHub',      color: '#24292E', placeholder: 'https://github.com/yourusername'      },
  { id: 'facebook',  label: 'Facebook',    color: '#1877F2', placeholder: 'https://facebook.com/yourpage'        },
  { id: 'website',   label: 'Website',     color: '#7c3aed', placeholder: 'https://yoursite.com'                 },
]

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES: Country[] = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'DZ', name: 'Algeria' },    { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },   { code: 'AT', name: 'Austria' },    { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },  { code: 'BE', name: 'Belgium' },    { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },      { code: 'CM', name: 'Cameroon' },   { code: 'CI', name: "Cote d'Ivoire" },
  { code: 'CL', name: 'Chile' },       { code: 'CN', name: 'China' },      { code: 'CO', name: 'Colombia' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' }, { code: 'EG', name: 'Egypt' },
  { code: 'ET', name: 'Ethiopia' },    { code: 'FI', name: 'Finland' },    { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },     { code: 'GH', name: 'Ghana' },      { code: 'GR', name: 'Greece' },
  { code: 'ID', name: 'Indonesia' },   { code: 'IN', name: 'India' },      { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },        { code: 'IL', name: 'Israel' },     { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },       { code: 'JO', name: 'Jordan' },     { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' },     { code: 'LB', name: 'Lebanon' },
  { code: 'LY', name: 'Libya' },       { code: 'MA', name: 'Morocco' },    { code: 'MR', name: 'Mauritania' },
  { code: 'MX', name: 'Mexico' },      { code: 'MY', name: 'Malaysia' },   { code: 'NL', name: 'Netherlands' },
  { code: 'NG', name: 'Nigeria' },     { code: 'NO', name: 'Norway' },     { code: 'NZ', name: 'New Zealand' },
  { code: 'OM', name: 'Oman' },        { code: 'PK', name: 'Pakistan' },   { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },      { code: 'PT', name: 'Portugal' },   { code: 'PS', name: 'Palestine' },
  { code: 'QA', name: 'Qatar' },       { code: 'RU', name: 'Russia' },     { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },     { code: 'SG', name: 'Singapore' },  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },       { code: 'SD', name: 'Sudan' },      { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' },      { code: 'TH', name: 'Thailand' },
  { code: 'TN', name: 'Tunisia' },     { code: 'TR', name: 'Turkey' },     { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'UAE' },         { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },     { code: 'YE', name: 'Yemen' },
].sort((a, b) => a.name.localeCompare(b.name))

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: ProfileData = {
  name: 'Motion Masters Creator',
  email: 'creator@chabaqa.com',
  bio: 'Creator & community builder. Helping motion designers level up their skills and build meaningful careers.',
  handle: '@motionmaster',
  location: { code: 'TN', name: 'Tunisia' },
  avatar: null,
  socials: {
    twitter: 'https://x.com/motionmaster',
    linkedin: 'https://linkedin.com/in/motionmaster',
    instagram: '',
    youtube: '',
    tiktok: '',
    github: '',
    facebook: '',
    website: 'https://chabaqa.com',
  },
}

// ─── Mock communities & content ───────────────────────────────────────────────

const COMMUNITIES = [
  { id: 1, name: 'Motion Masters',    members: 1298, role: 'Creator', color: 'var(--p)'      },
  { id: 2, name: 'Design System Lab', members: 420,  role: 'Member',  color: 'var(--cyan)'   },
  { id: 3, name: 'Creative Tunisia',  members: 870,  role: 'Admin',   color: 'var(--orange)' },
  { id: 4, name: 'UX Collective',     members: 3400, role: 'Member',  color: 'var(--pink)'   },
]

const CONTENT = [
  { id: 1, title: 'Motion Design Fundamentals', type: 'course',    progress: 100, color: 'var(--p)'      },
  { id: 2, title: 'Annual Community Summit',     type: 'event',     progress: 100, color: 'var(--pink)'   },
  { id: 3, title: '30-Day Body Challenge',       type: 'challenge', progress: 72,  color: 'var(--orange)' },
  { id: 4, title: '1-on-1 Strategy Session',     type: 'session',   progress: 100, color: 'var(--cyan)'   },
  { id: 5, title: 'Motion Pro — Advanced',       type: 'course',    progress: 45,  color: 'var(--p)'      },
  { id: 6, title: 'Branding Assets Pack',        type: 'product',   progress: 100, color: '#16a34a'       },
  { id: 7, title: '14-Day Portfolio Challenge',  type: 'challenge', progress: 100, color: 'var(--orange)' },
  { id: 8, title: 'Composition Masterclass',     type: 'course',    progress: 20,  color: 'var(--p)'      },
]

const TYPE_ICON: Record<string, React.ReactNode> = {
  course:    <BookOpen  className="w-3.5 h-3.5" strokeWidth={1.7} />,
  challenge: <Trophy    className="w-3.5 h-3.5" strokeWidth={1.7} />,
  session:   <Calendar  className="w-3.5 h-3.5" strokeWidth={1.7} />,
  event:     <Zap       className="w-3.5 h-3.5" strokeWidth={1.7} />,
  product:   <Package   className="w-3.5 h-3.5" strokeWidth={1.7} />,
}

const ROLE_META: Record<string, { bg: string; color: string }> = {
  Creator: { bg: 'var(--p2)',             color: 'var(--p)'      },
  Admin:   { bg: 'rgba(251,146,60,.12)',  color: 'var(--orange)' },
  Member:  { bg: 'var(--bg)',             color: 'var(--t3)'     },
}

// ─── Activity generator ───────────────────────────────────────────────────────

function genActivity(): number[] {
  let s = 0xdeadbeef
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  return Array.from({ length: 365 }, (_, i) => {
    const v = rng()
    if (i > 340) return v < 0.65 ? Math.ceil(v * 4) : 0
    if (v < 0.35) return 0
    return Math.ceil(v * 4)
  })
}
const ACTIVITY = genActivity()

// Purple 5-level scale (0 = empty → 4 = max)
const PURPLE_SCALE = ['#eaeaf4', '#c4b5fd', '#a78bfa', '#7c3aed', '#5b21b6']

// ─── Activity Grid ────────────────────────────────────────────────────────────

function ActivityGrid() {
  const CELL = 11, GAP = 3, STEP = CELL + GAP
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const today = new Date()
  const origin = new Date(today)
  origin.setDate(today.getDate() - 363)

  const days = Array.from({ length: 364 }, (_, i) => {
    const d = new Date(origin)
    d.setDate(origin.getDate() + i)
    return { date: d, level: ACTIVITY[i] ?? 0 }
  })

  const weeks = Array.from({ length: 52 }, (_, w) => days.slice(w * 7, w * 7 + 7))

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthLabels: { col: number; name: string }[] = []
  let lastM = -1
  weeks.forEach((wk, wi) => {
    const m = wk[0]?.date.getMonth() ?? -1
    if (m !== lastM) { monthLabels.push({ col: wi, name: MONTHS[m] }); lastM = m }
  })

  const activeDays = days.filter(d => d.level > 0).length
  const totalContribs = days.reduce((s, d) => s + d.level, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--t1)' }}>Activity</h2>
        <span className="text-[12px]" style={{ color: 'var(--t3)' }}>
          {totalContribs} contributions · {activeDays} active days
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 32 + 52 * STEP }}>
          {/* Month labels */}
          <div className="relative" style={{ height: 18, marginLeft: 32 }}>
            {monthLabels.map(ml => (
              <span key={ml.col} className="absolute text-[10px] font-medium"
                style={{ left: ml.col * STEP, color: 'var(--t3)', top: 0, lineHeight: '18px', whiteSpace: 'nowrap' }}>
                {ml.name}
              </span>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: 'flex', gap: GAP }}>
            {/* Day labels */}
            <div style={{ width: 28, flexShrink: 0 }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                <div key={i} style={{
                  height: STEP, display: 'flex', alignItems: 'center',
                  justifyContent: 'flex-end', paddingRight: 5,
                  fontSize: 9, color: 'var(--t3)',
                }}>
                  {label}
                </div>
              ))}
            </div>
            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {week.map((cell, di) => {
                  const ds = cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <div key={di}
                      style={{
                        width: CELL, height: CELL, borderRadius: 2, flexShrink: 0,
                        background: PURPLE_SCALE[cell.level],
                        cursor: 'default',
                      }}
                      onMouseEnter={e => {
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTip({ x: r.left + r.width / 2, y: r.top - 6,
                          text: cell.level === 0
                            ? `No contributions on ${ds}`
                            : `${cell.level} contribution${cell.level !== 1 ? 's' : ''} on ${ds}` })
                      }}
                      onMouseLeave={() => setTip(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end" style={{ fontSize: 10, color: 'var(--t3)' }}>
            <span>Less</span>
            {PURPLE_SCALE.map((c, i) => (
              <div key={i} style={{ width: CELL, height: CELL, borderRadius: 2, background: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
      {/* Tooltip */}
      {tip && (
        <div className="fixed z-[9999] pointer-events-none px-2.5 py-1.5 rounded-lg text-white text-[11px] font-medium shadow-xl"
          style={{ left: tip.x, top: tip.y, transform: 'translate(-50%,-100%)', background: '#1e1b4b', whiteSpace: 'nowrap' }}>
          {tip.text}
          <div style={{ position: 'absolute', left: '50%', bottom: -4, transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1e1b4b' }} />
        </div>
      )}
    </div>
  )
}

// ─── Country Picker ───────────────────────────────────────────────────────────

function CountryPicker({ value, onChange }: { value: Country | null; onChange: (c: Country) => void }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const results = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full h-10 px-3 rounded-xl text-[13px] flex items-center gap-2.5 cursor-pointer"
        style={{ border: `1.5px solid ${open ? 'var(--p)' : 'var(--bd)'}`, background: 'var(--bg)', color: 'var(--t1)', transition: 'border-color .15s' }}>
        {value
          ? <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/w20/${value.code.toLowerCase()}.png`}
                width={20} height={15} alt={value.name} loading="lazy"
                style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
              <span className="flex-1 text-left">{value.name}</span>
            </>
          : <span className="flex-1 text-left" style={{ color: 'var(--t3)' }}>Select country…</span>
        }
        <span style={{ color: 'var(--t3)', fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-50"
          style={{ background: 'var(--white)', border: '1.5px solid var(--p)', boxShadow: '0 16px 48px rgba(0,0,0,.18)' }}>
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--bd)' }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search country…" className="flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: 'var(--t1)' }} />
            {query && (
              <button type="button" onClick={() => setQuery('')} style={{ color: 'var(--t3)' }}>
                <X className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            )}
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {results.length === 0
              ? <p className="text-[13px] text-center py-4" style={{ color: 'var(--t3)' }}>No country found</p>
              : results.map(c => (
                  <button key={c.code} type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-left cursor-pointer"
                    style={{ color: value?.code === c.code ? 'var(--p)' : 'var(--t1)', background: 'transparent', transition: 'background .1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    onClick={() => { onChange(c); setOpen(false); setQuery('') }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                      width={20} height={15} alt={c.name} loading="lazy"
                      style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
                    {c.name}
                    {value?.code === c.code && <Check className="w-3.5 h-3.5 ml-auto" strokeWidth={2} />}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Password field with toggle ───────────────────────────────────────────────

function PwField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 pr-10 rounded-xl text-[13px] outline-none"
          style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)', transition: 'border-color .15s' }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--p)' }}
          onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = 'var(--bd)' }} />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{ color: 'var(--t3)' }}>
          {show ? <EyeOff className="w-4 h-4" strokeWidth={1.7} /> : <Eye className="w-4 h-4" strokeWidth={1.7} />}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(() => {
    if (typeof window === 'undefined') return DEFAULT_PROFILE
    try {
      const raw = localStorage.getItem('chabaqa_profile')
      if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return DEFAULT_PROFILE
  })

  type EditTab = 'profile' | 'socials' | 'security' | 'notifications' | 'billing'
  const [editOpen, setEditOpen]         = useState(false)
  const [editTab, setEditTab]           = useState<EditTab>('profile')
  const [draft, setDraft]               = useState<ProfileData>(profile)
  const [pwForm, setPwForm]             = useState({ current: '', newPw: '', confirm: '' })
  const [pwError, setPwError]           = useState('')
  const [pwSuccess, setPwSuccess]       = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [deleteInput, setDeleteInput]   = useState('')
  const [saved, setSaved]               = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const searchParams = useSearchParams()
  useEffect(() => {
    const q = searchParams?.get('edit')
    if (q && ['profile','socials','security','notifications','billing'].includes(q)) {
      openEdit(q as EditTab)
      // clean the URL so refresh doesn't re-open
      const url = new URL(window.location.href)
      url.searchParams.delete('edit')
      window.history.replaceState({}, '', url.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const saveProfile = () => {
    setProfile(draft)
    try { localStorage.setItem('chabaqa_profile', JSON.stringify(draft)) } catch { /* ignore */ }
    setSaved(true)
    setTimeout(() => { setSaved(false); setEditOpen(false) }, 900)
  }

  const openEdit = (tab: typeof editTab = 'profile') => {
    setDraft({ ...profile, socials: { ...profile.socials } })
    setEditTab(tab)
    setPwForm({ current: '', newPw: '', confirm: '' })
    setPwError('')
    setPwSuccess(false)
    setEditOpen(true)
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraft(d => ({ ...d, avatar: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handlePwSubmit = () => {
    setPwError('')
    if (!pwForm.current) return setPwError('Enter your current password')
    if (pwForm.newPw.length < 8) return setPwError('New password must be at least 8 characters')
    if (pwForm.newPw !== pwForm.confirm) return setPwError('Passwords do not match')
    setPwSuccess(true)
    setPwForm({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwSuccess(false), 3000)
  }

  const activeSocials = SOCIALS.filter(s => {
    const v = profile.socials[s.id as keyof SocialLinks]
    return v && v.trim().length > 0
  })

  return (
    <>
      <Header />
      <main className="min-h-screen" style={{ background: 'var(--bg)', paddingTop: 80 }}>
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

          {/* ── Hero Card ── */}
          <div className="rounded-2xl"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
            {/* Edit button row */}
            <div className="flex justify-end px-5 pt-5">
              <button onClick={() => openEdit('profile')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-70"
                style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }}>
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
                Edit Profile
              </button>
            </div>

            {/* Centered content */}
            <div className="flex flex-col items-center text-center px-6 pb-7 pt-2">
              {/* Avatar */}
              <div className="w-[100px] h-[100px] rounded-full overflow-hidden mb-4"
                style={{ border: '3px solid var(--white)', boxShadow: '0 0 0 2.5px var(--p), 0 4px 16px rgba(0,0,0,.1)' }}>
                {profile.avatar
                  ? <img src={profile.avatar} alt="Avatar" loading="lazy" className="w-full h-full object-cover" />  // eslint-disable-line @next/next/no-img-element
                  : <div className="w-full h-full flex items-center justify-center text-[34px] font-bold text-white"
                      style={{ background: 'var(--p)' }}>
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                }
              </div>

              {/* Name + handle */}
              <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{profile.name}</h1>
              <p className="text-[12px] mt-1 px-2.5 py-0.5 rounded-full font-mono"
                style={{ color: 'var(--t3)', background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                {profile.handle}
              </p>

              {/* Location + email */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3.5">
                {profile.location && (
                  <span className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--t2)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w20/${profile.location.code.toLowerCase()}.png`}
                      width={18} height={14} alt={profile.location.name} loading="lazy"
                      style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
                    {profile.location.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--t2)' }}>
                  <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                  {profile.email}
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--t2)', maxWidth: 460 }}>
                  {profile.bio}
                </p>
              )}

              {/* Social icon buttons */}
              {activeSocials.length > 0 && (
                <>
                  <div className="w-full mt-5 mb-4" style={{ borderTop: '1px solid var(--bd)' }} />
                  <div className="flex items-center gap-2.5">
                    {activeSocials.map(s => (
                      <a key={s.id}
                        href={profile.socials[s.id as keyof SocialLinks]}
                        target="_blank" rel="noopener noreferrer"
                        title={s.label}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: 'var(--bg)', border: '1.5px solid var(--bd)', color: 'var(--t3)', transition: 'all .15s' }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = s.color + '15'
                          el.style.borderColor = s.color
                          el.style.color = s.color
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = 'var(--bg)'
                          el.style.borderColor = 'var(--bd)'
                          el.style.color = 'var(--t3)'
                        }}>
                        <SocialSvg platform={s.id} size={16} />
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Activity ── */}
          <div className="rounded-2xl p-6"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
            <ActivityGrid />
          </div>

          {/* ── Communities ── */}
          <section>
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--t1)' }}>Communities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMMUNITIES.map(c => {
                const meta = ROLE_META[c.role] ?? ROLE_META.Member
                return (
                  <div key={c.id} className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg)' }}>
                      <Users className="w-5 h-5" style={{ color: c.color }} strokeWidth={1.7} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{c.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{c.members.toLocaleString()} members</p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: meta.bg, color: meta.color }}>
                      {c.role}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── My Content ── */}
          <section>
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--t1)' }}>My Content</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONTENT.map(c => (
                <div key={c.id} className="rounded-2xl p-4"
                  style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ background: c.color }}>
                      {TYPE_ICON[c.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'var(--t1)' }}>{c.title}</p>
                      <p className="text-[11px] capitalize mt-0.5" style={{ color: 'var(--t3)' }}>{c.type}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'var(--t3)' }}>
                      <span>Progress</span>
                      <span style={{ color: c.progress === 100 ? '#16a34a' : 'var(--t3)', fontWeight: 500 }}>{c.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${c.progress}%`, background: c.progress === 100 ? '#16a34a' : c.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
      <Footer />

      {/* ── Edit Modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditOpen(false) }}>
          <div className="w-full max-w-[540px] max-h-[88vh] overflow-y-auto rounded-2xl"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 24px 80px rgba(0,0,0,.22)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--t1)' }}>Edit Profile</h2>
              <button onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-60"
                style={{ color: 'var(--t3)' }}>
                <X className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 mt-4 gap-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--bd)' }}>
              {([
                { id: 'profile',       label: 'Profile' },
                { id: 'socials',       label: 'Social Links' },
                { id: 'notifications', label: 'Notifications' },
                { id: 'billing',       label: 'Billing' },
                { id: 'security',      label: 'Security' },
              ] as { id: EditTab; label: string }[]).map(tabItem => (
                <button key={tabItem.id} onClick={() => setEditTab(tabItem.id)}
                  className="px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                  style={{
                    color: editTab === tabItem.id ? 'var(--p)' : 'var(--t3)',
                    borderBottom: editTab === tabItem.id ? '2px solid var(--p)' : '2px solid transparent',
                    marginBottom: -1,
                  }}>
                  {tabItem.label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="px-6 py-5">

              {/* ── Profile tab ── */}
              {editTab === 'profile' && (
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-[72px] h-[72px] rounded-full overflow-hidden"
                        style={{ border: '2.5px solid var(--bd)' }}>
                        {draft.avatar
                          ? <img src={draft.avatar} alt="Avatar preview" loading="lazy" className="w-full h-full object-cover" />  // eslint-disable-line @next/next/no-img-element
                          : <div className="w-full h-full flex items-center justify-center text-[26px] font-bold text-white"
                              style={{ background: 'var(--p)' }}>
                              {draft.name.charAt(0).toUpperCase()}
                            </div>
                        }
                      </div>
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: 'var(--p)', color: '#fff', border: '2px solid var(--white)' }}>
                        <Camera className="w-3 h-3" strokeWidth={2} />
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>Profile photo</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>JPG or PNG, max 4 MB</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>Full Name</label>
                    <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl text-[13px] outline-none"
                      style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)', transition: 'border-color .15s' }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--p)' }}
                      onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = 'var(--bd)' }} />
                  </div>

                  {/* Handle */}
                  <div>
                    <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>Username</label>
                    <input value={draft.handle} onChange={e => setDraft(d => ({ ...d, handle: e.target.value }))}
                      placeholder="@yourhandle"
                      className="w-full h-10 px-3 rounded-xl text-[13px] outline-none"
                      style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)', transition: 'border-color .15s' }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--p)' }}
                      onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = 'var(--bd)' }} />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>Bio</label>
                    <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                      rows={3} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                      style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)', transition: 'border-color .15s' }}
                      onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--p)' }}
                      onBlur={e =>  { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)' }} />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>Country</label>
                    <CountryPicker value={draft.location} onChange={c => setDraft(d => ({ ...d, location: c }))} />
                  </div>
                </div>
              )}

              {/* ── Socials tab ── */}
              {editTab === 'socials' && (
                <div className="space-y-3.5">
                  <p className="text-[12px]" style={{ color: 'var(--t3)' }}>
                    Enter the full URL to your social media profiles (e.g. https://x.com/yourhandle).
                  </p>
                  {SOCIALS.map(s => (
                    <div key={s.id}>
                      <label className="flex items-center gap-2 text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>
                        <span style={{ color: s.color }}>
                          <SocialSvg platform={s.id} size={14} />
                        </span>
                        {s.label}
                      </label>
                      <input
                        type="url"
                        value={draft.socials[s.id as keyof SocialLinks]}
                        onChange={e => setDraft(d => ({ ...d, socials: { ...d.socials, [s.id]: e.target.value } }))}
                        placeholder={s.placeholder}
                        className="w-full h-10 px-3 rounded-xl text-[13px] outline-none"
                        style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)', transition: 'border-color .15s' }}
                        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--p)' }}
                        onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = 'var(--bd)' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Notifications tab ── */}
              {editTab === 'notifications' && (
                <NotificationsTab />
              )}

              {/* ── Billing tab ── */}
              {editTab === 'billing' && (
                <BillingTab />
              )}

              {/* ── Security tab ── */}
              {editTab === 'security' && (
                <div className="space-y-6">
                  {/* Change password */}
                  <div>
                    <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--t1)' }}>Change Password</h3>
                    <div className="space-y-3">
                      <PwField label="Current Password" value={pwForm.current}
                        onChange={v => setPwForm(f => ({ ...f, current: v }))} placeholder="Enter current password" />
                      <PwField label="New Password" value={pwForm.newPw}
                        onChange={v => setPwForm(f => ({ ...f, newPw: v }))} placeholder="At least 8 characters" />
                      <PwField label="Confirm New Password" value={pwForm.confirm}
                        onChange={v => setPwForm(f => ({ ...f, confirm: v }))} placeholder="Repeat new password" />
                    </div>
                    {pwError && (
                      <p className="mt-2 text-[12px] font-medium" style={{ color: '#dc2626' }}>{pwError}</p>
                    )}
                    {pwSuccess && (
                      <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#16a34a' }}>
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Password updated successfully!
                      </div>
                    )}
                    <button onClick={handlePwSubmit}
                      className="mt-4 w-full h-10 rounded-xl text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-85"
                      style={{ background: 'var(--p)', color: '#fff' }}>
                      Update Password
                    </button>
                  </div>

                  {/* Log out all devices */}
                  <div className="rounded-xl p-4" style={{ border: '1px solid var(--bd)', background: 'var(--bg)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                           style={{ background: '#ffe4ee', color: '#f65887' }}>
                        <LogOut className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                          Log out of all devices
                        </p>
                        <p className="text-[12px] mb-3" style={{ color: 'var(--t3)' }}>
                          Sign you out of every browser, phone or tablet where you're logged in.
                        </p>
                        <button
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-85"
                          style={{ background: '#f65887', color: '#fff' }}>
                          Log out everywhere
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-xl p-4" style={{ border: '1.5px solid #fca5a5', background: '#fff5f5' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} strokeWidth={1.8} />
                      <h3 className="text-[13px] font-semibold" style={{ color: '#dc2626' }}>Danger Zone</h3>
                    </div>
                    <p className="text-[12px] mb-3 leading-relaxed" style={{ color: '#7f1d1d' }}>
                      Once you delete your account, all your data, communities, and content will be permanently removed.
                      This action cannot be undone.
                    </p>
                    <button onClick={() => setDeleteOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-85"
                      style={{ background: '#dc2626', color: '#fff' }}>
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer — only for profile & socials tabs */}
            {(editTab === 'profile' || editTab === 'socials') && (
              <div className="px-6 pb-5 pt-2 flex items-center justify-end gap-3"
                style={{ borderTop: '1px solid var(--bd)' }}>
                <button onClick={() => setEditOpen(false)}
                  className="px-5 h-9 rounded-xl text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-60"
                  style={{ color: 'var(--t2)' }}>
                  Cancel
                </button>
                <button onClick={saveProfile}
                  className="flex items-center gap-1.5 px-5 h-9 rounded-xl text-[13px] font-semibold cursor-pointer transition-all hover:opacity-85"
                  style={{ background: saved ? '#16a34a' : 'var(--p)', color: '#fff' }}>
                  {saved
                    ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Saved!</>
                    : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal — 2 steps ── */}
      {deleteOpen && (
        <DeleteAccountFlow
          onCancel={() => { setDeleteOpen(false); setDeleteInput('') }}
          onDelete={() => {
            try { localStorage.clear() } catch { /* ignore */ }
            setDeleteOpen(false); setDeleteInput(''); setEditOpen(false)
          }} />
      )}
      {false && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3>Delete Account</h3>
            </div>
            <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteOpen(false); setDeleteInput('') }}>
                Cancel
              </button>
              <button onClick={() => {}}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Notifications tab ────────────────────────────────────── */

const MOCK_COMMUNITIES = [
  { id: '1', name: 'Skoolers',           avatar: '' },
  { id: '2', name: 'chabaqa testing',    avatar: '' },
  { id: '3', name: 'NextGen AI',         avatar: '' },
  { id: '4', name: 'AI Creator Profits', avatar: '' },
  { id: '5', name: 'Communauté IA',      avatar: '' },
]

function NotificationsTab() {
  const [app, setApp] = useState({
    newFollower: true, likes: true, kaching: true, affiliate: true,
  })
  const [openCommunity, setOpenCommunity] = useState<string | null>(null)
  const [commPrefs, setCommPrefs] = useState<Record<string, any>>(() =>
    Object.fromEntries(MOCK_COMMUNITIES.map(c => [c.id, {
      weeklyDigest: true, dailyNotifs: true, adminBroadcast: true, eventReminder: true,
    }]))
  )
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--t1)' }}>App notifications</p>
        <div className="space-y-1">
          <MiniToggleRow label="New follower"        checked={app.newFollower} onChange={v => setApp({ ...app, newFollower: v })} />
          <MiniToggleRow label="Likes & mentions"    checked={app.likes}       onChange={v => setApp({ ...app, likes: v })} />
          <MiniToggleRow label="Ka-ching (sales)"    checked={app.kaching}     onChange={v => setApp({ ...app, kaching: v })} />
          <MiniToggleRow label="Affiliate referral"  checked={app.affiliate}   onChange={v => setApp({ ...app, affiliate: v })} />
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>Community notifications</p>
        <p className="text-[12px] mb-3" style={{ color: 'var(--t3)' }}>Fine-tune per community you've joined.</p>
        <div className="space-y-2">
          {MOCK_COMMUNITIES.map(c => {
            const open = openCommunity === c.id
            const p = commPrefs[c.id]
            return (
              <div key={c.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--bd)' }}>
                <button onClick={() => setOpenCommunity(open ? null : c.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-semibold shrink-0"
                       style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{c.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--t3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {open && (
                  <div className="px-3 pb-3 pt-1 space-y-1" style={{ background: 'var(--bg)' }}>
                    <MiniToggleRow label="Weekly digest email"       checked={p.weeklyDigest}   onChange={v => setCommPrefs({ ...commPrefs, [c.id]: { ...p, weeklyDigest: v } })} />
                    <MiniToggleRow label="Daily notifications email" checked={p.dailyNotifs}    onChange={v => setCommPrefs({ ...commPrefs, [c.id]: { ...p, dailyNotifs: v } })} />
                    <MiniToggleRow label="Admin broadcast email"     checked={p.adminBroadcast} onChange={v => setCommPrefs({ ...commPrefs, [c.id]: { ...p, adminBroadcast: v } })} />
                    <MiniToggleRow label="Event reminders"           checked={p.eventReminder}  onChange={v => setCommPrefs({ ...commPrefs, [c.id]: { ...p, eventReminder: v } })} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t" style={{ borderColor: 'var(--bd)' }}>
        <button onClick={save}
                className="flex items-center gap-1.5 px-5 h-9 rounded-xl text-[13px] font-semibold cursor-pointer transition-all hover:opacity-85"
                style={{ background: saved ? '#16a34a' : 'var(--p)', color: '#fff' }}>
          {saved ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Saved!</> : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function MiniToggleRow({ label, checked, onChange }:
  { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12.5px]" style={{ color: 'var(--t1)' }}>{label}</span>
      <button onClick={() => onChange(!checked)}
              className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{ background: checked ? 'var(--p)' : 'var(--bd)' }}>
        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
  )
}

/* ─── Billing tab (user side) ────────────────────────────── */

function BillingTab() {
  const card = { brand: 'VISA', last4: '4242', exp: '09/28' }
  const history = [
    { id: 'INV-2026-08', date: 'Aug 12, 2026', amount: 29, item: 'Skoolers · Monthly' },
    { id: 'INV-2026-07', date: 'Jul 12, 2026', amount: 29, item: 'Skoolers · Monthly' },
    { id: 'INV-2026-06', date: 'Jun 12, 2026', amount: 49, item: 'AI Creator Profits · Monthly' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>Payment method</p>
        <p className="text-[12px] mb-3" style={{ color: 'var(--t3)' }}>Used for community subscriptions and purchases.</p>

        <div className="rounded-xl p-4 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #1a1730 0%, #3d3570 100%)' }}>
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-20" style={{ background: '#fff' }} />
          <p className="text-white text-[11px] uppercase tracking-wider opacity-70">{card.brand}</p>
          <p className="text-white text-[15px] font-mono mt-3 tracking-wider">•••• •••• •••• {card.last4}</p>
          <p className="text-white text-[10px] mt-2 opacity-80">Exp {card.exp}</p>
        </div>

        <button className="w-full mt-3 px-3 py-2.5 rounded-xl text-[12px] font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors hover:border-[var(--p3)]"
                style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}>
          <CreditCard className="w-3.5 h-3.5" /> Update payment method
        </button>
      </div>

      <div>
        <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--t1)' }}>Payment history</p>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--bd)' }}>
          {history.map((h, i) => (
            <div key={h.id} className="px-4 py-3 flex items-center gap-3"
                 style={{ borderTop: i > 0 ? '1px solid var(--bd)' : 'none' }}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>{h.item}</p>
                <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{h.date} · {h.id}</p>
              </div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>${h.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Delete account 2-step flow ────────────────────────────── */

function DeleteAccountFlow({ onCancel, onDelete }: { onCancel: () => void; onDelete: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
         onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="w-full max-w-[420px] rounded-2xl p-6"
           style={{ background: 'var(--white)', boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--t3)' }}>Step {step} of 2</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
            <div className="h-full transition-all" style={{ background: '#dc2626', width: step === 1 ? '50%' : '100%' }} />
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} strokeWidth={1.8} />
              <h3 className="text-[16px] font-semibold" style={{ color: 'var(--t1)' }}>Sorry to see you go</h3>
            </div>
            <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--t2)' }}>
              Before you delete your account, would you tell us why? It helps us make Chabaqa better.
            </p>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="Optional — a few words is enough"
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                      style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }} />

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={onCancel}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-70"
                      style={{ color: 'var(--t2)' }}>
                Cancel
              </button>
              <button onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90"
                      style={{ background: '#dc2626' }}>
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5" style={{ color: '#dc2626' }} strokeWidth={1.8} />
              <h3 className="text-[16px] font-semibold" style={{ color: 'var(--t1)' }}>Confirm with your password</h3>
            </div>
            <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--t2)' }}>
              This will <b>permanently delete</b> your account, communities and content. There's no undo.
            </p>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                   placeholder="Enter your password"
                   className="w-full h-10 px-3 rounded-xl text-[13px] outline-none"
                   style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }} />

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-70"
                      style={{ color: 'var(--t2)' }}>
                Back
              </button>
              <button disabled={!password} onClick={onDelete}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-40"
                      style={{ background: '#dc2626' }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete forever
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
