'use client'
import { useTranslations } from 'next-intl'
import { APP_URL } from '@/lib/config'

export function About() {
  const t = useTranslations('landing.about')
  const pills = t.raw('pills') as string[]

  return (
    <section className="py-24 px-6 md:px-10 bg-[var(--bg)]" id="about" aria-label="About Chabaqa">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="reveal-left">
          <div className="rounded-2xl overflow-hidden border border-[var(--bd)] shadow-[0_8px_40px_rgba(142,120,251,.12)] aspect-video bg-[var(--white)]">
            <iframe
              src="https://www.youtube.com/embed/t_IUPjKppN8?autoplay=0&rel=0&modestbranding=1"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title={t('heading')} loading="lazy" className="w-full h-full"
            />
          </div>
        </div>
        <div className="reveal-right">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--p)] mb-4">{t('eyebrow')}</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-[var(--t1)] leading-tight mb-5">{t('heading')}</h2>
          <p className="text-[var(--t3)] leading-relaxed mb-7">{t('body')}</p>
          <ul className="flex flex-wrap gap-2 mb-8 stagger" aria-label="Key features">
            {pills.map((pill) => (
              <li key={pill} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--p2)] border border-[var(--p3)] text-[var(--p)] text-sm font-semibold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                {pill}
              </li>
            ))}
          </ul>
          <a href={`${APP_URL}/register`} className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold text-white bg-[var(--p)] hover:bg-[#6c52f0] hover:-translate-y-[2px] transition-all shadow-[0_8px_24px_rgba(142,120,251,.35)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
  )
}
