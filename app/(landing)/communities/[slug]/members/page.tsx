import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { MessageSquare, Users, Search } from 'lucide-react'
import { getCommunity, ROLE_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function MembersPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const owners = community.members.filter(m => m.role === 'owner')
  const admins = community.members.filter(m => m.role === 'admin')
  const mods = community.members.filter(m => m.role === 'moderator')
  const regularMembers = community.members.filter(m => m.role === 'member')

  const sections = [
    { title: isAr ? 'المالك' : 'Owner', members: owners, show: owners.length > 0 },
    { title: isAr ? 'المشرفون' : 'Admins', members: admins, show: admins.length > 0 },
    { title: isAr ? 'المحررون' : 'Moderators', members: mods, show: mods.length > 0 },
    { title: isAr ? 'الأعضاء' : 'Members', members: regularMembers, show: true },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
        <input
          type="text"
          placeholder={isAr ? 'ابحث عن عضو…' : 'Search members…'}
          readOnly
          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
          style={{ background: 'var(--white)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
        />
      </div>

      {/* Member sections */}
      {community.members.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--p2)' }}>
            <Users className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا يوجد أعضاء' : 'No members yet'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sections.filter(s => s.show && s.members.length > 0).map(section => (
            <div key={section.title} className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              {/* Section header */}
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bd)', background: 'var(--bg)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
                  {section.title}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--white)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                  {section.members.length}
                </span>
              </div>

              {/* Member rows */}
              <div>
                {section.members.map((member, idx) => {
                  const role = ROLE_CONFIG[member.role]
                  return (
                    <div key={member.id}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg)]"
                      style={{ borderTop: idx > 0 ? '1px solid var(--bd)' : 'none' }}>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                        style={{ background: member.color }}>
                        {member.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{member.name}</p>
                          {member.isYou && (
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                              {isAr ? 'أنت' : 'You'}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: role.bg, color: role.color }}>
                            {isAr ? role.labelAr : role.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>@{member.handle}</p>
                      </div>

                      {/* Action */}
                      <div className="flex-shrink-0">
                        {member.isYou ? (
                          <button className="px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                            style={{ background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                            {isAr ? 'مغادرة' : 'Leave'}
                          </button>
                        ) : (
                          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                            style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.7} />
                            {isAr ? 'راسل' : 'Message'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
