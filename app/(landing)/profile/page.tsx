'use client'

import { useEffect, useRef, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  Pencil, MapPin, Mail, Globe, Check, X, Search,
  Camera, BookOpen, Calendar, Trophy, Zap, Package,
  Users, Star, ExternalLink, Link2, Github,
  Twitter, Linkedin, Instagram, Youtube,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialLinks {
  twitter: string; linkedin: string; instagram: string
  youtube: string; tiktok: string; github: string; website: string
}

interface Country { code: string; name: string }

interface ProfileData {
  name: string; email: string; bio: string; handle: string
  location: Country | null; avatar: string | null
  socials: SocialLinks
}

// ─── Countries (full list with flags) ────────────────────────────────────────

const toFlag = (code: string) =>
  code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')

const COUNTRIES: Country[] = [
  { code: 'TN', name: 'Tunisia' },       { code: 'DZ', name: 'Algeria' },
  { code: 'MA', name: 'Morocco' },       { code: 'EG', name: 'Egypt' },
  { code: 'LY', name: 'Libya' },         { code: 'MR', name: 'Mauritania' },
  { code: 'SD', name: 'Sudan' },         { code: 'LB', name: 'Lebanon' },
  { code: 'SY', name: 'Syria' },         { code: 'IQ', name: 'Iraq' },
  { code: 'JO', name: 'Jordan' },        { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },           { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },         { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },          { code: 'YE', name: 'Yemen' },
  { code: 'PS', name: 'Palestine' },     { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },       { code: 'GB', name: 'United Kingdom' },
  { code: 'ES', name: 'Spain' },         { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },      { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },       { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },        { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },       { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },        { code: 'CZ', name: 'Czech Republic' },
  { code: 'AT', name: 'Austria' },       { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },        { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },       { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },        { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },        { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },         { code: 'CO', name: 'Colombia' },
  { code: 'JP', name: 'Japan' },         { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },   { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },     { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },    { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },      { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' },      { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' },     { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },         { code: 'ET', name: 'Ethiopia' },
  { code: 'GH', name: 'Ghana' },         { code: 'SN', name: 'Senegal' },
  { code: 'CM', name: 'Cameroon' },      { code: 'CI', name: "Cote d'Ivoire" },
  { code: 'IL', name: 'Israel' },        { code: 'IR', name: 'Iran' },
  { code: 'AF', name: 'Afghanistan' },   { code: 'PK', name: 'Pakistan' },
].filter((c, i, a) => a.findIndex(x => x.code === c.code) === i)
  .sort((a, b) => a.name.localeCompare(b.name))

// ─── Social platforms config ──────────────────────────────────────────────────

const SOCIALS = [
  { id: 'twitter'   as const, label: 'X / Twitter', placeholder: '@username', color: '#000',     base: 'https://x.com/',             Icon: Twitter   },
  { id: 'linkedin'  as const, label: 'LinkedIn',    placeholder: 'username',  color: '#0077b5',  base: 'https://linkedin.com/in/',   Icon: Linkedin  },
  { id: 'instagram' as const, label: 'Instagram',   placeholder: '@username', color: '#e1306c',  base: 'https://instagram.com/',     Icon: Instagram },
  { id: 'youtube'   as const, label: 'YouTube',     placeholder: '@channel',  color: '#ff0000',  base: 'https://youtube.com/@',      Icon: Youtube   },
  { id: 'tiktok'    as const, label: 'TikTok',      placeholder: '@username', color: '#111',     base: 'https://tiktok.com/@',       Icon: Link2     },
  { id: 'github'    as const, label: 'GitHub',      placeholder: 'username',  color: '#333',     base: 'https://github.com/',        Icon: Github    },
  { id: 'website'   as const, label: 'Website',     placeholder: 'yoursite.com', color: 'var(--p)', base: 'https://',                Icon: Globe     },
] as const

// ─── Default profile ──────────────────────────────────────────────────────────

const DEFAULT: ProfileData = {
  name: 'Motion Masters Creator',
  email: 'creator@chabaqa.com',
  bio: 'Creator & community builder. Helping motion designers level up their skills and build meaningful careers.',
  handle: '@motionmaster',
  location: { code: 'TN', name: 'Tunisia' },
  avatar: null,
  socials: { twitter: 'motionmaster', linkedin: 'motionmaster', instagram: '', youtube: '', tiktok: '', github: '', website: 'chabaqa.com' },
}

// ─── Mock communities ─────────────────────────────────────────────────────────

const COMMUNITIES = [
  { id: 1, name: 'Motion Masters',    members: 1298, role: 'Creator', color: 'var(--p)',      joined: '2025-09-01' },
  { id: 2, name: 'Design System Lab', members: 420,  role: 'Member',  color: 'var(--cyan)',   joined: '2025-11-14' },
  { id: 3, name: 'Creative Tunisia',  members: 870,  role: 'Admin',   color: 'var(--orange)', joined: '2026-01-08' },
  { id: 4, name: 'UX Collective',     members: 3400, role: 'Member',  color: 'var(--pink)',   joined: '2026-02-20' },
]

// ─── Mock content ─────────────────────────────────────────────────────────────

const CONTENT = [
  { id: 1, title: 'Motion Design Fundamentals',   type: 'course',    progress: 100, rating: 4.9, color: 'var(--p)'      },
  { id: 2, title: 'Annual Community Summit',       type: 'event',     progress: 100, rating: 4.6, color: 'var(--pink)'   },
  { id: 3, title: '30-Day Body Challenge',         type: 'challenge', progress: 72,  rating: 4.7, color: 'var(--orange)' },
  { id: 4, title: '1-on-1 Strategy Session',       type: 'session',   progress: 100, rating: 5.0, color: 'var(--cyan)'   },
  { id: 5, title: 'Motion Pro — Advanced',         type: 'course',    progress: 45,  rating: 4.8, color: 'var(--p)'      },
  { id: 6, title: 'Branding Assets Pack',          type: 'product',   progress: 100, rating: 4.5, color: '#16a34a'       },
  { id: 7, title: '14-Day Portfolio Challenge',    type: 'challenge', progress: 100, rating: 4.6, color: 'var(--orange)' },
  { id: 8, title: 'Composition Masterclass',       type: 'course',    progress: 20,  rating: 4.8, color: 'var(--p)'      },
]

const TYPE_ICON: Record<string, React.ReactNode> = {
  course:    <BookOpen   className="w-3.5 h-3.5" strokeWidth={1.7} />,
  challenge: <Trophy     className="w-3.5 h-3.5" strokeWidth={1.7} />,
  session:   <Calendar   className="w-3.5 h-3.5" strokeWidth={1.7} />,
  event:     <Zap        className="w-3.5 h-3.5" strokeWidth={1.7} />,
  product:   <Package    className="w-3.5 h-3.5" strokeWidth={1.7} />,
}

const ROLE_META: Record<string, { bg: string; color: string }> = {
  Creator: { bg: 'var(--p2)',              color: 'var(--p)'  },
  Admin:   { bg: 'rgba(251,146,60,.12)',   color: 'var(--orange)' },
  Member:  { bg: 'var(--bg)',              color: 'var(--t3)' },
}

// ─── Activity Generator ───────────────────────────────────────────────────────

function genActivity(): number[] {
  let s = 0xdeadbeef
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  return Array.from({ length: 365 }, (_, i) => {
    const v = rng()
    if (i > 340) return v < 0.7 ? Math.ceil(v * 4) : 0
    if (v < 0.35) return 0
    return Math.ceil(v * 4)
  })
}

const ACTIVITY = genActivity()

const ACTIVITY_COLORS = [
  'var(--bd)',           // 0 — empty
  'var(--p3)',           // 1 — light
  'rgba(var(--p-rgb, 124,58,237),.4)',  // 2
  'rgba(var(--p-rgb, 124,58,237),.7)',  // 3
  'var(--p)',            // 4 — max
]

// ─── Country Picker ───────────────────────────────────────────────────────────

function CountryPicker({ value, onChange }: { value: Country | null; onChange: (c: Country) => void }) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const results = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full h-10 px-3 rounded-xl text-[13px] flex items-center gap-2 cursor-pointer transition-all"
        style={{ border: `1.5px solid ${open ? 'var(--p)' : 'var(--bd)'}`, background: 'var(--bg)', color: 'var(--t1)' }}>
        {value
          ? <><span className="text-[18px] leading-none">{toFlag(value.code)}</span><span className="flex-1 text-left">{value.name}</span></>
          : <span className="flex-1 text-left" style={{ color: 'var(--t3)' }}>Select country…</span>
        }
        <span style={{ color: 'var(--t3)', fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-50"
          style={{ background: 'var(--white)', border: '1.5px solid var(--p)', boxShadow: '0 16px 48px rgba(0,0,0,.15)' }}>
          {/* search */}
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--bd)' }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search country…" className="flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: 'var(--t1)' }} />
            {query && <button onClick={() => setQuery('')} style={{ color: 'var(--t3)' }}><X className="w-3.5 h-3.5" /></button>}
          </div>
          {/* list */}
          <div className="max-h-[220px] overflow-y-auto">
            {results.length === 0
              ? <p className="text-[13px] text-center py-4" style={{ color: 'var(--t3)' }}>No country found</p>
              : results.map(c => (
                  <button key={c.code} type="button"
                    onClick={() => { onChange(c); setOpen(false); setQuery('') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-left"
                    style={value?.code === c.code ? { background: 'var(--p2)', color: 'var(--p)' } : {}}
                    onMouseEnter={e => { if (value?.code !== c.code) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { if (value?.code !== c.code) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <span className="text-[20px] leading-none w-7 shrink-0 text-center">{toFlag(c.code)}</span>
                    <span className="text-[13px]" style={{ color: value?.code === c.code ? 'var(--p)' : 'var(--t1)' }}>{c.name}</span>
                    <span className="text-[10px] ml-auto font-mono" style={{ color: 'var(--t3)' }}>{c.code}</span>
                    {value?.code === c.code && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--p)' }} strokeWidth={2.5} />}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Activity Tracker ─────────────────────────────────────────────────────────

function ActivityTracker() {
  const weeks = 52
  const days  = 7
  const total = weeks * days

  // pad so week starts on Monday of 52 weeks ago
  const today  = new Date()
  const dow    = (today.getDay() + 6) % 7 // 0=Mon
  const offset = total - (ACTIVITY.length % total || total)

  const cells = Array.from({ length: total }, (_, i) => {
    const actIdx = i - offset
    return actIdx >= 0 && actIdx < ACTIVITY.length ? ACTIVITY[actIdx] : -1
  })

  const months: { label: string; col: number }[] = []
  for (let w = 0; w < weeks; w++) {
    const d = new Date(today)
    d.setDate(d.getDate() - (weeks - 1 - w) * 7 - dow)
    const m = d.toLocaleString('en-US', { month: 'short' })
    if (w === 0 || months[months.length - 1].label !== m) months.push({ label: m, col: w })
  }

  const total_active = ACTIVITY.filter(v => v > 0).length
  const streakDays   = (() => {
    let streak = 0
    for (let i = ACTIVITY.length - 1; i >= 0; i--) {
      if (ACTIVITY[i] === 0) break
      streak++
    }
    return streak
  })()

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Activity</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>
            <span className="font-semibold" style={{ color: 'var(--p)' }}>{total_active}</span> active days in the last year
          </p>
        </div>
        <div className="flex items-center gap-4">
          {streakDays > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(251,146,60,.1)', border: '1px solid rgba(251,146,60,.25)' }}>
              <span className="text-[14px]">🔥</span>
              <p className="text-[12px] font-bold" style={{ color: 'var(--orange)' }}>{streakDays} day streak</p>
            </div>
          )}
          {/* legend */}
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--t3)' }}>
            <span>Less</span>
            {[0,1,2,3,4].map(l => (
              <div key={l} className="w-3 h-3 rounded-sm"
                style={{ background: l === 0 ? 'var(--bd)' : l === 1 ? 'var(--p3)' : `rgba(124,58,237,${l * 0.22 + 0.16})` }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* month labels */}
      <div className="flex gap-[3px] mb-1 pl-[18px]">
        {Array.from({ length: weeks }, (_, w) => {
          const m = months.find(mo => mo.col === w)
          return (
            <div key={w} className="w-[11px] shrink-0 text-[9px]" style={{ color: 'var(--t3)' }}>
              {m ? m.label : ''}
            </div>
          )
        })}
      </div>

      {/* grid */}
      <div className="flex gap-[3px]">
        {/* day labels */}
        <div className="flex flex-col gap-[3px] mr-0.5">
          {['M','','W','','F','',''].map((d, i) => (
            <div key={i} className="w-[14px] h-[11px] text-[9px] flex items-center justify-end pr-0.5"
              style={{ color: 'var(--t3)' }}>{d}</div>
          ))}
        </div>
        {/* week columns */}
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {Array.from({ length: days }, (_, d) => {
              const idx  = w * days + d
              const val  = cells[idx]
              const bg   = val < 0 ? 'transparent'
                         : val === 0 ? 'var(--bd)'
                         : val === 1 ? 'var(--p3)'
                         : `rgba(124,58,237,${val * 0.22 + 0.16})`
              return (
                <div key={d} title={val >= 0 ? `${val} activities` : ''}
                  className="w-[11px] h-[11px] rounded-[2px] transition-transform hover:scale-125 cursor-default"
                  style={{ background: bg }} />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ profile, onSave, onClose }: {
  profile: ProfileData
  onSave: (p: ProfileData) => void
  onClose: () => void
}) {
  const [name,     setName]     = useState(profile.name)
  const [bio,      setBio]      = useState(profile.bio)
  const [location, setLocation] = useState<Country | null>(profile.location)
  const [socials,  setSocials]  = useState<SocialLinks>({ ...profile.socials })
  const [avatar,   setAvatar]   = useState<string | null>(profile.avatar)
  const [saving,   setSaving]   = useState(false)
  const [section,  setSection]  = useState<'info' | 'social'>('info')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatar = (f: File) => {
    const reader = new FileReader()
    reader.onload = e => setAvatar(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const submit = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    onSave({ ...profile, name, bio, location, socials, avatar })
    setSaving(false)
  }

  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none"
  const fs  = { border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }
  const fo  = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--p)'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--bd)'),
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[560px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
          style={{ background: 'var(--white)', boxShadow: '0 32px 80px rgba(0,0,0,.2)' }}>

          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--bd)' }}>
            <p className="text-[16px] font-bold" style={{ color: 'var(--t1)' }}>Edit Profile</p>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
              style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* tabs */}
          <div className="flex gap-1 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid var(--bd)', background: 'var(--bg)' }}>
            {(['info', 'social'] as const).map(t => (
              <button key={t} onClick={() => setSection(t)}
                className="h-8 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-all capitalize"
                style={section === t ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                {t === 'info' ? 'Profile Info' : 'Social Links'}
              </button>
            ))}
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {section === 'info' ? (
              <>
                {/* avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden"
                      style={{ border: '2px solid var(--bd)', background: 'var(--p2)' }}>
                      {avatar
                        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[22px] font-bold text-white"
                            style={{ background: 'var(--p)' }}>
                            {profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                      }
                    </div>
                    <button onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80"
                      style={{ background: 'var(--p)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
                      <Camera className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleAvatar(e.target.files[0]) }} />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>Profile Photo</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>JPG, PNG or GIF · Max 5MB</p>
                    <button onClick={() => fileRef.current?.click()}
                      className="mt-2 h-7 px-3 rounded-lg text-[11px] font-semibold cursor-pointer hover:opacity-80"
                      style={{ background: 'var(--p2)', color: 'var(--p)', border: '1px solid var(--bd)' }}>
                      Upload Photo
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>Display Name <span style={{ color: 'var(--p)' }}>*</span></p>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className={inp} style={fs} {...fo} />
                </div>

                <div>
                  <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>Bio</p>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder="Tell people about yourself…"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                    style={{ ...fs, border: '1.5px solid var(--bd)' as any }}
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--p)'}
                    onBlur={e  => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)'} />
                  <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>{bio.length}/160</p>
                </div>

                <div>
                  <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>Location</p>
                  <CountryPicker value={location} onChange={setLocation} />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px]" style={{ color: 'var(--t3)' }}>Add your social media usernames. Leave empty to hide.</p>
                {SOCIALS.map(s => {
                  const { Icon } = s
                  return (
                    <div key={s.id}>
                      <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t2)' }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: s.color }} strokeWidth={1.8} /> {s.label}
                      </p>
                      <div className="flex items-center gap-0 rounded-xl overflow-hidden"
                        style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)' }}>
                        <span className="px-3 text-[11px] h-10 flex items-center shrink-0"
                          style={{ color: 'var(--t3)', borderRight: '1px solid var(--bd)', background: 'var(--white)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.base}
                        </span>
                        <input value={socials[s.id]} onChange={e => setSocials(p => ({ ...p, [s.id]: e.target.value }))}
                          placeholder={s.placeholder}
                          className="flex-1 h-10 px-3 text-[13px] outline-none bg-transparent"
                          style={{ color: 'var(--t1)' }}
                          onFocus={e => ((e.target as HTMLInputElement).closest('div') as HTMLElement)!.style.borderColor = 'var(--p)'}
                          onBlur={e  => ((e.target as HTMLInputElement).closest('div') as HTMLElement)!.style.borderColor = 'var(--bd)'} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="h-2" />
          </div>

          {/* footer */}
          <div className="px-6 py-4 shrink-0 flex gap-3" style={{ borderTop: '1px solid var(--bd)' }}>
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80"
              style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
              Cancel
            </button>
            <button onClick={submit} disabled={!name.trim() || saving}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'var(--p)' }}>
              {saving
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <><Check className="w-4 h-4" strokeWidth={2.5} /> Save Profile</>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile,    setProfile]    = useState<ProfileData>(DEFAULT)
  const [editOpen,   setEditOpen]   = useState(false)
  const [contentTab, setContentTab] = useState<'all'|'course'|'session'|'event'|'challenge'|'product'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chabaqa_profile')
      if (saved) setProfile(JSON.parse(saved))
    } catch {}
  }, [])

  const saveProfile = (p: ProfileData) => {
    setProfile(p)
    localStorage.setItem('chabaqa_profile', JSON.stringify(p))
    setEditOpen(false)
  }

  const initials = profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const filteredContent = CONTENT.filter(c => contentTab === 'all' || c.type === contentTab)

  const activeSocials = SOCIALS.filter(s => profile.socials[s.id]?.trim())

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .profile-fade{animation:fadeUp .4s ease both}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
        .z-60{z-index:60}
      `}</style>

      <Header />

      <div className="min-h-screen pt-20" style={{ background: 'var(--bg)' }}>

        {/* ── Cover + Hero ── */}
        <div className="relative h-52 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--p) 0%, #7c3aed 40%, #6d28d9 70%, #4c1d95 100%)' }}>
          {/* decorative circles */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            {[{ w:300,h:300,t:-80,r:100 },{ w:200,h:200,b:-50,l:200 },{ w:150,h:150,t:20,r:350 }].map((c,i) => (
              <div key={i} className="absolute rounded-full border border-white"
                style={{ width: c.w, height: c.h, top: (c as any).t, bottom: (c as any).b, left: (c as any).l, right: (c as any).r }} />
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6">

          {/* ── Profile Header ── */}
          <div className="relative -mt-16 mb-6 profile-fade">
            <div className="flex items-end gap-5 flex-wrap">
              {/* avatar */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-3xl overflow-hidden"
                  style={{ border: '4px solid var(--white)', boxShadow: '0 8px 32px rgba(0,0,0,.18)', background: 'var(--p2)' }}>
                  {profile.avatar
                    ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[28px] font-bold text-white"
                        style={{ background: 'var(--p)' }}>{initials}</div>
                  }
                </div>
                <button onClick={() => setEditOpen(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 shadow-lg"
                  style={{ background: 'var(--p)', color: '#fff' }}>
                  <Camera className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              {/* name + info */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-[24px] font-bold" style={{ color: 'var(--t1)' }}>{profile.name}</h1>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded-lg" style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                    {profile.handle}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-[13px]" style={{ color: 'var(--t3)' }}>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.7} /> {profile.email}
                  </span>
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-[16px]">{toFlag(profile.location.code)}</span>
                      {profile.location.name}
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-[13px] mt-2 max-w-xl" style={{ color: 'var(--t2)' }}>{profile.bio}</p>
                )}
              </div>

              {/* edit button */}
              <button onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold cursor-pointer hover:opacity-90 transition-opacity shrink-0 mb-2"
                style={{ background: 'var(--p)', color: '#fff' }}>
                <Pencil className="w-3.5 h-3.5" strokeWidth={2} /> Edit Profile
              </button>
            </div>

            {/* social links */}
            {activeSocials.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-4">
                {activeSocials.map(s => {
                  const { Icon } = s
                  const username = profile.socials[s.id]
                  const href = s.id === 'website'
                    ? (username.startsWith('http') ? username : `https://${username}`)
                    : s.base + username
                  return (
                    <a key={s.id} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 h-8 px-3 rounded-xl text-[12px] font-medium transition-all hover:opacity-80"
                      style={{ background: 'var(--white)', border: '1px solid var(--bd)', color: 'var(--t2)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color; (e.currentTarget as HTMLElement).style.color = s.color }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'; (e.currentTarget as HTMLElement).style.color = 'var(--t2)' }}>
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'inherit' }} strokeWidth={1.8} />
                      {s.id === 'website' ? username : `@${username}`}
                      <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={1.7} />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-4 gap-3 mb-6 profile-fade" style={{ animationDelay: '50ms' }}>
            {[
              { label: 'Communities',  value: COMMUNITIES.length,                               color: 'var(--p)'      },
              { label: 'Content',      value: CONTENT.length,                                   color: 'var(--cyan)'   },
              { label: 'Completed',    value: CONTENT.filter(c => c.progress === 100).length,   color: '#16a34a'       },
              { label: 'Active Days',  value: ACTIVITY.filter(v => v > 0).length,               color: 'var(--orange)' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl px-5 py-4 text-center"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Activity Tracker ── */}
          <div className="mb-6 profile-fade" style={{ animationDelay: '100ms' }}>
            <ActivityTracker />
          </div>

          {/* ── Communities ── */}
          <div className="mb-6 profile-fade" style={{ animationDelay: '150ms' }}>
            <p className="text-[16px] font-bold mb-4" style={{ color: 'var(--t1)' }}>Communities</p>
            <div className="grid grid-cols-2 gap-3">
              {COMMUNITIES.map(c => {
                const rm = ROLE_META[c.role]
                return (
                  <div key={c.id} className="flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer"
                    style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.07)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-bold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${c.color} 0%, ${c.color}bb 100%)` }}>
                      {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-bold truncate" style={{ color: 'var(--t1)' }}>{c.name}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: rm.bg, color: rm.color }}>{c.role}</span>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
                        {c.members.toLocaleString()} members · Since {c.joined}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Content Owned ── */}
          <div className="mb-10 profile-fade" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[16px] font-bold" style={{ color: 'var(--t1)' }}>My Content</p>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {(['all', 'course', 'session', 'event', 'challenge', 'product'] as const).map(t => (
                  <button key={t} onClick={() => setContentTab(t)}
                    className="h-6 px-3 rounded-lg text-[11px] font-semibold cursor-pointer transition-all capitalize"
                    style={contentTab === t ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                    {t === 'all' ? 'All' : t + 's'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {filteredContent.map((c, i) => (
                <div key={c.id}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all"
                  style={{ background: 'var(--white)', border: '1px solid var(--bd)', animationDelay: `${i * 40}ms` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.07)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                  {/* color top */}
                  <div className="h-1.5 w-full" style={{ background: c.color }} />
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span style={{ color: c.color }}>{TYPE_ICON[c.type]}</span>
                      <span className="text-[10px] font-semibold capitalize" style={{ color: c.color }}>{c.type}</span>
                    </div>
                    <p className="text-[13px] font-bold mb-3 leading-tight" style={{ color: 'var(--t1)' }}>{c.title}</p>

                    {/* progress */}
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px]" style={{ color: 'var(--t3)' }}>
                        {c.progress === 100 ? 'Completed' : `${c.progress}% done`}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3" style={{ color: 'var(--orange)' }} fill="var(--orange)" strokeWidth={0} />
                        <p className="text-[10px] font-bold" style={{ color: 'var(--t2)' }}>{c.rating}</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${c.progress}%`, background: c.progress === 100 ? '#16a34a' : c.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <Footer />

      {editOpen && (
        <EditModal profile={profile} onSave={saveProfile} onClose={() => setEditOpen(false)} />
      )}
    </>
  )
}

// ─── Missing import ───────────────────────────────────────────────────────────
function ChevronRight({ className, style, strokeWidth }: { className?: string; style?: React.CSSProperties; strokeWidth?: number }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
