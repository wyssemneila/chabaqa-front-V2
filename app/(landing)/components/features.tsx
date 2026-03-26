'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FEATURES, FEATURE_PLACEHOLDERS } from '@/lib/landing-data'
import FeatureIcons from '@/components/ui/FeatureIcons'

export function Features() {
  const t = useTranslations('landing.features')
  const items = t.raw('items') as { id: string; name: string; desc: string }[]

  const [active, setActive] = useState(items[0]?.id ?? 'community')
  const feature      = FEATURES.find(f => f.id === active) ?? FEATURES[0]
  const currentVideo = FEATURE_PLACEHOLDERS[active]

  return (
    <section className="py-24 px-6 md:px-10 bg-[var(--white)]" id="features" aria-label="Features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 reveal">
          <div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--p)] mb-3">{t('eyebrow')}</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black text-[var(--t1)] mb-4">{t('title')}</h2>
          <p className="text-[var(--t3)] max-w-xl mx-auto">{t('sub')}</p>
        </div>

        {/* Mobile: pill tabs row + centered video */}
        <div className="md:hidden mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {items.map((f) => {
              const raw = FEATURES.find(r => r.id === f.id)!
              return (
                <button key={f.id} onClick={() => setActive(f.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                    active === f.id
                      ? 'bg-[var(--p)] text-white border-[var(--p)]'
                      : 'bg-[var(--white)] text-[var(--t2)] border-[var(--bd)] hover:border-[var(--p3)] hover:text-[var(--p)]'
                  }`}>
                  <FeatureIcons id={f.id} color={active === f.id ? '#fff' : raw.iconColor} size={12} />
                  {f.name}
                </button>
              )
            })}
          </div>
          <div className="rounded-2xl overflow-hidden border border-[var(--bd)] bg-[var(--white)] shadow-[0_8px_40px_rgba(142,120,251,.1)] w-full">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg)]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
              <span className="text-xs text-[var(--t3)] ms-2 truncate">{feature.url}</span>
            </div>
            <div className="relative aspect-video" style={{ background: `linear-gradient(135deg,${feature.iconBg},var(--bg))` }}>
              <video key={active} src={currentVideo.video} autoPlay loop muted playsInline preload="none" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Desktop: sidebar tabs + video */}
        <div className="hidden md:grid md:grid-cols-[300px_1fr] gap-8 items-start">
          <div className="flex flex-col gap-2">
            {items.map((f) => {
              const raw = FEATURES.find(r => r.id === f.id)!
              return (
                <button key={f.id} onClick={() => setActive(f.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-start transition-all border ${
                    active === f.id
                      ? 'border-[var(--p3)] bg-[var(--p2)] shadow-[0_4px_16px_rgba(142,120,251,.15)]'
                      : 'border-transparent bg-transparent hover:bg-[var(--p2)] hover:border-[var(--bd)]'
                  }`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: raw.iconBg, border: `1.5px solid ${raw.iconBorder}` }}>
                    <FeatureIcons id={f.id} color={raw.iconColor} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--t1)]">{f.name}</div>
                    <div className="text-xs text-[var(--t3)] mt-0.5">{f.desc}</div>
                  </div>
                  <span className="ms-auto text-[var(--t3)] text-sm">→</span>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl overflow-hidden border border-[var(--bd)] bg-[var(--white)] shadow-[0_8px_40px_rgba(142,120,251,.1)]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg)]">
              <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              <span className="text-xs text-[var(--t3)] ms-2">{feature.url}</span>
            </div>
            <div className="relative aspect-video" style={{ background: `linear-gradient(135deg,${feature.iconBg},var(--bg))` }}>
              <video key={active} src={currentVideo.video} autoPlay loop muted playsInline preload="none" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
