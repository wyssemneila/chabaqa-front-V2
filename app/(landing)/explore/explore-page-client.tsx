'use client'
import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import {
  EXPLORE_ITEMS, FEATURED_COMMUNITIES, CATEGORIES, CONTENT_TYPES,
  TYPE_CONFIG, SORT_OPTIONS,
  type ContentType, type ExploreItem,
} from '@/lib/explore-data-landing'
const APP_URL = 'https://app.chabaqa.io'

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`
}

const CTA_LABEL: Record<ContentType, string> = {
  community: 'Explore',
  course:    'Start',
  challenge: 'Join',
  product:   'Download',
  session:   'Book',
  event:     'Register',
}

// ── Unified card (Featured + Regular share the same component) ─────────────
function ExploreCard({
  item, featured = false,
}: { item: ExploreItem; featured?: boolean }) {
  const t    = useTranslations('exploreUI')
  const type = TYPE_CONFIG[item.type]

  return (
    <article
      className={`group flex flex-col bg-[var(--white)] border border-[var(--bd)] rounded-2xl overflow-hidden hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)] transition-all duration-300${
        featured ? ' flex-shrink-0 w-[300px] sm:w-[320px]' : ' w-full'
      }`}
    >
      {/* ── Banner ── */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <Image
          src={item.banner} alt={item.title} fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          sizes={featured ? '320px' : '(max-width:640px) 100vw,(max-width:1024px) 50vw,280px'}
        />

        {/* Badge row: Free/price  — VIP only on featured */}
        <div className="absolute top-2.5 end-2.5 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
            item.price === 'free'
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
              : 'bg-black/65 text-white'
          }`}>
            {item.price === 'free' ? t('free') : `${item.price} ${item.currency}`}
          </span>
          {featured && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm text-white"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#d97706)' }}>
              VIP
            </span>
          )}
        </div>

        {/* Verified */}
        {item.verified && (
          <span className="absolute top-2.5 start-2.5 w-6 h-6 rounded-full bg-white/92 flex items-center justify-center shadow-sm" aria-label="Verified Creator">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                stroke="#8e78fb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">

        {/* Title */}
        <h3 className="text-sm font-bold text-[var(--t1)] leading-snug line-clamp-2 group-hover:text-[var(--p)] transition-colors">
          {item.title}
        </h3>

        {/* Creator */}
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-[1.5px] ring-[var(--bd)]">
            {item.creatorAvatar
              ? <Image src={item.creatorAvatar} alt={item.creator} fill className="object-cover" sizes="24px" />
              : <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: item.creatorColor }}>{item.creatorInitials}</div>
            }
          </div>
          <span className="text-[11px] text-[var(--t3)] truncate flex items-center gap-1">
            {item.creator}
            {item.verified && (
              <svg viewBox="0 0 12 12" fill="#3b82f6" width="11" height="11" className="flex-shrink-0" aria-hidden="true">
                <circle cx="6" cy="6" r="6"/>
                <path d="M3.5 6l1.7 1.7L8.5 4.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </span>
        </div>

        {/* Stats row — type badge + members + rating only */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}>
            {type.label}
          </span>
          {item.members !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--t3)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {fmt(item.members)}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] ms-auto flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="#ff9b28" width="11" height="11" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="font-semibold text-[var(--t2)]">{item.rating}</span>
            {item.ratingCount && <span className="text-[var(--t3)]">({item.ratingCount})</span>}
          </span>
        </div>

        {/* ── CTA button — always purple, always at bottom ── */}
        <a href={`${APP_URL}/explore`}
          className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 hover:-translate-y-[1px]"
          style={{ background: 'var(--p)' }}>
          {CTA_LABEL[item.type]}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
      </div>
    </article>
  )
}

