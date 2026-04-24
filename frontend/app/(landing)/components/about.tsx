'use client'
import { localizeHref } from '@/lib/i18n/client'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

export function About() {
  const t = useTranslations('landing.about')
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)
  const pills = t.raw('pills') as string[]

  return (
    <div className="py-24 px-6 md:px-10 bg-white" id="about">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="reveal-left">
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-[0_8px_40px_rgba(142,120,251,.12)] aspect-video bg-white">
            <iframe
              src="https://www.youtube.com/embed/t_IUPjKppN8?autoplay=0&rel=0&modestbranding=1"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="What is Chabaqa?"
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="reveal-right">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[#8e78fb] mb-4">{t('eyebrow')}</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-gray-900 leading-tight mb-5">{t('heading')}</h2>
          <p className="text-gray-600 leading-relaxed mb-7">{t('body')}</p>
          <ul className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8 stagger" aria-label="Key features">
            {pills.map((pill) => (
              <li key={pill} className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#ede9ff] border border-[#c4b8fd] text-[#8e78fb] text-xs sm:text-sm font-semibold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" className="sm:w-[13px] sm:h-[13px]" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {pill}
              </li>
            ))}
          </ul>
          <a
            href={withLocale('/dashboard/create-community')}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-bold text-white bg-[#8e78fb] hover:bg-[#7a64f0] hover:-translate-y-[2px] transition-all shadow-[0_8px_24px_rgba(142,120,251,.35)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="sm:w-4 sm:h-4" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            {t('cta')}
          </a>
        </div>
      </div>

      <style jsx>{`
        .reveal-left,
        .reveal-right {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal-left {
          transform: translateX(-28px);
        }
        .reveal-right {
          transform: translateX(28px);
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
      `}</style>
    </div>
  )
}
