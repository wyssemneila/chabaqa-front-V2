import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  Search, MessageSquare, Crown, Shield, UserCheck,
  Users,
} from 'lucide-react'
import { getCommunity, ROLE_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function MembersPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const allMembers = community.members

  return (
    <div className="flex flex-col gap-6">

      {/* ── HEADER ──────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isAr ? 'الأعضاء' : 'Members'}
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            {community.membersCount} {isAr ? 'عضو' : 'members'}
          </p>
        </div>
      </div>

      {/* ── SEARCH ──────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" strokeWidth={1.8} />
        <input
          type="text"
          placeholder={isAr ? 'ابحث عن عضو...' : 'Search members...'}
          readOnly
          className="w-full h-11 pl-10 pr-4 rounded-xl text-[13px] bg-white text-gray-700 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-gray-300 cursor-pointer transition-colors"
        />
      </div>

      {/* ── MEMBER LIST ─────────────────────────── */}
      {allMembers.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1.3} />
          <p className="text-sm text-gray-500">{isAr ? 'لا يوجد أعضاء بعد' : 'No members yet'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {allMembers.map(member => {
            const rc = ROLE_CONFIG[member.role]
            return (
              <div key={member.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">

                {/* Avatar — large, round, colored */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                  style={{ background: member.color }}>
                  {member.initials}
                </div>

                {/* Name + handle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">
                      {member.name}
                    </p>
                    {member.isYou && (
                      <span className="text-[11px] text-gray-400 font-normal">
                        ({isAr ? 'أنت' : 'You'})
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">@{member.handle}</p>
                </div>

                {/* Role badge */}
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-md flex-shrink-0"
                  style={{ color: rc.color, background: rc.bg }}>
                  {isAr ? rc.labelAr : rc.label}
                </span>

                {/* Chat button */}
                {!member.isYou && (
                  <button className="h-9 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 transition-colors flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {isAr ? 'محادثة' : 'Chat'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
