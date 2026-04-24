import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Star, CheckCircle, Heart, Eye, Tag, TrendingUp, Award } from "lucide-react"
import { Explore } from "@/lib/data-communities"
import { resolveExploreCardRouting } from "@/app/(landing)/(communities)/components/explore-card-routing"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { getUserProfileHref } from "@/lib/profile-handle"

type ItemType = "community" | "course" | "challenge" | "product" | "oneToOne" | "event"

interface CommunityCardProps {
  community: Explore & { type?: ItemType }
  viewMode?: "grid" | "list"
  accessAware?: boolean
}

export function CommunityCard({ community, viewMode = "grid", accessAware = false }: CommunityCardProps) {
  const t = useTranslations("landing.explore")

  const formatProductRating = () => {
    if (community.type !== "product") {
      return community.rating.toFixed(1)
    }
    const count = Number(community.ratingCount || 0)
    if (count <= 0) return "New"
    return `${community.rating.toFixed(1)} (${count})`
  }

  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const formatPrice = (price: number | undefined, type: string) => {
    const p = typeof price === "number" && Number.isFinite(price) ? price : 0
    if (type === "free" || p === 0) return t("priceLabels.free")
    if (type === "paid") return `$${p}`
    if (type === "monthly") return `$${p}/mo`
    if (type === "yearly") return `$${p}/yr`
    if (type === "hourly") return `$${p}/hr`
    return `$${p}`
  }

  // Get type-specific styling and CTA text
  const getTypeConfig = (type?: ItemType) => {
    const itemType = type || "community"

    const typeConfigs = {
      community: {
        badgeColor: "border-blue-500/50 text-blue-600 bg-blue-50",
        ctaText: t("cta.explore"),
        ctaGradient: "from-[#5d67ff] to-[#8e78fb]",
      },
      course: {
        badgeColor: "border-[#47c7ea]/50 text-[#47c7ea] bg-[#47c7ea]/10",
        ctaText: t("cta.start"),
        ctaGradient: "from-[#47c7ea] to-[#86e4fd]",
      },
      challenge: {
        badgeColor: "border-[#ff9b28]/50 text-[#ff9b28] bg-[#ff9b28]/10",
        ctaText: t("cta.join"),
        ctaGradient: "from-[#ff9b28] to-[#fddab0]",
      },
      product: {
        badgeColor: "border-purple-500/50 text-purple-600 bg-purple-50",
        ctaText: t("cta.buy"),
        ctaGradient: "from-[#5d67ff] to-[#86e4fd]",
      },
      oneToOne: {
        badgeColor: "border-[#f65887]/50 text-[#f65887] bg-[#f65887]/10",
        ctaText: t("cta.book"),
        ctaGradient: "from-[#f65887] to-[#fddab0]",
      },
      event: {
        badgeColor: "border-chabaqa-primary/50 text-chabaqa-primary bg-chabaqa-primary/10",
        ctaText: t("cta.register"),
        ctaGradient: "from-[#8e78fb] to-[#86e4fd]",
      },
    }


    return typeConfigs[itemType]
  }

  const typeConfig = getTypeConfig(community.type)
  const creatorProfileHref = getUserProfileHref({
    username: community.creatorSlug,
    name: community.creator,
  })

  const itemType = ((community.type ?? "community") as ItemType)
  
  // Fix: Use communitySlug if available (for courses/challenges/etc) otherwise use community.slug
  const slug = (community as any).communitySlug || community.slug
  
  const defaultRouting = {
    href: itemType === "community"
      ? (community.isMember
        ? (community.link || `/${community.creator}/${community.slug}`)
        : `/community/${community.slug}#join-section`)
      : (community.link || `/community/${slug}#join-section`),
    label: itemType === "community"
      ? (community.isMember ? typeConfig.ctaText : t("cta.join"))
      : typeConfig.ctaText,
  }

  const accessAwareRouting = resolveExploreCardRouting(community, typeConfig.ctaText, {
    join: t("cta.join"),
    download: t("cta.download"),
    buy: t("cta.buy"),
    viewCommunity: t("cta.viewCommunity"),
  })
  const ctaHref = accessAware ? accessAwareRouting.href : defaultRouting.href
  const ctaLabel = accessAware ? accessAwareRouting.ctaLabel : defaultRouting.label

  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white hover:scale-[1.01]">
        <div className="flex h-48">
          {/* Image Section */}
          <div className="relative w-98 aspect-video flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={(community.image as string) || (community as any).coverImage || (community as any).banner || (community as any).logo || community.creatorAvatar || "/placeholder.svg"}
              alt={community.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 256px"
              unoptimized
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Price Badge */}
            <div className="absolute top-3 right-3">
              <Badge
                className={`px-2.5 py-1 font-bold text-sm shadow-xl border-0 ${community.priceType === "free"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-chabaqa-primary to-purple-600 text-white"
                  }`}
              >
                {formatPrice(community.price, community.priceType)}
              </Badge>
            </div>

            {/* Floating Actions */}
            <div className="absolute top-2 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 space-y-1.5">
              <button className="p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                <Heart className="w-3.5 h-3.5 text-gray-600 hover:text-red-500" />
              </button>
              <button className="p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                <Eye className="w-3.5 h-3.5 text-gray-600 hover:text-chabaqa-primary" />
              </button>
            </div>

            {/* Category Badge */}
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-white/95 text-gray-900 border-0 px-2.5 py-1 text-xs font-semibold shadow-lg flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {community.category}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              {/* Title & Verified */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-chabaqa-primary transition-colors duration-300 leading-tight line-clamp-2 break-words">
                  {community.name}
                </h3>
                {community.verified && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-[10px] px-2 py-0.5 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t("verified")}
                  </Badge>
                )}
              </div>

              {/* Creator */}
              <Link href={creatorProfileHref} className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={community.creatorAvatar || "/placeholder.svg"}
                    alt={community.creator}
                    fill
                    className="rounded-full ring-2 ring-chabaqa-primary/20 shadow-md object-cover"
                    sizes="32px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 truncate">
                    {t("createdBy")} <span className="font-semibold text-gray-800">{community.creator}</span>
                  </p>
                  {community.communityName && community.type !== 'community' && (
                    <p className="text-[11px] text-gray-500 truncate">
                      {t("communityLabel")}: <span className="font-medium text-chabaqa-primary">{community.communityName}</span>
                    </p>
                  )}
                </div>
              </Link>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed line-clamp-2 text-xs">
                {community.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {community.tags.slice(0, 4).map((tag, tagIndex) => (
                  <Badge
                    key={tagIndex}
                    variant="outline"
                    className="border-chabaqa-primary/30 text-chabaqa-primary bg-chabaqa-primary/5 font-medium text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Footer: badges left + CTA right */}
            <div className="flex items-center justify-between mt-1">
              {/* Left badges / stats */}
              <div className="flex gap-2">
                <div className="flex items-center text-[11px] bg-chabaqa-primary/10 px-2 py-0.5 rounded-full font-medium text-chabaqa-primary">
                  <Users className="w-3 h-3 mr-1 text-chabaqa-primary" />
                  {formatMembers(community.members)}
                </div>
                <div className="flex items-center text-[11px] bg-chabaqa-primary/10 px-2 py-0.5 rounded-full font-medium text-chabaqa-primary">
                  <Award className="w-3 h-3 mr-1 text-yellow-500" />
                  {formatProductRating()}
                </div>
                {/* Type badge with custom styling */}
                <Badge
                  variant="outline"
                  className={`text-[11px] px-2 py-0.5 font-medium capitalize border ${typeConfig.badgeColor}`}
                >
                  {t(`types.${(community.type || "community") as "community" | "course" | "challenge" | "product" | "oneToOne" | "event"}`)}
                </Badge>
              </div>

              {/* CTA Button with type-specific styling */}
              <Link href={ctaHref}>
                <button
                  className="px-8 py-1.5 text-sm font-semibold rounded-lg text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                  style={{
                    background: `linear-gradient(to right, ${community.type === 'course' ? '#47c7ea, #86e4fd' :
                        community.type === 'challenge' ? '#ff9b28, #fddab0' :
                          community.type === 'oneToOne' ? '#f65887, #fddab0' :
                            community.type === 'product' ? '#9333ea, #a855f7' :
                              '#3b82f6, #2563eb' // community default
                      })`
                  }}
                >
                  {ctaLabel}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Grid View
  return (
    <Card className="group hover:shadow-xl transition-all duration-500 border border-gray-100 rounded-2xl overflow-hidden bg-white hover:scale-[1.015]">
      {/* Image Section */}
      <div className="relative w-full aspect-[16/9] mb-1 overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={(community.image as string) || (community as any).coverImage || (community as any).banner || (community as any).logo || community.creatorAvatar || "/placeholder.svg"}
          alt={community.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Price Badge */}
        <div className="absolute top-2 right-3">
          <Badge
            className={`px-2 py-0.5 font-semibold text-xs border-0 shadow-md ${community.priceType === "free"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                : "bg-gradient-to-r from-chabaqa-primary to-purple-600 text-white"
              }`}
          >
            {formatPrice(community.price, community.priceType)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="px-3 pb-3 space-y-2">
        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-chabaqa-primary transition-colors duration-300 line-clamp-2 break-words">
          {community.name}
        </h3>

        {/* Creator */}
        <Link href={creatorProfileHref} className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity">
          <div className="relative w-5 h-5 flex-shrink-0">
            <Image
              src={community.creatorAvatar || "/placeholder.svg"}
              alt={community.creator}
              fill
              className="rounded-full ring-1 ring-gray-200 object-cover"
              sizes="20px"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-600 truncate">
              {t("createdBy")} <span className="font-semibold text-gray-800">{community.creator}</span>
            </p>
            {community.communityName && community.type !== "community" && (
              <p className="text-[11px] text-gray-500 truncate">
                {t("communityLabel")}: <span className="font-medium text-chabaqa-primary">{community.communityName}</span>
              </p>
            )}
          </div>
        </Link>

        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex items-center text-[11px] bg-chabaqa-primary/10 px-2 py-0.5 rounded-full font-medium text-chabaqa-primary">
            <Users className="w-3 h-3 mr-1 text-chabaqa-primary" />
            {formatMembers(community.members)}
          </div>
          <div className="flex items-center text-[11px] bg-chabaqa-primary/10 px-2 py-0.5 rounded-full font-medium text-chabaqa-primary">
            <Award className="w-3 h-3 mr-1 text-yellow-500" />
            {formatProductRating()}
          </div>
          {/* Type badge with custom styling */}
          <Badge
            variant="outline"
            className={`text-[11px] px-2 py-0.5 font-medium capitalize border ${typeConfig.badgeColor}`}
          >
            {t(`types.${(community.type || "community") as "community" | "course" | "challenge" | "product" | "oneToOne" | "event"}`)}
          </Badge>
        </div>

        {/* CTA with type-specific styling */}
        <Link href={ctaHref}>
          <button
            className="w-full mt-2 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300"
            style={{
              background: "linear-gradient(to right, #8e78fb, #8e78fb)"
            }}
          >
            {ctaLabel}
          </button>
        </Link>
      </CardContent>
    </Card>
  )
}