// ── List Row ───────────────────────────────────────────────────────────────
function ExploreListRow({ item }: { item: ExploreItem }) {
  const t    = useTranslations('exploreUI')
  const type = TYPE_CONFIG[item.type]
  return (
    <article className="group flex gap-4 bg-[var(--white)] border border-[var(--bd)] rounded-2xl overflow-hidden hover:shadow-[0_8px_32px_rgba(142,120,251,.13)] hover:-translate-y-[2px] transition-all duration-300 p-3">
      <div className="relative flex-shrink-0 w-[140px] sm:w-[180px] rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <Image src={item.banner} alt={item.title} fill className="object-cover" sizes="180px" />
        <div className="absolute top-2 end-2 flex gap-1">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.price === 'free' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' : 'bg-black/60 text-white'}`}>
            {item.price === 'free' ? t('free') : `${item.price} ${item.currency}`}
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
        <div>
          <h3 className="text-sm font-bold text-[var(--t1)] line-clamp-1 group-hover:text-[var(--p)] transition-colors mb-1">{item.title}</h3>
          <p className="text-[11px] text-[var(--t3)] line-clamp-2 leading-relaxed">{item.desc}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <div className="flex items-center gap-1.5">
            <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[var(--bd)]">
              {item.creatorAvatar
                ? <Image src={item.creatorAvatar} alt={item.creator} fill className="object-cover" sizes="20px" />
                : <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-white" style={{ background: item.creatorColor }}>{item.creatorInitials}</div>
              }
            </div>
            <span className="text-[11px] text-[var(--t3)] font-medium">{item.creator}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}>{type.label}</span>
          {item.members !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--t3)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              {fmt(item.members)}
            </span>
          )}
          {item.rating !== undefined && (
            <span className="flex items-center gap-1 text-[11px]">
              <svg viewBox="0 0 24 24" fill="#ff9b28" width="10" height="10" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="font-semibold text-[var(--t2)]">{item.rating}</span>
            </span>
          )}
          <span className={`ms-auto text-xs font-black flex-shrink-0 ${item.price === 'free' ? 'text-emerald-500' : 'text-[var(--t1)]'}`}>
            {item.price === 'free' ? t('free') : `${item.price} ${item.currency}`}
          </span>
        </div>
      </div>
    </article>
  )
}

const PER_PAGE = 12

