import { Sparkles, Shield, Trophy, Users, CheckCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { PageContent } from "@/lib/api/community-page-content"
import type { CommunityThemeTokens } from "@/lib/community-theme"
import { cn } from "@/lib/utils"

interface CommunityWhyJoinProps {
  community: {
    name: string
    slug: string
  }
  benefitsContent?: PageContent["benefits"] | null
  settingsBenefits?: string[]
  welcomeMessage?: string
  themeTokens?: CommunityThemeTokens
  contentWidthClass?: string
}

type BenefitDisplay = {
  title: string
  description?: string
  iconComponent?: LucideIcon
  iconEmoji?: string
  iconColor?: string
}

export function CommunityWhyJoin({
  community,
  benefitsContent,
  settingsBenefits = [],
  welcomeMessage,
  themeTokens,
  contentWidthClass = "max-w-7xl",
}: CommunityWhyJoinProps) {
  const fallbackBenefits: BenefitDisplay[] = [
    {
      iconComponent: Shield,
      title: "Expert-Led Content",
      description: "Learn from industry professionals with proven track records",
    },
    {
      iconComponent: Trophy,
      title: "Proven Results",
      description: "Join members who have achieved measurable success",
    },
    {
      iconComponent: Users,
      title: "Community Support",
      description: "Get help and encouragement from like-minded peers",
    },
    {
      iconComponent: CheckCircle,
      title: "Continuous Growth",
      description: "Regular updates with new content and resources",
    },
  ]

  const dynamicBenefits: BenefitDisplay[] =
    benefitsContent?.benefits
      ?.filter((benefit) => benefit.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((benefit) => ({
        title: benefit.title,
        description: benefit.description,
        iconEmoji: benefit.icon,
        iconColor: benefit.iconColor,
      })) || []

  const settingsBenefitItems: BenefitDisplay[] = settingsBenefits
    .filter((item) => typeof item === "string" && item.trim() !== "")
    .map((item) => ({
      title: item.trim(),
      description: "Available for all members.",
      iconComponent: CheckCircle,
    }))

  const dedupeBenefits = (items: BenefitDisplay[]) => {
    const seen = new Set<string>()
    const result: BenefitDisplay[] = []
    for (const item of items) {
      const key = item.title.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      result.push(item)
    }
    return result
  }

  const benefits =
    settingsBenefitItems.length > 0
      ? dedupeBenefits(settingsBenefitItems)
      : dynamicBenefits.length > 0
        ? dedupeBenefits(dynamicBenefits)
        : fallbackBenefits

  const headingPrefix = benefitsContent?.titlePrefix || "Transform Your Skills with"
  const headingSuffix =
    benefitsContent?.titleSuffix !== undefined && benefitsContent.titleSuffix !== ""
      ? benefitsContent.titleSuffix
      : community.name
  const heading = `${headingPrefix} ${headingSuffix}`.trim()

  const subtitle =
    welcomeMessage ||
    benefitsContent?.subtitle ||
    "Join thousands of satisfied members who have transformed their skills and achieved their goals. Our proven methodology and expert guidance ensure you get the results you're looking for."
  const chipLabel = benefitsContent?.titlePrefix || "Why Join?"
  const ctaTitle = benefitsContent?.ctaTitle || "Ready to get started?"
  const ctaSubtitle = benefitsContent?.ctaSubtitle || "Join our community today"

  const primary = themeTokens?.primary || "#8e78fb"
  const secondary = themeTokens?.secondary || "#f48fb1"

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", contentWidthClass)}>
        <div
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
          style={{ borderColor: themeTokens?.mutedBorder || undefined }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Content */}
            <div className="p-5 sm:p-8 lg:p-12">
              <div
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-5 border"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: themeTokens?.mutedBorder || undefined,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: primary }} />
                <span className="text-xs font-semibold" style={{ color: primary }}>{chipLabel}</span>
              </div>

              <h2 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                {heading}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-7 font-light leading-relaxed">{subtitle}</p>

              <div className="space-y-3.5">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.iconComponent
                  const number = index + 1
                  return (
                    <div key={index} className="flex items-start gap-3.5">
                      <div
                        className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center"
                        style={
                          benefit.iconColor
                            ? { color: benefit.iconColor, borderColor: benefit.iconColor }
                            : { color: primary }
                        }
                        aria-hidden="true"
                      >
                        {IconComponent ? (
                          <IconComponent className="w-[18px] h-[18px]" />
                        ) : (
                          <span className="font-semibold text-xs leading-none">{number}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-gray-900 leading-6 tracking-[-0.01em]">{benefit.title}</h3>
                        {benefit.description && (
                          <p className="text-gray-600 text-[13px] mt-1 leading-5">{benefit.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Image */}
            <div
              className="relative min-h-[220px] border-t lg:min-h-[300px] lg:border-l lg:border-t-0"
              style={{
                borderColor: themeTokens?.mutedBorder || undefined,
                background:
                  themeTokens?.softPrimary && themeTokens?.softSecondary
                    ? `linear-gradient(165deg, ${themeTokens.softPrimary} 0%, #ffffff 55%, ${themeTokens.softSecondary} 100%)`
                    : undefined,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3 p-6">
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white shadow-lg"
                    style={{ boxShadow: `0 12px 30px -16px ${secondary}` }}
                  >
                    <Users className="w-8 h-8" style={{ color: primary }} />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{ctaTitle}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{ctaSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
