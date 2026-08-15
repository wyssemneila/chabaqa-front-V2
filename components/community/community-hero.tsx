'use client'

import { useState } from 'react'
import { Settings, Users, Wifi, Shield } from 'lucide-react'
import CommunitySettingsPopup from './community-settings-popup'

interface Props {
  name: string
  description: string
  slug: string
  membersCount: number
  onlineCount: number
  adminCount: number
  bannerSrc: string
  link: string
}

export default function CommunityHero({ name, description, slug, membersCount, onlineCount, adminCount, bannerSrc, link }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <div className="flex items-start gap-5">
        {/* Left: info */}
        <div className="flex-1 min-w-0 py-1">
          <h1 className="text-[20px] font-bold text-gray-900 mb-1">{name}</h1>
          <p className="text-[12px] text-gray-400 mb-2">chabaqa.io/communities/{slug}</p>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-4 max-w-[400px]">{description}</p>

          {/* Stats row */}
          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.7} />
              <span className="text-[13px] font-semibold text-gray-900">{membersCount}</span>
              <span className="text-[12px] text-gray-400">Members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.7} />
              <span className="text-[13px] font-semibold text-gray-900">{onlineCount}</span>
              <span className="text-[12px] text-gray-400">Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.7} />
              <span className="text-[13px] font-semibold text-gray-900">{adminCount}</span>
              <span className="text-[12px] text-gray-400">Admins</span>
            </div>
          </div>

          {/* Settings button */}
          <button onClick={() => setSettingsOpen(true)}
            className="h-9 px-5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all hover:opacity-90"
            style={{ background: '#f5f5f5', color: '#555' }}>
            <Settings className="w-4 h-4" strokeWidth={1.7} />
            SETTINGS
          </button>
        </div>

        {/* Right: banner */}
        <div className="flex-shrink-0 rounded-xl overflow-hidden"
          style={{ width: 320, aspectRatio: '16/9', background: '#ede9ff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerSrc} alt={name} className="w-full h-full object-cover" />
        </div>
      </div>

      <CommunitySettingsPopup
        communityName={name}
        slug={slug}
        joinedDate="Aug 7, 2026"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
