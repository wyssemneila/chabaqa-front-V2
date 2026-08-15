'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Copy, Check, Bell, BellOff, Users, LogOut, ArrowUpCircle } from 'lucide-react'

interface Props {
  communityName: string
  slug: string
  joinedDate: string
  open: boolean
  onClose: () => void
}

type Tab = 'invite' | 'notifications' | 'membership'

export default function CommunitySettingsPopup({ communityName, slug, joinedDate, open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('invite')
  const [copied, setCopied] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [dailyNotif, setDailyNotif] = useState(true)
  const [adminBroadcast, setAdminBroadcast] = useState(true)
  const [eventReminder, setEventReminder] = useState(false)
  const [chatEnabled, setChatEnabled] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  if (!open) return null

  const inviteLink = `https://chabaqa.io/communities/${slug}?ref=invite`

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'invite', label: 'Invite' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'membership', label: 'Membership' },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.4)' }}>
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl w-full flex overflow-hidden"
        style={{ maxWidth: 620, maxHeight: '80vh', minHeight: 340 }}>

        {/* Left sidebar */}
        <div className="w-[180px] flex-shrink-0 py-5 px-3 flex flex-col gap-1" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-2 px-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: '#8e78fb' }}>CH</div>
            <span className="text-[13px] font-semibold text-gray-900 truncate">{communityName}</span>
          </div>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="text-left px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors"
              style={{
                background: tab === t.id ? '#fdf6e3' : 'transparent',
                color: tab === t.id ? '#1a1730' : '#666',
                borderLeft: tab === t.id ? '3px solid #f5c542' : '3px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 p-6 overflow-y-auto relative">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" strokeWidth={1.7} />
          </button>

          {tab === 'invite' && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-1">Invite people</h2>
              <p className="text-[13px] text-gray-500 mb-5">Invite your friends to {communityName} by sharing this link.</p>
              <div className="flex items-center gap-2 rounded-xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
                <input type="text" readOnly value={inviteLink}
                  className="flex-1 px-4 py-3 text-[13px] text-gray-600 bg-gray-50 outline-none truncate" />
                <button onClick={handleCopy}
                  className="px-5 py-3 text-[13px] font-bold transition-colors flex items-center gap-1.5 flex-shrink-0"
                  style={{ background: '#fdf6e3', color: '#1a1730' }}>
                  {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4" /> COPY</>}
                </button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-5">Notifications</h2>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Weekly digest email', value: weeklyDigest, set: setWeeklyDigest },
                  { label: 'Daily notifications email', value: dailyNotif, set: setDailyNotif },
                  { label: 'Admin broadcast email', value: adminBroadcast, set: setAdminBroadcast },
                  { label: 'Event reminder email', value: eventReminder, set: setEventReminder },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[14px] text-gray-700">{item.label}</span>
                    <button onClick={() => item.set(!item.value)}
                      className="w-11 h-6 rounded-full transition-colors relative"
                      style={{ background: item.value ? '#22c55e' : '#d1d5db' }}>
                      <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                        style={{ left: item.value ? 22 : 2 }} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5" style={{ borderTop: '1px solid #f0f0f0' }}>
                <h3 className="text-[15px] font-bold text-gray-900 mb-3">Chat</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-gray-700">Members can message you</span>
                  <button onClick={() => setChatEnabled(!chatEnabled)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
                    style={{ border: '1px solid #e8e8e8' }}>
                    {chatEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    {chatEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'membership' && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-5">Membership</h2>
              <p className="text-[14px] text-gray-700 mb-6">
                You&apos;ve been a group member of <span className="font-semibold">{communityName}</span> since <span className="font-semibold">{joinedDate}</span>.
              </p>
              <div className="flex flex-col gap-3">
                <button className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowUpCircle className="w-4 h-4" strokeWidth={1.5} />
                  Change plan
                </button>
                <button className="flex items-center gap-2 text-[14px] text-red-400 hover:text-red-600 transition-colors">
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
