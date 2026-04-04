'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  Plus, Mail, Send, FileText, Clock, Users, BarChart2,
  MousePointerClick, Eye, Trash2, ChevronRight, Upload,
  X, Check, Calendar, AlertCircle, Inbox, TrendingUp,
  Filter, Search, MoreHorizontal, Zap, RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignStats {
  sent: number
  opened: number
  clicked: number
}

interface Campaign {
  id: string
  name: string
  subject: string
  previewText: string
  status: 'sent' | 'draft' | 'scheduled'
  audienceType: 'all' | 'community' | 'csv'
  audienceLabel: string
  audienceCount: number
  sentAt?: string
  scheduledAt?: string
  createdAt: string
  stats: CampaignStats
}

// ─── Mock seed data ───────────────────────────────────────────────────────────

const SEED: Campaign[] = [
  {
    id: 'c1', name: 'Welcome Series — Onboarding', subject: 'Welcome to Motion Masters! 🎉',
    previewText: "Here's everything you need to get started...",
    status: 'sent', audienceType: 'all', audienceLabel: 'All Members', audienceCount: 1240,
    sentAt: '2026-03-28', createdAt: '2026-03-27',
    stats: { sent: 1240, opened: 748, clicked: 312 },
  },
  {
    id: 'c2', name: 'New Course Launch — Motion Pro', subject: 'Our most advanced course is here 🚀',
    previewText: 'Don\'t miss the early-bird discount…',
    status: 'sent', audienceType: 'community', audienceLabel: 'Paid Members', audienceCount: 384,
    sentAt: '2026-03-20', createdAt: '2026-03-19',
    stats: { sent: 384, opened: 291, clicked: 178 },
  },
  {
    id: 'c3', name: 'Weekly Digest — April Week 1', subject: 'What\'s new this week in the community 📰',
    previewText: 'Highlights, top posts and upcoming events…',
    status: 'scheduled', audienceType: 'all', audienceLabel: 'All Members', audienceCount: 1298,
    scheduledAt: '2026-04-07 09:00', createdAt: '2026-04-03',
    stats: { sent: 0, opened: 0, clicked: 0 },
  },
  {
    id: 'c4', name: 'Re-engagement — Inactive Users', subject: 'We miss you! Come back and see what\'s new',
    previewText: 'A lot has changed since you last visited…',
    status: 'draft', audienceType: 'csv', audienceLabel: 'Uploaded List', audienceCount: 210,
    createdAt: '2026-04-02',
    stats: { sent: 0, opened: 0, clicked: 0 },
  },
  {
    id: 'c5', name: 'Challenge Launch — 30-Day Fitness', subject: 'Join the 30-day challenge starting Monday 💪',
    previewText: 'Limited spots — reserve yours now…',
    status: 'sent', audienceType: 'community', audienceLabel: 'Free Members', audienceCount: 856,
    sentAt: '2026-03-15', createdAt: '2026-03-14',
    stats: { sent: 856, opened: 530, clicked: 244 },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100)

const STATUS_META: Record<Campaign['status'], { label: string; bg: string; color: string; border: string }> = {
  sent:      { label: 'Sent',      bg: 'rgba(74,222,128,.12)',  color: '#16a34a', border: 'rgba(74,222,128,.3)' },
  draft:     { label: 'Draft',     bg: 'var(--bg)',              color: 'var(--t3)', border: 'var(--bd)' },
  scheduled: { label: 'Scheduled', bg: 'rgba(251,146,60,.12)',  color: 'var(--orange)', border: 'rgba(251,146,60,.3)' },
}

const COMMUNITIES = ['All Members', 'Paid Members', 'Free Members', 'VIP Members', 'Trial Members']
const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'sent',      label: 'Sent'      },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'draft',     label: 'Drafts'    },
] as const

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
    </div>
  )
}

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

