"use client"

import { useState, useRef } from "react"
import { FeaturedCommunityCard } from "@/app/(landing)/(communities)/components/featured-community-card"
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Explore } from "@/lib/data-communities"
import { useTranslations } from "next-intl"

interface FeaturedCommunitiesProps {
  communities: Explore[]
}

export function FeaturedCommunities({ communities }: FeaturedCommunitiesProps) {
  const t = useTranslations("landing.explore")
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
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
      setTimeout(checkScrollButtons, 300)
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
      setTimeout(checkScrollButtons, 300)
    }
  }

  return (
      <section className="py-1 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Header */}
        <div className="text-center mb-6 px-4">

          <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200/50 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
            <span className="text-xs font-medium text-amber-700">
              {t("featured.badge")}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 break-words">
            <span className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 bg-clip-text text-transparent">
              {t("featured.title")}
            </span>
          </h2>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-2 break-words">
            {t("featured.subtitle")}
          </p>
        </div>

        {/* Compact Slider */}
        <div className="relative">
          {/* Smaller Navigation Buttons */}
          <Button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white text-gray-700 shadow-md border-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          <Button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white text-gray-700 shadow-md border-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          {/* Compact Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-10 py-2 snap-x snap-mandatory"
            onScroll={checkScrollButtons}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredCommunities.map((community, index) => (
              <div 
                key={community.id} 
                className="flex-shrink-0 w-64 sm:w-72 snap-center"
              >
                <FeaturedCommunityCard
                  community={community}
                  index={index}
                  slug={community.slug}
                  accessAware={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
