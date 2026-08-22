'use client'

import { useState } from 'react'
import { Settings, Users, Circle, ShieldCheck, Link2, Copy, Check, X, Bell, BellOff, LogOut, ArrowUpCircle } from 'lucide-react'

interface Props {
  name: string
  description: string
  slug: string
  membersCount: number
  onlineCount: number
  adminCount: number
  bannerSrc: string
  avatarInitials: string
  avatarColor: string
}

export default function CommunityHero({ name, description, slug, membersCount, onlineCount, adminCount, bannerSrc, avatarInitials, avatarColor }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      {/* Overlay hero — Facebook/LinkedIn style */}
      <div>
        {/* Banner 16:6 with floating Settings top-right */}
        <div className="relative rounded-2xl overflow-hidden bg-[#ede9ff]"
             style={{ aspectRatio: '16 / 6' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerSrc} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,.25) 100%)' }} />

          {/* Settings — floating top-right */}
          <button onClick={() => setSettingsOpen(true)}
                  className="absolute top-3 right-3 h-8 px-3 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md hover:bg-white/95"
                  style={{ background: 'rgba(255,255,255,.85)', color: '#1a1730' }}>
            <Settings className="w-3.5 h-3.5" strokeWidth={1.8} />
            Settings
          </button>
        </div>

        {/* Overlay row: avatar overlaps banner bottom, name+meta below */}
        <div className="flex items-end gap-4 -mt-8 md:-mt-10 px-2 md:px-4 relative z-10">
          {/* Avatar — overlaps the banner */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-black text-white text-xl md:text-2xl shadow-lg ring-4 ring-white flex-shrink-0"
               style={{ background: avatarColor }}>
            {avatarInitials}
          </div>

          {/* Name + description — aligned to bottom of avatar */}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-[18px] md:text-[20px] font-bold text-gray-900 truncate leading-tight">{name}</h1>
            {description && (
              <p className="text-[12.5px] text-gray-500 truncate mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* Meta pills row */}
        <div className="flex items-center gap-2 mt-3 px-2 md:px-4 flex-wrap">
          <MetaPill icon={<Users className="w-3.5 h-3.5" strokeWidth={1.8} />}
                    value={membersCount} label="Members"
                    iconColor="#8e78fb" bg="#ede9ff" />
          <MetaPill icon={<Circle className="w-2.5 h-2.5" fill="#34d399" strokeWidth={0} />}
                    value={onlineCount} label="Online"
                    iconColor="#22c55e" bg="#dcfce7" />
          <MetaPill icon={<ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.8} />}
                    value={adminCount} label="Admins"
                    iconColor="#f59e0b" bg="#fef3c7" />
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && <SettingsModal name={name} slug={slug} onClose={() => setSettingsOpen(false)} />}
    </>
  )
}

type Tab = 'invite' | 'notifications' | 'membership'

function MetaPill({ icon, value, label, iconColor, bg }:
  { icon: React.ReactNode; value: number; label: string; iconColor: string; bg: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-100 bg-white">
      <span className="flex items-center justify-center" style={{ color: iconColor }}>
        {icon}
      </span>
      <span className="text-[12px] font-bold text-gray-900">{value}</span>
      <span className="text-[11px] text-gray-500">{label}</span>
    </div>
  )
}

function SettingsModal({ name, slug, onClose }: { name: string; slug: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('invite')
  const [copied, setCopied] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [dailyNotif, setDailyNotif] = useState(true)
  const [adminBroadcast, setAdminBroadcast] = useState(true)
  const [eventReminder, setEventReminder] = useState(false)
  const [chatOn, setChatOn] = useState(true)

  const inviteLink = `https://chabaqa.io/communities/${slug}?ref=invite`

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: 560 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: '#8e78fb' }}>CH</div>
            <span className="text-[15px] font-bold text-gray-900">{name}</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex px-6 gap-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
          {([
            { id: 'invite' as Tab, label: 'Invite' },
            { id: 'notifications' as Tab, label: 'Notifications' },
            { id: 'membership' as Tab, label: 'Membership' },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-3 text-[13px] font-medium transition-colors"
              style={{
                color: tab === t.id ? '#8e78fb' : '#888',
                borderBottom: tab === t.id ? '2px solid #8e78fb' : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6" style={{ minHeight: 200 }}>

          {tab === 'invite' && (
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 mb-1">Invite people</h3>
              <p className="text-[13px] text-gray-500 mb-5">Share this link with your friends to invite them.</p>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #e4dffb', background: '#faf8ff' }}>
                <div className="flex items-center gap-2 flex-1 px-4 py-3 min-w-0">
                  <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: '#8e78fb' }} strokeWidth={1.7} />
                  <span className="text-[13px] text-gray-600 truncate">{inviteLink}</span>
                </div>
                <button onClick={handleCopy}
                  className="px-5 py-3 text-[12px] font-bold flex items-center gap-1.5 transition-all flex-shrink-0 hover:opacity-80"
                  style={{ background: '#8e78fb', color: '#fff' }}>
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="flex flex-col gap-0">
              {[
                { label: 'Weekly digest email', val: weeklyDigest, set: setWeeklyDigest },
                { label: 'Daily notifications email', val: dailyNotif, set: setDailyNotif },
                { label: 'Admin broadcast email', val: adminBroadcast, set: setAdminBroadcast },
                { label: 'Event reminder email', val: eventReminder, set: setEventReminder },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <span className="text-[13.5px] text-gray-700">{item.label}</span>
                  <button onClick={() => item.set(!item.val)}
                    className="w-10 h-[22px] rounded-full transition-colors relative flex-shrink-0"
                    style={{ background: item.val ? '#22c55e' : '#d4d4d4' }}>
                    <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all shadow-sm"
                      style={{ left: item.val ? 20 : 2 }} />
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 mt-2" style={{ borderTop: '1px solid #f0f0f0' }}>
                <div>
                  <p className="text-[13.5px] font-semibold text-gray-800">Chat</p>
                  <p className="text-[11.5px] text-gray-400 mt-0.5">Members can message you</p>
                </div>
                <button onClick={() => setChatOn(!chatOn)}
                  className="h-7 px-3 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  style={{ background: chatOn ? '#f0fdf4' : '#fafafa', color: chatOn ? '#22c55e' : '#aaa', border: `1px solid ${chatOn ? '#bbf7d0' : '#e5e5e5'}` }}>
                  {chatOn ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {chatOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {tab === 'membership' && (
            <div>
              <p className="text-[13.5px] text-gray-700 mb-6">
                You&apos;ve been a member of <span className="font-semibold">{name}</span> since <span className="font-semibold">Aug 7, 2026</span>.
              </p>
              <div className="flex flex-col gap-2">
                <button className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 transition-colors py-1.5">
                  <ArrowUpCircle className="w-4 h-4" strokeWidth={1.5} />
                  Change plan
                </button>
                <button className="flex items-center gap-2 text-[13px] text-red-400 hover:text-red-600 transition-colors py-1.5">
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  Leave group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
