'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { localizeHref } from '@/lib/i18n/client'
import { Users, BookOpen, Trophy, ShoppingBag, Video, Calendar } from 'lucide-react'

// Timeline data structure
interface TimelineItem {
  id: number
  title: string
  date: string
  content: string
  category: string
  icon: typeof Users
  relatedIds: number[]
  status: 'completed' | 'in-progress' | 'pending'
  energy: number
  image: string
  position: { top?: string; left?: string; right?: string; bottom?: string }
  animDelay: string
  duration: string
  borderColor: string
  iconColor: string
}

function PillPopup({ title, desc, image, side }: { title: string; desc: string; image: string; side: 'left' | 'right' }) {
  return (
    <div
      role="tooltip"
      data-popup
      className={`absolute top-[-20px] z-50 w-[300px] bg-white border border-gray-200 rounded-[18px] shadow-[0_16px_48px_rgba(142,120,251,.18)] overflow-hidden pointer-events-all ${
        side === 'right' ? 'left-[calc(100%+12px)]' : 'right-[calc(100%+12px)]'
      }`}
    >
      <div style={{ aspectRatio: '16/9', width: '100%', overflow: 'hidden', position: 'relative' }}>
        <Image src={image} alt={title} fill className="object-cover" sizes="300px" />
      </div>
      <div className="p-3 pb-4 px-4">
        <div className="text-[13px] font-extrabold text-gray-900 mb-1">{title}</div>
        <div className="text-[11px] text-gray-600 leading-relaxed whitespace-normal">{desc}</div>
      </div>
    </div>
  )
}

