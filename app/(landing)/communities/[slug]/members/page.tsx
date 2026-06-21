import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  Search, MessageSquare, Crown, Shield, UserCheck,
  Users, MoreHorizontal, Filter,
} from 'lucide-react'
import { getCommunity, ROLE_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function MembersPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const owner = community.members.find(m => m.role === 'owner')
  const admins = community.members.filter(m => m.role === 'admin')
  const mods = community.members.filter(m => m.role === 'moderator')
  const staff = [owner, ...admins, ...mods].filter(Boolean)
  const regularMembers = community.members.filter(m => m.role === 'member')

  const roleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-3 h-3" strokeWidth={2} />
    if (role === 'admin') return <Shield className="w-3 h-3" strokeWidth={2} />
    if (role === 'moderator') return <UserCheck className="w-3 h-3" strokeWidth={2} />
    return null
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── HEADER ────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? 'الأعضاء' : 'Members'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {community.membersCount} {isAr ? 'عضو في المجتمع' : 'people in this community'}
          </p>
        </div>
        {community.isJoined && (
          <button className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90 flex items-center gap-2 flex-shrink-0"
            style={{ background: '#3AAFA9' }}>
            <Users className="w-4 h-4" strokeWidth={2} />
            {isAr ? 'دعوة' : 'Invite'}
          </button>
        )}
      </div>

      {/* ── SEARCH + FILTER ──────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" strokeWidth={1.8} />
          <input
            type="text"
            placeholder={isAr ? 'ابحث بالاسم...' : 'Search by name...'}
            readOnly
            className="w-full h-11 pl-10 pr-4 rounded-xl text-[13px] bg-gray-50 text-gray-700 placeholder:text-gray-400 border border-gray-100 focus:outline-none focus:border-gray-200 cursor-pointer transition-colors"
          />
        </div>
        <button className="h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 text-[13px] font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors flex-shrink-0">
          <Filter className="w-4 h-4" strokeWidth={1.8} />
          {isAr ? 'تصفية' : 'Filter'}
        </button>
      </div>

      {/* ── COMMUNITY TEAM (Owner + Admins + Mods) ── */}
      {staff.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: '#3AAFA9' }} />
            <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">
              {isAr ? 'فريق المجتمع' : 'Community Team'}
            </h2>
            <span className="text-[11px] text-gray-400 font-medium">{staff.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {staff.map(member => {
              if (!member) return null
              const rc = ROLE_CONFIG[member.role]
              return (
                <div key={member.id}
                  className="group flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-all cursor-pointer">

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: member.color }}>
                      {member.initials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white"
                      style={{ background: rc.color }}>
                      {roleIcon(member.role)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">{member.name}</p>
                      {member.isYou && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {isAr ? 'أنت' : 'You'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-gray-400">@{member.handle}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-200" />
                      <span className="text-[11px] font-medium" style={{ color: rc.color }}>
                        {isAr ? rc.labelAr : rc.label}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {!member.isYou && (
                    <button className="h-9 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.8} />
                      {isAr ? 'راسل' : 'Message'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ALL MEMBERS ──────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-gray-300" />
          <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">
            {isAr ? 'الأعضاء' : 'Members'}
          </h2>
          <span className="text-[11px] text-gray-400 font-medium">{regularMembers.length}</span>
        </div>

        {regularMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" strokeWidth={1.3} />
            <p className="text-sm text-gray-500">{isAr ? 'لا يوجد أعضاء بعد' : 'No members yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regularMembers.map(member => (
              <div key={member.id}
                className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-all">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: member.color }}>
                  {member.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-medium text-gray-900 truncate">{member.name}</p>
                    {member.isYou && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                        {isAr ? 'أنت' : 'You'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">@{member.handle}</p>
                </div>

                {/* Action */}
                {!member.isYou && (
                  <button className="w-9 h-9 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-200 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title={isAr ? 'راسل' : 'Message'}>
                    <MessageSquare className="w-4 h-4" strokeWidth={1.7} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
