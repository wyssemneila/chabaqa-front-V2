'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { HERO_PILLS } from '@/lib/landing-data'
import { APP_URL } from '@/lib/config'
const STAT_COLORS = ['var(--p)', 'var(--orange)', 'var(--cyan)', 'var(--pink)']

function PillPopup({ title, desc, image, side }: { title: string; desc: string; image: string; side: 'left' | 'right' }) {
  return (
    <div
      role="tooltip"
      data-popup
      className={`absolute top-[-20px] z-50 w-[300px] bg-[var(--white)] border border-[var(--bd)] rounded-[18px] shadow-[0_16px_48px_rgba(142,120,251,.18)] overflow-hidden pointer-events-all ${
        side === 'right' ? 'left-[calc(100%+12px)]' : 'right-[calc(100%+12px)]'
      }`}
    >
      <div style={{ aspectRatio: '16/9', width: '100%', overflow: 'hidden', position: 'relative' }}>
        <Image src={image} alt={title} fill className="object-cover" sizes="300px" />
      </div>
      <div className="p-3 pb-4 px-4">
        <div className="text-[13px] font-extrabold text-[var(--t1)] mb-1">{title}</div>
        <div className="text-xs text-[var(--t3)] leading-relaxed whitespace-normal">{desc}</div>
      </div>
    </div>
  )
}

