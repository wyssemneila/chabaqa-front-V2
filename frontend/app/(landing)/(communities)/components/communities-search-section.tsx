"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import type { ExploreItem } from "@/lib/explore-data"
import { CATEGORIES, CONTENT_TYPES, TYPE_CONFIG, SORT_OPTIONS, type ContentType } from "@/lib/explore-data"
import { ExploreCard } from "@/app/(landing)/(communities)/components/explore-card"
import { ExploreListRow } from "@/app/(landing)/(communities)/components/explore-list-row"

interface CommunitiesSearchSectionProps {
  items: ExploreItem[]
}

const PER_PAGE = 12

export function CommunitiesSearchSection({ items }: CommunitiesSearchSectionProps) {
  const t = useTranslations("landing.explore")

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeTypes, setActiveTypes] = useState<ContentType[]>([])
  const [sort, setSort] = useState('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  const toggleType = (type: ContentType) => {
    setActiveTypes(prev => prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type])
    setPage(1)
  }

  const clearFilters = () => {
    setSearch(''); setActiveCategory('all'); setActiveTypes([]); setPage(1)
  }

  const filtered = useMemo(() => {
    let filteredItems = [...items]
    if (search.trim()) {
      const q = search.toLowerCase()
      filteredItems = filteredItems.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.desc.toLowerCase().includes(q) || 
        i.creator.toLowerCase().includes(q)
      )
    }
    if (activeCategory !== 'all') filteredItems = filteredItems.filter(i => i.category === activeCategory)
    if (activeTypes.length > 0) filteredItems = filteredItems.filter(i => activeTypes.includes(i.type))
    
    if (sort === 'rating') filteredItems.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (sort === 'price-low') filteredItems.sort((a, b) => (a.price === 'free' ? 0 : +a.price) - (b.price === 'free' ? 0 : +b.price))
    else if (sort === 'price-high') filteredItems.sort((a, b) => (b.price === 'free' ? 0 : +b.price) - (a.price === 'free' ? 0 : +a.price))
    else if (sort === 'popular') filteredItems.sort((a, b) => (b.members ?? 0) - (a.members ?? 0))
    
    return filteredItems
  }, [items, search, activeCategory, activeTypes, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const hasFilters = search || activeCategory !== 'all' || activeTypes.length > 0

  const CATEGORY_LABELS: Record<string, string> = {
    all: t('catAll'), fitness: t('catFitness'), education: t('catEducation'),
    technology: t('catTechnology'), business: t('catBusiness'), creative: t('catCreative'), language: t('catLanguage'),
  }
  const TYPE_LABELS: Record<ContentType, string> = {
    community: t('typeCommunity'), course: t('typeCourse'), challenge: t('typeChallenge'),
    product: t('typeProduct'), session: t('typeSession'), event: t('typeEvent'),
  }

  function pageRange() {
    const range: number[] = []
    const delta = 1
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i)
    if (range[0] > 1) { range.unshift(-1); range.unshift(1) }
    if (range[range.length - 1] < totalPages) { range.push(-2); range.push(totalPages) }
    return range
  }

  return (
    <section className="pb-16 px-6 md:px-10 bg-white" aria-label={t('gridLabel')}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-6 shadow-[0_2px_16px_rgba(142,120,251,.07)] space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative w-full sm:flex-1">
              <div className="absolute inset-y-0 start-3.5 flex items-center pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input
                type="search" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder={t('searchPlaceholder')} aria-label={t('searchLabel')}
                className="w-full ps-9 pe-9 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#8e78fb] focus:outline-none text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm transition-colors"
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1) }} aria-label={t('clearSearch')}
                  className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-900 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="flex gap-2 sm:gap-2.5 sm:flex-shrink-0">
              <div className="relative flex-1 sm:flex-shrink-0 sm:flex-none">
                <select
                  value={activeCategory}
                  onChange={e => { setActiveCategory(e.target.value); setPage(1) }}
                  aria-label={t('categoryLabel')}
                  className="appearance-none w-full h-9 ps-2.5 pe-7 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 focus:outline-none focus:border-[#8e78fb] hover:border-[#d4c5ff] cursor-pointer transition-colors"
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
              <div className="relative flex-1 sm:flex-shrink-0 sm:flex-none">
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); setPage(1) }}
                  aria-label={t('sortLabel')}
                  className="appearance-none w-full h-9 ps-2.5 pe-7 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 focus:outline-none focus:border-[#8e78fb] hover:border-[#d4c5ff] cursor-pointer transition-colors"
                >
                  {SORT_OPTIONS.map(opt => {
                    const sortKeyMap: Record<string, any> = {
                      'popular': t('sortPopular'),
                      'newest': t('sortNewest'),
                      'rating': t('sortRating'),
                      'price-low': t('sortPriceLow'),
                      'price-high': t('sortPriceHigh')
                    };
                    const label = sortKeyMap[opt.value] || opt.label;
                    return <option key={opt.value} value={opt.value}>{label}</option>
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 end-2 flex items-center" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap" role="group" aria-label={t('typeLabel')}>
            {CONTENT_TYPES.map(type => {
              const cfg = TYPE_CONFIG[type]
              const active = activeTypes.includes(type)
              return (
                <button key={type} onClick={() => toggleType(type)} aria-pressed={active}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={active
                    ? { background: cfg.color, color: '#fff', borderColor: cfg.color }
                    : { background: '#f9fafb', color: cfg.color, borderColor: cfg.border }
                  }>
                  {TYPE_LABELS[type]}
                </button>
              )
            })}
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 border border-gray-200 hover:text-red-500 hover:border-red-300 transition-all ms-auto">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="11" height="11" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                {t('clearAll')}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{filtered.length}</span>{' '}
            {t('resultsOf')}{' '}
            <span className="font-bold text-gray-900">{items.length}</span>{' '}
            {t('results')}
          </p>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} aria-label={t('gridView')}
              className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-[#8e78fb] text-white' : 'bg-white text-gray-500 hover:text-[#8e78fb]'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} aria-label={t('listView')}
              className={`px-3 py-2 transition-colors border-s border-gray-200 ${viewMode === 'list' ? 'bg-[#8e78fb] text-white' : 'bg-white text-gray-500 hover:text-[#8e78fb]'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-10 flex-wrap gap-4" role="navigation" aria-label={t('paginationLabel')}>
                <span className="text-sm text-gray-500">
                  {t('pageOf', { page, total: totalPages })}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} aria-label={t('firstPage')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#8e78fb] hover:border-[#d4c5ff] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
                  </button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label={t('previousPage')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#8e78fb] hover:border-[#d4c5ff] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  {pageRange().map((n, idx) =>
                    n < 0 ? (
                      <span key={`gap${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-500">…</span>
                    ) : (
                      <button key={n} onClick={() => setPage(n)} aria-current={page === n ? 'page' : undefined}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold border transition-all ${
                          page === n ? 'bg-[#8e78fb] text-white border-[#8e78fb]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#d4c5ff] hover:text-[#8e78fb]'
                        }`}>
                        {n}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label={t('nextPage')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#8e78fb] hover:border-[#d4c5ff] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label={t('lastPage')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#8e78fb] hover:border-[#d4c5ff] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f0eefe] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8e78fb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">{t('noResults')}</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-5">{t('noResultsSub')}</p>
            <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#8e78fb] hover:bg-[#7a64f0] transition-colors">
              {t('clearAll')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
