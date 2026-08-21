"use client"

import { useRef } from "react"
import { ExploreCard } from "@/app/(landing)/(communities)/components/explore-card"
import { useTranslations } from "next-intl"
import type { ExploreItem } from "@/lib/explore-data"

interface FeaturedCommunitiesProps {
  items: ExploreItem[]
}

export function FeaturedCommunities({ items }: FeaturedCommunitiesProps) {
  const t = useTranslations("landing.explore")
  const featuredRef = useRef<HTMLDivElement>(null)

  if (items.length === 0) return null

  const scrollFeatured = (direction: 1 | -1) => {
    featuredRef.current?.scrollBy({ left: direction * 340, behavior: 'smooth' })
  }

  return (
    <section className="relative pt-12 pb-12 overflow-hidden bg-white" aria-label={t('heroLabel')}>
      {/* Grid pattern background */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none" 
        aria-hidden="true"
        style={{ 
          backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', 
          backgroundSize: '52px 52px', 
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%)' 
        }} 
      />
      
      {/* Animated blobs */}
      <div className="absolute w-[480px] h-[300px] rounded-full blur-[80px] opacity-[0.10] -top-16 -left-24 bg-[#8e78fb] pointer-events-none animate-[blobMove_12s_ease-in-out_infinite]" aria-hidden="true" />
      <div className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.08] top-8 -right-16 bg-[#47c7ea] pointer-events-none animate-[blobMove_15s_ease-in-out_infinite] [animation-delay:-5s]" aria-hidden="true" />

      {/* Hero Section */}
      <div className="relative px-6 md:px-10 max-w-6xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-5 bg-[#f0eefe] border-[1.5px] border-[#d4c5ff] text-[#8e78fb] animate-[fadeDown_0.6s_ease_both]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          {t('badge')}
        </div>
        
        <h1 className="text-[clamp(22px,4.8vw,52px)] font-black text-gray-900 leading-tight tracking-[-0.03em] mb-4 animate-[fadeDown_0.65s_0.08s_ease_both]">
          {t('heroTitle1')}{' '}
          <span className="relative inline-block">
            <span className="relative z-10 text-[#8e78fb]">{t('heroTitle2')}</span>
            <svg className="absolute -bottom-1 left-0 w-full overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
              <path 
                d="M0 7 Q25 2 50 6 Q75 10 100 5" 
                fill="none" 
                stroke="#ff9b28" 
                strokeWidth="2"
                strokeLinecap="round" 
                pathLength="1"
                className="[stroke-dasharray:1] [stroke-dashoffset:1] animate-[drawLine_0.9s_0.65s_ease-out_forwards]"
              />
            </svg>
          </span>
        </h1>
        
        <p className="text-gray-500 text-[clamp(14px,2vw,16px)] leading-relaxed max-w-xl mx-auto animate-[fadeDown_0.65s_0.16s_ease_both]">
          {t('heroSub')}
        </p>
      </div>

      {/* Featured Communities Carousel */}
      <div className="relative px-6 md:px-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8e78fb] mb-0.5">
              {t('featuredEyebrow')}
            </div>
            <h2 className="text-lg font-black text-gray-900">
              {t('featuredTitle')}
            </h2>
          </div>
        </div>

        {/* Carousel wrapper with side arrows */}
        <div className="relative">
          {/* Left arrow */}
          <button 
            onClick={() => scrollFeatured(-1)} 
            aria-label={t('scrollLeft')}
            className="absolute -start-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[#8e78fb] hover:border-[#d4c5ff] transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Right arrow */}
          <button 
            onClick={() => scrollFeatured(1)} 
            aria-label={t('scrollRight')}
            className="absolute -end-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[#8e78fb] hover:border-[#d4c5ff] transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Scroll track */}
          <div 
            ref={featuredRef} 
            className="flex gap-4 overflow-x-auto pb-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map(item => (
              <ExploreCard key={item.id} item={item} featured />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes blobMove {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </section>
  )
}
