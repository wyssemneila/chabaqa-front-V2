'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  Users, Shield, UserCheck, Search, Plus, Mail, X, Check,
  ChevronDown, Trash2, MoreHorizontal, Crown, AlertTriangle,
  BookOpen, BarChart2, Settings, Megaphone, MessageSquare,
  Eye, Edit3, Ban, UserPlus, Clock, CheckCircle, XCircle,
  ArrowUpDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role    = 'owner' | 'admin' | 'moderator' | 'member'
type Tab     = 'all' | 'admin' | 'moderator' | 'member'
type SortKey = 'name' | 'role' | 'joined' | 'lastActive'

interface Member {
  id: string
  name: string
  email: string
  handle: string
  role: Role
  joined: string
  lastActive: string
  status: 'active' | 'inactive'
  color: string
  initials: string
}

interface Invite {
  id: string
  email: string
  role: Exclude<Role, 'owner'>
  sentAt: string
  status: 'pending' | 'accepted' | 'expired'
}

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  owner:     { label: 'Owner',     color: '#7c3aed', bg: '#f3f0ff', border: '#d8b4fe', icon: <Crown      className="w-3 h-3" strokeWidth={1.7} /> },
  admin:     { label: 'Admin',     color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: <Shield     className="w-3 h-3" strokeWidth={1.7} /> },
  moderator: { label: 'Moderator', color: '#0891b2', bg: '#f0f9ff', border: '#bae6fd', icon: <UserCheck  className="w-3 h-3" strokeWidth={1.7} /> },
  member:    { label: 'Member',    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: <Users      className="w-3 h-3" strokeWidth={1.7} /> },
}

// ─── Permissions matrix ───────────────────────────────────────────────────────

