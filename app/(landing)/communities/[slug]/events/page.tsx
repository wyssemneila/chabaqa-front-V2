import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Calendar, Clock, MapPin, Video, Users } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function EventsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const typeLabel = (type: string) => {
    if (type === 'online') return isAr ? 'أونلاين' : 'Online'
    return isAr ? 'حضوري' : 'In-Person'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? `فعاليات ${community.nameAr}` : `${community.name} Events`}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? 'الفعاليات والورشات القادمة' : 'Upcoming events and workshops'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100">
        {['All', 'Online', 'In-Person'].map((tab, i) => (
          <button
            key={tab}
            className={`pb-3 text-[13px] font-medium border-b-2 transition-colors ${
              i === 0
                ? 'border-[#3AAFA9] text-[#3AAFA9]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {isAr
              ? (tab === 'All' ? 'الكل' : tab === 'Online' ? 'أونلاين' : 'حضوري')
              : tab}
          </button>
        ))}
      </div>

      {/* Events list */}
      {community.events.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isAr ? 'لا توجد فعاليات بعد' : 'No events yet'}
          </p>
          <p className="text-[13px] text-gray-500">
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {community.events.map((event) => {
            const spotsLeft = event.ticketsTotal - event.ticketsSold
            return (
              <div key={event.id} className="py-5 flex gap-5">
                {/* Thumbnail placeholder */}
                <div className="hidden sm:flex w-[220px] h-[140px] rounded-xl bg-gray-50 flex-shrink-0 items-center justify-center">
                  {event.type === 'online' ? (
                    <Video className="w-8 h-8 text-gray-300" />
                  ) : (
                    <MapPin className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className={`text-[11px] font-medium ${
                      event.type === 'online' ? 'text-blue-500' : 'text-orange-500'
                    }`}>
                      {typeLabel(event.type)}
                    </span>
                    <h3 className="text-[15px] font-semibold text-gray-900 mt-1">
                      {event.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-[12px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {spotsLeft} {isAr ? 'مقعد متبقي' : 'spots left'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="text-[12px] text-gray-500 hover:text-gray-700">
                        {isAr ? 'أضف للتقويم' : 'Add to Calendar'}
                      </button>
                      <button
                        className={`text-[12px] font-medium px-4 py-2 rounded-lg ${
                          event.registered
                            ? 'border border-gray-200 text-gray-600'
                            : 'bg-[#3AAFA9] text-white'
                        }`}
                      >
                        {event.registered
                          ? (isAr ? 'مسجّل' : 'Registered')
                          : (isAr ? 'سجّل الآن' : 'RSVP Now')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
