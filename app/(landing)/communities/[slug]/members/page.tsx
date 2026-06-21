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

  // Group members by role
  const roles = ['owner', 'admin', 'moderator', 'member'] as const
  const groupedMembers = roles
    .map((role) => ({
      role,
      config: ROLE_CONFIG[role],
      members: community.members.filter((m) => m.role === role),
    }))
    .filter((g) => g.members.length > 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'الأعضاء' : 'Members'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {community.membersCount} {isAr ? 'عضو' : 'members'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={isAr ? 'ابحث عن عضو...' : 'Search members...'}
          className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-300"
        />
      </div>

      {/* Members by role */}
      {community.members.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isAr ? 'لا يوجد أعضاء بعد' : 'No members yet'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedMembers.map((group) => (
            <div key={group.role}>
              <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {isAr ? group.config.labelAr : group.config.label} ({group.members.length})
              </h2>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0"
                      style={{ background: member.color }}
                    >
                      {member.initials}
                    </div>

                    {/* Name + handle */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 truncate">
                        {member.name}
                        {member.isYou && (
                          <span className="ml-1.5 text-[11px] text-gray-400">
                            ({isAr ? 'أنت' : 'You'})
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-gray-400 truncate">@{member.handle}</p>
                    </div>

                    {/* Role badge */}
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded"
                      style={{ color: group.config.color, background: group.config.bg }}
                    >
                      {isAr ? group.config.labelAr : group.config.label}
                    </span>

                    {/* Chat button */}
                    {!member.isYou && (
                      <button className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {isAr ? 'محادثة' : 'Chat'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