export function Hero() {
  const t = useTranslations('landing.hero')

  const typedWordsRaw = t.raw('typedWords') as string[]
  const statsRaw      = t.raw('stats') as { val: string; label: string }[]
  const pillsRaw      = t.raw('pills') as Record<string, { label: string; title: string; desc: string }>

  const [typedWord,  setTypedWord]  = useState(typedWordsRaw[0] ?? '')
  const [activePill, setActivePill] = useState<string | null>(null)
  const wordIdx  = useRef(0)
  const charIdx  = useRef(0)
  const deleting = useRef(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    function type() {
      const word = typedWordsRaw[wordIdx.current]
      if (!deleting.current) {
        charIdx.current++
        setTypedWord(word.slice(0, charIdx.current))
        if (charIdx.current === word.length) { deleting.current = true; timeout = setTimeout(type, 2000); return }
      } else {
        charIdx.current--
        setTypedWord(word.slice(0, charIdx.current))
        if (charIdx.current === 0) { deleting.current = false; wordIdx.current = (wordIdx.current + 1) % typedWordsRaw.length }
      }
      timeout = setTimeout(type, deleting.current ? 60 : 90)
    }
    timeout = setTimeout(type, 1400)
    return () => clearTimeout(timeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-pill]') && !target.closest('[data-popup]')) setActivePill(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActivePill(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-10 pt-28 pb-20 overflow-hidden" aria-label="Hero">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)' }} />
        <div className="absolute w-[520px] h-[420px] rounded-full blur-[60px] opacity-20 -top-24 -left-28 bg-[var(--p)]" style={{ animation: 'blobMove 9s ease-in-out infinite' }} />
        <div className="absolute w-[380px] h-[380px] rounded-full blur-[60px] opacity-[0.18] top-[20%] -right-24 bg-[var(--cyan)]" style={{ animation: 'blobMove 11s ease-in-out infinite', animationDelay: '-3s' }} />
        <div className="absolute w-[320px] h-[320px] rounded-full blur-[60px] opacity-15 -bottom-20 left-[30%] bg-[var(--pink)]" style={{ animation: 'blobMove 13s ease-in-out infinite', animationDelay: '-6s' }} />
        <div className="absolute w-[260px] h-[260px] rounded-full blur-[60px] opacity-[0.18] bottom-[10%] right-[15%] bg-[var(--orange)]" style={{ animation: 'blobMove 10s ease-in-out infinite', animationDelay: '-4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[500,700,900].map((s,i) => (
            <div key={s} className="absolute rounded-full border border-[var(--bd2)]" style={{ width:s, height:s, marginTop:-s/2, marginLeft:-s/2, opacity:[0.25,0.18,0.12][i], animation:`ringPulse ${[4,6,8][i]}s ease-in-out infinite`, animationDelay:`${[0,-2,-4][i]}s` }} />
          ))}
        </div>
      </div>

      {/* Floating pills */}
      <div className="absolute inset-0 pointer-events-none z-[5]" aria-hidden="true">
        {HERO_PILLS.map((pill) => {
          const pillT    = pillsRaw[pill.id] ?? { label: pill.label, title: pill.label, desc: '' }
          const isLeft   = pill.position.left !== undefined
          const isActive = activePill === pill.id
          const popupSide = isLeft ? 'right' : 'left'
          return (
            <button
              key={pill.id}
              data-pill=""
              type="button"
              aria-expanded={isActive}
              aria-label={`Learn about ${pillT.label}`}
              onClick={() => setActivePill(prev => prev === pill.id ? null : pill.id)}
              className={`absolute hidden md:flex items-center gap-2 px-4 py-[9px] rounded-full bg-[var(--white)] border-[1.5px] text-[var(--t2)] text-xs font-semibold whitespace-nowrap pointer-events-auto cursor-pointer shadow-[0_4px_20px_rgba(142,120,251,.1)] transition-colors ${isActive ? 'bg-[var(--p2)]' : ''}`}
              style={{ ...pill.position, borderColor: isActive ? 'var(--p)' : pill.borderColor, animation: `floatPill ${pill.duration} ease-in-out infinite`, animationDelay: pill.animDelay }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={pill.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              {pillT.label}
              {isActive && <PillPopup title={pillT.title} desc={pillT.desc} image={pill.image} side={popupSide} />}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="relative z-[2] max-w-[820px] w-full">
        <div className="relative inline-flex items-center gap-2 rounded-full px-4 py-[6px] text-xs font-semibold mb-7 overflow-hidden" style={{ animation: 'fadeDown .7s ease both', background: 'linear-gradient(135deg, var(--p2) 0%, #ede9ff 50%, var(--p2) 100%)', border: '1.5px solid var(--p3)', color: 'var(--p)' }}>
          <span className="absolute inset-0 -translate-x-full" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(142,120,251,.35) 50%, transparent 60%)', animation: 'badgeShimmer 2.2s ease-in-out infinite' }} aria-hidden="true" />
          <div className="relative w-6 h-6 rounded-full bg-[var(--p)] text-white flex items-center justify-center text-[11px] font-extrabold" aria-hidden="true">✦</div>
          <span className="relative font-bold tracking-wide">{t('badge')}</span>
        </div>

        <h1 className="text-[clamp(46px,7vw,88px)] font-black text-[var(--t1)] leading-[1.05] tracking-[-0.04em] mb-3" style={{ animation: 'fadeDown .7s .1s ease both' }}>
          {t('title1')}{' '}
          <span className="relative inline-block text-[var(--p)] after:content-[''] after:absolute after:bottom-[2px] after:left-0 after:right-0 after:h-[5px] after:rounded-[3px] after:bg-gradient-to-r after:from-[var(--cyan)] after:to-[var(--p)] after:opacity-50">
            {t('passion')}
          </span>
          <br />
          {t('title2')}{' '}
          <span className="bg-gradient-to-br from-[var(--orange)] to-[var(--pink)] bg-clip-text text-transparent" aria-live="polite">
            {typedWord}
          </span>
          <span className="inline-block w-[3px] h-[.85em] bg-[var(--p)] rounded-sm ms-1 align-middle" style={{ animation: 'blink .8s ease-in-out infinite' }} aria-hidden="true" />
        </h1>

        <p className="text-[clamp(15px,2vw,19px)] text-[var(--t3)] leading-[1.65] max-w-[560px] mx-auto mb-9" style={{ animation: 'fadeDown .7s .2s ease both' }}>
          {t('sub')}
        </p>

        <div className="flex items-center gap-3 justify-center flex-wrap mb-12" style={{ animation: 'fadeDown .7s .3s ease both' }}>
          <a href={`${APP_URL}/register`} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[15px] font-bold text-white bg-[var(--p)] hover:bg-[#7a64f0] hover:-translate-y-[3px] transition-all shadow-[0_8px_30px_rgba(142,120,251,.35)] hover:shadow-[0_14px_40px_rgba(142,120,251,.45)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            {t('ctaPrimary')}
          </a>
          <button type="button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-[15px] font-semibold text-[var(--t2)] bg-[var(--white)] border-2 border-[var(--bd)] hover:border-[var(--p3)] hover:text-[var(--p)] hover:bg-[var(--p2)] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>
            {t('ctaSecondary')}
          </button>
        </div>

        <div className="flex items-center gap-3 justify-center" style={{ animation: 'fadeDown .7s .4s ease both' }}>
          <div className="flex" aria-hidden="true">
            {[['MI','#ede9ff','#8e78fb'],['AB','#dcfce7','#166534'],['WN','#e4f8fd','#0e7490'],['SA','#ffe4ee','#9d174d']].map(([init,bg,color]) => (
              <div key={init} className="w-8 h-8 rounded-full border-[2.5px] border-[var(--bg)] -ms-2 first:ms-0 text-[10px] font-extrabold flex items-center justify-center" style={{ background: bg, color }}>{init}</div>
            ))}
          </div>
          <span className="text-[13px] font-medium text-[var(--t3)]">{t('proofText')}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center bg-[var(--white)] border border-[var(--bd)] rounded-2xl overflow-hidden mt-8 md:mt-12 max-w-[680px] w-full mx-auto shadow-[0_4px_24px_rgba(142,120,251,.1)]" style={{ animation: 'fadeUp .7s .5s ease both' }} role="list" aria-label="Key stats">
          {statsRaw.map((s, i) => (
            <div key={s.label} className="flex-1 py-3 px-3 md:py-4 md:px-5 text-center border-r border-[var(--bd)] last:border-e-0" role="listitem">
              <div className="text-[16px] md:text-[22px] font-black leading-none" style={{ color: STAT_COLORS[i] }}>{s.val}</div>
              <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--t3)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
