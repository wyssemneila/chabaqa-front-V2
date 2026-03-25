'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function FAQ() {
  const t = useTranslations('landing.faq')
  const items = t.raw('items') as { q: string; a: string }[]
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-24 px-6 md:px-10 bg-gray-50" id="faq" aria-label="Frequently asked questions">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14 reveal">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[#8e78fb] mb-3">{t('eyebrow')}</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-gray-600">{t('sub')}</p>
        </div>

        <div className="flex flex-col gap-3 stagger" role="list">
          {items.map((faq, i) => {
            const isOpen = open === i
            const answerId = `faq-answer-${i}`
            const questionId = `faq-question-${i}`
            return (
              <div
                key={i}
                role="listitem"
                className={`rounded-2xl border transition-all overflow-hidden ${isOpen ? 'border-[#8e78fb] shadow-[0_4px_24px_rgba(142,120,251,.15)]' : 'border-gray-200 hover:border-[#c4b8fd]'}`}
              >
                <button
                  id={questionId}
                  className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-start font-semibold text-sm transition-colors ${
                    isOpen ? 'bg-[#8e78fb] text-white' : 'bg-white text-gray-900 hover:bg-[#ede9ff]'
                  }`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  {faq.q}
                  <span className="flex-shrink-0" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isOpen ? '#fff' : '#8e78fb'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="12"
                      height="12"
                      style={{ transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </button>
                <div id={answerId} role="region" aria-labelledby={questionId} hidden={!isOpen} className="px-6 py-5 text-sm text-gray-600 leading-relaxed bg-white">
                  {faq.a}
                </div>
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
        .stagger.in-view > *:nth-child(4) {
          transition-delay: 0.29s;
        }
        .stagger.in-view > *:nth-child(5) {
          transition-delay: 0.37s;
        }
        .stagger.in-view > *:nth-child(6) {
          transition-delay: 0.45s;
        }
      `}</style>
    </section>
  )
}
