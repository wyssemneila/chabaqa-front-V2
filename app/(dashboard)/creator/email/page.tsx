'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  Plus, Mail, Send, Clock, Users, MousePointerClick, Eye,
  Trash2, Upload, X, Check, Calendar, AlertCircle, Inbox,
  Search, Zap, Monitor, Smartphone, BookOpen, Trophy,
  ShoppingBag, UserMinus, ToggleLeft, ToggleRight, Pencil,
  ChevronDown, AtSign, Play, Pause,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string; name: string; subject: string; previewText: string; body: string
  status: 'sent' | 'draft' | 'scheduled'
  audienceType: 'all' | 'community' | 'custom'
  audienceLabel: string; audienceCount: number
  sentAt?: string; scheduledAt?: string; createdAt: string
  stats: { sent: number; opened: number; clicked: number }
}

interface Automation {
  id: string; name: string
  trigger: string; triggerLabel: string; triggerIcon: string
  delay: number
  subject: string; body: string
  isActive: boolean; triggered: number; createdAt: string
}

interface CustomAudience {
  id: string; name: string; emails: string[]; count: number; createdAt: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const CAMP_SEED: Campaign[] = [
  {
    id: 'c1', name: 'Welcome Series — Onboarding', subject: 'Welcome to Motion Masters! 🎉',
    previewText: "Here's everything you need to get started", body: 'Hi there!\n\nWelcome to the Motion Masters community. We are thrilled to have you here.\n\nHere is what you can do right now:\n• Browse our course catalog\n• Join the community challenges\n• Connect with other members\n\nSee you inside!\nThe Motion Masters Team',
    status: 'sent', audienceType: 'all', audienceLabel: 'All Members', audienceCount: 1240,
    sentAt: '2026-03-28', createdAt: '2026-03-27',
    stats: { sent: 1240, opened: 748, clicked: 312 },
  },
  {
    id: 'c2', name: 'New Course Launch — Motion Pro', subject: 'Our most advanced course is here',
    previewText: "Don't miss the early-bird discount",
    body: 'Hey!\n\nExciting news — Motion Pro is finally live.\n\nThis is our most comprehensive course yet, covering advanced techniques from industry professionals.\n\nEarly-bird pricing ends Friday. Grab your spot now.',
    status: 'sent', audienceType: 'community', audienceLabel: 'Paid Members', audienceCount: 384,
    sentAt: '2026-03-20', createdAt: '2026-03-19',
    stats: { sent: 384, opened: 291, clicked: 178 },
  },
  {
    id: 'c3', name: 'Weekly Digest — April Week 1', subject: "What's new this week in the community",
    previewText: 'Highlights, top posts and upcoming events',
    body: 'Here is your weekly digest:\n\nTop posts this week...\nUpcoming events...\nNew courses added...',
    status: 'scheduled', audienceType: 'all', audienceLabel: 'All Members', audienceCount: 1298,
    scheduledAt: '2026-04-07 09:00', createdAt: '2026-04-03',
    stats: { sent: 0, opened: 0, clicked: 0 },
  },
  {
    id: 'c4', name: 'Re-engagement — Inactive Users', subject: "We miss you! Come back and see what's new",
    previewText: 'A lot has changed since you last visited',
    body: 'Hey! We noticed you have not been around lately.\n\nHere is what you have been missing...',
    status: 'draft', audienceType: 'custom', audienceLabel: 'Inactive Upload', audienceCount: 210,
    createdAt: '2026-04-02',
    stats: { sent: 0, opened: 0, clicked: 0 },
  },
]

const AUTO_SEED: Automation[] = [
  {
    id: 'a1', name: 'Welcome Email', trigger: 'new_member', triggerLabel: 'New member joins', triggerIcon: 'users',
    delay: 0, subject: 'Welcome to Motion Masters!',
    body: 'Hi {{first_name}},\n\nWelcome! We are so excited to have you here...',
    isActive: true, triggered: 87, createdAt: '2026-03-01',
  },
  {
    id: 'a2', name: 'Course Completion Congrats', trigger: 'course_completed', triggerLabel: 'Member completes a course', triggerIcon: 'book',
    delay: 1, subject: 'Congratulations on finishing {{course_name}}!',
    body: 'Hey {{first_name}},\n\nYou did it! You just completed {{course_name}}. Here is your certificate...',
    isActive: true, triggered: 34, createdAt: '2026-03-05',
  },
  {
    id: 'a3', name: '7-Day Re-engagement', trigger: 'inactive_7', triggerLabel: 'Member inactive 7 days', triggerIcon: 'clock',
    delay: 0, subject: 'We miss you, {{first_name}}!',
    body: 'Hi {{first_name}},\n\nIt has been a week since your last visit. Here is what you missed...',
    isActive: false, triggered: 156, createdAt: '2026-03-10',
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_COMMUNITIES = ['All Members', 'Paid Members', 'Free Members', 'VIP Members', 'Trial Members', 'Inactive Members']

const TRIGGER_OPTIONS = [
  { id: 'new_member',       label: 'New member joins',          desc: 'When anyone joins your community',            icon: Users       },
  { id: 'purchase',         label: 'Purchase completed',        desc: 'When a member buys a product or course',      icon: ShoppingBag },
  { id: 'course_enrolled',  label: 'Enrolled in course',        desc: 'When a member enrolls in a course',           icon: BookOpen    },
  { id: 'course_completed', label: 'Completed a course',        desc: 'When a member finishes a course',             icon: Trophy      },
  { id: 'challenge_joined', label: 'Joined a challenge',        desc: 'When a member joins a challenge',             icon: Zap         },
  { id: 'event_registered', label: 'Registered for event',      desc: 'When a member registers for an event',        icon: Calendar    },
  { id: 'inactive_7',       label: 'Inactive for 7 days',       desc: 'When a member has not visited in 7 days',     icon: UserMinus   },
  { id: 'inactive_30',      label: 'Inactive for 30 days',      desc: 'When a member has not visited in 30 days',    icon: UserMinus   },
]

const DELAY_OPTIONS = [
  { value: 0,   label: 'Immediately' },
  { value: 1,   label: 'After 1 hour' },
  { value: 6,   label: 'After 6 hours' },
  { value: 24,  label: 'After 1 day' },
  { value: 72,  label: 'After 3 days' },
  { value: 168, label: 'After 1 week' },
]

const STATUS_META_RAW = {
  sent:      { bg: 'rgba(74,222,128,.12)',  color: '#16a34a',       border: 'rgba(74,222,128,.3)' },
  draft:     { bg: 'var(--bg)',              color: 'var(--t3)',     border: 'var(--bd)' },
  scheduled: { bg: 'rgba(251,146,60,.12)',  color: 'var(--orange)', border: 'rgba(251,146,60,.3)' },
}
const getStatusMeta = (status: 'sent' | 'draft' | 'scheduled', lang: string) => ({
  ...STATUS_META_RAW[status],
  label: status === 'sent'      ? (lang === 'ar' ? 'مُرسَل'   : 'Sent')
       : status === 'draft'     ? (lang === 'ar' ? 'مسودة'    : 'Draft')
       :                          (lang === 'ar' ? 'مجدول'    : 'Scheduled'),
})
// keep backward compat reference used in CampaignCard
const STATUS_META = STATUS_META_RAW as Record<string, { bg: string; color: string; border: string }>

const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LBL = ({ text, req }: { text: string; req?: boolean }) => (
  <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>
    {text}{req && <span style={{ color: 'var(--p)' }}> *</span>}
  </p>
)

const focusStyle = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--p)'),
  onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--bd)'),
}