const PERMISSIONS = [
  { id: 'manage_content',  label: 'Manage Content',       desc: 'Create, edit, delete courses, events, challenges',  owner: true,  admin: true,  moderator: false, member: false },
  { id: 'view_analytics',  label: 'View Analytics',       desc: 'Access community analytics and revenue reports',    owner: true,  admin: true,  moderator: false, member: false },
  { id: 'send_broadcasts', label: 'Send Broadcasts',       desc: 'Send messages to all or segmented members',         owner: true,  admin: true,  moderator: false, member: false },
  { id: 'manage_members',  label: 'Manage Members',        desc: 'Invite members, change roles below their own',      owner: true,  admin: true,  moderator: true,  member: false },
  { id: 'moderate',        label: 'Moderate Content',      desc: 'Remove comments, warn or mute members',            owner: true,  admin: true,  moderator: true,  member: false },
  { id: 'invite_members',  label: 'Invite Members',        desc: 'Send invitations to join the community',           owner: true,  admin: true,  moderator: true,  member: false },
  { id: 'access_revenue',  label: 'Access Revenue Data',   desc: 'View payouts, subscriptions, and payment history', owner: true,  admin: false, moderator: false, member: false },
  { id: 'edit_settings',   label: 'Edit Settings',         desc: 'Change community name, branding, integrations',   owner: true,  admin: false, moderator: false, member: false },
  { id: 'manage_courses',  label: 'Manage Courses',        desc: 'Edit curriculum, add lessons, manage enrollments', owner: true,  admin: true,  moderator: false, member: false },
  { id: 'create_automations', label: 'Create Automations', desc: 'Set up automated messages and workflows',          owner: true,  admin: true,  moderator: false, member: false },
]

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_MEMBERS: Member[] = [
  { id: 'm0',  name: 'You (Creator)',    email: 'creator@chabaqa.com',      handle: '@motionmaster', role: 'owner',     joined: '2024-09-01', lastActive: 'Today',     status: 'active',   color: '#7c3aed', initials: 'MC' },
  { id: 'm1',  name: 'Sarra Mansour',   email: 'sarra.m@gmail.com',        handle: '@sarram',       role: 'admin',     joined: '2024-09-15', lastActive: 'Today',     status: 'active',   color: '#ea580c', initials: 'SM' },
  { id: 'm2',  name: 'Yassine Belhaj',  email: 'yassine.b@outlook.com',    handle: '@yassineb',     role: 'admin',     joined: '2024-10-01', lastActive: '2 days ago', status: 'active',  color: '#0891b2', initials: 'YB' },
  { id: 'm3',  name: 'Ines Trabelsi',   email: 'ines.t@gmail.com',         handle: '@inest',        role: 'moderator', joined: '2024-11-05', lastActive: 'Today',     status: 'active',   color: '#db2777', initials: 'IT' },
  { id: 'm4',  name: 'Khalil Oueslati', email: 'khalil.o@proton.me',       handle: '@khalilo',      role: 'moderator', joined: '2025-01-12', lastActive: 'Yesterday', status: 'active',   color: '#16a34a', initials: 'KO' },
  { id: 'm5',  name: 'Nour Ben Ali',    email: 'nour.ba@gmail.com',        handle: '@nourba',       role: 'moderator', joined: '2025-02-20', lastActive: '3 days ago', status: 'active',  color: '#6366f1', initials: 'NB' },
  { id: 'm6',  name: 'Amira Chatti',    email: 'amira.c@gmail.com',        handle: '@amirac',       role: 'member',    joined: '2025-01-08', lastActive: 'Today',     status: 'active',   color: '#d97706', initials: 'AC' },
  { id: 'm7',  name: 'Tarek Hamdi',     email: 'tarek.h@yahoo.com',        handle: '@tarekh',       role: 'member',    joined: '2025-02-14', lastActive: '1 week ago', status: 'inactive',color: '#64748b', initials: 'TH' },
  { id: 'm8',  name: 'Rania Ferjani',   email: 'rania.f@gmail.com',        handle: '@raniaf',       role: 'member',    joined: '2025-03-01', lastActive: 'Today',     status: 'active',   color: '#0891b2', initials: 'RF' },
  { id: 'm9',  name: 'Malek Sassi',     email: 'malek.s@gmail.com',        handle: '@maleks',       role: 'member',    joined: '2025-03-10', lastActive: '5 days ago', status: 'active',  color: '#7c3aed', initials: 'MS' },
  { id: 'm10', name: 'Dorra Rekik',     email: 'dorra.r@outlook.com',      handle: '@dorrar',       role: 'member',    joined: '2025-03-22', lastActive: '2 weeks ago',status: 'inactive',color: '#db2777', initials: 'DR' },
  { id: 'm11', name: 'Bilel Gharbi',    email: 'bilel.g@gmail.com',        handle: '@bilelg',       role: 'member',    joined: '2025-04-01', lastActive: 'Yesterday', status: 'active',   color: '#ea580c', initials: 'BG' },
  { id: 'm12', name: 'Syrine Mrad',     email: 'syrine.m@gmail.com',       handle: '@syrinem',      role: 'member',    joined: '2025-04-03', lastActive: 'Today',     status: 'active',   color: '#16a34a', initials: 'SM' },
  { id: 'm13', name: 'Aymen Khaled',    email: 'aymen.k@outlook.com',      handle: '@aymenk',       role: 'member',    joined: '2025-04-10', lastActive: 'Today',     status: 'active',   color: '#6366f1', initials: 'AK' },
  { id: 'm14', name: 'Leila Mansouri',  email: 'leila.mn@gmail.com',       handle: '@leilam',       role: 'member',    joined: '2025-05-05', lastActive: '4 days ago', status: 'active',  color: '#d97706', initials: 'LM' },
  { id: 'm15', name: 'Mohamed Trabelsi',email: 'mo.trabelsi@gmail.com',    handle: '@motrabl',      role: 'member',    joined: '2025-06-18', lastActive: 'Today',     status: 'active',   color: '#0891b2', initials: 'MT' },
]

