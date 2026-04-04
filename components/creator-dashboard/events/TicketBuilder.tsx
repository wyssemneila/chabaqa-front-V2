'use client'

import { useState } from 'react'
import { Plus, Ticket, Edit2, Trash2, X, Check, Infinity } from 'lucide-react'
import type { DashLang } from '@/hooks/use-dash-prefs'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TicketType {
  id: string
  name: string
  tier: 'general' | 'vip' | 'early' | 'student' | 'custom'
  pricing: 'free' | 'paid'
  price: number
  quantity: number | 'unlimited'
  description: string
  salesDeadline: string
}

interface Props {
  tickets: TicketType[]
  onChange: (t: TicketType[]) => void
  lang: DashLang
}

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_COLORS: Record<TicketType['tier'], { bg: string; color: string; border: string }> = {
  general: { bg: 'rgba(99,102,241,.1)',  color: '#6366f1', border: 'rgba(99,102,241,.25)'  },
  vip:     { bg: 'rgba(236,72,153,.1)',  color: 'var(--pink)', border: 'rgba(236,72,153,.25)' },
  early:   { bg: 'rgba(251,146,60,.1)',  color: 'var(--orange)', border: 'rgba(251,146,60,.25)' },
  student: { bg: 'rgba(34,211,238,.1)',  color: 'var(--cyan)', border: 'rgba(34,211,238,.25)' },
  custom:  { bg: 'var(--bg)',            color: 'var(--t2)', border: 'var(--bd)'            },
}

const TIERS_EN = [
  { id:'general', label:'General'    },
  { id:'vip',     label:'VIP'        },
  { id:'early',   label:'Early Bird' },
  { id:'student', label:'Student'    },
  { id:'custom',  label:'Custom'     },
]
const TIERS_AR = [
  { id:'general', label:'عادي'      },
  { id:'vip',     label:'VIP'       },
  { id:'early',   label:'مبكر'      },
  { id:'student', label:'طالب'      },
  { id:'custom',  label:'مخصص'     },
]

function genId() { return Math.random().toString(36).slice(2, 10) }

const BLANK: Omit<TicketType, 'id'> = {
  name: '', tier: 'general', pricing: 'free',
  price: 0, quantity: 'unlimited', description: '', salesDeadline: '',
}

