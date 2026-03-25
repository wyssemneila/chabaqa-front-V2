"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Users, Star, CheckCircle, Tag, Verified } from "lucide-react"
import Link from "next/link"
import type { PageContent } from "@/lib/api/community-page-content"
import type { CommunityThemeTokens } from "@/lib/community-theme"
import { cn } from "@/lib/utils"

interface CommunityHeroProps {
  community: {
    id: string
    name: string
    slug: string
    creator: {
      id: string
      name: string
      avatar?: string
      verified: boolean
    } | null
    description?: string
    longDescription?: string
    category: string
    members: number
    rating: number
    price: number
    priceType: string
    image?: string
    coverImage?: string
    verified: boolean
    tags: string[]
    isMember?: boolean
    isPrivate?: boolean
  }
  heroContent?: PageContent["hero"] | null
  themeTokens?: CommunityThemeTokens
  contentWidthClass?: string
  headerStyle?: "default" | "centered" | "minimal"
  showStats?: boolean
}

export function CommunityHero({
  community,
  heroContent,
  themeTokens,
  contentWidthClass = "max-w-7xl",
  headerStyle = "default",
  showStats = true,
}: CommunityHeroProps) {
  // Helpers moved inside client component
  const formatPrice = (price: number, priceType: string) => {
    const normalizedType = String(priceType || "free").toLowerCase()
    const p = typeof price === "number" && Number.isFinite(price) ? price : 0

    if (normalizedType === "free" || p <= 0) return "Free"
    if (normalizedType === "one-time" || normalizedType === "paid") return `$${p}`
    if (normalizedType === "monthly") return `$${p}/mo`
    if (normalizedType === "yearly") return `$${p}/yr`
    return `$${p}/${normalizedType}`
  }

  const formatMembers = (count: number) => (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count))

  const displayImage =
    heroContent?.customBanner || community.coverImage || community.image || "/placeholder.svg"
  const creatorName = community.creator?.name || "Unknown Creator"
  const creatorAvatar = community.creator?.avatar
  const creatorInitial = creatorName.charAt(0).toUpperCase()
  const allowStats = showStats !== false
  const showMemberCount = allowStats && (heroContent ? heroContent.showMemberCount !== false : true)
  const showRating = allowStats && (heroContent ? heroContent.showRating !== false : true)
  const showCreator = heroContent ? heroContent.showCreator !== false : true
  const heroTitle = heroContent?.customTitle?.trim() || community.name
  const heroSubtitle =
    heroContent?.customSubtitle?.trim() ||
    community.longDescription ||
    community.description ||
    ""

  const isMember = community.isMember
  const isInviteRequired = Boolean(!isMember && community.isPrivate)
  const defaultCTA = isMember
    ? "Explore Community"
    : isInviteRequired
      ? "Invitation Required"
      : "Join Community"
  const heroCTA = heroContent?.ctaButtonText?.trim() || defaultCTA

  const ctaLink = isMember
    ? `/community/${community.slug}/home`
    : isInviteRequired
      ? "#"
      : `#join-section`

  const handleCTAClick = (e: React.MouseEvent) => {
    if (isInviteRequired) {
      e.preventDefault()
      return
    }
    if (!isMember) {
      // If not a member, prevent default Link behavior and trigger the modal event
      e.preventDefault()
      window.dispatchEvent(new CustomEvent("open-community-checkout"))
      
      // Also update hash for scroll if needed, though event handles modal
      window.location.hash = "join-section"
    }
  }

  const isCentered = headerStyle === "centered"
  const isMinimal = headerStyle === "minimal"
  const primary = themeTokens?.primary || "#8e78fb"
  const secondary = themeTokens?.secondary || "#f48fb1"
  const gradient = themeTokens?.gradient || `linear-gradient(90deg, ${primary}, ${secondary})`
  const creatorCardBackground = themeTokens
    ? `linear-gradient(150deg, #ffffff 0%, ${themeTokens.softPrimary} 100%)`
    : "#ffffff"

  return (
    <section
      className="relative border-b bg-white pb-10 sm:pb-14"
      style={{ borderColor: themeTokens?.mutedBorder || undefined }}
    >
      <div className={cn("relative mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7", contentWidthClass)}>
        {/* Logo */}
        <div className="mb-6 flex items-center justify-start sm:mb-3">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80"
            aria-label="Chabaqa Home"
          >
            <Image
              src="/Logos/PNG/frensh1.png"
              alt="Chabaqa Logo"
              width={150}
              height={28}
              priority
              style={{ objectFit: 'contain' }}
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          <div
            className={cn(
              "order-2 flex flex-col justify-between space-y-3 sm:space-y-4 lg:order-1",
              isCentered && "items-center text-center",
            )}
          >
            {/* Badges */}
            {!isMinimal && <div className={cn("flex items-center gap-1.5 flex-wrap", isCentered && "justify-center")}>
              <Badge
                variant="outline"
                className="px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: themeTokens?.mutedBorder || undefined,
                  color: primary,
                }}
              >
                <Users className="w-2.5 h-2.5 mr-0.5" />
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Community</span>
              </Badge>
              {community.verified && (
                <Badge
                  variant="outline"
                  className="bg-white text-green-700 border-green-200 px-2 py-0.5 text-xs font-medium"
                >
                  <Verified className="w-2.5 h-2.5 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>}

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-snug">
              {heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-3 sm:line-clamp-none font-light break-words [overflow-wrap:anywhere]">
              {heroSubtitle}
            </p>

            {/* Creator Info */}
            {showCreator && (
              <div
                className="bg-white p-2.5 sm:p-3.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                style={{
                  borderColor: themeTokens?.mutedBorder || undefined,
                  background: creatorCardBackground,
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {creatorAvatar ? (
                    <div
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 flex-shrink-0"
                      style={{ borderColor: themeTokens?.mutedBorder || undefined }}
                    >
                      <Image
                        src={creatorAvatar}
                        alt={creatorName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm"
                      style={{ backgroundImage: gradient }}
                    >
                      {creatorInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-light">By</p>
                    <div className="flex items-center gap-0.5">
                      <p className="font-medium text-gray-900 text-xs truncate">{creatorName}</p>
                      {community.creator?.verified && (
                        <CheckCircle className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            {!isMinimal && <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3", isCentered && "w-full")}>
              {showMemberCount && (
                <div
                  className="p-2.5 sm:p-3 rounded-lg border bg-white hover:shadow-sm transition-all duration-300"
                  style={{
                    borderColor: themeTokens?.mutedBorder || undefined,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 sm:p-2 bg-white border border-gray-200 rounded-md">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: primary }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-light" style={{ color: primary }}>Members</p>
                      <p className="font-semibold text-sm text-gray-900">{formatMembers(community.members)}</p>
                    </div>
                  </div>
                </div>
              )}

              {showRating && (
                <div
                  className="bg-white p-2.5 sm:p-3 rounded-lg border hover:shadow-sm transition-all duration-300"
                  style={{
                    borderColor: themeTokens?.mutedBorder || "#fde68a",
                    background: themeTokens
                      ? `linear-gradient(165deg, #ffffff 0%, ${themeTokens.softSecondary} 100%)`
                      : "#ffffff",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="p-1.5 sm:p-2 bg-white border rounded-md"
                      style={{ borderColor: themeTokens?.mutedBorder || "#fde68a" }}
                    >
                      <Star
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current"
                        style={{ color: secondary }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-light" style={{ color: secondary }}>Rating</p>
                      <p className="font-semibold text-sm text-gray-900">{community.rating.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="p-2.5 sm:p-3 rounded-lg border bg-white hover:shadow-sm transition-all duration-300"
                style={{
                  borderColor: themeTokens?.mutedBorder || undefined,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 sm:p-2 bg-white border border-gray-200 rounded-md">
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: secondary }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-light" style={{ color: secondary }}>Category</p>
                    <p className="font-semibold text-xs text-gray-900 capitalize truncate">{community.category}</p>
                  </div>
                </div>
              </div>
            </div>}

            {/* Tags */}
            {!isMinimal && community.tags.length > 0 && (
              <div className={cn("flex flex-wrap gap-2", isCentered && "justify-center")}>
                {community.tags.slice(0, 5).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-white border text-gray-700 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{ borderColor: themeTokens?.mutedBorder || undefined, color: primary }}
                  >
                    {tag}
                  </Badge>
                ))}
                {community.tags.length > 5 && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-600 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium"
                  >
                    +{community.tags.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            {/* Pricing & CTA */}
            <div
              className={cn(
                "flex flex-col gap-3 border-t-2 border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                isCentered && "w-full",
              )}
              style={{ borderColor: themeTokens?.mutedBorder || undefined }}
            >
              <div>
                <div className="flex items-baseline gap-1">
                  <p
                    className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: gradient }}
                  >
                    {formatPrice(community.price, community.priceType)}
                  </p>
                  {community.priceType !== "free" && community.priceType !== "one-time" && (
                    <span className="text-xs text-gray-500 font-medium">/{community.priceType === "monthly" ? "mo" : community.priceType}</span>
                  )}
                </div>
                {community.priceType === "free" && (
                  <p className="text-xs text-gray-600 mt-0.5 font-light">No credit card required</p>
                )}
              </div>

              <Link
                href={ctaLink}
                onClick={handleCTAClick}
                className={`group w-full rounded-lg px-6 py-3 text-center text-sm font-semibold shadow-md transition-all duration-300 sm:w-auto ${
                  isInviteRequired ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                }`}
                style={{
                  backgroundImage: gradient,
                  color: themeTokens?.primaryText || "#fff",
                }}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {heroCTA}
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isInviteRequired ? "" : "group-hover:translate-x-1"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Community Image */}
          <div className="relative order-1 lg:order-2">
            <div
              className="absolute -inset-2 sm:-inset-4 rounded-2xl sm:rounded-3xl blur-2xl"
              style={{ backgroundImage: gradient, opacity: 0.18 }}
            />
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border-2 border-white shadow-2xl sm:aspect-video sm:rounded-2xl sm:border-4">
              <Image
                src={displayImage}
                alt={`${community.name} community cover`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
