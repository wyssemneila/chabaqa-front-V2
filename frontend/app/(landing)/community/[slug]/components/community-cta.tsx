import Link from "next/link"
import type { PageContent } from "@/lib/api/community-page-content"
import type { CommunityThemeTokens } from "@/lib/community-theme"
import { cn } from "@/lib/utils"

interface CommunityCTAProps {
  community: {
    name: string
    slug: string
    members: number
    isMember: boolean
    isPrivate?: boolean
  }
  formatMembers: (count: number) => string
  ctaContent?: PageContent["cta"] | null
  themeTokens?: CommunityThemeTokens
  contentWidthClass?: string
}

export function CommunityCTA({
  community,
  formatMembers,
  ctaContent,
  themeTokens,
  contentWidthClass = "max-w-7xl",
}: CommunityCTAProps) {
  const title = ctaContent?.title || "Ready to Get Started?"
  const subtitle =
    ctaContent?.subtitle ||
    `Join now and start your journey to success with the ${community.name} community.`
  const isInviteRequired = Boolean(!community.isMember && community.isPrivate)
  const buttonText =
    ctaContent?.buttonText ||
    (community.isMember
      ? "Open Community"
      : isInviteRequired
        ? "Invitation Required"
        : "Join Community Now")
  const ctaHref = community.isMember
    ? `/community/${community.slug}/home`
    : `/community/${community.slug}#join-section`
  const gradient = themeTokens?.gradient || "linear-gradient(90deg, #8e78fb, #f48fb1)"

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16", contentWidthClass)}>
        <div
          className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
          style={
            themeTokens
              ? {
                  borderColor: themeTokens.mutedBorder,
                  backgroundColor: "#ffffff",
                }
              : undefined
          }
        >
          <div
            className="pointer-events-none absolute inset-x-0 -top-24 h-32 blur-3xl"
            style={{ background: themeTokens?.softPrimary || undefined, opacity: 0.35 }}
          />
          <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
          <div className="relative max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              {title}
            </h2>
            <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-gray-600 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>
          
          <div className="relative w-full flex-shrink-0 md:w-auto">
            {isInviteRequired ? (
              <span
                className="inline-block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold shadow-md opacity-70 cursor-not-allowed sm:w-auto"
                style={{
                  backgroundImage: gradient,
                  color: themeTokens?.primaryText || "#fff",
                }}
              >
                {buttonText}
              </span>
            ) : (
              <Link
                href={ctaHref}
                className="inline-block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] sm:w-auto"
                style={{
                  backgroundImage: gradient,
                  color: themeTokens?.primaryText || "#fff",
                }}
              >
                {buttonText}
              </Link>
            )}
          </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs sm:text-sm text-gray-500 font-light">
            Join {formatMembers(community.members)}+ members who are already seeing results
          </p>
        </div>
      </div>
    </footer>
  )
}
