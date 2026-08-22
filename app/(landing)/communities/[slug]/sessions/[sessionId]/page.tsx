import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity } from '@/lib/community-data'
import {
  ArrowLeft, Video, Clock, Star, Users, CalendarCheck,
  Info, CheckCircle2, ShieldCheck, MessageSquare,
} from 'lucide-react'

interface Props { params: Promise<{ slug: string; sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { slug, sessionId } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const session = community.sessions.find((s) => s.id === sessionId)
  if (!session) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back */}
      <Link href={`/communities/${slug}/sessions`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition-colors hover:text-[#8e78fb]"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr ? 'العودة للجلسات' : 'Back to sessions'}
      </Link>

      {/* Compact header */}
      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        <div className="flex items-start gap-4 flex-wrap">
          {/* Mentor avatar */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[18px] font-bold text-white shrink-0"
               style={{ background: session.mentorColor }}>
            {session.mentorInitials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#ede9ff', color: '#8e78fb' }}>
                <Video className="w-3 h-3" />
                {isAr ? 'مكالمة فيديو' : 'Video call'}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#ede9ff', color: '#8e78fb' }}>
                {session.duration} {isAr ? 'دقيقة' : 'min'}
              </span>
              {session.booked && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#d1fae5', color: '#10b981' }}>
                  ✓ {isAr ? 'محجوز' : 'Booked'}
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: '#1a1730' }}>
              {session.title}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: '#9590b8' }}>
              {isAr ? 'مع' : 'With'}{' '}
              <span className="font-semibold" style={{ color: '#46426a' }}>{session.mentorName}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip icon={<Clock className="w-3 h-3" />} value={`${session.duration} min`} />
          <StatChip icon={<Star className="w-3 h-3" />} value={session.rating.toFixed(1)} label={`(${session.reviewsCount})`} iconColor="#f59e0b" />
          <StatChip icon={<Users className="w-3 h-3" />} value={session.availableSlots} label={isAr ? 'متبقي' : 'slots left'} />
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* LEFT — Main */}
        <div className="space-y-4">
          {/* About */}
          <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: '#8e78fb' }}>
                <Info className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[17px] font-bold" style={{ color: '#1a1730' }}>
                {isAr ? 'حول الجلسة' : 'About this session'}
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: '#6b6885' }}>
              {isAr
                ? `احجز جلسة ${session.duration} دقيقة مع ${session.mentorName}. جلسة فردية مخصصة لمساعدتك في تحقيق أهدافك.`
                : `Book a ${session.duration}-minute 1-on-1 session with ${session.mentorName}. A personalized mentoring session tailored to help you achieve your goals.`}
            </p>
          </div>

          {/* What's included */}
          <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: '#ede9ff' }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: '#8e78fb' }} />
              </div>
              <h2 className="text-[17px] font-bold" style={{ color: '#1a1730' }}>
                {isAr ? 'ماذا يتضمن' : "What's included"}
              </h2>
            </div>
            <ul className="space-y-2">
              {[
                isAr ? `جلسة فيديو ${session.duration} دقيقة` : `${session.duration}-minute video call`,
                isAr ? 'مراجعة شخصية لعملك' : 'Personalized review of your work',
                isAr ? 'خطة عمل واضحة' : 'Clear action plan',
                isAr ? 'متابعة عبر المجتمع' : 'Follow-up via community',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color: '#6b6885' }}>
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#8e78fb' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Reviews */}
          <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: '#fef3c7' }}>
                <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold" style={{ color: '#1a1730' }}>
                  {isAr ? 'التقييمات' : 'Reviews'}
                </h2>
                <p className="text-[11.5px]" style={{ color: '#9590b8' }}>
                  {session.rating.toFixed(1)} · {session.reviewsCount} {isAr ? 'تقييم' : 'reviews'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5"
                      style={{ color: s <= Math.round(session.rating) ? '#f59e0b' : '#e5e1f5' }}
                      fill={s <= Math.round(session.rating) ? '#f59e0b' : 'none'} />
              ))}
              <span className="ml-2 text-[14px] font-bold" style={{ color: '#1a1730' }}>
                {session.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-[12px]" style={{ color: '#9590b8' }}>
              {isAr ? 'تقييمات من متدربين سابقين' : 'Ratings from previous mentees'}
            </p>
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          {/* Book card */}
          {!session.booked && (
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
              <div className="text-center mb-3">
                <p className="text-[24px] font-bold" style={{ color: '#8e78fb' }}>
                  {session.price} <span className="text-[14px] font-medium">{session.currency}</span>
                </p>
              </div>
              <button className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: '#8e78fb' }}>
                <CalendarCheck className="w-4 h-4" />
                {isAr ? 'احجز جلسة' : 'Book session'}
              </button>
              <div className="mt-3 flex items-center gap-2 justify-center text-[11px]" style={{ color: '#9590b8' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'دفع آمن' : 'Secure checkout'}
              </div>
            </div>
          )}

          {/* Session info */}
          <MutedCard title={isAr ? 'تفاصيل الجلسة' : 'Session details'} icon={<Video className="w-3.5 h-3.5" />}>
            <div className="space-y-2">
              <InfoRow label={isAr ? 'المدة' : 'Duration'} value={`${session.duration} min`} />
              <InfoRow label={isAr ? 'النوع' : 'Format'} value={isAr ? 'مكالمة فيديو' : 'Video call'} />
              <InfoRow label={isAr ? 'الأماكن المتاحة' : 'Available slots'} value={`${session.availableSlots}`} />
              <InfoRow label={isAr ? 'السعر' : 'Price'} value={`${session.price} ${session.currency}`} />
            </div>
          </MutedCard>

          {/* Mentor */}
          <MutedCard title={isAr ? 'المرشد' : 'Mentor'} icon={<Users className="w-3.5 h-3.5" />}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                   style={{ background: session.mentorColor }}>
                {session.mentorInitials}
              </div>
              <div>
                <p className="text-[12px] font-semibold" style={{ color: '#46426a' }}>{session.mentorName}</p>
                <p className="text-[11px]" style={{ color: '#9590b8' }}>{community.name}</p>
              </div>
            </div>
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
