import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Star, MessageSquare } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function ReviewsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  // Calculate rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (r) => community.reviews.filter((rev) => Math.round(rev.rating) === r).length
  )
  const totalReviews = community.reviews.length

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'حول' : 'About'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? `تقييمات ${community.nameAr}` : `${community.name} reviews`}
        </p>
      </div>

      {/* Rating overview */}
      <div className="rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-8">
          {/* Big rating number */}
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{community.rating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(community.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[12px] text-gray-500 mt-1">
              {community.ratingCount} {isAr ? 'تقييم' : 'reviews'}
            </p>
          </div>

          {/* Star breakdown bars */}
          <div className="flex-1 flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star, idx) => {
              const count = ratingCounts[idx]
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-500 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-gray-400 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Write review CTA */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <button className="text-[13px] font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#8e78fb' }}>
            {isAr ? 'اكتب تقييم' : 'Write a Review'}
          </button>
        </div>
      </div>

      {/* Reviews list */}
      {community.reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
          </p>
          <p className="text-[13px] text-gray-500">
            {isAr ? 'كن أول من يكتب تقييم' : 'Be the first to review'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {community.reviews.map((review) => (
            <div key={review.id} className="py-5 flex gap-4">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0"
                style={{ background: review.authorColor }}
              >
                {review.authorInitials}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-gray-900">{review.authorName}</span>
                  <span className="text-[12px] text-gray-400">{review.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(review.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