export function Hero() {
  const t = useTranslations('landing.hero')
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)

  const typedWords = t.raw('typedWords') as string[]
  const stats = t.raw('stats') as { val: string; label: string }[]
  const pillsRaw = t.raw('pills') as Record<string, { label: string; title: string; desc: string }>

  // Timeline data with proper structure
  const timelineData = useMemo<TimelineItem[]>(() => [
    {
      id: 1,
      title: t('timeline.community.title'),
      date: t('timeline.community.date'),
      content: t('timeline.community.content'),
      category: t('timeline.community.category'),
      icon: Users,
      relatedIds: [2, 3],
      status: 'completed',
      energy: 100,
      image: '/hero/community.webp',
      position: { top: '18%', left: '6%' },
      animDelay: '0s',
      duration: '5s',
      borderColor: '#c4b8fd',
      iconColor: '#8e78fb',
    },
    {
      id: 2,
      title: t('timeline.courses.title'),
      date: t('timeline.courses.date'),
      content: t('timeline.courses.content'),
      category: t('timeline.courses.category'),
      icon: BookOpen,
      relatedIds: [1, 4],
      status: 'in-progress',
      energy: 85,
      image: '/hero/course.webp',
      position: { top: '28%', right: '5%' },
      animDelay: '-2s',
      duration: '7s',
      borderColor: '#fde5bb',
      iconColor: '#ff9b28',
    },
    {
      id: 3,
      title: t('timeline.challenges.title'),
      date: t('timeline.challenges.date'),
      content: t('timeline.challenges.content'),
      category: t('timeline.challenges.category'),
      icon: Trophy,
      relatedIds: [1, 5],
      status: 'in-progress',
      energy: 75,
      image: '/hero/challenge.webp',
      position: { top: '60%', left: '4%' },
      animDelay: '-1s',
      duration: '6s',
      borderColor: '#a5f3fc',
      iconColor: '#47c7ea',
    },
    {
      id: 4,
      title: t('timeline.products.title'),
      date: t('timeline.products.date'),
      content: t('timeline.products.content'),
      category: t('timeline.products.category'),
      icon: ShoppingBag,
      relatedIds: [2, 6],
      status: 'pending',
      energy: 45,
      image: '/hero/product.webp',
      position: { top: '68%', right: '5%' },
      animDelay: '-3s',
      duration: '8s',
      borderColor: '#fda4af',
      iconColor: '#f65887',
    },
    {
      id: 5,
      title: t('timeline.sessions.title'),
      date: t('timeline.sessions.date'),
      content: t('timeline.sessions.content'),
      category: t('timeline.sessions.category'),
      icon: Video,
      relatedIds: [3, 6],
      status: 'pending',
      energy: 55,
      image: '/hero/session.webp',
      position: { top: '42%', left: '2%' },
      animDelay: '-4s',
      duration: '9s',
      borderColor: '#fde5bb',
      iconColor: '#ff9b28',
    },
    {
      id: 6,
      title: t('timeline.events.title'),
      date: t('timeline.events.date'),
      content: t('timeline.events.content'),
      category: t('timeline.events.category'),
      icon: Calendar,
      relatedIds: [4, 5],
      status: 'pending',
      energy: 35,
      image: '/hero/event.webp',
      position: { top: '48%', right: '3%' },
      animDelay: '-5s',
      duration: '7s',
      borderColor: '#c4b8fd',
      iconColor: '#8e78fb',
    },
  ], [t])

  const [typedWord, setTypedWord] = useState(typedWords[0])
  const [activePill, setActivePill] = useState<number | null>(null)
  const wordIdx = useRef(0)
  const charIdx = useRef(0)
  const deleting = useRef(false)

  useEffect(() => {
    wordIdx.current = 0
    charIdx.current = 0
    deleting.current = false
    setTypedWord(typedWords[0])
  }, [typedWords])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    function type() {
      const word = typedWords[wordIdx.current]
      if (!deleting.current) {
        charIdx.current++
        setTypedWord(word.slice(0, charIdx.current))
        if (charIdx.current === word.length) {
          deleting.current = true
          timeout = setTimeout(type, 2000)
          return
        }
      } else {
        charIdx.current--
        setTypedWord(word.slice(0, charIdx.current))
        if (charIdx.current === 0) {
          deleting.current = false
          wordIdx.current = (wordIdx.current + 1) % typedWords.length
        }
      }
      timeout = setTimeout(type, deleting.current ? 60 : 90)
    }
    timeout = setTimeout(type, 1400)
    return () => clearTimeout(timeout)
  }, [typedWords])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-pill]') && !target.closest('[data-popup]')) setActivePill(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePill(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const STAT_COLORS = ['#8e78fb', '#ff9b28', '#47c7ea', '#f65887']

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-12 pt-28 pb-20 overflow-hidden bg-white" aria-label="Hero">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'linear-gradient(#e8e4ff 1px,transparent 1px),linear-gradient(90deg,#e8e4ff 1px,transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)',
          }}
        />
        <div className="absolute w-[520px] h-[420px] rounded-full blur-[60px] opacity-20 -top-24 -left-28 bg-[#8e78fb]" style={{ animation: 'blobMove 9s ease-in-out infinite' }} />
        <div className="absolute w-[380px] h-[380px] rounded-full blur-[60px] opacity-[0.18] top-[20%] -right-24 bg-[#47c7ea]" style={{ animation: 'blobMove 11s ease-in-out infinite', animationDelay: '-3s' }} />
        <div className="absolute w-[320px] h-[320px] rounded-full blur-[60px] opacity-15 -bottom-20 left-[30%] bg-[#f65887]" style={{ animation: 'blobMove 13s ease-in-out infinite', animationDelay: '-6s' }} />
        <div className="absolute w-[260px] h-[260px] rounded-full blur-[60px] opacity-[0.18] bottom-[10%] right-[15%] bg-[#ff9b28]" style={{ animation: 'blobMove 10s ease-in-out infinite', animationDelay: '-4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[500, 700, 900].map((s, i) => (
            <div
              key={s}
              className="absolute rounded-full border border-gray-200"
              style={{
                width: s,
                height: s,
                marginTop: -s / 2,
                marginLeft: -s / 2,
                opacity: [0.25, 0.18, 0.12][i],
                animation: `ringPulse ${[4, 6, 8][i]}s ease-in-out infinite`,
                animationDelay: `${[0, -2, -4][i]}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating pills */}
      <div className="absolute inset-0 pointer-events-none z-[5]" aria-hidden="true">
        {timelineData.map((item) => {
          const Icon = item.icon
          const isLeft = item.position.left !== undefined
          const isActive = activePill === item.id
          const popupSide = isLeft ? 'right' : 'left'
          
          return (
            <button
              key={item.id}
              data-pill=""
              type="button"
              aria-expanded={isActive}
              aria-label={`Learn about ${item.title}`}
              onClick={() => setActivePill((prev) => (prev === item.id ? null : item.id))}
              className={`absolute hidden md:flex items-center gap-2 px-4 py-[9px] rounded-full bg-white border-[1.5px] text-gray-700 text-xs font-semibold whitespace-nowrap pointer-events-auto cursor-pointer shadow-[0_4px_20px_rgba(142,120,251,.1)] transition-all hover:scale-105 ${
                isActive ? 'bg-[#ede9ff] scale-105' : ''
              }`}
              style={{
                ...item.position,
                borderColor: isActive ? '#8e78fb' : item.borderColor,
                animation: `floatPill ${item.duration} ease-in-out infinite`,
                animationDelay: item.animDelay,
              }}
            >
              <Icon size={14} color={item.iconColor} aria-hidden="true" />
              {item.title}
              {isActive && <PillPopup title={item.title} desc={item.content} image={item.image} side={popupSide} />}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="relative z-[2] max-w-[820px] w-full">
        <div
          className="relative inline-flex items-center gap-2 rounded-full px-4 py-[6px] text-xs font-semibold mb-7 overflow-hidden"
          style={{
            animation: 'fadeDown .7s ease both',
            background: 'linear-gradient(135deg, #ede9ff 0%, #ede9ff 50%, #ede9ff 100%)',
            border: '1.5px solid #c4b8fd',
            color: '#8e78fb',
          }}
        >
          <span
            className="absolute inset-0 -translate-x-full"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(142,120,251,.35) 50%, transparent 60%)',
              animation: 'badgeShimmer 2.2s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <div className="relative w-6 h-6 rounded-full bg-[#8e78fb] text-white flex items-center justify-center text-[11px] font-extrabold" aria-hidden="true">
            ✦
          </div>
          <span className="relative font-bold tracking-wide">{t('badge')}</span>
        </div>

        <h1 className="text-[clamp(46px,7vw,88px)] font-black text-gray-900 leading-[1.05] tracking-[-0.04em] mb-3" style={{ animation: 'fadeDown .7s .1s ease both' }}>
          {t('title1')}{' '}
          <span className="relative inline-block text-[#8e78fb] after:content-[''] after:absolute after:bottom-[2px] after:left-0 after:right-0 after:h-[5px] after:rounded-[3px] after:bg-gradient-to-r after:from-[#47c7ea] after:to-[#8e78fb] after:opacity-50">
            {t('passion')}
          </span>
          <br />
          {t('title2')}{' '}
          <span className="bg-gradient-to-br from-[#ff9b28] to-[#f65887] bg-clip-text text-transparent" aria-live="polite">
            {typedWord}
          </span>
          <span className="inline-block w-[3px] h-[.85em] bg-[#8e78fb] rounded-sm ms-1 align-middle" style={{ animation: 'blink .8s ease-in-out infinite' }} aria-hidden="true" />
        </h1>

        <p className="text-[clamp(15px,2vw,19px)] text-gray-600 leading-[1.65] max-w-[560px] mx-auto mb-9" style={{ animation: 'fadeDown .7s .2s ease both' }}>
          {t('sub')}
        </p>

        <div className="flex items-center gap-2 sm:gap-3 justify-center flex-wrap mb-8 sm:mb-12" style={{ animation: 'fadeDown .7s .3s ease both' }}>
          <a
            href={withLocale('/dashboard/create-community')}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-[15px] font-bold text-white bg-[#8e78fb] hover:bg-[#7a64f0] hover:-translate-y-[3px] transition-all shadow-[0_8px_30px_rgba(142,120,251,.35)] hover:shadow-[0_14px_40px_rgba(142,120,251,.45)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="sm:w-4 sm:h-4" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            {t('ctaPrimary')}
          </a>
          <button
            type="button"
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-3 sm:px-7 sm:py-4 rounded-xl sm:rounded-[14px] text-sm sm:text-[15px] font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-[#c4b8fd] hover:text-[#8e78fb] hover:bg-[#ede9ff] transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="sm:w-4 sm:h-4" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            {t('ctaSecondary')}
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 justify-center" style={{ animation: 'fadeDown .7s .4s ease both' }}>
          <div className="flex" aria-hidden="true">
            {[
              '/profile/637781117_883560937847524_881110216935920072_n.jpg',
              '/profile/637821498_903865835718612_2266197064791773063_n.jpg',
              '/profile/639077524_1227592362783256_5641138724717692722_n.jpg',
              '/profile/642635919_768841262950142_5195117104642339597_n.jpg',
            ].map((src, i) => (
              <div
                key={src}
                className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[2px] sm:border-[2.5px] border-white -ml-1.5 sm:-ml-2 first:ml-0 overflow-hidden"
              >
                <Image src={src} alt={`Creator ${i + 1}`} fill className="object-cover" sizes="32px" />
              </div>
            ))}
          </div>
          <span className="text-xs sm:text-[13px] font-medium text-gray-600">{t('proofText')}</span>
        </div>

        {/* Stats */}
        <div
          className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden mt-8 md:mt-12 max-w-[680px] w-full mx-auto shadow-[0_4px_24px_rgba(142,120,251,.1)]"
          style={{ animation: 'fadeUp .7s .5s ease both' }}
          role="list"
          aria-label="Key stats"
        >
          {stats.map((s, i) => (
            <div key={s.label} className="flex-1 py-2.5 px-2 md:py-4 md:px-5 text-center border-r border-gray-200 last:border-r-0" role="listitem">
              <div className="text-[15px] md:text-[22px] font-black leading-none" style={{ color: STAT_COLORS[i] }}>
                {s.val}
              </div>
              <div className="text-[8px] md:text-[10px] font-semibold uppercase tracking-[.06em] text-gray-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes blobMove {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -20px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 15px) scale(0.95);
          }
        }
        @keyframes floatPill {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        @keyframes ringPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.1;
          }
        }
        @keyframes fadeDown {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes badgeShimmer {
          0% {
            transform: translateX(-150%);
          }
          60%,
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, transparent, white)' }} aria-hidden="true" />
    </section>
  )
}