// ── Main ───────────────────────────────────────────────────────────────────
export default function ExploreClient() {
  const t = useTranslations('exploreUI')

  const [search,         setSearch]         = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeTypes,    setActiveTypes]    = useState<ContentType[]>([])
  const [sort,           setSort]           = useState('popular')
  const [viewMode,       setViewMode]       = useState<'grid' | 'list'>('grid')
  const [page,           setPage]           = useState(1)

  const featuredRef = useRef<HTMLDivElement>(null)
  function scrollFeatured(dir: 1 | -1) {
    featuredRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })
  }

  const toggleType = (type: ContentType) => {
    setActiveTypes(prev => prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type])
    setPage(1)
  }
  const clearFilters = () => {
    setSearch(''); setActiveCategory('all'); setActiveTypes([]); setPage(1)
  }

  const filtered = useMemo(() => {
    let items = [...EXPLORE_ITEMS]
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.creator.toLowerCase().includes(q))
    }
    if (activeCategory !== 'all')   items = items.filter(i => i.category === activeCategory)
    if (activeTypes.length > 0)     items = items.filter(i => activeTypes.includes(i.type))
    if (sort === 'rating')          items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (sort === 'price-low')  items.sort((a, b) => (a.price === 'free' ? 0 : +a.price) - (b.price === 'free' ? 0 : +b.price))
    else if (sort === 'price-high') items.sort((a, b) => (b.price === 'free' ? 0 : +b.price) - (a.price === 'free' ? 0 : +a.price))
    else if (sort === 'popular')    items.sort((a, b) => (b.members ?? 0) - (a.members ?? 0))
    return items
  }, [search, activeCategory, activeTypes, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const hasFilters = search || activeCategory !== 'all' || activeTypes.length > 0

  const CATEGORY_LABELS: Record<string, string> = {
    all: t('catAll'), fitness: t('catFitness'), education: t('catEducation'),
    technology: t('catTechnology'), business: t('catBusiness'), creative: t('catCreative'), language: t('catLanguage'),
  }
  const TYPE_LABELS: Record<ContentType, string> = {
    community: t('typeCommunity'), course: t('typeCourse'), challenge: t('typeChallenge'),
    product: t('typeProduct'), session: t('typeSession'), event: t('typeEvent'),
  }

  // page range for pagination
  function pageRange() {
    const range: number[] = []
    const delta = 1
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i)
    if (range[0] > 1) { range.unshift(-1); range.unshift(1) }
    if (range[range.length - 1] < totalPages) { range.push(-2); range.push(totalPages) }
    return range
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      {/* ════════════════════════════════════════════════════════════════
          SECTION 1 — Hero + Featured Communities (always visible)
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-12 overflow-hidden" aria-label={t('heroLabel')}>
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true"
          style={{ backgroundImage: 'linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%,black 30%,transparent 100%)' }} />
        <div className="absolute w-[480px] h-[300px] rounded-full blur-[80px] opacity-[0.10] -top-16 -left-24 bg-[var(--p)] pointer-events-none" aria-hidden="true" />
        <div className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.08] top-8 -right-16 bg-[var(--cyan)] pointer-events-none" aria-hidden="true" />

        {/* Headline — centered + animated */}
        <div className="relative px-6 md:px-10 max-w-6xl mx-auto mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-5"
            style={{ background: 'var(--p2)', border: '1.5px solid var(--p3)', color: 'var(--p)', animation: 'fadeDown .6s ease both' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {t('badge')}
          </div>
          <h1 className="text-[clamp(22px,4.8vw,52px)] font-black text-[var(--t1)] leading-tight tracking-[-0.03em] mb-4 whitespace-nowrap"
            style={{ animation: 'fadeDown .65s .08s ease both' }}>
            {t('heroTitle1')}{' '}
            <span className="relative inline-block">
              <span className="relative z-10" style={{ color: 'var(--p)' }}>{t('heroTitle2')}</span>
              {/* Animated curved underline */}
              <svg className="absolute -bottom-1 left-0 w-full overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 7 Q25 2 50 6 Q75 10 100 5" fill="none" stroke="var(--orange)" strokeWidth="2"
                  strokeLinecap="round" pathLength="1"
                  style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawLine 0.9s 0.65s ease-out forwards' }}/>
              </svg>
            </span>
          </h1>
          <p className="text-[var(--t3)] text-[clamp(14px,2vw,16px)] leading-relaxed max-w-xl mx-auto"
            style={{ animation: 'fadeDown .65s .16s ease both' }}>
            {t('heroSub')}
          </p>
        </div>

        {/* Featured Communities carousel */}
        <div className="relative px-6 md:px-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--p)] mb-0.5">{t('featuredEyebrow')}</div>
              <h2 className="text-lg font-black text-[var(--t1)]">{t('featuredTitle')}</h2>
            </div>
          </div>

          {/* Carousel wrapper with side arrows */}
          <div className="relative">
            {/* Left arrow */}
            <button onClick={() => scrollFeatured(-1)} aria-label="Scroll left"
              className="absolute -start-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--white)] border border-[var(--bd)] shadow-md text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {/* Right arrow */}
            <button onClick={() => scrollFeatured(1)} aria-label="Scroll right"
              className="absolute -end-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--white)] border border-[var(--bd)] shadow-md text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Scroll track */}
            <div ref={featuredRef} className="flex gap-4 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {FEATURED_COMMUNITIES.map(item => (
                <ExploreCard key={item.id} item={item} featured />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2 — Search + Filters + Grid
      ════════════════════════════════════════════════════════════════ */}
      <section className="pb-16 px-6 md:px-10" aria-label={t('gridLabel')}>
        <div className="max-w-6xl mx-auto">

          {/* ── Smart filter block ── */}
          <div className="bg-[var(--white)] border border-[var(--bd)] rounded-2xl p-3 mb-6 shadow-[0_2px_16px_rgba(142,120,251,.07)] space-y-2.5">

            {/* Row 1: Search (full width mobile) + dropdowns side-by-side below on mobile */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search — always full width on mobile */}
              <div className="relative w-full sm:flex-1">
                <div className="absolute inset-y-0 start-3.5 flex items-center pointer-events-none" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <input
                  type="search" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder={t('searchPlaceholder')} aria-label={t('searchLabel')}
                  className="w-full ps-9 pe-9 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] focus:border-[var(--p)] focus:outline-none text-[var(--t1)] placeholder:text-[var(--t3)] text-xs sm:text-sm transition-colors"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1) }} aria-label={t('clearSearch')}
                    className="absolute inset-y-0 end-3 flex items-center text-[var(--t3)] hover:text-[var(--t1)] transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdowns row — side by side on all screen sizes */}
              <div className="flex gap-2 sm:gap-2.5 sm:flex-shrink-0">
                {/* Category */}
                <div className="relative flex-1 sm:flex-shrink-0 sm:flex-none">
                  <select
                    value={activeCategory}
                    onChange={e => { setActiveCategory(e.target.value); setPage(1) }}
                    aria-label={t('categoryLabel')}
                    className="appearance-none w-full h-9 ps-2.5 pe-7 rounded-xl text-xs font-semibold bg-[var(--bg)] text-[var(--t2)] border border-[var(--bd)] focus:outline-none focus:border-[var(--p)] hover:border-[var(--p3)] cursor-pointer transition-colors"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 end-2 flex items-center" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Sort */}
                <div className="relative flex-1 sm:flex-shrink-0 sm:flex-none">
                  <select
                    value={sort}
                    onChange={e => { setSort(e.target.value); setPage(1) }}
                    aria-label={t('sortLabel')}
                    className="appearance-none w-full h-9 ps-2.5 pe-7 rounded-xl text-xs font-semibold bg-[var(--bg)] text-[var(--t2)] border border-[var(--bd)] focus:outline-none focus:border-[var(--p)] hover:border-[var(--p3)] cursor-pointer transition-colors"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 end-2 flex items-center" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Type chips */}
            <div className="flex gap-2 flex-wrap" role="group" aria-label={t('typeLabel')}>
              {CONTENT_TYPES.map(type => {
                const cfg    = TYPE_CONFIG[type]
                const active = activeTypes.includes(type)
                return (
                  <button key={type} onClick={() => toggleType(type)} aria-pressed={active}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={active
                      ? { background: cfg.color, color: '#fff', borderColor: cfg.color }
                      : { background: 'var(--bg)', color: cfg.color, borderColor: cfg.border }
                    }>
                    {TYPE_LABELS[type]}
                  </button>
                )
              })}
              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--t3)] border border-[var(--bd)] hover:text-red-500 hover:border-red-300 transition-all ms-auto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="11" height="11" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  {t('clearAll')}
                </button>
              )}
            </div>
          </div>

          {/* ── Toolbar: count + view toggle ── */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--t3)]">
              <span className="font-bold text-[var(--t1)]">{filtered.length}</span>{' '}
              {t('resultsOf')}{' '}
              <span className="font-bold text-[var(--t1)]">{EXPLORE_ITEMS.length}</span>{' '}
              {t('results')}
            </p>
            <div className="flex items-center border border-[var(--bd)] rounded-xl overflow-hidden">
              <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} aria-label="Grid view"
                className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-[var(--p)] text-white' : 'bg-[var(--white)] text-[var(--t3)] hover:text-[var(--p)]'}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} aria-label="List view"
                className={`px-3 py-2 transition-colors border-s border-[var(--bd)] ${viewMode === 'list' ? 'bg-[var(--p)] text-white' : 'bg-[var(--white)] text-[var(--t3)] hover:text-[var(--p)]'}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          {paginated.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginated.map(item => <ExploreCard key={item.id} item={item} />)}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {paginated.map(item => <ExploreListRow key={item.id} item={item} />)}
                </div>
              )}

              {/* ── Pagination (screenshot-style: "Page X of Y" + << < 1 2 > >>) ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-10 flex-wrap gap-4" role="navigation" aria-label="Pagination">
                  {/* Page label */}
                  <span className="text-sm text-[var(--t3)]">
                    Page{' '}
                    <span className="font-bold text-[var(--t1)]">{page}</span>
                    {' '}of{' '}
                    <span className="font-bold text-[var(--t1)]">{totalPages}</span>
                  </span>

                  {/* Nav buttons */}
                  <div className="flex items-center gap-1">
                    {/* First */}
                    <button onClick={() => setPage(1)} disabled={page === 1} aria-label="First page"
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--bd)] bg-[var(--white)] text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
                    </button>
                    {/* Prev */}
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page"
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--bd)] bg-[var(--white)] text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>

                    {/* Page numbers */}
                    {pageRange().map((n, idx) =>
                      n < 0 ? (
                        <span key={`gap${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-[var(--t3)]">…</span>
                      ) : (
                        <button key={n} onClick={() => setPage(n)} aria-current={page === n ? 'page' : undefined}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold border transition-all ${
                            page === n
                              ? 'bg-[var(--p)] text-white border-[var(--p)]'
                              : 'bg-[var(--white)] text-[var(--t2)] border-[var(--bd)] hover:border-[var(--p3)] hover:text-[var(--p)]'
                          }`}>
                          {n}
                        </button>
                      )
                    )}

                    {/* Next */}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page"
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--bd)] bg-[var(--white)] text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    {/* Last */}
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Last page"
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--bd)] bg-[var(--white)] text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--p2)] flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--p)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-[var(--t1)] mb-2">{t('noResults')}</h3>
              <p className="text-sm text-[var(--t3)] max-w-xs mb-5">{t('noResultsSub')}</p>
              <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--p)] hover:bg-[#7a64f0] transition-colors">
                {t('clearAll')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3 — Light Promo
      ════════════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-10 pb-20" aria-label={t('promoLabel')}>
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-[var(--bd)]" style={{ background: 'var(--section-alt, #f0eefe)' }}>

            {/* Soft blob accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
              <div className="absolute w-[320px] h-[320px] rounded-full blur-[90px] opacity-20 -top-20 -right-16 bg-[var(--p)]" style={{ animation: 'blobMove 12s ease-in-out infinite' }} />
              <div className="absolute w-[240px] h-[240px] rounded-full blur-[80px] opacity-15 bottom-0 left-10 bg-[var(--cyan)]" style={{ animation: 'blobMove 15s ease-in-out infinite', animationDelay: '-5s' }} />
            </div>

            <div className="relative px-8 md:px-14 py-12 md:py-14">

              {/* Two-column layout: left text + CTA, right features */}
              <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">

                {/* Left: badge + headline + stats + CTA */}
                <div className="flex-1 min-w-0" style={{ animation: 'fadeDown .6s ease both' }}>
                  <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold mb-5 border"
                    style={{ color: 'var(--p)', background: 'var(--p2)', borderColor: 'var(--p3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {t('promoBadge')}
                  </div>

                  <h2 className="text-[clamp(22px,3.5vw,38px)] font-black text-[var(--t1)] leading-[1.1] tracking-[-0.02em] mb-3">
                    {t('promoTitle')}
                  </h2>
                  <p className="text-sm text-[var(--t2)] leading-relaxed mb-7 max-w-sm">
                    {t('promoSub')}
                  </p>

                  {/* Mini stats */}
                  <div className="flex items-center gap-6 flex-wrap mb-7">
                    {[
                      { val: '200+', label: t('statCreators'), color: '#8e78fb' },
                      { val: '500+', label: t('statCourses'),  color: '#47c7ea' },
                      { val: '50k+', label: t('statMembers'),  color: '#ff9b28' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-2xl font-black leading-none mb-0.5" style={{ color: s.color }}>{s.val}</div>
                        <div className="text-[10px] text-[var(--t3)] font-medium uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <a href={`${APP_URL}/register`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-[1px] shadow-[0_4px_16px_rgba(142,120,251,.35)]"
                      style={{ background: 'var(--p)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                      {t('promoCTA')}
                    </a>
                    <a href={`${APP_URL}/explore`}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border hover:border-[var(--p3)] hover:text-[var(--p)] hover:bg-[var(--p2)]"
                      style={{ color: 'var(--t2)', borderColor: 'var(--bd)', background: 'var(--white)' }}>
                      {t('promoSecondary')}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Right: 4 feature pills */}
                <div className="flex-shrink-0 w-full md:w-[340px]">
                  <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeUp .6s .2s ease both' }}>
                    {[
                      {
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        ),
                        color: '#8e78fb', bg: '#f0eefe', label: t('promoF1'), sub: t('promoF1Sub'),
                      },
                      {
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                          </svg>
                        ),
                        color: '#47c7ea', bg: '#e8f9fd', label: t('promoF2'), sub: t('promoF2Sub'),
                      },
                      {
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                        ),
                        color: '#ff9b28', bg: '#fff4e5', label: t('promoF3'), sub: t('promoF3Sub'),
                      },
                      {
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                          </svg>
                        ),
                        color: '#f65887', bg: '#fff0f4', label: t('promoF4'), sub: t('promoF4Sub'),
                      },
                    ].map((f, i) => (
                      <div key={f.label}
                        className="flex flex-col gap-2.5 p-4 rounded-2xl border border-[var(--bd)] bg-[var(--white)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default group"
                        style={{ animation: `fadeUp .5s ${0.25 + i * 0.07}s ease both` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ color: f.color, background: f.bg }}>
                          {f.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--t1)] leading-tight mb-0.5">{f.label}</div>
                          <div className="text-[10px] text-[var(--t3)] leading-relaxed">{f.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
