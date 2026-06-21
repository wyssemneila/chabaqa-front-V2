import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import { Star, Clock, Users } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

export default async function SessionsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const tabs = ['All', 'Available', 'Booked']

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? 'الجلسات' : 'Sessions'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAr ? 'احجز جلسة مع مرشد خبير' : 'Book a session with an expert mentor'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-100">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              i === 0
                ? 'border-[#3AAFA9] text-[#3AAFA9]'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Session Rows */}
      <div className="bg-white rounded-xl divide-y divide-gray-100">
        {community.sessions.map((session) => (
          <div key={session.id} className="flex gap-5 p-5">
            {/* Mentor Avatar */}
            <div
              className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: session.mentorColor }}
            >
              {session.mentorInitials}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {session.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{session.mentorName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    {session.rating} ({session.reviewsCount} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {session.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {session.availableSlots} slots available
                  </span>
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-semibold text-gray-900">
                  {session.price} {session.currency}
                </span>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    session.booked
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-[#3AAFA9] text-white'
                  }`}
                >
                  {session.booked
                    ? (isAr ? 'محجوز' : 'Booked')
                    : (isAr ? 'احجز الآن' : 'Book Now')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