function CampaignCard({ c, onDelete }: { c: Campaign; onDelete: (id: string) => void }) {
  const st = STATUS_META[c.status]
  const openRate  = pct(c.stats.opened,  c.stats.sent)
  const clickRate = pct(c.stats.clicked, c.stats.sent)

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      {/* header row */}
      <div className="flex items-start gap-4 p-4 pb-3">
        {/* icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--p2)' }}>
          <Mail className="w-5 h-5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
        </div>

        {/* name + subject */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold truncate" style={{ color: 'var(--t1)' }}>{c.name}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}>
              {st.label}
            </span>
          </div>
          <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--t3)' }}>{c.subject}</p>
        </div>

        {/* actions */}
        <button onClick={() => onDelete(c.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70 shrink-0"
          style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* divider */}
      <div style={{ borderTop: '1px solid var(--bd)' }} />

      {/* meta + stats */}
      <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
          <Users className="w-3 h-3" strokeWidth={1.8} />
          {c.audienceLabel} · {c.audienceCount.toLocaleString()}
        </span>
        {c.sentAt && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
            <Send className="w-3 h-3" strokeWidth={1.8} /> {c.sentAt}
          </span>
        )}
        {c.scheduledAt && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--orange)' }}>
            <Clock className="w-3 h-3" strokeWidth={1.8} /> {c.scheduledAt}
          </span>
        )}
      </div>

      {/* metrics */}
      {c.status === 'sent' && (
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Sent',       value: c.stats.sent.toLocaleString(), pct: 100,       color: 'var(--p)'     },
            { label: 'Open Rate',  value: `${openRate}%`,                pct: openRate,  color: 'var(--cyan)'  },
            { label: 'Click Rate', value: `${clickRate}%`,               pct: clickRate, color: 'var(--orange)'},
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
              <p className="text-[13px] font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[10px] mt-0.5 mb-2" style={{ color: 'var(--t3)' }}>{m.label}</p>
              <StatBar value={m.pct} max={100} color={m.color} />
            </div>
          ))}
        </div>
      )}

      {(c.status === 'draft' || c.status === 'scheduled') && (
        <div className="px-4 pb-4">
          <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
            style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
              {c.status === 'draft' ? 'Draft — not sent yet. Edit and schedule to send.' : `Scheduled for ${c.scheduledAt}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create Campaign Drawer ────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  onClose: () => void
  onSave: (c: Campaign) => void
}

function CreateDrawer({ open, onClose, onSave }: DrawerProps) {
  const [name,        setName]        = useState('')
  const [subject,     setSubject]     = useState('')
  const [preview,     setPreview]     = useState('')
  const [body,        setBody]        = useState('')
  const [audienceMode, setAudienceMode] = useState<'community' | 'csv'>('community')
  const [communities, setCommunities] = useState<string[]>(['All Members'])
  const [csvName,     setCsvName]     = useState('')
  const [csvCount,    setCsvCount]    = useState(0)
  const [schedMode,   setSchedMode]   = useState<'now' | 'later'>('now')
  const [schedDate,   setSchedDate]   = useState('')
  const [schedTime,   setSchedTime]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleCommunity = (c: string) => {
    setCommunities(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const handleCsv = (f: File) => {
    setCsvName(f.name)
    setCsvCount(Math.floor(Math.random() * 800) + 100)
  }

  const canSend = name.trim() && subject.trim() && (
    audienceMode === 'community' ? communities.length > 0 : csvCount > 0
  )

  const buildCampaign = (status: Campaign['status']): Campaign => {
    const audLabel = audienceMode === 'csv' ? 'Uploaded List' : communities.join(', ')
    const audCount = audienceMode === 'csv' ? csvCount : Math.floor(Math.random() * 900) + 300
    return {
      id: Math.random().toString(36).slice(2),
      name, subject, previewText: preview, status,
      audienceType: audienceMode === 'csv' ? 'csv' : communities.includes('All Members') ? 'all' : 'community',
      audienceLabel: audLabel, audienceCount: audCount,
      sentAt:     status === 'sent'      ? new Date().toISOString().slice(0, 10) : undefined,
      scheduledAt: status === 'scheduled' ? `${schedDate} ${schedTime}` : undefined,
      createdAt:  new Date().toISOString().slice(0, 10),
      stats: status === 'sent'
        ? { sent: audCount, opened: Math.floor(audCount * (0.4 + Math.random() * 0.3)), clicked: Math.floor(audCount * (0.1 + Math.random() * 0.2)) }
        : { sent: 0, opened: 0, clicked: 0 },
    }
  }

  const submit = async (status: Campaign['status']) => {
    if (!canSend) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    onSave(buildCampaign(status))
    setSaving(false)
    onClose()
    // reset
    setName(''); setSubject(''); setPreview(''); setBody('')
    setCommunities(['All Members']); setCsvName(''); setCsvCount(0)
    setSchedMode('now'); setSchedDate(''); setSchedTime('')
  }

  const LBL = ({ text, req }: { text: string; req?: boolean }) => (
    <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>
      {text}{req && <span style={{ color: 'var(--p)' }}> *</span>}
    </p>
  )
  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none transition-colors"

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 transition-all duration-300"
        style={{ background: open ? 'rgba(0,0,0,.35)' : 'transparent', backdropFilter: open ? 'blur(2px)' : 'none', pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose} />

      {/* drawer */}
      <div className="fixed top-0 right-0 h-full w-[480px] z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ background: 'var(--white)', borderLeft: '1px solid var(--bd)', transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>New Campaign</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>Configure and send an email campaign</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
            style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Campaign Details ── */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>Campaign Details</p>

            <div className="space-y-3">
              <div>
                <LBL text="Campaign Name" req />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Digest — April"
                  className={inp} style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--p)'}
                  onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--bd)'} />
              </div>
              <div>
                <LBL text="Subject Line" req />
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's the email about?"
                  className={inp} style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--p)'}
                  onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--bd)'} />
              </div>
              <div>
                <LBL text="Preview Text" />
                <input value={preview} onChange={e => setPreview(e.target.value)} placeholder="Short summary shown in inbox…"
                  className={inp} style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--p)'}
                  onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--bd)'} />
              </div>
              <div>
                <LBL text="Email Body" />
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your email content here…" rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-colors resize-none"
                  style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--p)'}
                  onBlur={e  => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)'} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>HTML and markdown supported</p>
              </div>
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          {/* ── Audience ── */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>Audience</p>

            {/* mode toggle */}
            <div className="flex gap-2 mb-4">
              {([['community', 'Community Filter'], ['csv', 'Upload CSV']] as const).map(([mode, label]) => (
                <button key={mode} onClick={() => setAudienceMode(mode)}
                  className="flex-1 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={audienceMode === mode
                    ? { background: 'var(--p)', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                  {label}
                </button>
              ))}
            </div>

            {audienceMode === 'community' ? (
              <div className="space-y-2">
                {COMMUNITIES.map(c => {
                  const sel = communities.includes(c)
                  return (
                    <button key={c} onClick={() => toggleCommunity(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left"
                      style={sel
                        ? { background: 'var(--p2)', border: '1.5px solid var(--p)' }
                        : { background: 'var(--bg)', border: '1.5px solid var(--bd)' }}>
                      <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: sel ? 'var(--p)' : 'transparent', border: sel ? 'none' : '1.5px solid var(--bd)' }}>
                        {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <p className="text-[13px] font-medium flex-1" style={{ color: sel ? 'var(--p)' : 'var(--t2)' }}>{c}</p>
                      <Users className="w-3.5 h-3.5" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleCsv(e.target.files[0]) }} />
                <button onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-all"
                  style={{ border: `2px dashed ${csvCount > 0 ? 'var(--p)' : 'var(--bd)'}`, background: csvCount > 0 ? 'var(--p2)' : 'var(--bg)' }}>
                  {csvCount > 0
                    ? <>
                        <Check className="w-6 h-6" style={{ color: 'var(--p)' }} />
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--p)' }}>{csvName}</p>
                        <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{csvCount} recipients detected</p>
                      </>
                    : <>
                        <Upload className="w-6 h-6" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                        <p className="text-[13px] font-medium" style={{ color: 'var(--t2)' }}>Drop CSV or click to upload</p>
                        <p className="text-[11px]" style={{ color: 'var(--t3)' }}>Must have an "email" column</p>
                      </>
                  }
                </button>
              </div>
            )}
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          {/* ── Schedule ── */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>Schedule</p>

            <div className="flex gap-2 mb-4">
              {([['now', 'Send Now'], ['later', 'Schedule for Later']] as const).map(([mode, label]) => (
                <button key={mode} onClick={() => setSchedMode(mode)}
                  className="flex-1 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={schedMode === mode
                    ? { background: 'var(--p)', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                  {label}
                </button>
              ))}
            </div>

            {schedMode === 'later' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <LBL text="Date" req />
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    className={inp} style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--p)'}
                    onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--bd)'} />
                </div>
                <div>
                  <LBL text="Time" req />
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className={inp} style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--p)'}
                    onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--bd)'} />
                </div>
              </div>
            )}

            {schedMode === 'now' && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.25)' }}>
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: '#16a34a' }} strokeWidth={1.8} />
                <p className="text-[12px]" style={{ color: '#16a34a' }}>Campaign will be sent immediately after confirmation</p>
              </div>
            )}
          </section>

          <div className="h-4" />
        </div>

        {/* footer */}
        <div className="px-6 py-4 flex gap-2" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={() => submit('draft')} disabled={!name.trim() || saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
            Save Draft
          </button>
          <button onClick={() => submit(schedMode === 'later' ? 'scheduled' : 'sent')}
            disabled={!canSend || saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--p)' }}>
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : schedMode === 'later'
                ? <><Calendar className="w-4 h-4" strokeWidth={2} /> Schedule</>
                : <><Send className="w-4 h-4" strokeWidth={2} /> Send Now</>
            }
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailMarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<typeof TABS[number]['id']>('all')
  const [search,    setSearch]    = useState('')
  const [drawer,    setDrawer]    = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chabaqa_campaigns')
      setCampaigns(raw ? JSON.parse(raw) : SEED)
    } catch { setCampaigns(SEED) }
    finally { setLoading(false) }
  }, [])

  const save = (list: Campaign[]) => {
    setCampaigns(list)
    localStorage.setItem('chabaqa_campaigns', JSON.stringify(list))
  }

  const addCampaign = (c: Campaign) => save([c, ...campaigns])
  const delCampaign = (id: string) => save(campaigns.filter(c => c.id !== id))

  const filtered = campaigns
    .filter(c => tab === 'all' || c.status === tab)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase()))

  const sent = campaigns.filter(c => c.status === 'sent')
  const totalSent   = sent.reduce((s, c) => s + c.stats.sent,   0)
  const totalOpened = sent.reduce((s, c) => s + c.stats.opened, 0)
  const totalClicked = sent.reduce((s, c) => s + c.stats.clicked, 0)
  const avgOpen  = pct(totalOpened,  totalSent)
  const avgClick = pct(totalClicked, totalSent)

  const tabCount = (id: string) => id === 'all' ? campaigns.length : campaigns.filter(c => c.status === id).length

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Email Marketing" subtitle="Send campaigns and track audience engagement" />

          <main className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* ── KPI row ── */}
            <div className="grid grid-cols-4 gap-4 mb-7">
              <KpiCard icon={<Mail className="w-5 h-5" />}      label="Total Campaigns" value={String(campaigns.length)}      sub={`${tabCount('sent')} sent · ${tabCount('draft')} drafts`} color="var(--p)" />
              <KpiCard icon={<Send className="w-5 h-5" />}      label="Emails Sent"     value={totalSent.toLocaleString()}     sub="across all campaigns"       color="var(--cyan)" />
              <KpiCard icon={<Eye className="w-5 h-5" />}       label="Avg Open Rate"   value={`${avgOpen}%`}                  sub={`${totalOpened.toLocaleString()} opens`}  color="var(--orange)" />
              <KpiCard icon={<MousePointerClick className="w-5 h-5" />} label="Avg Click Rate" value={`${avgClick}%`}         sub={`${totalClicked.toLocaleString()} clicks`} color="var(--pink)" />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {/* tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                    style={tab === t.id
                      ? { background: 'var(--p)', color: '#fff' }
                      : { color: 'var(--t3)' }}>
                    {t.label}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={tab === t.id
                        ? { background: 'rgba(255,255,255,.25)', color: '#fff' }
                        : { background: 'var(--bg)', color: 'var(--t3)' }}>
                      {tabCount(t.id)}
                    </span>
                  </button>
                ))}
              </div>

              {/* search */}
              <div className="flex items-center gap-2 flex-1 min-w-[180px] h-9 px-3 rounded-xl"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search campaigns…" className="flex-1 bg-transparent text-[13px] outline-none"
                  style={{ color: 'var(--t1)' }} />
                {search && (
                  <button onClick={() => setSearch('')} className="cursor-pointer" style={{ color: 'var(--t3)' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* new campaign */}
              <button onClick={() => setDrawer(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: 'var(--p)' }}>
                <Plus className="w-4 h-4" strokeWidth={2.5} /> New Campaign
              </button>
            </div>

            {/* ── Content ── */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--p3)] border-t-[var(--p)] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed"
                style={{ borderColor: 'var(--bd)', background: 'var(--white)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--p2)' }}>
                  <Inbox className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--t1)' }}>
                  {search ? 'No campaigns match your search' : 'No campaigns yet'}
                </p>
                <p className="text-[13px] mb-6" style={{ color: 'var(--t3)' }}>
                  {search ? 'Try a different keyword' : 'Create your first email campaign'}
                </p>
                {!search && (
                  <button onClick={() => setDrawer(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                    style={{ background: 'var(--p)' }}>
                    <Plus className="w-4 h-4" strokeWidth={2.5} /> New Campaign
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-w-4xl">
                {filtered.map((c, i) => (
                  <div key={c.id} style={{ animation: `dashFadeUp .3s ${i * 50}ms ease both` }}>
                    <CampaignCard c={c} onDelete={delCampaign} />
                  </div>
                ))}
              </div>
            )}

          </main>
        </div>
      </div>

      <CreateDrawer open={drawer} onClose={() => setDrawer(false)} onSave={addCampaign} />
    </>
  )
}
