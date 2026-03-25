"use client"

import { ReviewsSection } from "./reviews-section"

interface CommunityReviewsSectionProps {
  communityId: string
  showForm?: boolean
  onRefresh?: () => Promise<void>
}

export function CommunityReviewsSection({ 
  communityId, 
  showForm = true, 
  onRefresh 
}: CommunityReviewsSectionProps) {
  return (
    <ReviewsSection
      relatedId={communityId}
      relatedModel="Community"
      showForm={showForm}
      onRefresh={onRefresh}
      title="Community Reviews"
      description="What members are saying about this community"
      emptyMessage="No reviews yet. Be the first to review this community!"
      promptMessage="Share your experience! Help others by leaving a review for this community."
    />
  )
}
