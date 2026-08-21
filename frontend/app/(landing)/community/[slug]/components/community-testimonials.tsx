import Image from "next/image"
import { Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { PageContent } from "@/lib/api/community-page-content"
import type { CommunityThemeTokens } from "@/lib/community-theme"
import { cn } from "@/lib/utils"

interface CommunityTestimonialsProps {
  community: {
    name: string
    category: string
  }
  testimonialsContent?: PageContent["testimonials"] | null
  themeTokens?: CommunityThemeTokens
  contentWidthClass?: string
}

export function CommunityTestimonials({
  community,
  testimonialsContent,
  themeTokens,
  contentWidthClass = "max-w-7xl",
}: CommunityTestimonialsProps) {
  const testimonials =
    testimonialsContent?.testimonials
      ?.filter((testimonial) => testimonial.visible !== false && testimonial.content?.trim())
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((testimonial) => ({
        name: testimonial.name,
        role: testimonial.role,
        avatar: testimonial.avatar || "/placeholder.svg",
        text: testimonial.content,
        rating: testimonial.rating,
      })) || []

  if (testimonials.length === 0) {
    return null
  }

  const title = testimonialsContent?.title || "What Members Are Saying"
  const subtitle =
    testimonialsContent?.subtitle || `See what members are saying about ${community.name}.`
  const showRatings = testimonialsContent?.showRatings ?? true

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        background:
          themeTokens?.softPrimary && themeTokens?.softSecondary
            ? `linear-gradient(180deg, ${themeTokens.softSecondary} 0%, #ffffff 28%, #ffffff 72%, ${themeTokens.softPrimary} 100%)`
            : "#ffffff",
      }}
    >
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", contentWidthClass)}>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 font-light">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              style={
                themeTokens
                  ? {
                      borderColor: themeTokens.mutedBorder,
                      background: `linear-gradient(165deg, #ffffff 0%, ${themeTokens.softPrimary} 100%)`,
                    }
                  : undefined
              }
            >
              {showRatings && (
                <div className="mb-3 flex gap-0.5" style={{ color: themeTokens?.secondary || "#f59e0b" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              )}

              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              <div className="flex items-center">
                <div
                  className="relative mr-3 h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border-2"
                  style={{ borderColor: themeTokens?.mutedBorder || undefined }}
                >
                  <Image
                    src={testimonial.avatar}
                    alt={`Profile picture of ${testimonial.name}`}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{testimonial.name}</p>
                  <p className="text-xs text-gray-500 truncate">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
