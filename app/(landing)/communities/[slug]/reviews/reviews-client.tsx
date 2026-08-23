'use client'

import { useState } from 'react'
import { Star, MessageSquare, ImagePlus, X } from 'lucide-react'
import type { CommunityData } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
}

export default function ReviewsClient({ community, locale }: Props) {
  const isAr = locale === 'ar'
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])

  const ratingCounts = [5, 4, 3, 2, 1].map(
    (r) => community.reviews.filter((rev) => Math.round(rev.rating) === r).length
  )
  const totalReviews = community.reviews.length

  function handleImageUpload() {
    setImages(prev => [...prev, `review-image-${prev.length + 1}.jpg`])
  }

  function submitReview() {
    if (rating === 0) return
    setShowForm(false)
    setRating(0)
    setComment('')
    setImages([])
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'حول' : 'About'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? `تقييمات ${community.nameAr}` : `${community.name} reviews`}
        </p>
      </div>

      {/* About description */}
      <div className="rounded-2xl p-5" style={{ background: '#f9f8fd', border: '1px solid #e8e4ff' }}>
        <p className="text-[14px] leading-relaxed" style={{ color: '#46426a' }}>
          {isAr ? community.descriptionAr : community.description}
        </p>
        <div className="mt-3 flex items-center gap-4 text-[12px]" style={{ color: '#9590b8' }}>
          <span><strong style={{ color: '#1a1730' }}>{community.membersCount}</strong> members</span>
          <span><strong style={{ color: '#1a1730' }}>{community.activeTodayCount}</strong> online today</span>
        </div>
      </div>

      {/* Rating overview */}
      <div className="rounded-2xl p-6" style={{ border: '1px solid #e8e4ff' }}>
        <div className="flex items-start gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{community.rating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(community.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <p className="text-[12px] text-gray-500 mt-1">
              {community.ratingCount} {isAr ? 'تقييم' : 'reviews'}
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star, idx) => {
              const count = ratingCounts[idx]
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-500 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[12px] text-gray-400 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <button onClick={() => setShowForm(true)}
            className="text-[13px] font-medium px-5 py-2.5 rounded-xl text-white cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: '#8e78fb' }}>
            {isAr ? 'اكتب تقييم' : 'Write a Review'}
          </button>
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="rounded-2xl p-5" style={{ border: '1px solid #e8e4ff', background: '#faf8ff' }}>
          <h3 className="text-[15px] font-bold text-gray-900 mb-3">
            {isAr ? 'شاركنا رأيك' : 'Share your experience'}
          </h3>

          {/* Star rating — REQUIRED */}
          <div className="mb-4">
            <p className="text-[12px] font-medium text-gray-600 mb-2">
              {isAr ? 'التقييم (مطلوب)' : 'Rating (required)'} <span className="text-red-400">*</span>
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="cursor-pointer transition-transform hover:scale-110">
                  <Star className={`w-7 h-7 ${(hoverRating || rating) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-[12px] font-medium text-gray-500">
                  {rating === 5 ? '⭐ Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                </span>
              )}
            </div>
            {rating === 0 && (
              <p className="text-[11px] text-red-400 mt-1">{isAr ? 'يرجى اختيار تقييم' : 'Please select a rating'}</p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-4">
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder={isAr ? 'اكتب تقييمك هنا...' : 'Write your review here...'}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-[13px] resize-none outline-none bg-white"
              style={{ border: '1px solid #e8e4ff' }} />
          </div>

          {/* Image upload */}
          <div className="mb-4">
            <p className="text-[12px] font-medium text-gray-600 mb-2">
              {isAr ? 'أضف صور (اختياري)' : 'Add photos (optional)'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden" style={{ background: '#e8e4ff' }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePlus className="w-5 h-5" style={{ color: '#8e78fb' }} />
                  </div>
                  <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <button onClick={handleImageUpload}
                className="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-[#f4f2fc]"
                style={{ border: '2px dashed #e8e4ff' }}>
                <ImagePlus className="w-4 h-4" style={{ color: '#9590b8' }} />
                <span className="text-[9px]" style={{ color: '#9590b8' }}>Upload</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setRating(0); setComment(''); setImages([]) }}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors hover:bg-gray-50"
              style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={submitReview}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: rating > 0 ? '#8e78fb' : '#e8e4ff', color: rating > 0 ? '#fff' : '#9590b8' }}>
              {isAr ? 'نشر التقييم' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {community.reviews.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1px solid #e8e4ff' }}>
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
        <div className="space-y-0">
          {community.reviews.map((review) => (
            <div key={review.id} className="py-5 flex gap-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0"
                style={{ background: review.authorColor }}>
                {review.authorInitials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-gray-900">{review.authorName}</span>
                  <span className="text-[12px] text-gray-400">{review.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(review.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
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
