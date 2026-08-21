'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { siteData } from '@/lib/data'
import { JSX } from 'react/jsx-runtime';

function FeatureIcon({ id, color, size = 16 }: { id: string; color: string; size?: number }) {
  const icons: Record<string, JSX.Element> = {
    community: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    course: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    challenge: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    product: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    ),
    event: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    oneToOne: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    dms: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    analytics: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    branding: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  }
  return icons[id] || icons.community
}

function FeatureVideo({ src, active }: { src: string; active: string }) {
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  useEffect(() => {
    setHasError(false)
  }, [active])

  if (hasError) return null

  return (
    <video
      ref={videoRef}
      key={active}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className="absolute inset-0 w-full h-full object-cover"
      onError={handleError}
    />
  )
}

export function Features() {
  const t = useTranslations('landing.features')
  const items = t.raw('items') as { id: string; name: string; desc: string }[]
  const [active, setActive] = useState('community')

  // Get all data from centralized source
  const features = siteData.features
  const colors = siteData.featureColors
  
  // Find the active feature - no fallback
  const feature = features.find((f) => f.id === active)
  if (!feature) {
    console.error(`Feature with id "${active}" not found`)
    return null
  }

  // Get colors for the active feature - no fallback
  const featureColors = colors[active as keyof typeof colors]
  if (!featureColors) {
    console.error(`Colors for feature "${active}" not found`)
    return null
  }

  return (
    <div className="py-24 px-6 md:px-10 bg-white dark:!bg-[var(--section-alt)]" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 reveal">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[#8e78fb] mb-3">{t('eyebrow')}</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-gray-600 max-w-xl mx-auto">{t('sub')}</p>
        </div>

        {/* Mobile: pill tabs row + centered video */}
        <div className="md:hidden mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {items.map((f) => {
              const itemColors = colors[f.id as keyof typeof colors]
              if (!itemColors) return null
              
              return (
                <button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                    active === f.id ? 'bg-[#8e78fb] text-white border-[#8e78fb]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#c4b8fd] hover:text-[#8e78fb]'
                  }`}
                >
                  <FeatureIcon id={f.id} color={active === f.id ? '#fff' : itemColors.iconColor} size={12} />
                  {f.name}
                </button>
              )
            })}
          </div>
          {/* Video centered full width */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[0_8px_40px_rgba(142,120,251,.1)] w-full">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="text-xs text-gray-600 ms-2 truncate">{feature.url || 'chabaqa.io'}</span>
            </div>
            <div className="relative aspect-video" style={{ background: `linear-gradient(135deg,${featureColors.iconBg},#f7f7fe)` }}>
              {feature.video && (
                <FeatureVideo src={feature.video} active={active} />
              )}
            </div>
          </div>
        </div>

        {/* Desktop: sidebar tabs + video */}
        <div className="hidden md:grid md:grid-cols-[280px_1fr] gap-8 items-start">
          <div className="flex flex-col gap-2 h-full">
            {items.map((f) => {
              const itemColors = colors[f.id as keyof typeof colors]
              if (!itemColors) return null
              
              return (
                <button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-start transition-all border ${
                    active === f.id
                      ? 'border-[#c4b8fd] bg-[#ede9ff] shadow-[0_4px_16px_rgba(142,120,251,.15)] dark:border-[var(--p3)] dark:bg-[var(--p2)] dark:shadow-[0_4px_18px_rgba(0,0,0,.24)]'
                      : 'border-transparent bg-transparent hover:bg-[#ede9ff] hover:border-gray-200 dark:hover:border-[var(--bd)] dark:hover:bg-[var(--p2)]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: itemColors.iconBg, border: `1.5px solid ${itemColors.iconBorder}` }}>
                    <FeatureIcon id={f.id} color={itemColors.iconColor} size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-[var(--t1)]">{f.name}</div>
                  </div>
                  <span className="text-gray-400 text-sm dark:text-[var(--t2)]">→</span>
                </button>
              )
            })}
          </div>

          {/* Video preview */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[0_8px_40px_rgba(142,120,251,.1)]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="text-xs text-gray-600 ms-2">{feature.url || 'chabaqa.io'}</span>
            </div>
            <div className="relative aspect-video" style={{ background: `linear-gradient(135deg,${featureColors.iconBg},#f7f7fe)` }}>
              {feature.video && (
                <FeatureVideo src={feature.video} active={active} />
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .in-view {
          opacity: 1 !important;
          transform: none !important;
        }
      `}</style>
    </div>
  )
}
