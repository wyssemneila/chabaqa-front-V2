import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import { Calendar, MapPin, Globe, Users } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const EVENT_TYPE_CONFIG = {
  'online':    { label: 'Online',    labelAr: 'أونلاين',  color: '#3AAFA9' },
  'in-person': { label: 'In-Person', labelAr: 'حضوري',    color: '#8b5cf6' },
}

export default async function EventsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const tabs = ['All', 'Online', 'In-Person']

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {community.name} {isAr ? 'أحداث' : 'Events'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAr ? 'انضم للأحداث القادمة وتواصل مع المجتمع' : 'Join upcoming events and connect with the community'}
        </p>
      </div>

      {/* Tabs + View Toggle */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-100">
        <div className="flex gap-6">
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
        <button className="text-sm text-gray-500 hover:text-gray-700 pb-3">
          {isAr ? 'عرض قائمة' : 'List View'}
        </button>
      </div>

      {/* Event Rows */}
      <div className="bg-white rounded-xl divide-y divide-gray-100">
        {community.events.map((event) => {
          const typeConf = EVENT_TYPE_CONFIG[event.type]
          const attending = event.ticketsSold
          return (
            <div key={event.id} className="flex gap-5 p-5">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-[200px] h-[140px] rounded-xl bg-gray-100 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-gray-300" />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Type badge */}
                  <div className="flex items-center gap-1.5">
                    {event.type === 'online' ? (
                      <Globe className="w-3 h-3" style={{ color: typeConf.color }} />
                    ) : (
                      <MapPin className="w-3 h-3" style={{ color: typeConf.color }} />
                    )}
                    <span className="text-xs font-medium" style={{ color: typeConf.color }}>
                      {isAr ? typeConf.labelAr : typeConf.label}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mt-1 truncate">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {event.date}
                    </span>
                    <span>{event.time}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {attending} Attending
                    </span>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    {event.price === 'free' || event.price === 0 ? (
                      <span className="text-sm font-medium text-green-600">Free</span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {event.price} {event.currency || 'TND'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      {isAr ? 'أضف للتقويم' : 'Add to Calendar'}
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        event.registered
                          ? 'bg-gray-100 text-gray-500'
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
    </div>
  )
}
