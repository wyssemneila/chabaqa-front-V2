import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity } from '@/lib/community-data'
import { Star, Clock, Video, Users, Calendar as CalendarIcon } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

export default async function SessionsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Sessions list — vertical cards like screenshot */}
      <div className="flex flex-col gap-5">
        {community.sessions.map((session) => (
          <Link key={session.id} href={`/communities/${slug}/sessions/${session.id}`} className="rounded-xl overflow-hidden block hover:shadow-lg transition-shadow" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>

            {/* Thumbnail — 16:9 */}
            <div className="w-full h-[200px] relative" style={{ background: '#f7f7fe' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(142,120,251,0.1)' }}>
                  <Video className="w-6 h-6" style={{ color: '#c4b8fd' }} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: '#ede9ff', color: '#8e78fb' }}>
                  {session.category === 'general' ? 'General' : session.category}
                </span>
              </div>

              <h3 className="text-lg font-bold" style={{ color: '#1a1730' }}>
                {session.title}
              </h3>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#9590b8' }}>
                {session.description || (isAr
                  ? 'جلسة استراتيجية المحتوى نبني مع بعض خطة محتوى كاملة تناسب مجالك وجمهورك'
                  : `Book a ${session.duration}-minute session with ${session.mentorName}`)}
              </p>

              {/* Mentor + Rating */}
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: session.mentorColor }}>
                  {session.mentorInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1a1730' }}>{session.mentorName}</p>
                  <p className="text-xs" style={{ color: '#9590b8' }}>Mentor</p>
                </div>
                <div className="ml-4 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold" style={{ color: '#1a1730' }}>{session.rating}</span>
                </div>
                <span className="text-xs" style={{ color: '#9590b8' }}>
                  {session.reviewsCount} {isAr ? 'تقييم' : 'reviews'}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-5 mt-4 text-sm" style={{ color: '#9590b8' }}>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {session.duration} {isAr ? 'دقيقة' : 'minutes'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Video className="w-4 h-4" /> {isAr ? 'مكالمة فيديو' : 'Video call'}
                </span>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mt-3">
                {(session.tags || ['Mentorship', '1-on-1']).map(tag => (
                  <span key={String(tag)} className="text-xs px-3 py-1 rounded-full" style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                    {String(tag)}
                  </span>
                ))}
              </div>

              {/* Divider */}
              <div className="my-4" style={{ borderTop: '1px solid #e8e4ff' }} />

              {/* Price + Actions */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: '#8e78fb' }}>
                  {session.price} <span className="text-base font-medium">{session.currency}</span>
                </span>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg" style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                    <Star className="w-4 h-4" style={{ color: '#9590b8' }} />
                    {isAr ? 'التقييمات' : 'View Reviews'}
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-lg text-white"
                    style={{ background: session.booked ? '#9590b8' : '#f65887' }}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    {session.booked
                      ? (isAr ? 'محجوز' : 'Booked')
                      : (isAr ? 'احجز جلسة' : 'Book Session')}
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
