import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Star, MessageSquare, ThumbsUp } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i < rating ? '#ff9b28' : 'none'} stroke="#ff9b28" strokeWidth="1.5" width={size} height={size} aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default async function ReviewsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const breakdown = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: community.reviews.filter(r => r.rating === n).length,
    pct: community.reviews.length > 0
      ? Math.round((community.reviews.filter(r => r.rating === n).length / community.reviews.length) * 100)
      : 0,
  }))

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>
          {isAr ? 'التقييمات' : 'Reviews'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
          {isAr ? 'ما يقوله أعضاء المجتمع' : 'What community members are saying'}
        </p>
      </div>

      {/* Rating overview */}
      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>

        {/* Big rating */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <span className="text-6xl font-black" style={{ color: 'var(--t1)', lineHeight: 1 }}>
            {community.rating.toFixed(1)}
          </span>
          <Stars rating={Math.round(community.rating)} size={16} />
          <span className="text-sm" style={{ color: 'var(--t3)' }}>
            {community.ratingCount} {isAr ? 'تقييم' : 'reviews'}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px self-stretch" style={{ background: 'var(--bd)' }} />

        {/* Breakdown bars */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
          {breakdown.map(row => (
            <div key={row.stars} className="flex items-center gap-3">
              <span className="text-xs w-3 text-right flex-shrink-0 font-semibold" style={{ color: 'var(--t2)' }}>{row.stars}</span>
              <svg viewBox="0 0 24 24" fill="#ff9b28" width="12" height="12" className="flex-shrink-0" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                <div className="h-2.5 rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.stars >= 4 ? '#ff9b28' : row.stars === 3 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span className="text-xs w-8 text-right flex-shrink-0 font-semibold" style={{ color: 'var(--t3)' }}>{row.pct}%</span>
              <span className="text-xs w-4 flex-shrink-0" style={{ color: 'var(--t3)' }}>{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write review CTA */}
      {community.isJoined && (
        <button className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90 active:scale-[.98]"
          style={{ background: 'linear-gradient(135deg, var(--p), #a78bfa)', color: '#fff', boxShadow: '0 8px 24px rgba(142,120,251,.3)' }}>
          <Star className="w-4 h-4" strokeWidth={2} />
          {isAr ? 'اكتب تقييمك الآن' : 'Write a Review'}
        </button>
      )}

      {/* Reviews list */}
      {community.reviews.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--p2)' }}>
            <MessageSquare className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'كن أول من يكتب تقييماً' : 'Be the first to write a review'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {community.reviews.map(review => (
            <article key={review.id}
              className="rounded-2xl p-5 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,.06)]"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-md"
                  style={{ background: review.authorColor }}>
                  {review.authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{review.authorName}</p>
                    <span className="text-xs" style={{ color: 'var(--t3)' }}>{review.date}</span>
                  </div>
                  <Stars rating={review.rating} />
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--t2)' }}>{review.comment}</p>

              <button className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all hover:bg-[var(--bg)]" style={{ color: 'var(--t3)' }}>
                <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.7} />
                {isAr ? 'مفيد' : 'Helpful'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
