"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ""

export function CommunitiesCTA() {
  const t = useTranslations("landing.explore")
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)

  return (
    <section className="px-6 md:px-10 py-20" aria-label={t('promoLabel')}>
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-gray-200" style={{ background: '#f0eefe' }}>
          {/* Soft blob accents */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div 
              className="absolute w-[320px] h-[320px] rounded-full blur-[90px] opacity-20 -top-20 -right-16 bg-[#8e78fb]" 
              style={{ animation: 'blobMove 12s ease-in-out infinite' }} 
            />
            <div 
              className="absolute w-[240px] h-[240px] rounded-full blur-[80px] opacity-15 bottom-0 left-10 bg-[#47c7ea]" 
              style={{ animation: 'blobMove 15s ease-in-out infinite', animationDelay: '-5s' }} 
            />
          </div>

          <div className="relative px-8 md:px-14 py-12 md:py-14">
            {/* Two-column layout: left text + CTA, right features */}
            <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
              {/* Left: badge + headline + stats + CTA */}
              <div className="flex-1 min-w-0" style={{ animation: 'fadeDown .6s ease both' }}>
                <div 
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold mb-5 border"
                  style={{ color: '#8e78fb', background: '#f0eefe', borderColor: '#d4c5ff' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {t('promoBadge')}
                </div>

                <h2 className="text-[clamp(22px,3.5vw,38px)] font-black text-gray-900 leading-[1.1] tracking-[-0.02em] mb-3">
                  {t('promoTitle')}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-7 max-w-sm">
                  {t('promoSub')}
                </p>

                {/* Mini stats */}
                <div className="flex items-center gap-6 flex-wrap mb-7">
                  {[
                    { val: '200+', label: t('statCreators'), color: '#8e78fb' },
                    { val: '500+', label: t('statCourses'), color: '#47c7ea' },
                    { val: '50k+', label: t('statMembers'), color: '#ff9b28' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-black leading-none mb-0.5" style={{ color: s.color }}>
                        {s.val}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={withLocale("/dashboard/create-community")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-[1px] shadow-[0_4px_16px_rgba(142,120,251,.35)]"
                    style={{ background: '#8e78fb' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                    {t('promoCTA')}
                  </Link>
                  <Link
                    href={withLocale("/explore")}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border hover:border-[#d4c5ff] hover:text-[#8e78fb] hover:bg-[#f0eefe]"
                    style={{ color: '#6b7280', borderColor: '#e5e7eb', background: '#ffffff' }}
                  >
                    {t('promoSecondary')}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Right: 4 feature pills */}
              <div className="flex-shrink-0 w-full md:w-[340px]">
                <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeUp .6s .2s ease both' }}>
                  {[
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      ),
                      color: '#8e78fb',
                      bg: '#f0eefe',
                      label: t('promoF1'),
                      sub: t('promoF1Sub'),
                    },
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                      ),
                      color: '#47c7ea',
                      bg: '#e8f9fd',
                      label: t('promoF2'),
                      sub: t('promoF2Sub'),
                    },
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                          <line x1="12" y1="1" x2="12" y2="23"/>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      ),
                      color: '#ff9b28',
                      bg: '#fff4e5',
                      label: t('promoF3'),
                      sub: t('promoF3Sub'),
                    },
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                          <circle cx="12" cy="8" r="6"/>
                          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                      ),
                      color: '#f65887',
                      bg: '#fff0f4',
                      label: t('promoF4'),
                      sub: t('promoF4Sub'),
                    },
                  ].map((f, i) => (
                    <div
                      key={f.label}
                      className="flex flex-col gap-2.5 p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default group"
                      style={{ animation: `fadeUp .5s ${0.25 + i * 0.07}s ease both` }}
                    >
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ color: f.color, background: f.bg }}
                      >
                        {f.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 leading-tight mb-0.5">
                          {f.label}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-relaxed">
                          {f.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blobMove {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
