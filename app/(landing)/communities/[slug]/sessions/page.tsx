import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Clock, Star, Video } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function SessionsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'الجلسات' : 'Sessions'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? 'تصفح الجلسات المتاحة' : 'Browse available sessions'}
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 border-b border-gray-100">
        <button className="pb-3 text-[13px] font-medium border-b-2 border-[#3AAFA9] text-[#3AAFA9]">
          {isAr ? 'تصفح الجلسات' : 'Browse Sessions'}
        </button>
        <button className="pb-3 text-[13px] font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
          {isAr ? 'يومي' : 'Daily'}
        </button>
      </div>

      {/* Sessions grid */}
      {community.sessions.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isAr ? 'لا توجد جلسات بعد' : 'No sessions yet'}
          </p>
          <p className="text-[13px] text-gray-500">
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {community.sessions.map((session) => (
            <div key={session.id} className="rounded-xl border border-gray-100 p-5">
              {/* Mentor info */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-semibold"
                  style={{ background: session.mentorColor }}
                >
                  {session.mentorInitials}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">{session.mentorName}</p>
                  <p className="text-[12px] text-gray-500">{session.title}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(session.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="text-[12px] text-gray-500 ml-1">
                  ({session.reviewsCount})
                </span>
              </div>

              {/* Details */}
              <div className="flex items-center gap-4 text-[12px] text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {session.duration} {isAr ? 'دقيقة' : 'min'}
                </span>
                <span>
                  {session.availableSlots} {isAr ? 'مقعد متاح' : 'slots left'}
                </span>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-gray-900">
                  {session.price} {session.currency}
                </span>
                <button
                  className={`text-[12px] font-medium px-4 py-2 rounded-lg ${
                    session.booked
                      ? 'border border-gray-200 text-gray-600'
                      : 'bg-[#3AAFA9] text-white'
                  }`}
                >
                  {session.booked
                    ? (isAr ? 'محجوز' : 'Booked')
                    : (isAr ? 'احجز الآن' : 'Book Now')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
