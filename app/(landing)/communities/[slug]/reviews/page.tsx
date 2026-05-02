import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Star, MessageSquare } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i < rating ? '#ff9b28' : 'none'} stroke="#ff9b28" strokeWidth="1.5" width="13" height="13" aria-hidden="true">
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

  const breakdown = [5,4,3,2,1].map(n => ({
    stars: n,
    pct: community.reviews.length > 0 ? Math.round((community.reviews.filter(r => r.rating === n).length / community.reviews.length) * 100) : 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>{isAr ? 'التقييمات' : 'Reviews'}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'ما يقوله أعضاء المجتمع' : 'What community members are saying'}</p>
      </div>

      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <span className="text-5xl font-black" style={{ color: 'var(--t1)' }}>{community.rating.toFixed(1)}</span>
          <StarRow rating={Math.round(community.rating)} />
          <span className="text-xs" style={{ color: 'var(--t3)' }}>{community.ratingCount} {isAr ? 'تقييم' : 'reviews'}</span>
        </div>
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
          {breakdown.map(row => (
            <div key={row.stars} className="flex items-center gap-3">
              <span className="text-xs w-3 text-right flex-shrink-0" style={{ color: 'var(--t3)' }}>{row.stars}</span>
              <svg viewBox="0 0 24 24" fill="#ff9b28" width="11" height="11" className="flex-shrink-0" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                <div className="h-2 rounded-full" style={{ width: `${row.pct}%`, background: '#ff9b28' }} />
              </div>
              <span className="text-xs w-6 flex-shrink-0" style={{ color: 'var(--t3)' }}>{row.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {community.isJoined && (
        <button className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-80" style={{ background: 'var(--p2)', color: 'var(--p)', border: '1px solid var(--p3)' }}>
          <Star className="w-4 h-4" strokeWidth={1.7} />
          {isAr ? 'اكتب تقييمك' : 'Write a Review'}
        </button>
      )}

      {community.reviews.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
          <p className="text-sm font-semibold" style={{ color: 'var(--t2)' }}>{isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'كن أول من يكتب تقييماً' : 'Be the first to write a review'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {community.reviews.map(review => (
            <article key={review.id} className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0" style={{ background: review.authorColor }}>{review.authorInitials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{review.authorName}</p>
                    <span className="text-xs" style={{ color: 'var(--t3)' }}>{review.date}</span>
                  </div>
                  <StarRow rating={review.rating} />
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--t2)' }}>{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
