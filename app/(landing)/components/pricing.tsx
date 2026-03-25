'use client'
import { useState } from 'react'
import { PLANS } from '@/lib/landing-data'

const APP_URL = 'https://app.chabaqa.io'

const PLANS_TEXT = [
  { badge: '🌱 Starter',      name: 'Starter', desc: 'Perfect for getting started',    fee: 'Transaction fee: 7.9%',
    features: ['1 Community (up to 100 members)', 'Activate up to 3 Courses', 'Digital Products enabled', '2 GB Storage', 'Basic analytics', '24/7 Support'] },
  { badge: '⭐ Most Popular', name: 'Growth',  desc: 'For growing communities',        fee: 'Transaction fee: 4.9%',
    features: ['Up to 3 Communities (10k members)', 'Unlimited Courses', 'Challenges, Sessions & Events', 'Magic Reach automation (500/mo)', 'Member gamification', 'Verified badge · 50 GB storage', '24/7 Priority Support'] },
  { badge: '🚀 Pro',          name: 'Pro',     desc: 'For professional creators',      fee: 'Transaction fee: 2.9%',
    features: ['Unlimited Communities & Members', 'Unlimited automation', 'Add up to 3 team admins', 'Custom domain name', 'Featured badge + top listings', '24/7 VIP Support'] },
]

export function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section className="py-24 px-6 md:px-10 bg-[var(--bg)]" id="pricing" aria-label="Pricing plans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 reveal">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--p)] mb-3">Transparent pricing</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-[var(--t1)] mb-4">Start free, scale when ready</h2>
          <p className="text-[var(--t3)] max-w-xl mx-auto mb-8">Every plan includes a 7-day free trial. No hidden fees.</p>
          <div className="inline-flex rounded-xl border border-[var(--bd)] bg-[var(--white)] p-1 gap-1" role="group">
            <button onClick={() => setYearly(false)} aria-pressed={!yearly}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${!yearly ? 'bg-[var(--p)] text-white shadow-sm' : 'text-[var(--t2)] hover:bg-[var(--p2)]'}`}>
              Monthly
            </button>
            <button onClick={() => setYearly(true)} aria-pressed={yearly}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${yearly ? 'bg-[var(--p)] text-white shadow-sm' : 'text-[var(--t2)] hover:bg-[var(--p2)]'}`}>
              Yearly
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--cyan)] text-white">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 stagger items-center">
          {PLANS.map((plan, i) => {
            const tPlan        = PLANS_TEXT[i]
            const displayPrice = yearly ? plan.yearlyPrice : plan.monthlyPrice
            const isFree       = displayPrice === 0
            const priceLabel   = isFree ? '0' : `${displayPrice}`
            const periodLabel  = isFree
              ? 'forever · no card needed'
              : yearly
              ? `${displayPrice} TND / month · billed yearly`
              : `${displayPrice} TND / month · 7-day free trial`

            if (plan.featured) {
              return (
                <div key={plan.name} className="relative md:-my-3 z-10"
                  style={{ filter: 'drop-shadow(0 20px 48px rgba(142,120,251,.35))' }}>
                  <div className="relative rounded-2xl p-7 flex flex-col overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, #8e78fb 0%, #a78bfa 60%, #7c67f8 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.07]"
                      style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, #fff, transparent)' }}
                      aria-hidden="true" />
                    <div className="inline-flex self-center mb-5 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
                      style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                      {tPlan.badge}
                    </div>
                    <div className="text-2xl font-black text-white mb-1">{tPlan.name}</div>
                    <div className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>{tPlan.desc}</div>
                    <div className="flex items-end gap-1.5 mb-1">
                      <span className="text-[54px] font-black leading-none text-white">{priceLabel}</span>
                      <span className="text-base mb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>TND</span>
                    </div>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{periodLabel}</div>
                    {yearly && (
                      <div className="text-xs line-through mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{plan.monthlyPrice} TND</div>
                    )}
                    <div className="text-xs font-bold mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>{tPlan.fee}</div>
                    <div className="w-full h-px mb-6" style={{ background: 'rgba(255,255,255,0.18)' }} />
                    <ul className="flex flex-col gap-3 mb-8 flex-1">
                      {tPlan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.25)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="9" height="9" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a href={`${APP_URL}/register`}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[.98]"
                      style={{ background: '#fff', color: '#7c67f8' }}>
                      Start 7-day free trial
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                  </div>
                </div>
              )
            }

            return (
              <div key={plan.name}
                className="rounded-2xl p-7 flex flex-col bg-[var(--white)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(142,120,251,.13)]"
                style={{ border: '1.5px solid var(--bd)' }}>
                <div className="inline-flex self-start text-xs font-bold px-3 py-1 rounded-full mb-5 bg-[var(--p2)] text-[var(--p)]">
                  {tPlan.badge}
                </div>
                <div className="text-xl font-black text-[var(--t1)] mb-1">{tPlan.name}</div>
                <div className="text-sm text-[var(--t3)] mb-6">{tPlan.desc}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-[46px] font-black leading-none text-[var(--t1)]">
                    {isFree ? 'Free' : priceLabel}
                  </span>
                  {!isFree && <span className="text-sm mb-3 text-[var(--t3)]">TND</span>}
                </div>
                <div className="text-xs text-[var(--t3)] mb-1">{periodLabel}</div>
                {yearly && !isFree && (
                  <div className="text-xs line-through text-[var(--t3)] mb-2">{plan.monthlyPrice} TND</div>
                )}
                <div className="text-xs font-semibold text-[var(--p)] mb-6">{tPlan.fee}</div>
                <div className="w-full h-px bg-[var(--bd)] mb-6" />
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {tPlan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center bg-[var(--p2)]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--p)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="9" height="9" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-[var(--t2)]">{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={`${APP_URL}/register`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:bg-[var(--p)] hover:text-white hover:border-[var(--p)]"
                  style={{ background: 'var(--p2)', color: 'var(--p)', border: '1.5px solid var(--p3)' }}>
                  {isFree ? 'Start for free' : 'Start 7-day free trial'}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
