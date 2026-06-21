import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import { Calendar, MapPin, Globe, Users } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const EVENT_TYPE_CONFIG = {
  'online':    { label: 'Online',    labelAr: 'أونلاين',  bg: '#ede9ff', color: '#8e78fb' },
  'in-person': { label: 'In-Person', labelAr: 'حضوري',    bg: '#ede9ff', color: '#6c52f0' },
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
        <h1 className="text-2xl font-bold" style={{ color: '#1a1730' }}>
          {community.name} {isAr ? 'أحداث' : 'Events'}
        </h1>
        <p className="mt-1" style={{ color: '#9590b8' }}>
          {isAr ? 'انضم للأحداث القادمة وتواصل مع المجتمع' : 'Join upcoming events and connect with the community'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6 border-b" style={{ borderColor: '#e8e4ff' }}>
        <div className="flex gap-6">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className="pb-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: i === 0 ? '#8e78fb' : 'transparent',
                color: i === 0 ? '#1a1730' : '#9590b8',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Event Rows */}
      <div className="rounded-xl overflow-hidden divide-y" style={{ border: '1px solid #e8e4ff', background: '#fff', divideColor: '#e8e4ff' }}>
        {community.events.map((event) => {
          const typeConf = EVENT_TYPE_CONFIG[event.type]
          const attending = event.ticketsSold
          return (
            <div key={event.id} className="flex gap-5 p-5">
              {/* Thumbnail — 16:9 */}
              <div className="flex-shrink-0 w-[240px] aspect-video rounded-xl flex items-center justify-center" style={{ background: '#f7f7fe' }}>
                <Calendar className="w-10 h-10" style={{ color: '#c4b8fd' }} />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    {event.type === 'online' ? (
                      <Globe className="w-3 h-3" style={{ color: typeConf.color }} />
                    ) : (
                      <MapPin className="w-3 h-3" style={{ color: typeConf.color }} />
                    )}
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: typeConf.bg, color: typeConf.color }}>
                      {isAr ? typeConf.labelAr : typeConf.label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mt-1.5 truncate" style={{ color: '#1a1730' }}>
                    {event.title}
                  </h3>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9590b8' }}>
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: '#9590b8' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {event.date}
                    </span>
                    <span>{event.time}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {attending} {isAr ? 'حاضر' : 'Attending'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    {event.price === 'free' || event.price === 0 ? (
                      <span className="text-sm font-medium" style={{ color: '#8e78fb' }}>{isAr ? 'مجاني' : 'Free'}</span>
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: '#1a1730' }}>
                        {event.price} {event.currency || 'TND'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-sm hover:underline" style={{ color: '#9590b8' }}>
                      {isAr ? 'أضف للتقويم' : 'Add to Calendar'}
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
                      style={{ background: event.registered ? '#9590b8' : '#8e78fb' }}
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
