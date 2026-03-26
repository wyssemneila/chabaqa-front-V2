'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function FAQ() {
  const t = useTranslations('landing.faq')
  const faqs = t.raw('items') as { q: string; a: string }[]
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-24 px-6 md:px-10 bg-[var(--bg)]" id="faq" aria-label="Frequently asked questions">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14 reveal">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--p)] mb-3">{t('eyebrow')}</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-[var(--t1)] mb-4">{t('title')}</h2>
          <p className="text-[var(--t3)]">{t('sub')}</p>
        </div>

        <div className="flex flex-col gap-3 stagger" role="list">
          {faqs.map((faq, i) => {
            const isOpen     = open === i
            const answerId   = `faq-answer-${i}`
            const questionId = `faq-question-${i}`
            return (
              <div key={i} role="listitem" className={`rounded-2xl border transition-all overflow-hidden ${isOpen ? 'border-[var(--p)] shadow-[0_4px_24px_rgba(142,120,251,.15)]' : 'border-[var(--bd)] hover:border-[var(--p3)]'}`}>
                <button
                  id={questionId}
                  className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-start font-semibold text-[15px] transition-colors ${isOpen ? 'bg-[var(--p)] text-white' : 'bg-[var(--white)] text-[var(--t1)] hover:bg-[var(--p2)]'}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  {faq.q}
                  <span className="flex-shrink-0" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke={isOpen ? '#fff' : 'var(--p)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"
                      style={{ transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </span>
                </button>
                <div id={answerId} role="region" aria-labelledby={questionId} hidden={!isOpen}
                  className="px-6 py-5 text-[15px] text-[var(--t3)] leading-relaxed bg-[var(--white)]">
                  {faq.a}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
