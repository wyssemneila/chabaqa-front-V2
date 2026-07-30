import Link from 'next/link'
import type { ExploreItem } from '@/lib/explore-data'
import { TYPE_CONFIG } from '@/lib/explore-data'
import { useTranslations } from 'next-intl'
import { ExploreSafeImage } from './explore-safe-image'
import { getExploreAvatarFallback, getExploreImageFallback } from '@/lib/explore-image-fallbacks'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`
}

function encodeSegment(value: string | undefined): string | null {
  const v = (value || '').trim()
  return v ? encodeURIComponent(v) : null
}

interface ExploreListRowProps {
  item: ExploreItem
}

export function ExploreListRow({ item }: ExploreListRowProps) {
  const type = TYPE_CONFIG[item.type]
  const itemType = item.type
  const t = useTranslations('landing.explore')
  const imageFallback = getExploreImageFallback(item)
  const avatarFallback = getExploreAvatarFallback(item)

  // Resolve href based on membership
  let href: string
  if (itemType === 'community') {
    if (item.isMember) {
      const creatorSeg = encodeSegment(item.creatorSlug || item.creator)
      const slugSeg = encodeSegment(item.slug || item.id)
      href = creatorSeg && slugSeg
        ? `/${creatorSeg}/${slugSeg}/home`
        : `/community/${item.slug || item.id}`
    } else {
      href = `/community/${encodeSegment(item.slug || item.id) || item.id}`
    }
  } else if (item.isMember) {
    const creatorSeg = encodeSegment(item.creatorSlug || item.creator)
    const commSlug = encodeSegment(item.communitySlug)
    const contentId = encodeSegment(item.mongoId || item.id)
    if (creatorSeg && commSlug && contentId) {
      const base = `/${creatorSeg}/${commSlug}`
      switch (itemType) {
        case 'course': href = `${base}/courses/${contentId}`; break
        case 'challenge': href = `${base}/challenges/${contentId}`; break
        case 'product': href = `${base}/products/${contentId}`; break
        case 'session': href = `${base}/sessions?sessionId=${contentId}`; break
        case 'event': href = `${base}/events?eventId=${contentId}`; break
        default: href = item.url; break
      }
    } else {
      href = item.url
    }
  } else {
    const commSlug = encodeSegment(item.communitySlug)
    href = commSlug ? `/community/${commSlug}` : item.url
  }

  return (
    <Link href={href} className="block">
      <article className="group flex gap-4 bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-[0_8px_32px_rgba(142,120,251,.13)] hover:-translate-y-[2px] transition-all duration-300 p-3">
        <div className="relative flex-shrink-0 w-[140px] sm:w-[180px] rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <ExploreSafeImage src={item.banner} fallbackSrc={imageFallback} alt={item.title} fill className="object-cover" sizes="180px" />
          <div className="absolute top-2 end-2 flex gap-1">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.price === 'free' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' : 'bg-black/60 text-white'}`}>
              {item.price === 'free' ? t('priceLabels.free') : `${item.price} ${item.currency}`}
            </span>
          </div>
          {item.isMember && (
            <span className="absolute bottom-1.5 start-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
              ✓ {t('memberBadge')}
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-[#8e78fb] transition-colors mb-1">{item.title}</h3>
            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{item.desc}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <div className="flex items-center gap-1.5">
              <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                {item.creatorAvatar
                  ? <ExploreSafeImage src={item.creatorAvatar} fallbackSrc={avatarFallback} alt={item.creator} fill className="object-cover" sizes="20px" />
                  : <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-white" style={{ background: item.creatorColor }}>{item.creatorInitials}</div>
                }
              </div>
              <span className="text-[11px] text-gray-500 font-medium">{item.creator}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}>{t(`types.${itemType}`)}</span>
            {item.members !== undefined && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
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
                <span className="font-semibold text-gray-700">{typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}</span>
              </span>
            )}
            <span className={`ms-auto text-xs font-black flex-shrink-0 ${item.price === 'free' ? 'text-emerald-500' : 'text-gray-900'}`}>
              {item.price === 'free' ? t('priceLabels.free') : `${item.price} ${item.currency}`}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
