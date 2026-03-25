'use client'
import { STEPS } from '@/lib/landing-data'

const STEPS_TEXT = [
  { num: '1', title: 'Create your community', desc: 'Sign up, name your community, add a description and banner. Takes 3 minutes. Your invite link is live immediately.' },
  { num: '2', title: 'Add your content',      desc: 'Upload course videos, create challenges, set your coaching calendar, and list your digital products — all from one dashboard.' },
  { num: '3', title: 'Share & earn',          desc: 'Share your invite link. Members join, pay, and engage. You get paid with transparent transaction fees starting at 2.9%.' },
]

export function HowItWorks() {
  return (
    <section className="py-24 px-6 md:px-10 bg-[var(--bg)]" id="how" aria-label="How it works">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 reveal">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--p)] mb-3">Simple setup</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-[var(--t1)] mb-4">Up and running in minutes</h2>
          <p className="text-[var(--t3)] max-w-xl mx-auto">No developers, no headaches. Just create, share, and grow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10 stagger">
          {STEPS_TEXT.map((step, i) => (
            <div key={step.num} className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-6" style={{ background: STEPS[i].color, boxShadow: `0 8px 24px ${STEPS[i].shadow}` }}>
                {step.num}
              </div>
              <div className="text-lg font-bold text-[var(--t1)] mb-3">{step.title}</div>
              <p className="text-[var(--t3)] leading-relaxed text-[15px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
