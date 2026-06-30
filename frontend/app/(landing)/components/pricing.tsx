'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { localizeHref } from '@/lib/i18n/client'
import { PLANS, PLAN_TIERS, formatLimit, type PlanTier } from '@/lib/plans/plan-config'

// Types
interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
}

// Confetti particle generator
function createConfetti(): ConfettiParticle[] {
  const colors = ['#8e78fb', '#47c7ea', '#ff9b28', '#f65887', '#fbbf24']
  const particles: ConfettiParticle[] = []

  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    })
  }
  return particles
}

export function Pricing() {
  const t = useTranslations('landing.pricing')
  const pathname = usePathname()
  const withLocale = useCallback((href: string) => localizeHref(pathname, href), [pathname])
  const plans = useMemo(() => PLAN_TIERS.map((tier) => PLANS[tier]), [])
  
  const [yearly, setYearly] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([])
  const [animatingPrices, setAnimatingPrices] = useState<Record<string, number>>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  // Animate confetti
  useEffect(() => {
    if (confetti.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let particles = [...confetti]

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles = particles.filter((p) => {
        p.y += p.vy
        p.x += p.vx
        p.vy += 0.1 // gravity
        p.rotation += p.rotationSpeed

        if (p.y > canvas.height) return false

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()

        return true
      })

      if (particles.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setConfetti([])
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [confetti])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval))
      intervalsRef.current.clear()
    }
  }, [])

  // Animate price change
  const animatePrice = useCallback((planName: string, from: number, to: number) => {
    const duration = 500
    const steps = 30
    const increment = (to - from) / steps
    let current = from
    let step = 0

    const interval = setInterval(() => {
      step++
      current += increment
      setAnimatingPrices((prev) => ({ ...prev, [planName]: Math.round(current) }))

      if (step >= steps) {
        clearInterval(interval)
        intervalsRef.current.delete(interval)
        setAnimatingPrices((prev) => ({ ...prev, [planName]: to }))
      }
    }, duration / steps)

    intervalsRef.current.add(interval)
  }, [])

  // Handle toggle with confetti
  const handleToggle = useCallback((isYearly: boolean) => {
    if (isYearly && !yearly) {
      // Switching to yearly - trigger confetti
      setConfetti(createConfetti())
    }
    setYearly(isYearly)

    // Animate prices
    plans.forEach((plan) => {
      const oldPrice = yearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice
      const newPrice = isYearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice
      animatePrice(plan.name, oldPrice, newPrice)
    })
  }, [yearly, animatePrice, plans])

  const getPlanFeatures = (tier: PlanTier): string[] => {
    const plan = PLANS[tier]
    const features = [
      `${formatLimit(plan.limits.membersMax)} members`,
      `${formatLimit(plan.limits.coursesActivationMax)} active courses`,
      `${plan.limits.storageGB} GB storage`,
      `${plan.limits.adminsMax} admin seat${plan.limits.adminsMax > 1 ? 's' : ''}`,
      `${plan.transactionFee}% + ${plan.transactionFixedFee} TND transaction fee`,
    ]

    if (plan.features.challenges) features.push('Challenges')
    if (plan.features.sessions) features.push(`${formatLimit(plan.limits.sessionBookingsPerMonth)} session bookings/month`)
    if (plan.features.events) features.push('Events')
    if (plan.features.gamification) features.push('Gamification')
    if (plan.features.branding) features.push('Remove Chabaqa branding')

    return features.slice(0, 7)
  }

  const checkoutHref = (tier: PlanTier) =>
    withLocale(`/pricing?plan=${tier}&billing=${yearly ? 'yearly' : 'monthly'}`)

  return (
    <section className="py-24 px-6 md:px-10 bg-white relative" id="pricing" aria-label="Pricing plans">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ display: confetti.length > 0 ? 'block' : 'none' }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 reveal">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[#8e78fb] mb-3">{t('eyebrow')}</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">{t('sub')}</p>
          <div className="inline-flex rounded-lg sm:rounded-xl border border-gray-200 bg-white p-0.5 sm:p-1 gap-0.5 sm:gap-1" role="group" aria-label="Billing period toggle">
            <button
              onClick={() => handleToggle(false)}
              aria-pressed={!yearly}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-all ${!yearly ? 'bg-[#8e78fb] text-white shadow-sm scale-105' : 'text-gray-700 hover:bg-[#ede9ff]'}`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => handleToggle(true)}
              aria-pressed={yearly}
              className={`flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-all ${yearly ? 'bg-[#8e78fb] text-white shadow-sm scale-105' : 'text-gray-700 hover:bg-[#ede9ff]'}`}
            >
              {t('yearly')}
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded-full bg-[#47c7ea] text-white">{t('save')}</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 stagger items-center">
          {plans.map((plan) => {
            const displayPrice = animatingPrices[plan.name] ?? (yearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice)
            const priceLabel = `${displayPrice}`
            const periodLabel = yearly ? `per month, billed ${plan.yearlyTotal} TND/year` : 'per month'
            const features = getPlanFeatures(plan.tier)

            if (plan.highlight) {
              return (
                <div key={plan.name} className="relative md:-my-3 z-10" style={{ filter: 'drop-shadow(0 20px 48px rgba(142,120,251,.35))' }}>
                  {/* card */}
                  <div className="relative rounded-2xl p-7 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(145deg, #8e78fb 0%, #a78bfa 60%, #7c67f8 100%)' }}>
                    {/* subtle shine overlay */}
                    <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, #fff, transparent)' }} aria-hidden="true" />

                    {/* Most popular badge */}
                    <div
                      className="inline-flex self-center mb-5 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
                      style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', backdropFilter: 'blur(8px)' }}
                    >
                      Most popular
                    </div>

                    <div className="text-2xl font-black text-white mb-1">{plan.name}</div>
                    <div className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Scale a growing paid community with advanced creator tools.
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-1.5 mb-1">
                      <span className="text-[54px] font-black leading-none text-white transition-all duration-300" aria-live="polite">{priceLabel}</span>
                      <span className="text-base mb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        TND
                      </span>
                    </div>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {periodLabel}
                    </div>
                    {yearly && (
                      <div className="text-xs line-through mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {plan.monthlyPrice} TND
                      </div>
                    )}
                    <div className="text-xs font-bold mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      7-day trial through secure checkout
                    </div>

                    <div className="w-full h-px mb-6" style={{ background: 'rgba(255,255,255,0.18)' }} />

                    <ul className="flex flex-col gap-3 mb-8 flex-1">
                      {features.map((f, idx) => (
                        <li key={`${plan.name}-feature-${idx}`} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="9" height="9" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={checkoutHref(plan.tier)}
                      className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 bg-white text-[#8e78fb] hover:bg-opacity-90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Start secure checkout
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" className="sm:w-[14px] sm:h-[14px]" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                  </div>
                </div>
              )
            }

            /* Regular cards */
            return (
              <div
                key={plan.name}
                className="rounded-2xl p-7 flex flex-col bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(142,120,251,.13)]"
                style={{ border: '1.5px solid #e8e4ff' }}
              >
                <div className="inline-flex self-start text-xs font-bold px-3 py-1 rounded-full mb-5 bg-[#ede9ff] text-[#8e78fb]">
                  {plan.tier === 'starter' ? 'Starter' : 'Advanced'}
                </div>

                <div className="text-xl font-black text-gray-900 mb-1">{plan.name}</div>
                <div className="text-sm text-gray-600 mb-6">
                  {plan.tier === 'starter'
                    ? 'Start selling courses and products with clear limits.'
                    : 'Unlock premium branding and the lowest transaction fee.'}
                </div>

                {/* Price */}
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-[46px] font-black leading-none text-gray-900 transition-all duration-300" aria-live="polite">{priceLabel}</span>
                  <span className="text-sm mb-3 text-gray-600">TND</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">{periodLabel}</div>
                {yearly && <div className="text-xs line-through text-gray-600 mb-2">{plan.monthlyPrice} TND</div>}
                <div className="text-xs font-semibold text-[#8e78fb] mb-6">7-day trial through secure checkout</div>

                <div className="w-full h-px bg-gray-200 mb-6" />

                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {features.map((f, idx) => (
                    <li key={`${plan.name}-feature-${idx}`} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center bg-[#ede9ff]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#8e78fb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="9" height="9" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={checkoutHref(plan.tier)}
                  className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: '#ede9ff', color: '#8e78fb', border: '1.5px solid #c4b8fd' }}
                >
                  Start secure checkout
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            )
          })}
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
        .stagger > * {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .stagger.in-view > * {
          opacity: 1;
          transform: none;
        }
        .stagger.in-view > *:nth-child(1) {
          transition-delay: 0.05s;
        }
        .stagger.in-view > *:nth-child(2) {
          transition-delay: 0.13s;
        }
        .stagger.in-view > *:nth-child(3) {
          transition-delay: 0.21s;
        }
      `}</style>
    </section>
  )
}
