'use client'

import { useState } from 'react'
import {
  Section,
  type Device,
  type LandingContent,
  type PageId,
} from '@/components/creator-dashboard/landing-renderer'
import type { CommunityLandingState } from '@/lib/community-landing-state'

type RuntimeOverrides = Partial<Pick<LandingContent, 'name' | 'slug' | 'logo' | 'members' | 'rating' | 'reviews' | 'price' | 'currency' | 'creatorName' | 'creatorImage'>>

export function CommunityLandingExperience({
  state,
  device = 'desktop',
  runtime,
  builderMode = false,
  selectedBlock,
  language = 'en',
}: {
  state: CommunityLandingState
  device?: Device
  runtime?: RuntimeOverrides
  builderMode?: boolean
  selectedBlock?: string | null
  language?: 'en' | 'ar'
}) {
  const [activeMedia, setActiveMedia] = useState('')
  const [page, setPage] = useState<PageId>('home')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [openSec, setOpenSec] = useState<number | string | null>(0)
  const content = { ...state.content, ...runtime }
  const t = (en: string, ar: string) => language === 'ar' ? ar : en
  const visibleBlocks = state.blocks.filter((block) => block.visible)

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100%', background: state.design.bg === 'white' ? '#fff' : '#fbfaff' }}>
      {visibleBlocks.map((block, index) => (
        <div
          key={block.id}
          className="relative"
          style={builderMode && selectedBlock === block.id ? { outline: `2px solid ${state.design.accent}`, outlineOffset: -2 } : undefined}
        >
          {builderMode && selectedBlock === block.id && (
            <span className="absolute left-0 top-0 z-20 rounded-br px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: state.design.accent }}>
              {block.label[language]}
            </span>
          )}
          <Section
            block={block}
            c={content}
            design={state.design}
            device={device}
            index={index}
            media={state.media}
            activeMedia={activeMedia}
            setActiveMedia={setActiveMedia}
            reviews={state.reviews}
            page={page}
            setPage={setPage}
            t={t}
            openFaq={openFaq}
            setOpenFaq={setOpenFaq}
            openSec={openSec}
            setOpenSec={setOpenSec}
          />
        </div>
      ))}
    </div>
  )
}
