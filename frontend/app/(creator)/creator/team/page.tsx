'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { communityAccessApi, type CommunityStaffMember } from '@/lib/api/community-access.api'
import type { CommunityStaffRole } from '@/lib/permissions'
import {
  Users, Shield, UserCheck, Search, Plus, Mail, X, Check,
  ChevronDown, Trash2, MoreHorizontal, Crown, AlertTriangle,
  BookOpen, BarChart2, Settings, Megaphone, MessageSquare,
  Eye, Edit3, Ban, UserPlus, Clock, CheckCircle, XCircle,
  ArrowUpDown,
} from 'lucide-react'

const STAFF_ROLE_META: Record<CommunityStaffRole, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: '#ea580c', bg: '#fff7ed' },
  moderator: { label: 'Moderator', color: '#0891b2', bg: '#f0f9ff' },
  support: { label: 'Support', color: '#16a34a', bg: '#f0fdf4' },
}

const staffName = (member: CommunityStaffMember) => {
  const user = member.user
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  return full || user?.username || user?.email || 'Staff member'
}

const initialsFor = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'ST'

function StaffRoleBadge({ role }: { role: CommunityStaffRole }) {
  const meta = STAFF_ROLE_META[role] || STAFF_ROLE_META.support
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}>
      {meta.label}
    </span>
  )
}

export default function TeamPage() {
  const { lang } = useDashPrefs()
  const { selectedCommunityId, selectedCommunity, isLoading: communityLoading } = useCreatorCommunity()
  const [staff, setStaff] = useState<CommunityStaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  const loadStaff = async () => {
    if (!selectedCommunityId) {
      setStaff([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setStaff(await communityAccessApi.listStaff(selectedCommunityId))
    } catch (err: any) {
      setStaff([])
      setError(err?.message || 'Unable to load team members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityLoading) return
    void loadStaff()
  }, [communityLoading, selectedCommunityId])

  const updateRole = async (member: CommunityStaffMember, role: CommunityStaffRole) => {
    if (!selectedCommunityId || role === member.role) return
    setUpdatingId(member.userId)
    setError('')
    try {
      const updated = await communityAccessApi.updateStaffRole(selectedCommunityId, member.userId, role)
      setStaff(prev => prev.map(item => item.userId === member.userId ? { ...item, ...updated, role } : item))
    } catch (err: any) {
      setError(err?.message || 'Unable to update staff role')
    } finally {
      setUpdatingId('')
    }
  }

  const removeStaff = async (member: CommunityStaffMember) => {
    if (!selectedCommunityId) return
    setUpdatingId(member.userId)
    setError('')
    try {
      await communityAccessApi.removeStaff(selectedCommunityId, member.userId)
      setStaff(prev => prev.filter(item => item.userId !== member.userId))
    } catch (err: any) {
      setError(err?.message || 'Unable to remove staff member')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar title={lang === 'ar' ? 'الفريق' : 'Team'} subtitle={selectedCommunity?.name ? `Backend staff access for ${selectedCommunity.name}` : 'Backend staff access by selected community'} />
        <main id="main-content" className="flex-1 p-6 lg:p-8 space-y-5">
          <div className="rounded-2xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15px] font-black" style={{ color: 'var(--t1)' }}>Staff members</p>
                <p className="mt-1 text-[12px]" style={{ color: 'var(--t3)' }}>Roles are loaded from `/communities/:communityId/staff` and updates call the staff access API.</p>
              </div>
              <button
                type="button"
                onClick={loadStaff}
                disabled={loading || !selectedCommunityId}
                className="h-10 rounded-xl px-4 text-[13px] font-black disabled:opacity-50"
                style={{ background: 'var(--p)', color: '#fff' }}
              >
                Refresh
              </button>
            </div>
          </div>

          {!selectedCommunityId && !communityLoading && (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <p className="text-[15px] font-black" style={{ color: 'var(--t1)' }}>Select a community first</p>
              <p className="mt-2 text-[13px]" style={{ color: 'var(--t3)' }}>Team management is scoped to the active creator community.</p>
            </div>
          )}

          {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] font-semibold text-amber-800">{error}</div>}

          <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            {loading || communityLoading ? (
              <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" /></div>
            ) : staff.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[15px] font-black" style={{ color: 'var(--t1)' }}>No staff members found</p>
                <p className="mt-2 text-[13px]" style={{ color: 'var(--t3)' }}>Invite and assignment actions require a backend user search flow; no demo staff are shown here.</p>
              </div>
            ) : staff.map((member) => {
              const name = staffName(member)
              return (
                <div key={member._id || member.userId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid var(--bd)' }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white" style={{ background: STAFF_ROLE_META[member.role]?.color || '#64748b' }}>
                      {initialsFor(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-black" style={{ color: 'var(--t1)' }}>{name}</p>
                      <p className="truncate text-[12px]" style={{ color: 'var(--t3)' }}>{member.user?.email || member.user?.username || member.userId}</p>
                    </div>
                    <StaffRoleBadge role={member.role} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={member.role}
                      disabled={updatingId === member.userId}
                      onChange={(event) => updateRole(member, event.target.value as CommunityStaffRole)}
                      className="h-10 rounded-xl px-3 text-[13px] font-bold outline-none disabled:opacity-50"
                      style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
                    >
                      {Object.entries(STAFF_ROLE_META).map(([role, meta]) => <option key={role} value={role}>{meta.label}</option>)}
                    </select>
                    <button
                      type="button"
                      disabled={updatingId === member.userId}
                      onClick={() => removeStaff(member)}
                      className="h-10 rounded-xl px-3 text-[12px] font-black disabled:opacity-50"
                      style={{ color: '#dc2626', border: '1px solid #fecaca', background: '#fff1f2' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
