'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  Plus, Users, Trash2, Upload, X, Check, Clock,
  Search, Zap, Image, FileText, Video, Link2,
  Play, Pause, Send, Phone, CheckCheck, Inbox,
  Calendar, AlertCircle, Eye, Smile, Paperclip,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WaCampaign {
  id: string; name: string
  messageType: 'text' | 'image' | 'video' | 'document'
  message: string; mediaUrl?: string; caption?: string
  status: 'sent' | 'draft' | 'scheduled'
  audienceLabel: string; audienceCount: number
  sentAt?: string; scheduledAt?: string; createdAt: string
  stats: { sent: number; delivered: number; read: number; replied: number }
}

interface WaAutomation {
  id: string; name: string
  trigger: string; triggerLabel: string
  delay: number; message: string
  isActive: boolean; triggered: number; createdAt: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const CAMP_SEED: WaCampaign[] = [
  {
    id: 'w1', name: 'Course Launch Announcement', messageType: 'image',
    message: 'Hey! Our new Motion Pro course is LIVE. Get early-bird pricing before Friday. Tap the link below!', caption: 'Motion Pro is here!',
    status: 'sent', audienceLabel: 'All Members', audienceCount: 1240,
    sentAt: '2026-03-28', createdAt: '2026-03-27',
    stats: { sent: 1240, delivered: 1198, read: 876, replied: 142 },
  },
  {
    id: 'w2', name: 'Weekly Challenge Reminder', messageType: 'text',
    message: 'The 30-day challenge ends this Sunday. You have 3 more days to hit your goal. You got this!',
    status: 'sent', audienceLabel: 'Challenge Participants', audienceCount: 320,
    sentAt: '2026-03-22', createdAt: '2026-03-21',
    stats: { sent: 320, delivered: 314, read: 290, replied: 67 },
  },
  {
    id: 'w3', name: 'April Event Reminder', messageType: 'text',
    message: 'Reminder: Live Q&A session tomorrow at 7PM. Join via the app. See you there!',
    status: 'scheduled', audienceLabel: 'Registered Members', audienceCount: 480,
    scheduledAt: '2026-04-06 10:00', createdAt: '2026-04-03',
    stats: { sent: 0, delivered: 0, read: 0, replied: 0 },
  },
  {
    id: 'w4', name: 'VIP Exclusive Offer', messageType: 'document',
    message: 'VIP members — here is your exclusive offer package. Check the PDF for all the details.',
    status: 'draft', audienceLabel: 'VIP Members', audienceCount: 95,
    createdAt: '2026-04-02',
    stats: { sent: 0, delivered: 0, read: 0, replied: 0 },
  },
]

const AUTO_SEED: WaAutomation[] = [
  {
    id: 'wa1', name: 'Welcome Message', trigger: 'new_member', triggerLabel: 'New member joins',
    delay: 0, message: 'Welcome to Motion Masters! We are glad to have you here. Reply with any questions.',
    isActive: true, triggered: 93, createdAt: '2026-03-01',
  },
  {
    id: 'wa2', name: 'Purchase Thank You', trigger: 'purchase', triggerLabel: 'Purchase completed',
    delay: 1, message: 'Thank you for your purchase! Your access has been activated. Enjoy the content!',
    isActive: true, triggered: 48, createdAt: '2026-03-08',
  },
  {
    id: 'wa3', name: 'Inactive Member Nudge', trigger: 'inactive_7', triggerLabel: 'Inactive 7 days',
    delay: 0, message: 'Hey! It has been a while. Come back and check out what is new in the community.',
    isActive: false, triggered: 211, createdAt: '2026-03-12',
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCES = ['All Members', 'Paid Members', 'Free Members', 'VIP Members', 'Trial Members', 'Challenge Participants', 'Registered Members']

const TRIGGER_OPTIONS = [
  { id: 'new_member',       label: 'New member joins',        desc: 'When anyone joins your community'        },
  { id: 'purchase',         label: 'Purchase completed',      desc: 'When a member completes a purchase'      },
  { id: 'course_enrolled',  label: 'Enrolled in course',      desc: 'When a member enrolls in a course'       },
  { id: 'course_completed', label: 'Completed a course',      desc: 'When a member finishes a course'         },
  { id: 'challenge_joined', label: 'Joined a challenge',      desc: 'When a member joins a challenge'         },
  { id: 'event_registered', label: 'Registered for event',    desc: 'When a member registers for an event'   },
  { id: 'inactive_7',       label: 'Inactive for 7 days',     desc: 'No activity in 7 days'                   },
  { id: 'inactive_30',      label: 'Inactive for 30 days',    desc: 'No activity in 30 days'                  },
]

const DELAY_OPTIONS = [
  { value: 0, label: 'Immediately' }, { value: 1, label: 'After 1 hour' },
  { value: 6, label: 'After 6 hours' }, { value: 24, label: 'After 1 day' },
  { value: 72, label: 'After 3 days' },
]

const MSG_TYPES = [
  { id: 'text',     label: 'Text',     icon: FileText  },
  { id: 'image',    label: 'Image',    icon: Image     },
  { id: 'video',    label: 'Video',    icon: Video     },
  { id: 'document', label: 'Document', icon: Paperclip },
] as const

const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100)

const STATUS_META = {
  sent:      { label: 'Sent',      bg: 'rgba(74,222,128,.12)',  color: '#16a34a',       border: 'rgba(74,222,128,.3)' },
  draft:     { label: 'Draft',     bg: 'var(--bg)',              color: 'var(--t3)',     border: 'var(--bd)' },
  scheduled: { label: 'Scheduled', bg: 'rgba(251,146,60,.12)',  color: 'var(--orange)', border: 'rgba(251,146,60,.3)' },
}

// ─── WhatsApp Preview ─────────────────────────────────────────────────────────

function WaPreview({ message, msgType, caption }: {
  message: string; msgType: WaCampaign['messageType']; caption?: string
}) {
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#e5ddd5' }}>
      {/* WA header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#075e54' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
          style={{ background: '#128c7e', color: '#fff' }}>Ch</div>
        <div>
          <p className="text-[13px] font-semibold text-white">Motion Masters</p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,.7)' }}>Business Account</p>
        </div>
        <Phone className="w-4 h-4 text-white ml-auto" strokeWidth={1.7} />
      </div>

      {/* chat area */}
      <div className="p-4 min-h-[200px] flex items-end justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm overflow-hidden shadow-sm"
          style={{ background: '#dcf8c6' }}>
          {/* media placeholder */}
          {msgType !== 'text' && (
            <div className="flex items-center justify-center"
              style={{ background: '#b2dfb0', height: '120px' }}>
              {msgType === 'image'    && <Image    className="w-8 h-8 opacity-50" style={{ color: '#075e54' }} strokeWidth={1.5} />}
              {msgType === 'video'    && <Video    className="w-8 h-8 opacity-50" style={{ color: '#075e54' }} strokeWidth={1.5} />}
              {msgType === 'document' && <Paperclip className="w-8 h-8 opacity-50" style={{ color: '#075e54' }} strokeWidth={1.5} />}
            </div>
          )}
          <div className="px-3 py-2">
            {caption && msgType !== 'text' && (
              <p className="text-[12px] font-semibold mb-1" style={{ color: '#111' }}>{caption}</p>
            )}
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: '#111' }}>
              {message || 'Your message will appear here...'}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <p className="text-[10px]" style={{ color: '#777' }}>{now}</p>
              <CheckCheck className="w-3 h-3" style={{ color: '#34b7f1' }} strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* input bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#f0f0f0' }}>
        <Smile className="w-5 h-5 shrink-0" style={{ color: '#aaa' }} strokeWidth={1.5} />
        <div className="flex-1 h-9 rounded-full px-4 flex items-center text-[12px]"
          style={{ background: '#fff', color: '#aaa' }}>Message</div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#128c7e' }}>
          <Send className="w-4 h-4 text-white" strokeWidth={2} style={{ marginLeft: '1px' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ c, onDelete, onPreview }: {
  c: WaCampaign; onDelete: (id: string) => void; onPreview: (c: WaCampaign) => void
}) {
  const st = STATUS_META[c.status]
  const TypeIcon = MSG_TYPES.find(t => t.id === c.messageType)?.icon ?? FileText

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      <div className="flex items-start gap-4 p-4 pb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(37,211,102,.12)' }}>
          <TypeIcon className="w-5 h-5" style={{ color: '#25d366' }} strokeWidth={1.7} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold truncate" style={{ color: 'var(--t1)' }}>{c.name}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}>{st.label}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{ background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
              {c.messageType}
            </span>
          </div>
          <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--t3)' }}>{c.message.slice(0, 80)}{c.message.length > 80 ? '...' : ''}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onPreview(c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
            style={{ background: 'rgba(37,211,102,.12)', color: '#25d366' }}>
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
          <Users className="w-3 h-3" strokeWidth={1.8} />{c.audienceLabel} · {c.audienceCount.toLocaleString()}
        </span>
        {c.sentAt && <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}><Send className="w-3 h-3" strokeWidth={1.8} />{c.sentAt}</span>}
        {c.scheduledAt && <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--orange)' }}><Clock className="w-3 h-3" strokeWidth={1.8} />{c.scheduledAt}</span>}
      </div>

      {c.status === 'sent' && (
        <div className="px-4 pb-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Sent',      value: c.stats.sent.toLocaleString(),             bar: 100,                              color: '#25d366' },
            { label: 'Delivered', value: `${pct(c.stats.delivered, c.stats.sent)}%`, bar: pct(c.stats.delivered, c.stats.sent), color: 'var(--p)'     },
            { label: 'Read',      value: `${pct(c.stats.read,      c.stats.sent)}%`, bar: pct(c.stats.read,      c.stats.sent), color: 'var(--cyan)'  },
            { label: 'Replied',   value: `${pct(c.stats.replied,   c.stats.sent)}%`, bar: pct(c.stats.replied,   c.stats.sent), color: 'var(--orange)'},
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
              <p className="text-[13px] font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[10px] mt-0.5 mb-1.5" style={{ color: 'var(--t3)' }}>{m.label}</p>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
                <div className="h-full rounded-full" style={{ width: `${m.bar}%`, background: m.color }} />
              </div>
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
              {c.status === 'draft' ? 'Draft — not sent yet.' : `Scheduled for ${c.scheduledAt}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Automation Card ──────────────────────────────────────────────────────────

function AutomationCard({ a, onToggle, onDelete }: {
  a: WaAutomation; onToggle: (id: string) => void; onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-2xl p-4 flex gap-4 items-start transition-all"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: a.isActive ? 'rgba(37,211,102,.12)' : 'var(--bg)', border: '1px solid var(--bd)' }}>
        <Zap className="w-5 h-5" style={{ color: a.isActive ? '#25d366' : 'var(--t3)' }} strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{a.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={a.isActive
              ? { background: 'rgba(74,222,128,.12)', color: '#16a34a', borderColor: 'rgba(74,222,128,.3)' }
              : { background: 'var(--bg)', color: 'var(--t3)', borderColor: 'var(--bd)' }}>
            {a.isActive ? 'Active' : 'Paused'}
          </span>
        </div>
        <p className="text-[12px]" style={{ color: 'var(--t3)' }}>Trigger: {a.triggerLabel}{a.delay > 0 ? ` · after ${DELAY_OPTIONS.find(d => d.value === a.delay)?.label?.replace('After ', '')}` : ''}</p>
        <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--t3)' }}>{a.message.slice(0, 70)}...</p>
        <p className="text-[11px] mt-1 font-semibold" style={{ color: '#25d366' }}>{a.triggered.toLocaleString()} messages sent</p>
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

function CreateCampaignDrawer({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (c: WaCampaign) => void
}) {
  const [name,      setName]      = useState('')
  const [msgType,   setMsgType]   = useState<WaCampaign['messageType']>('text')
  const [message,   setMessage]   = useState('')
  const [caption,   setCaption]   = useState('')
  const [audience,  setAudience]  = useState<string[]>(['All Members'])
  const [schedMode, setSchedMode] = useState<'now' | 'later'>('now')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [preview,   setPreview]   = useState(false)
  const [saving,    setSaving]    = useState(false)

  const toggleAud = (a: string) => setAudience(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])
  const canSend = name.trim() && message.trim() && audience.length > 0

  const submit = async (status: WaCampaign['status']) => {
    if (!canSend) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    const audCount = audience.includes('All Members') ? 1298 : Math.floor(Math.random() * 500) + 80
    onSave({
      id: Math.random().toString(36).slice(2),
      name, messageType: msgType, message, caption,
      status, audienceLabel: audience.join(', '), audienceCount: audCount,
      sentAt:      status === 'sent'      ? new Date().toISOString().slice(0, 10) : undefined,
      scheduledAt: status === 'scheduled' ? `${schedDate} ${schedTime}`           : undefined,
      createdAt: new Date().toISOString().slice(0, 10),
      stats: status === 'sent'
        ? { sent: audCount, delivered: Math.floor(audCount * 0.97), read: Math.floor(audCount * (0.6 + Math.random() * 0.25)), replied: Math.floor(audCount * (0.05 + Math.random() * 0.15)) }
        : { sent: 0, delivered: 0, read: 0, replied: 0 },
    })
    setSaving(false); onClose()
    setName(''); setMessage(''); setCaption(''); setAudience(['All Members']); setSchedMode('now')
  }

  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none"
  const fs  = { border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }
  const fo  = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#25d366'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--bd)'),
  }

  const LBL = ({ text, req }: { text: string; req?: boolean }) => (
    <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>
      {text}{req && <span style={{ color: '#25d366' }}> *</span>}
    </p>
  )

  return (
    <>
      {preview && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" onClick={() => setPreview(false)} />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-[380px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,.8)' }}>WhatsApp Preview</p>
                <button onClick={() => setPreview(false)} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <WaPreview message={message} msgType={msgType} caption={caption} />
            </div>
          </div>
        </>
      )}

      <div className="fixed inset-0 z-40 transition-all duration-300"
        style={{ background: open ? 'rgba(0,0,0,.35)' : 'transparent', backdropFilter: open ? 'blur(2px)' : 'none', pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[480px] z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ background: 'var(--white)', borderLeft: '1px solid var(--bd)', transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>New WA Campaign</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>Send a WhatsApp message to your audience</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-80"
              style={{ background: 'rgba(37,211,102,.12)', color: '#25d366' }}>
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
              style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#25d366' }}>Message</p>
            <div className="space-y-3">
              <div>
                <LBL text="Campaign Name" req />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Launch Announcement"
                  className={inp} style={fs} {...fo} />
              </div>
              <div>
                <LBL text="Message Type" />
                <div className="grid grid-cols-4 gap-2">
                  {MSG_TYPES.map(t => {
                    const Icon = t.icon; const sel = msgType === t.id
                    return (
                      <button key={t.id} onClick={() => setMsgType(t.id)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl cursor-pointer transition-all"
                        style={sel ? { background: 'rgba(37,211,102,.12)', border: '1.5px solid #25d366' } : { background: 'var(--bg)', border: '1.5px solid var(--bd)' }}>
                        <Icon className="w-4 h-4" style={{ color: sel ? '#25d366' : 'var(--t3)' }} strokeWidth={1.7} />
                        <p className="text-[10px] font-semibold" style={{ color: sel ? '#25d366' : 'var(--t3)' }}>{t.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              {msgType !== 'text' && (
                <div>
                  <LBL text={msgType === 'image' ? 'Image Caption' : msgType === 'video' ? 'Video Caption' : 'Document Title'} />
                  <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Optional caption"
                    className={inp} style={fs} {...fo} />
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <LBL text="Message Text" req />
                  <button onClick={() => setPreview(true)} className="text-[11px] font-semibold cursor-pointer flex items-center gap-1" style={{ color: '#25d366' }}>
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Type your WhatsApp message here..." rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ ...fs, border: '1.5px solid var(--bd)' as any }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#25d366'}
                  onBlur={e  => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)'} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>
                  {message.length}/1024 · Use *bold*, _italic_, ~strikethrough~
                </p>
              </div>
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#25d366' }}>Audience</p>
            <div className="space-y-2">
              {AUDIENCES.map(a => {
                const sel = audience.includes(a)
                return (
                  <button key={a} onClick={() => toggleAud(a)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left"
                    style={sel
                      ? { background: 'rgba(37,211,102,.08)', border: '1.5px solid #25d366' }
                      : { background: 'var(--bg)', border: '1.5px solid var(--bd)' }}>
                    <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: sel ? '#25d366' : 'transparent', border: sel ? 'none' : '1.5px solid var(--bd)' }}>
                      {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <p className="text-[13px] font-medium flex-1" style={{ color: sel ? '#25d366' : 'var(--t2)' }}>{a}</p>
                    <Users className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
                  </button>
                )
              })}
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#25d366' }}>Schedule</p>
            <div className="flex gap-2 mb-4">
              {(['now', 'later'] as const).map(m => (
                <button key={m} onClick={() => setSchedMode(m)}
                  className="flex-1 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={schedMode === m
                    ? { background: '#25d366', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                  {m === 'now' ? 'Send Now' : 'Schedule'}
                </button>
              ))}
            </div>
            {schedMode === 'later' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>Date <span style={{ color: '#25d366' }}>*</span></p>
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    className={inp} style={fs} {...fo} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>Time <span style={{ color: '#25d366' }}>*</span></p>
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className={inp} style={fs} {...fo} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.3)' }}>
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: '#25d366' }} strokeWidth={1.8} />
                <p className="text-[12px]" style={{ color: '#25d366' }}>Sent immediately after confirmation</p>
              </div>
            )}
          </section>
          <div className="h-4" />
        </div>

        <div className="px-6 py-4 flex gap-2" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={() => submit('draft')} disabled={!name.trim() || saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
            Save Draft
          </button>
          <button onClick={() => submit(schedMode === 'later' ? 'scheduled' : 'sent')}
            disabled={!canSend || saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: '#25d366' }}>
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : schedMode === 'later'
                ? <><Calendar className="w-4 h-4" strokeWidth={2} /> Schedule</>
                : <><Send className="w-4 h-4" strokeWidth={2} /> Send Now</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Create Automation Drawer ─────────────────────────────────────────────────

function CreateAutoDrawer({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (a: WaAutomation) => void
}) {
  const [name,    setName]    = useState('')
  const [trigger, setTrigger] = useState('')
  const [delay,   setDelay]   = useState(0)
  const [message, setMessage] = useState('')
  const [saving,  setSaving]  = useState(false)

  const canSave = name.trim() && trigger && message.trim()

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    const tOpt = TRIGGER_OPTIONS.find(t => t.id === trigger)!
    onSave({ id: Math.random().toString(36).slice(2), name, trigger, triggerLabel: tOpt.label, delay, message, isActive: true, triggered: 0, createdAt: new Date().toISOString().slice(0, 10) })
    setSaving(false); onClose()
    setName(''); setTrigger(''); setDelay(0); setMessage('')
  }

  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none"
  const fs  = { border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }
  const fo  = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#25d366'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--bd)'),
  }

  return (
    <>
      <div className="fixed inset-0 z-40 transition-all duration-300"
        style={{ background: open ? 'rgba(0,0,0,.35)' : 'transparent', backdropFilter: open ? 'blur(2px)' : 'none', pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[480px] z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ background: 'var(--white)', borderLeft: '1px solid var(--bd)', transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>New WA Automation</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>Trigger-based WhatsApp messages</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
            style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#25d366' }}>Setup</p>
            <div className="space-y-3">
              <div>
                <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>Name <span style={{ color: '#25d366' }}>*</span></p>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome Message"
                  className={inp} style={fs} {...fo} />
              </div>
              <div>
                <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>Send Delay</p>
                <div className="flex flex-wrap gap-2">
                  {DELAY_OPTIONS.map(d => (
                    <button key={d.value} onClick={() => setDelay(d.value)}
                      className="h-8 px-3 rounded-xl text-[11px] font-semibold cursor-pointer transition-all"
                      style={delay === d.value
                        ? { background: '#25d366', color: '#fff' }
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
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#25d366' }}>Trigger</p>
            <div className="space-y-2">
              {TRIGGER_OPTIONS.map(t => {
                const sel = trigger === t.id
                return (
                  <button key={t.id} onClick={() => setTrigger(t.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left"
                    style={sel
                      ? { background: 'rgba(37,211,102,.08)', border: '1.5px solid #25d366' }
                      : { background: 'var(--bg)', border: '1.5px solid var(--bd)' }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: sel ? '#25d366' : 'var(--white)', border: '1px solid var(--bd)' }}>
                      <Zap className="w-3 h-3" style={{ color: sel ? '#fff' : 'var(--t3)' }} strokeWidth={1.7} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold" style={{ color: sel ? '#25d366' : 'var(--t1)' }}>{t.label}</p>
                      <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{t.desc}</p>
                    </div>
                    {sel && <Check className="w-4 h-4 shrink-0" style={{ color: '#25d366' }} strokeWidth={2.5} />}
                  </button>
                )
              })}
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#25d366' }}>Message</p>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder={'Hi! Welcome to Motion Masters...'} rows={5}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
              style={{ ...fs, border: '1.5px solid var(--bd)' as any }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#25d366'}
              onBlur={e  => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)'} />
            <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>Use *bold*, _italic_, variables: {'{{first_name}}'}</p>
          </section>
          <div className="h-4" />
        </div>

        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={submit} disabled={!canSave || saving}
            className="w-full h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: '#25d366' }}>
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><Zap className="w-4 h-4" strokeWidth={2} /> Create &amp; Activate</>}
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

export default function WhatsAppPage() {
  const [campaigns,   setCampaigns]   = useState<WaCampaign[]>([])
  const [automations, setAutomations] = useState<WaAutomation[]>([])
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState<'campaigns' | 'automations'>('campaigns')
  const [tab,         setTab]         = useState<typeof CAMP_TABS[number]['id']>('all')
  const [search,      setSearch]      = useState('')
  const [campDrawer,  setCampDrawer]  = useState(false)
  const [autoDrawer,  setAutoDrawer]  = useState(false)
  const [previewCamp, setPreviewCamp] = useState<WaCampaign | null>(null)

  useEffect(() => {
    try {
      setCampaigns(JSON.parse(localStorage.getItem('chabaqa_wa_campaigns')   || 'null') ?? CAMP_SEED)
      setAutomations(JSON.parse(localStorage.getItem('chabaqa_wa_automations') || 'null') ?? AUTO_SEED)
    } catch { setCampaigns(CAMP_SEED); setAutomations(AUTO_SEED) }
    finally { setLoading(false) }
  }, [])

  const saveCamps = (list: WaCampaign[])   => { setCampaigns(list);   localStorage.setItem('chabaqa_wa_campaigns',   JSON.stringify(list)) }
  const saveAutos = (list: WaAutomation[]) => { setAutomations(list); localStorage.setItem('chabaqa_wa_automations', JSON.stringify(list)) }

  const filtered = campaigns
    .filter(c => tab === 'all' || c.status === tab)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  const sent         = campaigns.filter(c => c.status === 'sent')
  const totalSent    = sent.reduce((s, c) => s + c.stats.sent,      0)
  const totalDeliv   = sent.reduce((s, c) => s + c.stats.delivered, 0)
  const totalRead    = sent.reduce((s, c) => s + c.stats.read,      0)
  const totalReplied = sent.reduce((s, c) => s + c.stats.replied,   0)

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      {previewCamp && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" onClick={() => setPreviewCamp(null)} />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-[380px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,.8)' }}>{previewCamp.name}</p>
                <button onClick={() => setPreviewCamp(null)} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <WaPreview message={previewCamp.message} msgType={previewCamp.messageType} caption={previewCamp.caption} />
            </div>
          </div>
        </>
      )}

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="WhatsApp" subtitle="Broadcast messages and automate WhatsApp flows" />

          <main className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 mb-7">
              <KpiCard icon={<Send className="w-5 h-5" />}       label="Messages Sent"   value={totalSent.toLocaleString()}              sub={`${sent.length} campaigns`}              color="#25d366" />
              <KpiCard icon={<CheckCheck className="w-5 h-5" />} label="Delivery Rate"   value={`${pct(totalDeliv, totalSent)}%`}        sub={`${totalDeliv.toLocaleString()} delivered`} color="var(--p)" />
              <KpiCard icon={<Eye className="w-5 h-5" />}        label="Read Rate"       value={`${pct(totalRead, totalSent)}%`}         sub={`${totalRead.toLocaleString()} read`}       color="var(--cyan)" />
              <KpiCard icon={<Users className="w-5 h-5" />}      label="Reply Rate"      value={`${pct(totalReplied, totalSent)}%`}      sub={`${totalReplied.toLocaleString()} replied`} color="var(--orange)" />
            </div>

            {/* View toggle + toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {(['campaigns', 'automations'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className="h-7 px-4 rounded-lg text-[12px] font-semibold cursor-pointer transition-all capitalize"
                    style={view === v ? { background: '#25d366', color: '#fff' } : { color: 'var(--t3)' }}>
                    {v === 'automations' ? `Automations · ${automations.filter(a => a.isActive).length} active` : 'Campaigns'}
                  </button>
                ))}
              </div>

              {view === 'campaigns' && (
                <>
                  <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                    {CAMP_TABS.map(t => {
                      const cnt = t.id === 'all' ? campaigns.length : campaigns.filter(c => c.status === t.id).length
                      return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                          style={tab === t.id ? { background: '#25d366', color: '#fff' } : { color: 'var(--t3)' }}>
                          {t.label}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={tab === t.id ? { background: 'rgba(255,255,255,.25)', color: '#fff' } : { background: 'var(--bg)', color: 'var(--t3)' }}>
                            {cnt}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[160px] h-9 px-3 rounded-xl"
                    style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                    <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
                      className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: 'var(--t1)' }} />
                    {search && <button onClick={() => setSearch('')} style={{ color: 'var(--t3)' }}><X className="w-3.5 h-3.5" /></button>}
                  </div>
                </>
              )}

              <button onClick={() => view === 'campaigns' ? setCampDrawer(true) : setAutoDrawer(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-white cursor-pointer hover:opacity-90 ml-auto"
                style={{ background: '#25d366' }}>
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                {view === 'campaigns' ? 'New Campaign' : 'New Automation'}
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#25d366]/30 border-t-[#25d366] animate-spin" />
              </div>
            ) : view === 'campaigns' ? (
              filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: 'var(--bd)', background: 'var(--white)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(37,211,102,.1)' }}>
                    <Inbox className="w-8 h-8" style={{ color: '#25d366' }} strokeWidth={1.5} />
                  </div>
                  <p className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--t1)' }}>No campaigns yet</p>
                  <p className="text-[13px] mb-6" style={{ color: 'var(--t3)' }}>Send your first WhatsApp campaign</p>
                  <button onClick={() => setCampDrawer(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                    style={{ background: '#25d366' }}>
                    <Plus className="w-4 h-4" strokeWidth={2.5} /> New Campaign
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                  {filtered.map((c, i) => (
                    <div key={c.id} style={{ animation: `dashFadeUp .3s ${i * 50}ms ease both` }}>
                      <CampaignCard c={c} onDelete={id => saveCamps(campaigns.filter(x => x.id !== id))} onPreview={setPreviewCamp} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              automations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: 'var(--bd)', background: 'var(--white)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(37,211,102,.1)' }}>
                    <Zap className="w-8 h-8" style={{ color: '#25d366' }} strokeWidth={1.5} />
                  </div>
                  <p className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--t1)' }}>No automations yet</p>
                  <p className="text-[13px] mb-6" style={{ color: 'var(--t3)' }}>Set up automated WhatsApp flows</p>
                  <button onClick={() => setAutoDrawer(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                    style={{ background: '#25d366' }}>
                    <Plus className="w-4 h-4" strokeWidth={2.5} /> New Automation
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                  <div className="grid grid-cols-3 gap-3 mb-1">
                    {[
                      { label: 'Total',   value: automations.length,                                    color: '#25d366' },
                      { label: 'Active',  value: automations.filter(a => a.isActive).length,            color: '#16a34a' },
                      { label: 'Sent',    value: automations.reduce((s, a) => s + a.triggered, 0).toLocaleString(), color: 'var(--cyan)' },
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
                        onDelete={id => saveAutos(automations.filter(x => x.id !== id))} />
                    </div>
                  ))}
                </div>
              )
            )}
          </main>
        </div>
      </div>

      <CreateCampaignDrawer open={campDrawer} onClose={() => setCampDrawer(false)} onSave={c => saveCamps([c, ...campaigns])} />
      <CreateAutoDrawer open={autoDrawer} onClose={() => setAutoDrawer(false)} onSave={a => saveAutos([a, ...automations])} />
    </>
  )
}
