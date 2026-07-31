import Link from 'next/link'
import type { ExploreItem } from '@/lib/explore-data'
import { TYPE_CONFIG } from '@/lib/explore-data'
import { useTranslations } from 'next-intl'
import { getExploreImageFallback } from '@/lib/explore-image-fallbacks'
import { ExploreCreatorAvatar } from '@/app/(landing)/(communities)/components/explore-creator-avatar'
import { ExploreSafeImage } from '@/app/(landing)/(communities)/components/explore-safe-image'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`
}

function encodeSegment(value: string | undefined): string | null {
  const v = (value || '').trim()
  return v ? encodeURIComponent(v) : null
}

interface ExploreCardProps {
  item: ExploreItem
  featured?: boolean
}

export function ExploreCard({ item, featured = false }: ExploreCardProps) {
  const type = TYPE_CONFIG[item.type]
  const t = useTranslations('landing.explore')
  const isFree = item.price === 'free' || item.price === 0
  const itemType = item.type
  const imageFallback = getExploreImageFallback(item)

  let ctaLabel: string
  let ctaHref: string

  if (itemType === 'community') {
    if (item.isMember) {
      const creatorSeg = encodeSegment(item.creatorSlug || item.creator)
      const slugSeg = encodeSegment(item.slug || item.id)
      ctaHref = creatorSeg && slugSeg
        ? `/${creatorSeg}/${slugSeg}/home`
        : `/community/${item.slug || item.id}`
      ctaLabel = t('cta.explore')
    } else {
      ctaHref = `/community/${encodeSegment(item.slug || item.id) || item.id}`
      ctaLabel = t('cta.join')
    }
  } else {
    if (item.isMember) {
      const creatorSeg = encodeSegment(item.creatorSlug || item.creator)
      const commSlug = encodeSegment(item.communitySlug)
      const contentId = encodeSegment(item.mongoId || item.id)

      if (creatorSeg && commSlug && contentId) {
        const base = `/${creatorSeg}/${commSlug}`
        switch (itemType) {
          case 'course': ctaHref = `${base}/courses/${contentId}`; break
          case 'challenge': ctaHref = `${base}/challenges/${contentId}`; break
          case 'product': ctaHref = `${base}/products/${contentId}`; break
          case 'session': ctaHref = `${base}/sessions?sessionId=${contentId}`; break
          case 'event': ctaHref = `${base}/events?eventId=${contentId}`; break
          default: ctaHref = item.url; break
        }
      } else {
        ctaHref = item.url
      }

      const ctaMap: Record<string, string> = {
        course: t('cta.explore'),
        challenge: t('cta.start'),
        product: t('cta.download'),
        session: t('cta.book'),
        event: t('cta.register'),
      }
      ctaLabel = ctaMap[itemType] || t('cta.explore')
    } else {
      const commSlug = encodeSegment(item.communitySlug)
      ctaHref = commSlug ? `/community/${commSlug}` : item.url
      ctaLabel = t('cta.viewCommunity')
    }
  }

  return (
    <article
      className={`group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)] transition-all duration-300${
        featured ? ' flex-shrink-0 w-[300px] sm:w-[320px]' : ' w-full'
      }`}
    >
      <div className="relative flex-shrink-0 overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <ExploreSafeImage
          src={item.banner}
          fallbackSrc={imageFallback}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          sizes={featured ? '320px' : '(max-width:640px) 100vw,(max-width:1024px) 50vw,280px'}
        />
        <div className="absolute top-2.5 end-2.5 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
            isFree
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
              : 'bg-black/65 text-white'
          }`}>
            {isFree ? t('priceLabels.free') : `${item.price} ${item.currency || ''}`}
          </span>
          {featured && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm text-white bg-gradient-to-r from-amber-400 to-orange-600">
              {t('vipBadge')}
            </span>
          )}
        </div>
        {item.verified && (
          <span className="absolute top-2.5 start-2.5 w-6 h-6 rounded-full bg-white/92 flex items-center justify-center shadow-sm" aria-label={t('verifiedCreator')}>
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                stroke="#8e78fb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
        {item.isMember && (
          <span className="absolute bottom-2 start-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
            ✓ {t('memberBadge')}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#8e78fb] transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex-shrink-0 ring-[1.5px] ring-gray-200 rounded-full">
            <ExploreCreatorAvatar src={item.creatorAvatar} name={item.creator} />
          </div>
          <span className="text-[11px] text-gray-500 truncate flex items-center gap-1">
            {item.creator}
            {item.verified && (
              <svg viewBox="0 0 12 12" fill="#3b82f6" width="11" height="11" className="flex-shrink-0" aria-hidden="true">
                <circle cx="6" cy="6" r="6"/>
                <path d="M3.5 6l1.7 1.7L8.5 4.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}>
            {t(`types.${itemType}`)}
          </span>
          {item.members !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
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
            <span className="font-semibold text-gray-700">{typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}</span>
            {item.ratingCount ? <span className="text-gray-500">({item.ratingCount})</span> : null}
          </span>
        </div>
        <Link href={ctaHref}
          className={`mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 hover:-translate-y-[1px] ${
            item.isMember ? 'bg-[#8e78fb]' : 'bg-blue-500'
          }`}>
          {ctaLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>
    </article>
  )
}
