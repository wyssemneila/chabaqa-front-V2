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
  const defaultTestimonials = [
    {
      name: "Michael Rodriguez",
      role: "Marketing Manager",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBu7MVh7knj_t08kwzuj5Ea_2O5G2lxUEbgu5uPnop2g4fUYv_ilamBS95GExu0COXhDlr8C85-tAeMerGwRIiXmL7d3UWFI91Rrqs6ABaBtMx2zvugPkpITKkJX-cmbGD5FqlhyAHbDtw-w2Wbv1SIALDDkpwW8xh8nqURUolqXRgNI24zLCkVUzPL0b0MPQRW3BkNdLyKMheDYmejxLvjvh92mbNPF-mXr7LO5USWkLqP2CRs3FvAmKyg3_fj13HACt_m2MXI1As",
      text: "This completely transformed how I approach my work. The insights and strategies are invaluable!",
    },
    {
      name: "Emily Watson",
      role: "Entrepreneur",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCykuuNlThazErbBEoOZfjeOLbiIDLXNZXlCUilw0tc4CFsErutdNAM64Pd6MNqc2sdnmYFi9FCQmfQrqrZxFuGPX1neQfzNtTeq9QX7B2WxMzRohASBiO1zmaAwPG3G01PH0dN_-0KAt5AYDFtFzBTcYgtGiYdkGMOlP2_A8lqCX8r7HyyPWomRrY-EiQtMz5DHowbcda3WxD7TyE6Y6GObnzxTx3p3xTFA0j2n2hEG98SopT8Ve5J0AYeTY-jWsGJmQGS8WjTwXM",
      text: "Best investment I've made in my professional development. Highly recommend to anyone serious about growth.",
    },
    {
      name: "David Kim",
      role: "Designer",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB8XVD2Zzw1U0_bhkFGwRU8UB3iNS1nXNiCCMGRGI-LJ_yG_gqxrK0o-NCyFdDFruy2OEUfkjHLfxCpUVSJltQPQjCEmfASU2UjIxOsvxkNOusDpbSz2FJAPflQZyCSTAjko90uuLgjbUAu8riOgs1rlBeO1j7Nki9Fc9RIX2aVX4Yy90gReptU6AJvl-bIxirQS8ZRCIDf3G7nxW4XpugAIGHzpKhurcx1pjqNIPLvh7BUyB8a--b5ScQLXpaDi2cKlrJmUufwOmM",
      text: "The community support and expert guidance made all the difference. Exceeded my expectations!",
    },
  ]

  const dynamicTestimonials =
    testimonialsContent?.testimonials
      ?.filter((testimonial) => testimonial.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((testimonial) => ({
        name: testimonial.name,
        role: testimonial.role,
        avatar: testimonial.avatar || "/placeholder.svg",
        text: testimonial.content,
        rating: testimonial.rating,
      })) || []

  const testimonials = dynamicTestimonials.length > 0 ? dynamicTestimonials : defaultTestimonials

  const title = testimonialsContent?.title || "What Members Are Saying"
  const subtitle =
    testimonialsContent?.subtitle || "Join thousands of satisfied members who have achieved amazing results."
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
