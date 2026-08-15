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

export default function CommunityHero({ name, description, slug, membersCount, onlineCount, adminCount, bannerSrc }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-6 rounded-2xl p-5" style={{ background: '#fafbfc', border: '1px solid #f0f0f0' }}>
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[18px] font-bold text-gray-900 mb-0.5">{name}</h1>
          <p className="text-[11px] text-gray-400 mb-2">chabaqa.io/communities/{slug}</p>
          <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3 line-clamp-2">{description}</p>

          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1 text-[12px]">
              <Users className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
              <span className="font-semibold text-gray-800">{membersCount}</span>
              <span className="text-gray-400">Members</span>
            </span>
            <span className="flex items-center gap-1 text-[12px]">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
              <span className="font-semibold text-gray-800">{onlineCount}</span>
              <span className="text-gray-400">Online</span>
            </span>
            <span className="flex items-center gap-1 text-[12px]">
              <Shield className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
              <span className="font-semibold text-gray-800">{adminCount}</span>
              <span className="text-gray-400">Admins</span>
            </span>
          </div>

          <button onClick={() => setSettingsOpen(true)}
            className="h-8 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all hover:bg-gray-200"
            style={{ background: '#eee', color: '#555' }}>
            <Settings className="w-3.5 h-3.5" strokeWidth={1.7} />
            SETTINGS
          </button>
        </div>

        {/* Right: banner (2:1 ratio matching 1440x720 image, displayed small) */}
        <div className="flex-shrink-0 rounded-xl overflow-hidden shadow-sm"
          style={{ width: 260, aspectRatio: '2/1', background: '#ede9ff' }}>
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