const INIT_INVITES: Invite[] = [
  { id: 'i1', email: 'rafik.b@gmail.com',    role: 'moderator', sentAt: 'Apr 2, 2026', status: 'pending'  },
  { id: 'i2', email: 'hela.bouzid@gmail.com', role: 'member',   sentAt: 'Apr 1, 2026', status: 'pending'  },
  { id: 'i3', email: 'slim.jrad@yahoo.com',   role: 'admin',    sentAt: 'Mar 28, 2026',status: 'expired'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useLocalList<T>(key: string, init: T[]): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const [list, setList] = useState<T[]>(() => {
    if (typeof window === 'undefined') return init
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : init } catch { return init }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(list)) } catch { /* */ } }, [key, list])
  return [list, setList]
}

function RoleBadge({ role, size = 'md' }: { role: Role; size?: 'sm' | 'md' }) {
  const m = ROLE_META[role]
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{
        background: m.bg, color: m.color, border: `1px solid ${m.border}`,
        fontSize: size === 'sm' ? 10 : 11,
        padding: size === 'sm' ? '2px 7px' : '3px 9px',
      }}>
      {m.icon}
      {m.label}
    </span>
  )
}

// ─── Role change modal ────────────────────────────────────────────────────────

function RoleChangeModal({ member, onClose, onConfirm }: {
  member: Member
  onClose: () => void
  onConfirm: (id: string, role: Role) => void
}) {
  const [selected, setSelected] = useState<Role>(member.role)
  const changeable: Role[] = ['admin', 'moderator', 'member']

  const isPromotion = (from: Role, to: Role) => {
    const order: Role[] = ['member', 'moderator', 'admin', 'owner']
    return order.indexOf(to) > order.indexOf(from)
  }

  const gained = selected !== member.role
    ? PERMISSIONS.filter(p => p[selected] && !p[member.role as keyof typeof p])
    : []
  const lost = selected !== member.role
    ? PERMISSIONS.filter(p => !p[selected] && p[member.role as keyof typeof p])
    : []

  const promoting = selected !== member.role && isPromotion(member.role, selected)
  const demoting  = selected !== member.role && !isPromotion(member.role, selected)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-[440px] rounded-2xl"
        style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: member.color }}>
              {member.initials}
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Change Role</p>
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{member.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'var(--t3)' }}>
            <X className="w-4 h-4" strokeWidth={1.7} />
          </button>
        </div>

        {/* Role selector */}
        <div className="px-6 pt-5 pb-3">
          <p className="text-[12px] font-medium mb-2.5" style={{ color: 'var(--t2)' }}>Select new role</p>
          <div className="grid grid-cols-3 gap-2">
            {changeable.map(r => {
              const m = ROLE_META[r]
              const active = selected === r
              const isCurrent = member.role === r
              return (
                <button key={r} onClick={() => setSelected(r)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl cursor-pointer transition-all text-center relative"
                  style={{
                    border: `1.5px solid ${active ? m.color : 'var(--bd)'}`,
                    background: active ? m.bg : 'var(--bg)',
                  }}>
                  {isCurrent && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 rounded"
                      style={{ background: 'var(--p2)', color: 'var(--p)' }}>now</span>
                  )}
                  <span style={{ color: m.color }}>{m.icon}</span>
                  <p className="text-[11px] font-semibold" style={{ color: active ? m.color : 'var(--t1)' }}>{m.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Permissions diff */}
        {selected !== member.role && (
          <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--bd)' }}>
            {gained.length > 0 && (
              <div className="px-4 py-3" style={{ background: '#f0fdf4' }}>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: '#16a34a' }}>
                  {promoting ? '✓ Will gain access to' : '✓ Keeps access to'}
                </p>
                {gained.map(p => (
                  <div key={p.id} className="flex items-start gap-1.5 text-[11px] mb-0.5" style={{ color: '#166534' }}>
                    <Check className="w-3 h-3 shrink-0 mt-px" strokeWidth={1.7} />
                    <span><span className="font-medium">{p.label}</span> — {p.desc}</span>
                  </div>
                ))}
              </div>
            )}
            {lost.length > 0 && (
              <div className="px-4 py-3" style={{ background: '#fff1f2', borderTop: gained.length > 0 ? '1px solid var(--bd)' : 'none' }}>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: '#dc2626' }}>
                  ✕ This member will lose access to
                </p>
                {lost.map(p => (
                  <div key={p.id} className="flex items-start gap-1.5 text-[11px] mb-0.5" style={{ color: '#991b1b' }}>
                    <X className="w-3 h-3 shrink-0 mt-px" strokeWidth={1.7} />
                    <span><span className="font-medium">{p.label}</span> — {p.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Same role notice */}
        {selected === member.role && (
          <div className="mx-6 mb-4 px-4 py-3 rounded-xl text-[12px]"
            style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t3)' }}>
            Select a different role to see permission changes.
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t2)' }}>
            Cancel
          </button>
          <button
            onClick={() => { if (selected !== member.role) { onConfirm(member.id, selected); onClose() } }}
            disabled={selected === member.role}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: demoting ? '#dc2626' : 'var(--p)',
              color: '#fff',
            }}>
            {demoting ? 'Confirm & Remove Permissions' : 'Confirm & Apply Role'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Role picker trigger ──────────────────────────────────────────────────────

function RolePicker({ current, memberId, member, onSave }: {
  current: Role; memberId: string; member: Member; onSave: (id: string, r: Role) => void
}) {
  const [open, setOpen] = useState(false)

  if (current === 'owner') return <RoleBadge role="owner" />

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
        <RoleBadge role={current} />
        <ChevronDown className="w-3 h-3" style={{ color: ROLE_META[current].color }} strokeWidth={1.7} />
      </button>
      {open && (
        <RoleChangeModal
          member={member}
          onClose={() => setOpen(false)}
          onConfirm={onSave}
        />
      )}
    </>
  )
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose, onSend }: {
  onClose: () => void
  onSend: (email: string, role: Exclude<Role, 'owner'>) => void
}) {
  const [email,   setEmail]   = useState('')
  const [role,    setRole]    = useState<Exclude<Role, 'owner'>>('member')
  const [sending, setSending] = useState(false)
  const [done,    setDone]    = useState(false)

  const submit = () => {
    if (!email.trim() || !email.includes('@')) return
    setSending(true)
    setTimeout(() => { setSending(false); setDone(true); setTimeout(() => { onSend(email.trim(), role); onClose() }, 1000) }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-[440px] rounded-2xl"
        style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--p2)' }}>
              <UserPlus className="w-3.5 h-3.5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
            </div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Invite Team Member</p>
          </div>
          <button onClick={onClose} className="cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'var(--t3)' }}>
            <X className="w-4 h-4" strokeWidth={1.7} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--t2)' }}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
                placeholder="member@email.com"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] outline-none"
                style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)', transition: 'border-color .15s' }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--p)' }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'var(--bd)' }} />
            </div>
          </div>
          {/* Role */}
          <div>
            <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--t2)' }}>Assign Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'moderator', 'member'] as const).map(r => {
                const m = ROLE_META[r]
                return (
                  <button key={r} onClick={() => setRole(r)}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl cursor-pointer transition-all text-center"
                    style={{
                      border: `1.5px solid ${role === r ? m.color : 'var(--bd)'}`,
                      background: role === r ? m.bg : 'var(--bg)',
                    }}>
                    <span style={{ color: m.color }}>{m.icon}</span>
                    <p className="text-[11px] font-semibold" style={{ color: role === r ? m.color : 'var(--t1)' }}>{m.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
          {/* Role description */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
            <p className="text-[11px] font-semibold mb-1" style={{ color: ROLE_META[role].color }}>{ROLE_META[role].label} permissions:</p>
            <div className="space-y-0.5">
              {PERMISSIONS.filter(p => p[role]).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--t2)' }}>
                  <Check className="w-3 h-3 shrink-0" style={{ color: '#16a34a' }} strokeWidth={1.7} />
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl text-[12px] font-medium cursor-pointer hover:opacity-70"
            style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={!email.trim() || !email.includes('@') || sending}
            className="flex-1 h-10 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
            style={{
              background: done ? '#16a34a' : 'var(--p)', color: '#fff',
              opacity: (!email.trim() || !email.includes('@') || sending) ? .5 : 1,
            }}>
            {done
              ? <span className="flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" strokeWidth={1.7} /> Invited!</span>
              : sending
              ? <span className="flex items-center justify-center gap-1.5"><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</span>
              : <span className="flex items-center justify-center gap-1.5"><Mail className="w-3.5 h-3.5" strokeWidth={1.7} /> Send Invitation</span>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Remove confirm modal ─────────────────────────────────────────────────────

function RemoveModal({ member, onClose, onConfirm }: {
  member: Member; onClose: () => void; onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-[380px] rounded-2xl p-6"
        style={{ background: 'var(--white)', border: '1.5px solid #fca5a5', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#fee2e2' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} strokeWidth={1.7} />
          </div>
          <p className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>Remove Member</p>
        </div>
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--t2)' }}>
          Are you sure you want to remove <strong style={{ color: 'var(--t1)' }}>{member.name}</strong> from the community?
          They will lose access to all content and their role will be revoked.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl text-[12px] font-medium cursor-pointer hover:opacity-70"
            style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 h-10 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-85"
            style={{ background: '#dc2626', color: '#fff' }}>
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [members, setMembers] = useLocalList<Member>('chabaq_team', INIT_MEMBERS)
  const [invites, setInvites] = useLocalList<Invite>('chabaq_invites', INIT_INVITES)

  const [tab,         setTab]         = useState<Tab>('all')
  const [query,       setQuery]       = useState('')
  const [sortKey,     setSortKey]     = useState<SortKey>('role')
  const [sortAsc,     setSortAsc]     = useState(true)
  const [inviteOpen,  setInviteOpen]  = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [showPerms,   setShowPerms]   = useState(false)

  // ── Computed ──
  const admins    = members.filter(m => m.role === 'admin').length
  const mods      = members.filter(m => m.role === 'moderator').length
  const activeNow = members.filter(m => m.lastActive === 'Today').length
  const pending   = invites.filter(i => i.status === 'pending').length

  const filtered = members
    .filter(m => tab === 'all' || m.role === tab)
    .filter(m =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()) ||
      m.handle.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      let va: string, vb: string
      if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'role') {
        const order: Record<Role, number> = { owner: 0, admin: 1, moderator: 2, member: 3 }
        return sortAsc ? order[a.role] - order[b.role] : order[b.role] - order[a.role]
      }
      else if (sortKey === 'joined') { va = a.joined; vb = b.joined }
      else { va = a.lastActive; vb = b.lastActive }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortAsc(a => !a)
    else { setSortKey(k); setSortAsc(true) }
  }

  const changeRole = (id: string, role: Role) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
  }

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    setRemoveTarget(null)
  }

  const addInvite = (email: string, role: Exclude<Role, 'owner'>) => {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setInvites(prev => [{ id: 'i' + Date.now(), email, role, sentAt: now, status: 'pending' }, ...prev])
  }

  const cancelInvite = (id: string) => setInvites(prev => prev.filter(i => i.id !== id))

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'all',       label: 'All',        count: members.length },
    { id: 'admin',     label: 'Admins',     count: admins         },
    { id: 'moderator', label: 'Moderators', count: mods           },
    { id: 'member',    label: 'Members',    count: members.filter(m => m.role === 'member').length },
  ]

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => sortBy(k)} className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity text-left"
      style={{ color: sortKey === k ? 'var(--p)' : 'var(--t3)' }}>
      {label}
      <ArrowUpDown className="w-3 h-3" strokeWidth={1.7} />
    </button>
  )

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Team & Roles" subtitle="Manage your community team and permissions" />

          <main className="p-7 flex-1" style={{ animation: 'fadeUp .4s ease both' }}>

            {/* ── KPI row ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Members', value: members.length, color: 'var(--p)',      icon: <Users      className="w-4 h-4" strokeWidth={1.7} />, sub: 'in this community'    },
                { label: 'Admins',        value: admins,         color: 'var(--orange)', icon: <Shield     className="w-4 h-4" strokeWidth={1.7} />, sub: 'full management access' },
                { label: 'Moderators',    value: mods,           color: 'var(--cyan)',   icon: <UserCheck  className="w-4 h-4" strokeWidth={1.7} />, sub: 'content & member mgmt'  },
                { label: 'Active Today',  value: activeNow,      color: '#16a34a',       icon: <CheckCircle className="w-4 h-4" strokeWidth={1.7} />, sub: 'logged in today'       },
              ].map(k => (
                <div key={k.label} className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.color + '1a', color: k.color }}>
                      {k.icon}
                    </div>
                  </div>
                  <p className="text-[26px] font-bold leading-none" style={{ color: 'var(--t1)' }}>{k.value}</p>
                  <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--t2)' }}>{k.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Members section ── */}
            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              {/* Toolbar */}
              <div className="flex items-center gap-3 px-5 py-4 flex-wrap" style={{ borderBottom: '1px solid var(--bd)' }}>
                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className="h-7 px-3 rounded-lg text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                      style={tab === t.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                      {t.label}
                      <span className="px-1.5 py-0.5 rounded-full text-[9px]"
                        style={{ background: tab === t.id ? 'rgba(255,255,255,.25)' : 'var(--white)', color: tab === t.id ? '#fff' : 'var(--t3)' }}>
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search members…"
                    className="w-full h-8 pl-9 pr-3 rounded-xl text-[12px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }} />
                </div>
                {/* Invite button */}
                <button onClick={() => setInviteOpen(true)}
                  className="ml-auto flex items-center gap-1.5 px-4 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-85"
                  style={{ background: 'var(--p)', color: '#fff' }}>
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.7} />
                  Invite Member
                </button>
              </div>

              {/* Table header */}
              <div className="grid px-5 py-2.5 text-[11px] font-semibold"
                style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 90px 80px', color: 'var(--t3)', borderBottom: '1px solid var(--bd)' }}>
                <SortBtn k="name" label="Member" />
                <SortBtn k="role" label="Role" />
                <SortBtn k="joined" label="Joined" />
                <SortBtn k="lastActive" label="Last Active" />
                <span>Status</span>
                <span>Actions</span>
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--t3)' }} />
                  <p className="text-[13px]" style={{ color: 'var(--t2)' }}>No members found</p>
                </div>
              ) : (
                filtered.map((m, i) => (
                  <div key={m.id}
                    className="grid items-center px-5 py-3"
                    style={{
                      gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 90px 80px',
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--bd)' : 'none',
                    }}>
                    {/* Member */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: m.color }}>
                        {m.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{m.name}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>{m.email}</p>
                      </div>
                    </div>
                    {/* Role */}
                    <div>
                      <RolePicker current={m.role} memberId={m.id} member={m} onSave={changeRole} />
                    </div>
                    {/* Joined */}
                    <p className="text-[12px]" style={{ color: 'var(--t2)' }}>
                      {new Date(m.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </p>
                    {/* Last active */}
                    <p className="text-[12px]" style={{ color: 'var(--t2)' }}>{m.lastActive}</p>
                    {/* Status */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit"
                      style={m.status === 'active'
                        ? { background: 'rgba(74,222,128,.1)', color: '#16a34a' }
                        : { background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.status === 'active' ? '#16a34a' : 'var(--t3)' }} />
                      {m.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => setRemoveTarget(m)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                          style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444' }}
                          title="Remove member">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.7} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Permissions matrix ── */}
            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <button className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => setShowPerms(p => !p)}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                  <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>Role Permissions</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                    {PERMISSIONS.length} permissions
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 transition-transform"
                  style={{ color: 'var(--t3)', transform: showPerms ? 'rotate(180deg)' : 'none' }} strokeWidth={1.7} />
              </button>

              {showPerms && (
                <div style={{ borderTop: '1px solid var(--bd)' }}>
                  {/* Columns header */}
                  <div className="grid px-5 py-3 text-[11px] font-bold"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid var(--bd)' }}>
                    <span style={{ color: 'var(--t3)' }}>Permission</span>
                    {(['owner', 'admin', 'moderator', 'member'] as Role[]).map(r => (
                      <div key={r} className="flex items-center justify-center gap-1" style={{ color: ROLE_META[r].color }}>
                        {ROLE_META[r].icon}
                        {ROLE_META[r].label}
                      </div>
                    ))}
                  </div>
                  {/* Rows */}
                  {PERMISSIONS.map((p, i) => (
                    <div key={p.id} className="grid items-center px-5 py-3"
                      style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'transparent' : 'var(--bg)', borderBottom: i < PERMISSIONS.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: 'var(--t1)' }}>{p.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{p.desc}</p>
                      </div>
                      {(['owner', 'admin', 'moderator', 'member'] as Role[]).map(r => (
                        <div key={r} className="flex justify-center">
                          {p[r]
                            ? <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(74,222,128,.12)' }}>
                                <Check className="w-3 h-3" style={{ color: '#16a34a' }} strokeWidth={1.7} />
                              </div>
                            : <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(239,68,68,.08)' }}>
                                <X className="w-3 h-3" style={{ color: '#ef4444' }} strokeWidth={1.7} />
                              </div>
                          }
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Pending invitations ── */}
            {invites.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                    <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>
                      Invitations
                      {pending > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background: 'var(--p)' }}>{pending}</span>
                      )}
                    </p>
                  </div>
                </div>
                {invites.map((inv, i) => {
                  const m = ROLE_META[inv.role]
                  return (
                    <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5"
                      style={{ borderBottom: i < invites.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                      {/* Avatar placeholder */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'var(--bg)', border: '1.5px dashed var(--bd)' }}>
                        <Mail className="w-3.5 h-3.5" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <RoleBadge role={inv.role} size="sm" />
                          <span className="text-[11px]" style={{ color: 'var(--t3)' }}>Sent {inv.sentAt}</span>
                        </div>
                      </div>
                      {/* Status */}
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={inv.status === 'pending'
                          ? { background: 'rgba(251,191,36,.12)', color: '#d97706' }
                          : { background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                        {inv.status === 'pending' ? '⏳ Pending' : '⌛ Expired'}
                      </span>
                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {inv.status === 'expired' && (
                          <button
                            onClick={() => setInvites(prev => prev.map(x => x.id === inv.id ? { ...x, status: 'pending', sentAt: 'Just now' } : x))}
                            className="px-3 h-7 rounded-lg text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                            style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                            Resend
                          </button>
                        )}
                        <button onClick={() => cancelInvite(inv.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                          style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t3)' }}>
                          <X className="w-3.5 h-3.5" strokeWidth={1.7} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Modals */}
      {inviteOpen  && <InviteModal onClose={() => setInviteOpen(false)} onSend={addInvite} />}
      {removeTarget && (
        <RemoveModal
          member={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => removeMember(removeTarget.id)}
        />
      )}
    </>
  )
}
