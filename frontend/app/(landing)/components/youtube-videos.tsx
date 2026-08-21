'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { siteData } from '@/lib/data'
import { InfiniteSlider } from '@/components/ui/infinite-slider'

const TAG_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  'Getting Started': { bg: '#ede9ff', border: '#c4b8fd', color: '#8e78fb' },
  Courses: { bg: '#fff3e4', border: '#fde5bb', color: '#ff9b28' },
  Challenges: { bg: '#e4f8fd', border: '#a5f3fc', color: '#47c7ea' },
  Coaching: { bg: '#fff3e4', border: '#fde5bb', color: '#ff9b28' },
  Products: { bg: '#ffe4ee', border: '#fda4af', color: '#f65887' },
  Events: { bg: '#ede9ff', border: '#c4b8fd', color: '#8e78fb' },
}

export function YouTubeVideos() {
  const t = useTranslations('landing.videos')
  const items = t.raw('items') as { num: string; tag: string; title: string; desc: string }[]
  
  // Get videos from centralized data
  const VIDEOS = siteData.videos

  const [modal, setModal] = useState<{ id: string; title: string } | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  function openModal(id: string, title: string) {
    setModal({ id, title })
    document.body.style.overflow = 'hidden'
  }
  function closeModal() {
    setModal(null)
    document.body.style.overflow = ''
  }

  useEffect(() => () => {
    document.body.style.overflow = ''
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const total = '06'

  return (
    <>
      <section ref={sectionRef} className="py-24 bg-white dark:!bg-[var(--section-alt)]" tabIndex={0} aria-label="Tutorial videos carousel" style={{ outline: 'none' }}>
        {/* Header */}
        <div className="max-w-6xl mx-auto px-6 md:px-10 mb-10 text-center">
          <div className="reveal">
            <div className="text-xs font-bold uppercase tracking-[.1em] text-[#8e78fb] mb-3">{t('eyebrow')}</div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-black text-gray-900 mb-3">{t('title')}</h2>
            <p className="text-gray-600 max-w-lg mx-auto">{t('sub')}</p>
          </div>
        </div>

        {/* Scrollable track */}
        <div className="relative overflow-hidden">
          <InfiniteSlider gap={18} duration={42} durationOnHover={90} className="pb-4">
            {VIDEOS.map((v, idx) => {
              const tItem = items[idx] ?? { num: v.num, tag: v.tag, title: '', desc: '' }
              const tag = TAG_STYLES[v.tag] ?? TAG_STYLES['Getting Started']
              return (
                <button
                  key={v.id}
                  onClick={() => openModal(v.id, tItem.title)}
                  type="button"
                  aria-label={`Watch: ${tItem.title}`}
                  className="flex-shrink-0 w-[300px] snap-center bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-[0_8px_32px_rgba(142,120,251,.15)] hover:-translate-y-1 transition-all text-start"
                >
                  <div className="relative aspect-video overflow-hidden bg-[#ede9ff]">
                    <Image src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt={tItem.title} fill className="object-cover" sizes="300px" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <polygon points="5 3 19 12 5 21 5 3" fill="#8e78fb" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-2 end-2 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-black/60">{v.dur}</div>
                  </div>
                  <div className="p-5">
                    <div className="inline-flex text-[11px] font-bold px-3 py-1 rounded-full mb-3" style={{ background: tag.bg, border: `1px solid ${tag.border}`, color: tag.color }}>
                      {tItem.tag}
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-2 leading-snug">{tItem.title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed mb-4">{tItem.desc}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">
                        {tItem.num} / {total}
                      </span>
                      <span className="text-xs font-bold flex items-center gap-1" style={{ color: tag.color }}>
                        {t('watchNow')}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </InfiniteSlider>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white via-white/75 to-transparent dark:from-[var(--bg)] dark:via-[#12111abf] sm:w-14" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white via-white/75 to-transparent dark:from-[var(--bg)] dark:via-[#12111abf] sm:w-14" />
        </div>

      </section>

      {/* Modal */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl mx-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8e78fb]" />
                <span id="video-modal-title" className="text-sm font-bold text-gray-900 truncate max-w-[340px]">
                  {modal.title}
                </span>
              </div>
              <button onClick={closeModal} aria-label="Close video" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ede9ff] text-gray-600 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${modal.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                title={modal.title}
                className="w-full h-full"
              />
            </div>
            <div className="px-5 py-3 border-t border-gray-200 text-end">
              <a
                href={`https://www.youtube.com/watch?v=${modal.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#8e78fb] hover:text-[#7a64f0]"
              >
                Open on YouTube
              </a>
            </div>
          </div>
        </div>
      )}

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
    </>
  )
}
