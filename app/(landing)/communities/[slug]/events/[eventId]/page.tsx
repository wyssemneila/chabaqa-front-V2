import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity } from '@/lib/community-data'
import {
  ArrowLeft, Calendar, Clock, MapPin, Globe, Users, Ticket,
  Info, CheckCircle2, ShieldCheck,
} from 'lucide-react'

interface Props { params: Promise<{ slug: string; eventId: string }> }

const TYPE_CONFIG = {
  online:      { label: 'Online',    labelAr: 'أونلاين', icon: Globe,  color: '#8e78fb', bg: '#ede9ff' },
  'in-person': { label: 'In-Person', labelAr: 'حضوري',   icon: MapPin, color: '#f59e0b', bg: '#fef3c7' },
}

export default async function EventDetailPage({ params }: Props) {
  const { slug, eventId } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const event = community.events.find((e) => e.id === eventId)
  if (!event) notFound()
  const isAr = locale === 'ar'

  const cfg = TYPE_CONFIG[event.type]
  const TypeIcon = cfg.icon
  const free = event.price === 'free' || event.price === 0
  const spotsLeft = event.ticketsTotal - event.ticketsSold

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back */}
      <Link href={`/communities/${slug}/events`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition-colors hover:text-[#8e78fb]"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr ? 'العودة للفعاليات' : 'Back to events'}
      </Link>

      {/* Compact header */}
      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        <div className="flex items-start gap-4 flex-wrap">
          {/* Event icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
               style={{ background: cfg.bg }}>
            <TypeIcon className="w-7 h-7" style={{ color: cfg.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                <TypeIcon className="w-3 h-3" />
                {isAr ? cfg.labelAr : cfg.label}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: free ? '#d1fae5' : '#ede9ff', color: free ? '#10b981' : '#8e78fb' }}>
                {free ? (isAr ? 'مجاني' : 'Free') : `${event.price} ${event.currency || 'TND'}`}
              </span>
              {event.registered && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#d1fae5', color: '#10b981' }}>
                  ✓ {isAr ? 'مسجّل' : 'Registered'}
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: '#1a1730' }}>
              {event.title}
            </h1>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip icon={<Calendar className="w-3 h-3" />} value={event.date} />
          <StatChip icon={<Clock className="w-3 h-3" />} value={event.time} />
          <StatChip icon={<Users className="w-3 h-3" />} value={spotsLeft} label={isAr ? 'متبقي' : 'spots left'} />
          <StatChip icon={<Ticket className="w-3 h-3" />} value={event.ticketsSold} label={isAr ? 'مسجّل' : 'registered'} />
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* LEFT — Main */}
        <div className="space-y-4">
          {/* Description */}
          <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: '#8e78fb' }}>
                <Info className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[17px] font-bold" style={{ color: '#1a1730' }}>
                {isAr ? 'حول الفعالية' : 'About this event'}
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: '#6b6885' }}>
              {event.description}
            </p>
          </div>

          {/* What to expect */}
          <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: '#ede9ff' }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: '#8e78fb' }} />
              </div>
              <h2 className="text-[17px] font-bold" style={{ color: '#1a1730' }}>
                {isAr ? 'ماذا تتوقع' : 'What to expect'}
              </h2>
            </div>
            <ul className="space-y-2">
              {[
                isAr ? 'محتوى تفاعلي مباشر' : 'Live interactive content',
                isAr ? 'جلسة أسئلة وأجوبة' : 'Q&A session',
                isAr ? 'التواصل مع أعضاء المجتمع' : 'Networking with community members',
                isAr ? 'موارد ومواد إضافية' : 'Resources and follow-up materials',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color: '#6b6885' }}>
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#8e78fb' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          {/* Register card */}
          {!event.registered && (
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
              <div className="text-center mb-3">
                <p className="text-[24px] font-bold" style={{ color: free ? '#10b981' : '#8e78fb' }}>
                  {free ? (isAr ? 'مجاني' : 'Free') : `${event.price} ${event.currency || 'TND'}`}
                </p>
              </div>
              <button className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: '#8e78fb' }}>
                <Ticket className="w-4 h-4" />
                {free ? (isAr ? 'سجّل مجاناً' : 'Register free') : (isAr ? 'احجز الآن' : 'Book now')}
              </button>
              <div className="mt-3 flex items-center gap-2 justify-center text-[11px]" style={{ color: '#9590b8' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'تأكيد فوري' : 'Instant confirmation'}
              </div>
            </div>
          )}

          {/* Event details */}
          <MutedCard title={isAr ? 'تفاصيل الفعالية' : 'Event details'} icon={<Calendar className="w-3.5 h-3.5" />}>
            <div className="space-y-2">
              <InfoRow label={isAr ? 'التاريخ' : 'Date'} value={event.date} />
              <InfoRow label={isAr ? 'الوقت' : 'Time'} value={event.time} />
              <InfoRow label={isAr ? 'النوع' : 'Format'} value={isAr ? cfg.labelAr : cfg.label} />
              <InfoRow label={isAr ? 'السعة' : 'Capacity'} value={`${event.ticketsTotal}`} />
              <InfoRow label={isAr ? 'متبقي' : 'Spots left'} value={`${spotsLeft}`} />
            </div>
          </MutedCard>

          {/* Organizer */}
          <MutedCard title={isAr ? 'المنظم' : 'Organizer'} icon={<Users className="w-3.5 h-3.5" />}>
            <p className="text-[12px] font-semibold" style={{ color: '#46426a' }}>{community.creatorName}</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#9590b8' }}>{community.name}</p>
          </MutedCard>
        </div>
      </div>
    </div>
  )
}

function StatChip({ icon, value, label, iconColor }:
  { icon: React.ReactNode; value: string | number; label?: string; iconColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium"
          style={{ background: 'rgba(142,120,251,0.1)', color: '#8e78fb' }}>
      <span style={{ color: iconColor || '#8e78fb' }}>{icon}</span>
      <span className="font-bold">{value}</span>
      {label && <span className="opacity-75">{label}</span>}
    </span>
  )
}

function MutedCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#f6f5fb' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: '#9590b8' }}>{icon}</span>
        <h3 className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: '#9590b8' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: '#9590b8' }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: '#46426a' }}>{value}</span>
    </div>
  )
}
