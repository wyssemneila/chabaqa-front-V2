import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { MessageSquare, Shield, Users, Crown } from 'lucide-react'
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>{isAr ? 'الأعضاء' : 'Members'}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'تواصل مع أعضاء مجتمع' : `Connect with people in ${community.name}`}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: community.members.length, label: isAr ? 'عضو' : 'Members', color: 'var(--p)', icon: <Users className="w-4 h-4" strokeWidth={1.7} /> },
          { value: owners.length, label: isAr ? 'مالك' : 'Owner', color: 'var(--p)', icon: <Crown className="w-4 h-4" strokeWidth={1.7} /> },
          { value: admins.length, label: isAr ? 'مشرف' : 'Admins', color: 'var(--orange)', icon: <Shield className="w-4 h-4" strokeWidth={1.7} /> },
          { value: mods.length, label: isAr ? 'محرر' : 'Mods', color: 'var(--cyan)', icon: <Shield className="w-4 h-4" strokeWidth={1.7} /> },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl flex-shrink-0" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--t3)' }}>
            {isAr ? `عرض ${community.members.length} من ${community.members.length} عضو` : `Showing ${community.members.length} of ${community.members.length} members`}
          </p>
        </div>
        <div>
          {community.members.map((member, idx) => {
            const role = ROLE_CONFIG[member.role]
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--bg)]"
                style={{ borderTop: idx > 0 ? '1px solid var(--bd)' : 'none' }}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0" style={{ background: member.color }}>
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{member.name}</p>
                    {member.isYou && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--p2)', color: 'var(--p)' }}>{isAr ? 'أنت' : 'You'}</span>
                    )}
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: role.bg, color: role.color }}>
                      {isAr ? role.labelAr : role.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>@{member.handle}</p>
                </div>
                <div className="flex-shrink-0">
                  {member.isYou ? (
                    <button className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80" style={{ background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                      {isAr ? 'مغادرة' : 'Quit'}
                    </button>
                  ) : (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80" style={{ background: 'var(--p2)', color: 'var(--p)', border: '1px solid var(--p3)' }}>
                      <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.7} />
                      {isAr ? 'راسل' : 'DM'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}
