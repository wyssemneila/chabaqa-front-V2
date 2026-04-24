"use client"

import { useState, useRef } from "react"
import { FeaturedCommunityCard } from "@/components/featured-community-card"
import { FeaturedCommunitiesClient } from "@/components/communities/featured-communities-client"
import { Crown, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Community {
  id: number
  name: string
  creator: string
  creatorAvatar: string
  description: string
  category: string
  members: number
  rating: number
  price: number
  priceType: string
  image: string
  tags: string[]
  featured: boolean
  verified: boolean
}

interface FeaturedCommunitiesProps {
  communities: Community[]
}

export function FeaturedCommunities({ communities }: FeaturedCommunitiesProps) {
  const featuredCommunities = communities.filter((c) => c.featured)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  if (featuredCommunities.length === 0) return null

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: "smooth" })
      setTimeout(checkScrollButtons, 300)
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: "smooth" })
      setTimeout(checkScrollButtons, 300)
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-chabaqa-accent/5 via-white to-chabaqa-secondary1/5 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 right-20 w-32 h-32 bg-chabaqa-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-chabaqa-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-chabaqa-accent/10 to-orange-500/10 rounded-full border border-chabaqa-accent/20 mb-6">
            <Crown className="w-4 h-4 text-chabaqa-accent mr-2" />
            <Sparkles className="w-4 h-4 text-orange-500 mr-2" />
            <span className="text-sm font-medium bg-gradient-to-r from-chabaqa-accent to-orange-600 bg-clip-text text-transparent">
              Featured Communities
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-accent bg-clip-text text-transparent">
              Handpicked
            </span>{" "}
            for You
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our most popular and highly-rated communities, carefully selected to provide exceptional value and
            engagement.
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative mb-12">
          {/* Navigation Buttons */}
          <Button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-900 shadow-lg border-0 w-12 h-12 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-900 shadow-lg border-0 w-12 h-12 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide px-12 py-2"
            onScroll={checkScrollButtons}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredCommunities.map((community, index) => (
              <div key={community.id} className="flex-shrink-0 w-96">
                <FeaturedCommunityCard community={community} index={index} />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <FeaturedCommunitiesClient />
        </div>
      </div>
    </section>
  )
}
