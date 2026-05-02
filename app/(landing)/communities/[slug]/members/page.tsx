import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { MessageSquare, Shield, Users, Crown, Search } from 'lucide-react'
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
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>
            {isAr ? 'الأعضاء' : 'Members'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
            {isAr ? `تواصل مع أعضاء ${community.name}` : `Connect with people in ${community.name}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: community.members.length, label: isAr ? 'عضو' : 'Members', color: 'var(--p)', bg: 'var(--p2)', icon: <Users className="w-4 h-4" strokeWidth={1.7} /> },
          { value: owners.length, label: isAr ? 'مالك' : 'Owner', color: '#8e78fb', bg: '#ede9ff', icon: <Crown className="w-4 h-4" strokeWidth={1.7} /> },
          { value: admins.length, label: isAr ? 'مشرفون' : 'Admins', color: 'var(--orange, #ff9b28)', bg: '#fff4e5', icon: <Shield className="w-4 h-4" strokeWidth={1.7} /> },
          { value: mods.length, label: isAr ? 'محررون' : 'Mods', color: 'var(--cyan, #47c7ea)', bg: '#e0f7fc', icon: <Shield className="w-4 h-4" strokeWidth={1.7} /> },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
        <input
          type="text"
          placeholder={isAr ? 'ابحث عن عضو…' : 'Search members…'}
          readOnly
          className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm outline-none cursor-pointer"
          style={{ background: 'var(--white)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
        />
      </div>

      {/* Member sections */}
      <div className="flex flex-col gap-4">
        {sections.filter(s => s.show && s.members.length > 0).map(section => (
          <div key={section.title} className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            {/* Section header */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bd)', background: 'var(--bg)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
                {section.title}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--white)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
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
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm"
                      style={{ background: member.color }}>
                      {member.initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{member.name}</p>
                        {member.isYou && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                            {isAr ? 'أنت' : 'You'}
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: role.bg, color: role.color }}>
                          {isAr ? role.labelAr : role.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>@{member.handle}</p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {member.isYou ? (
                        <button className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                          {isAr ? 'مغادرة' : 'Leave'}
                        </button>
                      ) : (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
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

    </div>
  )
}