// ─── Email Preview Modal ──────────────────────────────────────────────────────

function PreviewModal({ open, onClose, subject, previewText, body }: {
  open: boolean; onClose: () => void
  subject: string; previewText: string; body: string
}) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop')
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-none">
        <div className="pointer-events-auto w-full flex flex-col" style={{ maxWidth: view === 'mobile' ? '420px' : '680px', maxHeight: '90vh' }}>

          {/* toolbar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,.4)' }}>
              {(['desktop', 'mobile'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                  style={view === v ? { background: '#fff', color: 'var(--t1)' } : { color: 'rgba(255,255,255,.7)' }}>
                  {v === 'desktop' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  {v === 'desktop' ? 'Desktop' : 'Mobile'}
                </button>
              ))}
            </div>
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,.8)' }}>Live Preview</p>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* email client frame */}
          <div className="rounded-2xl overflow-hidden flex-1" style={{ boxShadow: '0 32px 80px rgba(0,0,0,.5)', overflowY: 'auto' }}>
            {/* client top bar */}
            <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 h-6 rounded-md text-[11px] flex items-center px-2" style={{ background: '#e0e0e0', color: '#888' }}>
                {subject || 'Email preview'}
              </div>
            </div>

            {/* email meta */}
            <div className="px-6 py-3 space-y-1" style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
              <p className="text-[12px]" style={{ color: 'var(--t2)' }}><span className="font-semibold">From:</span> Motion Masters &lt;hello@chabaqa.com&gt;</p>
              <p className="text-[12px]" style={{ color: 'var(--t2)' }}><span className="font-semibold">Subject:</span> {subject || <span style={{ color: 'var(--t3)' }}>(No subject)</span>}</p>
              {previewText && <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{previewText}</p>}
            </div>

            {/* email body */}
            <div style={{ background: '#f4f4f4', padding: '24px 0' }}>
              <div style={{
                background: '#fff', maxWidth: view === 'mobile' ? '100%' : '580px',
                margin: '0 auto', borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,.08)',
              }}>
                {/* header */}
                <div className="flex items-center gap-2.5 px-8 py-5" style={{ borderBottom: '2px solid var(--p)', background: 'var(--p)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold"
                    style={{ background: 'rgba(255,255,255,.25)', color: '#fff' }}>Ch</div>
                  <p className="font-bold text-white text-[15px]">Motion Masters</p>
                </div>

                {/* content */}
                <div className="px-8 py-6">
                  {subject && <h2 className="text-[18px] font-bold mb-4" style={{ color: 'var(--t1)' }}>{subject}</h2>}
                  {previewText && <p className="text-[13px] mb-4 italic" style={{ color: '#777' }}>{previewText}</p>}
                  {body
                    ? <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: '#333' }}>{body}</p>
                    : <div className="space-y-2">
                        {[100, 90, 95, 70].map((w, i) => (
                          <div key={i} className="h-3 rounded-full" style={{ background: '#f0f0f0', width: `${w}%` }} />
                        ))}
                      </div>
                  }
                </div>

                {/* footer */}
                <div className="px-8 py-5 text-center" style={{ background: '#f9f9f9', borderTop: '1px solid #eee' }}>
                  <p className="text-[11px]" style={{ color: 'var(--t3)' }}>Motion Masters · Chabaqa Platform</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>
                    <span className="underline cursor-pointer">Unsubscribe</span> &nbsp;·&nbsp; <span className="underline cursor-pointer">Privacy Policy</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--bd)' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  )
}