// ─── Ticket form (inline) ─────────────────────────────────────────────────────
function TicketForm({
  initial, onSave, onCancel, lang,
}: {
  initial: TicketType | null
  onSave: (t: TicketType) => void
  onCancel: () => void
  lang: DashLang
}) {
  const [form, setForm] = useState<Omit<TicketType, 'id'>>(
    initial ? { ...initial } : { ...BLANK }
  )
  const set = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const tiers = lang === 'ar' ? TIERS_AR : TIERS_EN

  const save = () => {
    if (!form.name.trim()) return
    onSave({ ...form, id: initial?.id ?? genId() })
  }

  const inputCls = `w-full h-9 px-3 rounded-xl border text-[12px] focus:outline-none transition-colors`
  const inputStyle = { background: 'var(--white)', borderColor: 'var(--bd)', color: 'var(--t1)' }

  return (
    <div className="rounded-2xl border-2 p-5 space-y-4"
      style={{ background: 'var(--p2)', borderColor: 'var(--p3)' }}>

      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold" style={{ color: 'var(--p)' }}>
          {initial ? (lang === 'ar' ? 'تعديل التذكرة' : 'Edit Ticket') : (lang === 'ar' ? 'تذكرة جديدة' : 'New Ticket')}
        </p>
        <button type="button" onClick={onCancel}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
          style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tier selector */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
          style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'النوع' : 'Tier'}
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {tiers.map(t => (
            <button key={t.id} type="button" onClick={() => set('tier', t.id)}
              className="h-7 px-3 rounded-full text-[11px] font-semibold cursor-pointer transition-all border"
              style={form.tier === t.id
                ? { background: TIER_COLORS[t.id as TicketType['tier']].color, color: '#fff', borderColor: 'transparent' }
                : { background: 'var(--white)', color: 'var(--t2)', borderColor: 'var(--bd)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
          style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'اسم التذكرة' : 'Ticket Name'} *
        </label>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder={lang === 'ar' ? 'مثال: تذكرة VIP' : 'e.g. VIP Access'}
          className={inputCls} style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--p)')}
          onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
      </div>

      {/* Pricing toggle */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
          style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'السعر' : 'Pricing'}
        </label>
        <div className="flex items-center p-1 rounded-xl gap-1 w-fit"
          style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
          {(['free', 'paid'] as const).map(p => (
            <button key={p} type="button" onClick={() => set('pricing', p)}
              className="h-7 px-4 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
              style={form.pricing === p
                ? { background: 'var(--p)', color: '#fff' }
                : { background: 'transparent', color: 'var(--t3)' }}>
              {p === 'free'
                ? (lang === 'ar' ? 'مجاني' : 'Free')
                : (lang === 'ar' ? 'مدفوع' : 'Paid')}
            </button>
          ))}
        </div>
      </div>

      {/* Price input (if paid) */}
      {form.pricing === 'paid' && (
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
            style={{ color: 'var(--t3)' }}>
            {lang === 'ar' ? 'السعر (د.ت)' : 'Price (TND)'}
          </label>
          <input type="number" min={0} value={form.price}
            onChange={e => set('price', parseFloat(e.target.value) || 0)}
            className={inputCls} style={{ ...inputStyle, width: '160px' }}
            onFocus={e => (e.target.style.borderColor = 'var(--p)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
          style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'العدد المتاح' : 'Quantity'}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number" min={1}
            value={form.quantity === 'unlimited' ? '' : form.quantity}
            placeholder={form.quantity === 'unlimited' ? '∞' : ''}
            disabled={form.quantity === 'unlimited'}
            onChange={e => set('quantity', parseInt(e.target.value) || 1)}
            className={inputCls} style={{ ...inputStyle, width: '120px',
              opacity: form.quantity === 'unlimited' ? 0.4 : 1 }}
          />
          <label className="flex items-center gap-1.5 cursor-pointer">
            <div onClick={() => set('quantity', form.quantity === 'unlimited' ? 100 : 'unlimited')}
              className="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
              style={{ background: form.quantity === 'unlimited' ? 'var(--p)' : 'var(--bd)' }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: form.quantity === 'unlimited' ? '17px' : '2px' }} />
            </div>
            <span className="text-[11px] font-medium flex items-center gap-1"
              style={{ color: 'var(--t2)' }}>
              <Infinity className="w-3 h-3" /> {lang === 'ar' ? 'غير محدود' : 'Unlimited'}
            </span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
          style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'وصف (اختياري)' : 'Description (optional)'}
        </label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={2}
          placeholder={lang === 'ar' ? 'ما الذي تشمله هذه التذكرة؟' : "What's included with this ticket?"}
          className="w-full px-3 py-2 rounded-xl border text-[12px] focus:outline-none resize-none transition-colors"
          style={{ background: 'var(--white)', borderColor: 'var(--bd)', color: 'var(--t1)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--p)')}
          onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
      </div>

      {/* Sale deadline */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
          style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'تاريخ انتهاء البيع (اختياري)' : 'Sales Deadline (optional)'}
        </label>
        <input type="datetime-local" value={form.salesDeadline}
          onChange={e => set('salesDeadline', e.target.value)}
          className={inputCls} style={{ ...inputStyle, width: '220px' }}
          onFocus={e => (e.target.style.borderColor = 'var(--p)')}
          onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 h-9 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-70 transition-opacity"
          style={{ background: 'var(--white)', border: '1px solid var(--bd)', color: 'var(--t2)' }}>
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </button>
        <button type="button" onClick={save}
          disabled={!form.name.trim()}
          className="flex-[2] h-9 rounded-xl text-[12px] font-bold text-white flex items-center justify-center
                     gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          style={{ background: 'var(--p)' }}>
          <Check className="w-3.5 h-3.5" strokeWidth={1.7} />
          {lang === 'ar' ? 'حفظ التذكرة' : 'Save Ticket'}
        </button>
      </div>
    </div>
  )
}

// ─── Ticket card ──────────────────────────────────────────────────────────────
function TicketCard({
  ticket, onEdit, onDelete, lang,
}: {
  ticket: TicketType
  onEdit: () => void
  onDelete: () => void
  lang: DashLang
}) {
  const clr   = TIER_COLORS[ticket.tier]
  const tiers = lang === 'ar' ? TIERS_AR : TIERS_EN
  const tierLabel = tiers.find(t => t.id === ticket.tier)?.label ?? ticket.tier

  return (
    <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl border transition-all"
      style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: clr.bg, border: `1px solid ${clr.border}` }}>
        <Ticket className="w-4 h-4" style={{ color: clr.color }} strokeWidth={1.7} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold truncate" style={{ color: 'var(--t1)' }}>{ticket.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: clr.bg, color: clr.color, border: `1px solid ${clr.border}` }}>
            {tierLabel}
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>
          {ticket.pricing === 'free'
            ? (lang === 'ar' ? 'مجاني' : 'Free')
            : `${ticket.price} ${lang === 'ar' ? 'د.ت' : 'TND'}`
          }
          {' · '}
          {ticket.quantity === 'unlimited'
            ? (lang === 'ar' ? 'غير محدود' : 'Unlimited')
            : `${ticket.quantity} ${lang === 'ar' ? 'مقعد' : 'seats'}`
          }
          {ticket.description && ` · ${ticket.description}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <button type="button" onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:opacity-70"
          style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:opacity-70"
          style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TicketBuilder({ tickets, onChange, lang }: Props) {
  const [formState, setFormState] = useState<'closed' | 'adding' | string>('closed') // string = editing id

  const editingTicket = typeof formState === 'string' && formState !== 'closed' && formState !== 'adding'
    ? tickets.find(t => t.id === formState) ?? null
    : null

  const handleSave = (ticket: TicketType) => {
    if (editingTicket) {
      onChange(tickets.map(t => t.id === ticket.id ? ticket : t))
    } else {
      onChange([...tickets, ticket])
    }
    setFormState('closed')
  }

  const handleDelete = (id: string) => onChange(tickets.filter(t => t.id !== id))

  const showForm = formState !== 'closed'

  return (
    <div className="space-y-3">

      {/* Existing tickets */}
      {tickets.length > 0 && (
        <div className="space-y-2">
          {tickets.map(t => (
            <TicketCard key={t.id} ticket={t} lang={lang}
              onEdit={() => setFormState(t.id)}
              onDelete={() => handleDelete(t.id)} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {tickets.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed flex flex-col items-center justify-center py-8 gap-2"
          style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--p2)' }}>
            <Ticket className="w-5 h-5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
          </div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--t2)' }}>
            {lang === 'ar' ? 'لا توجد تذاكر بعد' : 'No tickets yet'}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
            {lang === 'ar' ? 'أضف أنواع التذاكر أدناه' : 'Add your first ticket type below'}
          </p>
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <TicketForm
          initial={editingTicket}
          onSave={handleSave}
          onCancel={() => setFormState('closed')}
          lang={lang} />
      )}

      {/* Add button */}
      {!showForm && (
        <button type="button" onClick={() => setFormState('adding')}
          className="w-full h-10 rounded-xl border-2 border-dashed flex items-center justify-center gap-2
                     text-[12px] font-semibold cursor-pointer transition-all hover:opacity-80"
          style={{ borderColor: 'var(--p3)', color: 'var(--p)', background: 'var(--p2)' }}>
          <Plus className="w-4 h-4" strokeWidth={1.7} />
          {lang === 'ar' ? 'إضافة نوع تذكرة' : 'Add Ticket Type'}
        </button>
      )}
    </div>
  )
}
