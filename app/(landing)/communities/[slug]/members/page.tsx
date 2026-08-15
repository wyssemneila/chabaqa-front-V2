'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
  Search, MessageSquare, Users, UserPlus, Calendar,
} from 'lucide-react'

interface Member {
  id: string
  name: string
  handle: string
  initials: string
  color: string
  role: 'owner' | 'admin' | 'moderator' | 'member'
  bio: string
  online: boolean
  joinedDate: string
  isYou?: boolean
}

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Wyssem Neila', handle: 'wyssem-neila-7982', initials: 'WN', color: '#f97316', role: 'owner', bio: 'EDIT PROD', online: true, joinedDate: 'Aug 7, 2026', isYou: true },
  { id: '2', name: 'Erwin Ensing', handle: 'erwin-ensing-1741', initials: 'EE', color: '#3b82f6', role: 'admin', bio: 'Hi, I am Erwin online marketer, investor and trader', online: true, joinedDate: 'Jun 26, 2026' },
  { id: '3', name: 'Christelle Christ', handle: 'christ-christ-8723', initials: 'CC', color: '#a855f7', role: 'admin', bio: 'Love helping people', online: true, joinedDate: 'May 12, 2026' },
  { id: '4', name: 'Ahmed Ben Ali', handle: 'ahmed-benali-4521', initials: 'AB', color: '#6c52f0', role: 'member', bio: 'Motion designer & After Effects lover', online: false, joinedDate: 'Jul 18, 2024' },
  { id: '5', name: 'Alaa Elhefnawy', handle: 'alaa-elhefnawy-9012', initials: 'AE', color: '#10b981', role: 'member', bio: 'Community manager & content creator', online: true, joinedDate: 'Jan 3, 2025' },
  { id: '6', name: 'Terrell Gentry', handle: 'terrell-gentry-3344', initials: 'TG', color: '#3b82f6', role: 'member', bio: 'AI automation specialist', online: false, joinedDate: 'Mar 15, 2025' },
  { id: '7', name: 'Ufuk Ekici', handle: 'ufuk-ekici-5566', initials: 'UE', color: '#94a3b8', role: 'member', bio: 'Video production & AI tools', online: false, joinedDate: 'Feb 20, 2025' },
  { id: '8', name: 'Money Lab', handle: 'money-lab-7788', initials: 'ML', color: '#a855f7', role: 'member', bio: 'Digital marketing tips & tricks', online: false, joinedDate: 'Mar 20, 2025' },
]

const ROLE_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  owner: { color: '#dc2626', bg: '#fef2f2', label: 'Owner' },
  admin: { color: '#f59e0b', bg: '#fffbeb', label: 'Admin' },
  moderator: { color: '#8e78fb', bg: '#f4f2fc', label: 'Moderator' },
  member: { color: '#6b7280', bg: '#f9fafb', label: 'Member' },
}

type Filter = 'all' | 'online' | 'admins'

export default function MembersPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const onlineCount = MOCK_MEMBERS.filter(m => m.online).length
  const adminCount = MOCK_MEMBERS.filter(m => m.role === 'owner' || m.role === 'admin').length

  const filtered = MOCK_MEMBERS.filter(m => {
    if (filter === 'online' && !m.online) return false
    if (filter === 'admins' && m.role !== 'owner' && m.role !== 'admin') return false
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Members', count: MOCK_MEMBERS.length },
    { id: 'admins', label: 'Admins', count: adminCount },
    { id: 'online', label: 'Online', count: onlineCount },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Filter tabs + Invite */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="h-9 px-4 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5"
              style={{
                background: filter === f.id ? '#8e78fb' : '#f5f5f5',
                color: filter === f.id ? '#fff' : '#666',
              }}>
              {f.label}
              <span className="text-[11px] font-bold" style={{ opacity: filter === f.id ? 0.85 : 0.6 }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <button className="h-9 px-5 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all hover:opacity-90"
          style={{ background: '#f59e0b', color: '#fff' }}>
          <UserPlus className="w-4 h-4" strokeWidth={2} />
          INVITE
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" strokeWidth={1.8} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full h-11 pl-10 pr-4 rounded-xl text-[13px] bg-white text-gray-700 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-gray-300 transition-colors" />
      </div>

      {/* Member list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1.3} />
          <p className="text-[14px] font-medium text-gray-500">
            {filter === 'online' ? "Nobody's online right now — they'll be back soon!" : "No members found"}
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            {filter === 'online' ? 'Check back in a bit 👋' : 'Try a different search'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white overflow-hidden divide-y" style={{ border: '1px solid #e8e4ff' }}>
          {filtered.map(member => {
            const rc = ROLE_COLORS[member.role]
            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">

                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-bold"
                    style={{ background: member.color }}>
                    {member.initials}
                  </div>
                  {member.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 ring-[3px] ring-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{member.name}</p>
                    {member.isYou && <span className="text-[11px] text-gray-400">(You)</span>}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">@{member.handle}</p>
                  {member.bio && <p className="text-[12.5px] text-gray-600 mt-1">{member.bio}</p>}
                  <div className="flex items-center gap-4 mt-1.5">
                    {member.online && <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online now
                    </span>}
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar className="w-3 h-3" strokeWidth={1.5} /> Joined {member.joinedDate}
                    </span>
                  </div>
                </div>

                {(member.role === 'owner' || member.role === 'admin') && (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-md flex-shrink-0"
                    style={{ color: rc.color, background: rc.bg }}>
                    {rc.label}
                  </span>
                )}

                {!member.isYou && (
                  <button className="h-9 px-3.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 transition-colors flex-shrink-0">
                    CHAT <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.7} />
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