function CampaignCard({ c, onDelete, onPreview, lang = 'en' }: {
  c: Campaign; onDelete: (id: string) => void
  onPreview: (c: Campaign) => void; lang?: string
}) {
  const st = getStatusMeta(c.status, lang)
  const openRate  = pct(c.stats.opened,  c.stats.sent)
  const clickRate = pct(c.stats.clicked, c.stats.sent)
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      <div className="flex items-start gap-4 p-4 pb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--p2)' }}>
          <Mail className="w-5 h-5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold truncate" style={{ color: 'var(--t1)' }}>{c.name}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}>{st.label}</span>
          </div>
          <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--t2)' }}>{c.subject}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onPreview(c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
            style={{ background: 'var(--p2)', color: 'var(--p)' }}>
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(c.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
            style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bd)' }} />

      <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
          <Users className="w-3 h-3" strokeWidth={1.7} />{c.audienceLabel} · {c.audienceCount.toLocaleString()}
        </span>
        {c.sentAt && <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}><Send className="w-3 h-3" strokeWidth={1.7} />{c.sentAt}</span>}
        {c.scheduledAt && <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--orange)' }}><Clock className="w-3 h-3" strokeWidth={1.7} />{c.scheduledAt}</span>}
      </div>

      {c.status === 'sent' && (
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          {[
            { label: lang === 'ar' ? 'مُرسَل'     : 'Sent',       value: c.stats.sent.toLocaleString(), bar: 100,       color: 'var(--p)'     },
            { label: lang === 'ar' ? 'معدل الفتح'  : 'Open Rate',  value: `${openRate}%`,                bar: openRate,  color: 'var(--cyan)'  },
            { label: lang === 'ar' ? 'معدل النقر'  : 'Click Rate', value: `${clickRate}%`,               bar: clickRate, color: 'var(--orange)'},
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
              <p className="text-[13px] font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{m.label}</p>
              <StatBar value={m.bar} color={m.color} />
            </div>
          ))}
        </div>
      )}

      {(c.status === 'draft' || c.status === 'scheduled') && (
        <div className="px-4 pb-4">
          <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
            style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
              {c.status === 'draft'
                ? (lang === 'ar' ? 'مسودة — لم تُرسَل بعد. عدّل وجدول للإرسال.' : 'Draft — not sent yet. Edit and schedule to send.')
                : (lang === 'ar' ? `مجدول في ${c.scheduledAt}` : `Scheduled for ${c.scheduledAt}`)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Automation Card ──────────────────────────────────────────────────────────

function AutomationCard({ a, onToggle, onDelete, lang = 'en' }: {
  a: Automation
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  lang?: string
}) {
  const TriggerIcon = TRIGGER_OPTIONS.find(t => t.id === a.trigger)?.icon ?? Zap
  return (
    <div className="rounded-2xl p-4 flex gap-4 items-start transition-all duration-200"
      style={{ background: 'var(--white)', border: `1px solid ${a.isActive ? 'rgba(var(--p-rgb),.3)' : 'var(--bd)'}` }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: a.isActive ? 'var(--p2)' : 'var(--bg)', border: '1px solid var(--bd)' }}>
        <TriggerIcon className="w-5 h-5" style={{ color: a.isActive ? 'var(--p)' : 'var(--t3)' }} strokeWidth={1.7} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{a.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={a.isActive
              ? { background: 'rgba(74,222,128,.12)', color: '#16a34a', borderColor: 'rgba(74,222,128,.3)' }
              : { background: 'var(--bg)', color: 'var(--t3)', borderColor: 'var(--bd)' }}>
            {a.isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'متوقف' : 'Paused')}
          </span>
        </div>
        <p className="text-[12px]" style={{ color: 'var(--t2)' }}>
          {lang === 'ar' ? 'المحفّز:' : 'Trigger:'} {a.triggerLabel}{a.delay > 0 ? ` · ${lang === 'ar' ? 'انتظار' : 'Wait'} ${DELAY_OPTIONS.find(d => d.value === a.delay)?.label?.replace('After ', '')}` : ''}
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'الموضوع:' : 'Subject:'} <span style={{ color: 'var(--t2)' }}>{a.subject}</span>
        </p>
        <p className="text-[11px] mt-1.5 font-semibold" style={{ color: 'var(--p)' }}>
          {a.triggered.toLocaleString()} {lang === 'ar' ? 'إيميل مُرسَل' : 'emails sent'}
        </p>
      </div>

      <div className="flex gap-1 shrink-0">
        <button onClick={() => onToggle(a.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
          style={{ background: 'var(--bg)', color: a.isActive ? '#16a34a' : 'var(--t3)' }}>
          {a.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button onClick={() => onDelete(a.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
          style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Create Campaign Drawer ───────────────────────────────────────────────────

function CreateCampaignDrawer({ open, onClose, onSave, customAudiences, onSaveAudience, lang = 'en' }: {
  open: boolean; onClose: () => void
  onSave: (c: Campaign) => void
  customAudiences: CustomAudience[]
  onSaveAudience: (a: CustomAudience) => void
  lang?: string
}) {
  const [name,         setName]         = useState('')
  const [subject,      setSubject]      = useState('')
  const [preview,      setPreview]      = useState('')
  const [body,         setBody]         = useState('')
  const [audMode,      setAudMode]      = useState<'community' | 'custom'>('community')
  const [communities,  setCommunities]  = useState<string[]>(['All Members'])
  const [customAudId,  setCustomAudId]  = useState<string>('')
  const [newAudName,   setNewAudName]   = useState('')
  const [newAudEmails, setNewAudEmails] = useState<string[]>([])
  const [emailInput,   setEmailInput]   = useState('')
  const [csvName,      setCsvName]      = useState('')
  const [csvMode,      setCsvMode]      = useState<'type' | 'upload'>('type')
  const [schedMode,    setSchedMode]    = useState<'now' | 'later'>('now')
  const [schedDate,    setSchedDate]    = useState('')
  const [schedTime,    setSchedTime]    = useState('')
  const [saving,       setSaving]       = useState(false)
  const [previewOpen,  setPreviewOpen]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const allCommunities = [...BASE_COMMUNITIES, ...customAudiences.map(a => a.name)]

  const toggleCom = (c: string) =>
    setCommunities(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])

  const addEmail = () => {
    const e = emailInput.trim()
    if (e && /\S+@\S+\.\S+/.test(e) && !newAudEmails.includes(e)) {
      setNewAudEmails(p => [...p, e])
      setEmailInput('')
    }
  }

  const saveCustomAudience = () => {
    if (!newAudName.trim() || newAudEmails.length === 0) return
    const a: CustomAudience = {
      id: Math.random().toString(36).slice(2),
      name: newAudName.trim(),
      emails: newAudEmails,
      count: newAudEmails.length,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    onSaveAudience(a)
    setNewAudName(''); setNewAudEmails([]); setCsvName(''); setCsvMode('type')
    setCustomAudId(a.id)
    setAudMode('community')
    setCommunities([a.name])
  }

  const canSend = name.trim() && subject.trim() && communities.length > 0

  const submit = async (status: Campaign['status']) => {
    if (!canSend) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    const audLabel = communities.join(', ')
    const audCount = communities.includes('All Members') ? 1298 : Math.floor(Math.random() * 600) + 100
    onSave({
      id: Math.random().toString(36).slice(2),
      name, subject, previewText: preview, body, status,
      audienceType: communities.includes('All Members') ? 'all' : 'community',
      audienceLabel: audLabel, audienceCount: audCount,
      sentAt:      status === 'sent'      ? new Date().toISOString().slice(0, 10) : undefined,
      scheduledAt: status === 'scheduled' ? `${schedDate} ${schedTime}`           : undefined,
      createdAt: new Date().toISOString().slice(0, 10),
      stats: status === 'sent'
        ? { sent: audCount, opened: Math.floor(audCount * (0.4 + Math.random() * 0.3)), clicked: Math.floor(audCount * (0.1 + Math.random() * 0.2)) }
        : { sent: 0, opened: 0, clicked: 0 },
    })
    setSaving(false)
    onClose()
    setName(''); setSubject(''); setPreview(''); setBody('')
    setCommunities(['All Members']); setSchedMode('now'); setSchedDate(''); setSchedTime('')
  }

  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none transition-colors"
  const fieldStyle = { border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }

  return (
    <>
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)}
        subject={subject} previewText={preview} body={body} />

      <div className="fixed inset-0 z-40 transition-all duration-300"
        style={{ background: open ? 'rgba(0,0,0,.35)' : 'transparent', backdropFilter: open ? 'blur(2px)' : 'none', pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[480px] z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ background: 'var(--white)', borderLeft: '1px solid var(--bd)', transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'حملة جديدة' : 'New Campaign'}</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'إعداد وإرسال حملة بريد إلكتروني' : 'Configure and send an email campaign'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-80"
              style={{ background: 'var(--p2)', color: 'var(--p)' }}>
              <Eye className="w-3.5 h-3.5" /> {lang === 'ar' ? 'معاينة' : 'Preview'}
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
              style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Campaign Details */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>{lang === 'ar' ? 'تفاصيل الحملة' : 'Campaign Details'}</p>
            <div className="space-y-3">
              <div>
                <LBL text={lang === 'ar' ? 'اسم الحملة' : 'Campaign Name'} req />
                <input value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'ar' ? 'مثال: النشرة الأسبوعية' : 'e.g. Weekly Digest'}
                  className={inp} style={fieldStyle} {...focusStyle} />
              </div>
              <div>
                <LBL text={lang === 'ar' ? 'سطر الموضوع' : 'Subject Line'} req />
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={lang === 'ar' ? 'ما موضوع الإيميل؟' : "What's the email about?"}
                  className={inp} style={fieldStyle} {...focusStyle} />
              </div>
              <div>
                <LBL text={lang === 'ar' ? 'نص المعاينة' : 'Preview Text'} />
                <input value={preview} onChange={e => setPreview(e.target.value)} placeholder={lang === 'ar' ? 'ملخص قصير يظهر في صندوق الوارد…' : 'Short summary shown in inbox…'}
                  className={inp} style={fieldStyle} {...focusStyle} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <LBL text={lang === 'ar' ? 'محتوى الإيميل' : 'Email Body'} />
                  <button onClick={() => setPreviewOpen(true)}
                    className="text-[11px] font-semibold cursor-pointer hover:opacity-70 flex items-center gap-1"
                    style={{ color: 'var(--p)' }}>
                    <Eye className="w-3 h-3" /> {lang === 'ar' ? 'معاينة مباشرة' : 'Live preview'}
                  </button>
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب محتوى الإيميل هنا...' : 'Write your email content here...'} rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ ...fieldStyle, border: '1.5px solid var(--bd)' as any }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--p)'}
                  onBlur={e  => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)'} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>
                  Use variables: {'{{first_name}}'}, {'{{community_name}}'}
                </p>
              </div>
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          {/* Audience */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>{lang === 'ar' ? 'الجمهور' : 'Audience'}</p>

            <div className="flex gap-2 mb-4">
              {(['community', 'custom'] as const).map(m => (
                <button key={m} onClick={() => setAudMode(m)}
                  className="flex-1 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={audMode === m
                    ? { background: 'var(--p)', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                  {m === 'community' ? (lang === 'ar' ? 'تصفية المجتمع' : 'Community Filter') : (lang === 'ar' ? 'جمهور مخصص' : 'Custom Audience')}
                </button>
              ))}
            </div>

            {audMode === 'community' ? (
              <div className="space-y-2">
                {allCommunities.map(c => {
                  const sel = communities.includes(c)
                  const isCustom = !BASE_COMMUNITIES.includes(c)
                  return (
                    <button key={c} onClick={() => toggleCom(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left"
                      style={sel
                        ? { background: 'var(--p2)', border: '1.5px solid var(--p)' }
                        : { background: 'var(--bg)', border: '1.5px solid var(--bd)' }}>
                      <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: sel ? 'var(--p)' : 'transparent', border: sel ? 'none' : '1.5px solid var(--bd)' }}>
                        {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <p className="text-[13px] font-medium flex-1" style={{ color: sel ? 'var(--p)' : 'var(--t2)' }}>{c}</p>
                      {isCustom && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--p2)', color: 'var(--p)' }}>CUSTOM</span>
                      )}
                      <Users className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <LBL text={lang === 'ar' ? 'اسم الجمهور' : 'Audience Name'} req />
                  <input value={newAudName} onChange={e => setNewAudName(e.target.value)} placeholder={lang === 'ar' ? 'مثال: كبار المشترين' : 'e.g. VIP Buyers'}
                    className={inp} style={fieldStyle} {...focusStyle} />
                </div>

                {/* CSV or manual */}
                <div className="flex gap-2">
                  {(['type', 'upload'] as const).map(m => (
                    <button key={m} onClick={() => setCsvMode(m)}
                      className="flex-1 h-8 rounded-xl text-[11px] font-semibold cursor-pointer transition-all"
                      style={csvMode === m
                        ? { background: 'var(--p2)', color: 'var(--p)', border: '1.5px solid var(--p)' }
                        : { background: 'var(--bg)', color: 'var(--t3)', border: '1.5px solid var(--bd)' }}>
                      {m === 'type' ? (lang === 'ar' ? 'إدخال يدوي' : 'Type manually') : (lang === 'ar' ? 'رفع CSV' : 'Upload CSV')}
                    </button>
                  ))}
                </div>

                {csvMode === 'type' ? (
                  <div>
                    <div className="flex gap-2">
                      <input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                        placeholder="email@example.com" type="email"
                        className="flex-1 h-10 px-3 rounded-xl text-[13px] outline-none"
                        style={fieldStyle} {...focusStyle} />
                      <button onClick={addEmail}
                        className="h-10 px-3 rounded-xl text-[12px] font-bold cursor-pointer hover:opacity-80"
                        style={{ background: 'var(--p)', color: '#fff' }}>
                        Add
                      </button>
                    </div>
                    {newAudEmails.length > 0 && (
                      <div className="mt-2 rounded-xl p-2 max-h-[140px] overflow-y-auto space-y-1"
                        style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                        {newAudEmails.map(e => (
                          <div key={e} className="flex items-center justify-between px-2 py-1 rounded-lg"
                            style={{ background: 'var(--white)' }}>
                            <span className="text-[12px]" style={{ color: 'var(--t2)' }}>{e}</span>
                            <button onClick={() => setNewAudEmails(p => p.filter(x => x !== e))}
                              className="cursor-pointer" style={{ color: '#ef4444' }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] mt-1.5" style={{ color: 'var(--t3)' }}>
                      {newAudEmails.length} email{newAudEmails.length !== 1 ? 's' : ''} added
                    </p>
                  </div>
                ) : (
                  <div>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          setCsvName(e.target.files[0].name)
                          const count = Math.floor(Math.random() * 800) + 100
                          setNewAudEmails(Array.from({ length: count }, (_, i) => `user${i + 1}@example.com`))
                        }
                      }} />
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full rounded-xl py-6 flex flex-col items-center gap-2 cursor-pointer"
                      style={{ border: `2px dashed ${csvName ? 'var(--p)' : 'var(--bd)'}`, background: csvName ? 'var(--p2)' : 'var(--bg)' }}>
                      {csvName
                        ? <><Check className="w-5 h-5" style={{ color: 'var(--p)' }} /><p className="text-[12px] font-semibold" style={{ color: 'var(--p)' }}>{csvName}</p><p className="text-[11px]" style={{ color: 'var(--t3)' }}>{newAudEmails.length} recipients</p></>
                        : <><Upload className="w-5 h-5" style={{ color: 'var(--t3)' }} strokeWidth={1.7} /><p className="text-[12px]" style={{ color: 'var(--t2)' }}>Drop CSV or click to upload</p><p className="text-[11px]" style={{ color: 'var(--t3)' }}>Must have an "email" column</p></>
                      }
                    </button>
                  </div>
                )}

                <button onClick={saveCustomAudience}
                  disabled={!newAudName.trim() || newAudEmails.length === 0}
                  className="w-full h-9 rounded-xl text-[12px] font-bold cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--p)', color: '#fff' }}>
                  Save &amp; Use This Audience
                </button>
              </div>
            )}
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          {/* Schedule */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>{lang === 'ar' ? 'الجدولة' : 'Schedule'}</p>
            <div className="flex gap-2 mb-4">
              {(['now', 'later'] as const).map(m => (
                <button key={m} onClick={() => setSchedMode(m)}
                  className="flex-1 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={schedMode === m
                    ? { background: 'var(--p)', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                  {m === 'now' ? (lang === 'ar' ? 'إرسال الآن' : 'Send Now') : (lang === 'ar' ? 'جدولة لاحقاً' : 'Schedule for Later')}
                </button>
              ))}
            </div>
            {schedMode === 'later' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <LBL text={lang === 'ar' ? 'التاريخ' : 'Date'} req />
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    className={inp} style={fieldStyle} {...focusStyle} />
                </div>
                <div>
                  <LBL text={lang === 'ar' ? 'الوقت' : 'Time'} req />
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className={inp} style={fieldStyle} {...focusStyle} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.25)' }}>
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: '#16a34a' }} strokeWidth={1.7} />
                <p className="text-[12px]" style={{ color: '#16a34a' }}>Sent immediately after confirmation</p>
              </div>
            )}
          </section>

          <div className="h-4" />
        </div>

        <div className="px-6 py-4 flex gap-2" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={() => submit('draft')} disabled={!name.trim() || saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
            {lang === 'ar' ? 'حفظ مسودة' : 'Save Draft'}
          </button>
          <button onClick={() => submit(schedMode === 'later' ? 'scheduled' : 'sent')}
            disabled={!canSend || saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--p)' }}>
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : schedMode === 'later'
                ? <><Calendar className="w-4 h-4" strokeWidth={1.7} /> {lang === 'ar' ? 'جدولة' : 'Schedule'}</>
                : <><Send className="w-4 h-4" strokeWidth={1.7} /> {lang === 'ar' ? 'إرسال الآن' : 'Send Now'}</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Create Automation Drawer ─────────────────────────────────────────────────

function CreateAutomationDrawer({ open, onClose, onSave, lang = 'en' }: {
  open: boolean; onClose: () => void; onSave: (a: Automation) => void; lang?: string
}) {
  const [name,    setName]    = useState('')
  const [trigger, setTrigger] = useState('')
  const [delay,   setDelay]   = useState(0)
  const [subject, setSubject] = useState('')
  const [body,    setBody]    = useState('')
  const [preview, setPreview] = useState(false)
  const [saving,  setSaving]  = useState(false)

  const canSave = name.trim() && trigger && subject.trim()

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    const tOpt = TRIGGER_OPTIONS.find(t => t.id === trigger)!
    onSave({
      id: Math.random().toString(36).slice(2),
      name, trigger, triggerLabel: tOpt.label, triggerIcon: trigger,
      delay, subject, body, isActive: true, triggered: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    setSaving(false); onClose()
    setName(''); setTrigger(''); setDelay(0); setSubject(''); setBody('')
  }

  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none"
  const fieldStyle = { border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }

  return (
    <>
      <PreviewModal open={preview} onClose={() => setPreview(false)} subject={subject} previewText="" body={body} />

      <div className="fixed inset-0 z-40 transition-all duration-300"
        style={{ background: open ? 'rgba(0,0,0,.35)' : 'transparent', backdropFilter: open ? 'blur(2px)' : 'none', pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[480px] z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ background: 'var(--white)', borderLeft: '1px solid var(--bd)', transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'أتمتة جديدة' : 'New Automation'}</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'إعداد سير عمل بريدي مبني على محفّز' : 'Set up a trigger-based email flow'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-80"
              style={{ background: 'var(--p2)', color: 'var(--p)' }}>
              <Eye className="w-3.5 h-3.5" /> {lang === 'ar' ? 'معاينة' : 'Preview'}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
              style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>{lang === 'ar' ? 'الإعداد' : 'Setup'}</p>
            <div className="space-y-3">
              <div>
                <LBL text={lang === 'ar' ? 'اسم الأتمتة' : 'Automation Name'} req />
                <input value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'ar' ? 'مثال: ترحيب بالأعضاء الجدد' : 'e.g. Welcome New Members'}
                  className={inp} style={fieldStyle} {...focusStyle} />
              </div>
              <div>
                <LBL text={lang === 'ar' ? 'تأخير الإرسال' : 'Send Delay'} />
                <div className="flex flex-wrap gap-2">
                  {DELAY_OPTIONS.map(d => (
                    <button key={d.value} onClick={() => setDelay(d.value)}
                      className="h-8 px-3 rounded-xl text-[11px] font-semibold cursor-pointer transition-all"
                      style={delay === d.value
                        ? { background: 'var(--p)', color: '#fff' }
                        : { background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>{lang === 'ar' ? 'المحفّز' : 'Trigger'}</p>
            <div className="grid grid-cols-1 gap-2">
              {TRIGGER_OPTIONS.map(t => {
                const Icon = t.icon
                const sel = trigger === t.id
                return (
                  <button key={t.id} onClick={() => setTrigger(t.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left"
                    style={sel
                      ? { background: 'var(--p2)', border: '1.5px solid var(--p)' }
                      : { background: 'var(--bg)', border: '1.5px solid var(--bd)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: sel ? 'var(--p)' : 'var(--white)' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: sel ? '#fff' : 'var(--t3)' }} strokeWidth={1.7} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold" style={{ color: sel ? 'var(--p)' : 'var(--t1)' }}>{t.label}</p>
                      <p className="text-[11px]" style={{ color: 'var(--t2)' }}>{t.desc}</p>
                    </div>
                    {sel && <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--p)' }} strokeWidth={1.7} />}
                  </button>
                )
              })}
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>{lang === 'ar' ? 'محتوى الإيميل' : 'Email Content'}</p>
            <div className="space-y-3">
              <div>
                <LBL text={lang === 'ar' ? 'سطر الموضوع' : 'Subject Line'} req />
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: مرحباً {{first_name}}!' : 'e.g. Welcome {{first_name}}!'}
                  className={inp} style={fieldStyle} {...focusStyle} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <LBL text={lang === 'ar' ? 'محتوى الإيميل' : 'Email Body'} />
                  <button onClick={() => setPreview(true)} className="text-[11px] font-semibold cursor-pointer hover:opacity-70 flex items-center gap-1" style={{ color: 'var(--p)' }}>
                    <Eye className="w-3 h-3" /> {lang === 'ar' ? 'معاينة' : 'Preview'}
                  </button>
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder={'Hi {{first_name}},\n\nYour message here...'} rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ ...fieldStyle, border: '1.5px solid var(--bd)' as any }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--p)'}
                  onBlur={e  => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)'} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>
                  Variables: {'{{first_name}}'}, {'{{community_name}}'}, {'{{course_name}}'}
                </p>
              </div>
            </div>
          </section>

          <div className="h-4" />
        </div>

        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={submit} disabled={!canSave || saving}
            className="w-full h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--p)' }}>
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><Zap className="w-4 h-4" strokeWidth={1.7} /> {lang === 'ar' ? 'إنشاء وتفعيل الأتمتة' : 'Create & Activate Automation'}</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="rounded-2xl p-5 flex gap-4 items-start"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + '1a' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[22px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{value}</p>
        <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{sub}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CAMP_TABS = [
  { id: 'all', label: 'All' }, { id: 'sent', label: 'Sent' },
  { id: 'scheduled', label: 'Scheduled' }, { id: 'draft', label: 'Drafts' },
] as const

export default function EmailMarketingPage() {
  const { lang } = useDashPrefs()
  const [campaigns,       setCampaigns]       = useState<Campaign[]>([])
  const [automations,     setAutomations]     = useState<Automation[]>([])
  const [customAudiences, setCustomAudiences] = useState<CustomAudience[]>([])
  const [loading,         setLoading]         = useState(true)
  const [view,            setView]            = useState<'campaigns' | 'automations'>('campaigns')
  const [tab,             setTab]             = useState<typeof CAMP_TABS[number]['id']>('all')
  const [search,          setSearch]          = useState('')
  const [campDrawer,      setCampDrawer]      = useState(false)
  const [autoDrawer,      setAutoDrawer]      = useState(false)
  const [previewCamp,     setPreviewCamp]     = useState<Campaign | null>(null)

  useEffect(() => {
    try {
      setCampaigns(JSON.parse(localStorage.getItem('chabaqa_campaigns')   || 'null') ?? CAMP_SEED)
      setAutomations(JSON.parse(localStorage.getItem('chabaqa_automations') || 'null') ?? AUTO_SEED)
      setCustomAudiences(JSON.parse(localStorage.getItem('chabaqa_custom_audiences') || '[]'))
    } catch { setCampaigns(CAMP_SEED); setAutomations(AUTO_SEED) }
    finally { setLoading(false) }
  }, [])

  const saveCamps = (list: Campaign[]) => { setCampaigns(list); localStorage.setItem('chabaqa_campaigns', JSON.stringify(list)) }
  const saveAutos = (list: Automation[]) => { setAutomations(list); localStorage.setItem('chabaqa_automations', JSON.stringify(list)) }
  const saveAuds  = (list: CustomAudience[]) => { setCustomAudiences(list); localStorage.setItem('chabaqa_custom_audiences', JSON.stringify(list)) }

  const filtered = campaigns
    .filter(c => tab === 'all' || c.status === tab)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase()))

  const sent        = campaigns.filter(c => c.status === 'sent')
  const totalSent   = sent.reduce((s, c) => s + c.stats.sent,    0)
  const totalOpened = sent.reduce((s, c) => s + c.stats.opened,  0)
  const totalClicked = sent.reduce((s, c) => s + c.stats.clicked, 0)

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      {previewCamp && (
        <PreviewModal open onClose={() => setPreviewCamp(null)}
          subject={previewCamp.subject} previewText={previewCamp.previewText} body={previewCamp.body} />
      )}

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Email Marketing" subtitle="Campaigns, automations and audience analytics" />

          <main className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 mb-7">
              <KpiCard icon={<Mail className="w-5 h-5" />}             label={lang === 'ar' ? 'إجمالي الحملات' : 'Total Campaigns'} value={String(campaigns.length)}      sub={`${campaigns.filter(c=>c.status==='sent').length} ${lang==='ar'?'مُرسَلة':'sent'} · ${campaigns.filter(c=>c.status==='draft').length} ${lang==='ar'?'مسودات':'drafts'}`} color="var(--p)" />
              <KpiCard icon={<Send className="w-5 h-5" />}             label={lang === 'ar' ? 'إيميلات مُرسَلة' : 'Emails Sent'}     value={totalSent.toLocaleString()}     sub={lang === 'ar' ? 'عبر كل الحملات' : 'across all campaigns'}  color="var(--cyan)" />
              <KpiCard icon={<Eye className="w-5 h-5" />}              label={lang === 'ar' ? 'متوسط معدل الفتح' : 'Avg Open Rate'}   value={`${pct(totalOpened, totalSent)}%`}  sub={`${totalOpened.toLocaleString()} ${lang==='ar'?'فتح':'opens'}`}  color="var(--orange)" />
              <KpiCard icon={<MousePointerClick className="w-5 h-5" />} label={lang === 'ar' ? 'متوسط معدل النقر' : 'Avg Click Rate'}  value={`${pct(totalClicked, totalSent)}%`} sub={`${totalClicked.toLocaleString()} ${lang==='ar'?'نقرة':'clicks'}`} color="var(--pink)" />
            </div>

            {/* View toggle + actions */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {(['campaigns', 'automations'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className="h-7 px-4 rounded-lg text-[12px] font-semibold cursor-pointer transition-all capitalize"
                    style={view === v ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                    {v === 'automations' ? `${lang === 'ar' ? 'أتمتة' : 'Automations'} · ${automations.filter(a => a.isActive).length} ${lang === 'ar' ? 'نشطة' : 'active'}` : (lang === 'ar' ? 'الحملات' : 'Campaigns')}
                  </button>
                ))}
              </div>

              {view === 'campaigns' && (
                <>
                  {/* status tabs */}
                  <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                    {CAMP_TABS.map(t => {
                      const cnt = t.id === 'all' ? campaigns.length : campaigns.filter(c => c.status === t.id).length
                      return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                          style={tab === t.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                          {t.id === 'all'       ? (lang === 'ar' ? 'الكل'     : 'All')
                           : t.id === 'sent'      ? (lang === 'ar' ? 'مُرسَل'   : 'Sent')
                           : t.id === 'scheduled' ? (lang === 'ar' ? 'مجدول'   : 'Scheduled')
                           :                        (lang === 'ar' ? 'مسودات'   : 'Drafts')}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={tab === t.id ? { background: 'rgba(255,255,255,.25)', color: '#fff' } : { background: 'var(--bg)', color: 'var(--t3)' }}>
                            {cnt}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {/* search */}
                  <div className="flex items-center gap-2 flex-1 min-w-[160px] h-9 px-3 rounded-xl"
                    style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                    <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث في الحملات…' : 'Search campaigns…'}
                      className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: 'var(--t1)' }} />
                    {search && <button onClick={() => setSearch('')} style={{ color: 'var(--t3)' }}><X className="w-3.5 h-3.5" /></button>}
                  </div>
                </>
              )}

              <button onClick={() => view === 'campaigns' ? setCampDrawer(true) : setAutoDrawer(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-white cursor-pointer hover:opacity-90 ml-auto"
                style={{ background: 'var(--p)' }}>
                <Plus className="w-4 h-4" strokeWidth={1.7} />
                {view === 'campaigns' ? (lang === 'ar' ? 'حملة جديدة' : 'New Campaign') : (lang === 'ar' ? 'أتمتة جديدة' : 'New Automation')}
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--p3)] border-t-[var(--p)] animate-spin" />
              </div>
            ) : view === 'campaigns' ? (
              filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--p2)' }}>
                    <Mail className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                  </div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? (search ? 'لا توجد نتائج مطابقة' : 'لا توجد حملات بعد') : (search ? 'No campaigns match your search' : 'No campaigns yet')}</p>
                  <p className="text-[12px]" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? (search ? 'جرّب كلمة مختلفة' : 'أنشئ أول حملة بريد إلكتروني') : (search ? 'Try a different keyword' : 'Create your first email campaign')}</p>
                  {!search && (
                    <button onClick={() => setCampDrawer(true)}
                      className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 mt-1"
                      style={{ background: 'var(--p)' }}>
                      <Plus className="w-4 h-4" strokeWidth={1.7} /> {lang === 'ar' ? 'حملة جديدة' : 'New Campaign'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                  {filtered.map((c, i) => (
                    <div key={c.id} style={{ animation: `dashFadeUp .3s ${i * 50}ms ease both` }}>
                      <CampaignCard c={c} onDelete={id => saveCamps(campaigns.filter(x => x.id !== id))} onPreview={setPreviewCamp} lang={lang} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Automations view */
              automations.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--p2)' }}>
                    <Zap className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                  </div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'لا توجد أتمتة بعد' : 'No automations yet'}</p>
                  <p className="text-[12px]" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'أعدّ أول سير عمل بريدي مبني على محفّز' : 'Set up your first trigger-based email'}</p>
                  <button onClick={() => setAutoDrawer(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 mt-1"
                    style={{ background: 'var(--p)' }}>
                    <Plus className="w-4 h-4" strokeWidth={1.7} /> {lang === 'ar' ? 'أتمتة جديدة' : 'New Automation'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                  {/* summary bar */}
                  <div className="grid grid-cols-3 gap-3 mb-1">
                    {[
                      { label: lang === 'ar' ? 'الإجمالي'      : 'Total',       value: automations.length, color: 'var(--p)' },
                      { label: lang === 'ar' ? 'نشطة'          : 'Active',      value: automations.filter(a=>a.isActive).length, color: '#16a34a' },
                      { label: lang === 'ar' ? 'إيميلات مُرسَلة' : 'Emails sent', value: automations.reduce((s,a)=>s+a.triggered,0).toLocaleString(), color: 'var(--cyan)' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 flex items-center gap-3"
                        style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                        <p className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {automations.map((a, i) => (
                    <div key={a.id} style={{ animation: `dashFadeUp .3s ${i * 50}ms ease both` }}>
                      <AutomationCard a={a}
                        onToggle={id => saveAutos(automations.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x))}
                        onDelete={id => saveAutos(automations.filter(x => x.id !== id))}
                        lang={lang} />
                    </div>
                  ))}
                </div>
              )
            )}

          </main>
        </div>
      </div>

      <CreateCampaignDrawer
        open={campDrawer} onClose={() => setCampDrawer(false)}
        onSave={c => saveCamps([c, ...campaigns])}
        customAudiences={customAudiences}
        onSaveAudience={a => saveAuds([...customAudiences, a])}
        lang={lang} />

      <CreateAutomationDrawer
        open={autoDrawer} onClose={() => setAutoDrawer(false)}
        onSave={a => saveAutos([a, ...automations])}
        lang={lang} />
    </>
  )
}
