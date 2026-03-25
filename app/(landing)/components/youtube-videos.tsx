'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { VIDEOS } from '@/lib/landing-data'

const CARD_W = 318

const TAG_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  'Getting Started': { bg: 'var(--p2)',  border: 'var(--p3)',  color: 'var(--p)'      },
  'Courses':         { bg: 'var(--o2)',  border: '#fde5bb',    color: 'var(--orange)' },
  'Challenges':      { bg: 'var(--c2)',  border: '#a5f3fc',    color: 'var(--cyan)'   },
  'Coaching':        { bg: 'var(--o2)',  border: '#fde5bb',    color: 'var(--orange)' },
  'Products':        { bg: 'var(--pk2)', border: '#fda4af',    color: 'var(--pink)'   },
  'Events':          { bg: 'var(--p2)',  border: 'var(--p3)',  color: 'var(--p)'      },
}

const ITEMS = [
  { num: '01', tag: 'Getting Started', title: 'How to Create Your Community on Chabaqa',  desc: 'Set up your community in minutes — name, banner, invite link.' },
  { num: '02', tag: 'Courses',         title: 'Build & Sell Your First Online Course',     desc: 'Upload videos, create chapters, set pricing and publish.' },
  { num: '03', tag: 'Challenges',      title: 'Launch a 7-Day Challenge',                  desc: 'Boost daily member engagement and retention.' },
  { num: '04', tag: 'Coaching',        title: 'Set Up Your 1:1 Coaching Calendar',         desc: 'Book, pay and meet — fully automated.' },
  { num: '05', tag: 'Products',        title: 'Sell Digital Products & Earn Passively',    desc: 'Upload, price and sell presets or e-books instantly.' },
  { num: '06', tag: 'Events',          title: 'Track Your Growth with Analytics',          desc: 'Revenue, engagement and member growth in real time.' },
]

export function YouTubeVideos() {
  const [cur,   setCur]   = useState(0)
  const [modal, setModal] = useState<{ id: string; title: string } | null>(null)
  const sectionRef  = useRef<HTMLElement>(null)
  const trackRef    = useRef<HTMLDivElement>(null)
  const isDown      = useRef(false)
  const startX      = useRef(0)
  const scrollL     = useRef(0)
  const programmatic = useRef(false)

  function scrollTo(i: number) {
    const idx = ((i % VIDEOS.length) + VIDEOS.length) % VIDEOS.length
    setCur(idx)
    programmatic.current = true
    trackRef.current?.scrollTo({ left: idx * CARD_W, behavior: 'smooth' })
    setTimeout(() => { programmatic.current = false }, 600)
  }

  function openModal(id: string, title: string) { setModal({ id, title }); document.body.style.overflow = 'hidden' }
  function closeModal() { setModal(null); document.body.style.overflow = '' }

  useEffect(() => () => { document.body.style.overflow = '' }, [])

  const onMouseDown  = (e: React.MouseEvent) => { isDown.current = true; startX.current = e.pageX - (trackRef.current?.offsetLeft ?? 0); scrollL.current = trackRef.current?.scrollLeft ?? 0 }
  const onMouseLeave = () => { isDown.current = false }
  const onMouseUp    = () => { isDown.current = false }
  const onMouseMove  = (e: React.MouseEvent) => {
    if (!isDown.current) return
    e.preventDefault()
    const x = e.pageX - (trackRef.current?.offsetLeft ?? 0)
    if (trackRef.current) trackRef.current.scrollLeft = scrollL.current - (x - startX.current) * 1.5
  }
  const onScroll = () => { if (!trackRef.current || programmatic.current) return; const i = Math.round(trackRef.current.scrollLeft / CARD_W); if (i !== cur) setCur(i) }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollTo(cur - 1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollTo(cur + 1) }
    }
    section.addEventListener('keydown', handler)
    return () => section.removeEventListener('keydown', handler)
  }, [cur])

  return (
    <>
      <section ref={sectionRef} className="py-24 bg-[var(--white)]" tabIndex={0} aria-label="Tutorial videos carousel" style={{ outline: 'none' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 mb-10">
          <div className="reveal">
            <div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--p)] mb-3">Video Tutorials</div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-black text-[var(--t1)] mb-3">Learn from Videos</h2>
            <p className="text-[var(--t3)] max-w-lg">Watch step-by-step walkthroughs and discover how to build, grow and monetize your community.</p>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-[18px] overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none px-6 md:px-10 pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseDown={onMouseDown} onMouseLeave={onMouseLeave} onMouseUp={onMouseUp} onMouseMove={onMouseMove} onScroll={onScroll}
          >
            {VIDEOS.map((v, idx) => {
              const tItem = ITEMS[idx] ?? { num: v.num, tag: v.tag, title: v.title, desc: v.desc }
              const tag   = TAG_STYLES[v.tag] ?? TAG_STYLES['Getting Started']
              return (
                <button key={v.id} onClick={() => openModal(v.id, tItem.title)} type="button"
                  aria-label={`Watch: ${tItem.title}`}
                  className="flex-shrink-0 w-[300px] snap-start bg-[var(--white)] border border-[var(--bd)] rounded-2xl overflow-hidden cursor-pointer hover:shadow-[0_8px_32px_rgba(142,120,251,.15)] hover:-translate-y-1 transition-all text-start">
                  <div className="relative aspect-video overflow-hidden bg-[var(--p2)]">
                    <Image src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt={tItem.title} fill className="object-cover" sizes="300px" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3" fill="var(--p)"/></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-2 end-2 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-black/60">{v.dur}</div>
                  </div>
                  <div className="p-5">
                    <div className="inline-flex text-[11px] font-bold px-3 py-1 rounded-full mb-3" style={{ background: tag.bg, border: `1px solid ${tag.border}`, color: tag.color }}>{tItem.tag}</div>
                    <div className="text-sm font-bold text-[var(--t1)] mb-2 leading-snug">{tItem.title}</div>
                    <div className="text-[13px] text-[var(--t3)] leading-relaxed mb-4">{tItem.desc}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--t3)]">{tItem.num} / 06</span>
                      <span className="text-xs font-bold flex items-center gap-1" style={{ color: tag.color }}>
                        Watch now
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => scrollTo(cur - 1)} aria-label="Previous"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--bd)] text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] hover:bg-[var(--p2)] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => scrollTo(cur + 1)} aria-label="Next"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--bd)] text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] hover:bg-[var(--p2)] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </section>

      {modal && (
        <div role="dialog" aria-modal="true" aria-labelledby="video-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-[var(--white)] rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bd)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--p)]" />
                <span id="video-modal-title" className="text-sm font-bold text-[var(--t1)] truncate max-w-[340px]">{modal.title}</span>
              </div>
              <button onClick={closeModal} aria-label="Close video"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--p2)] text-[var(--t3)] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="aspect-video">
              <iframe src={`https://www.youtube.com/embed/${modal.id}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media" allowFullScreen title={modal.title} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
