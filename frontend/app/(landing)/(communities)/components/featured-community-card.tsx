import { Badge } from "@/components/ui/badge"
import { Users, Star, CheckCircle, Crown, Heart, ArrowRight, Sparkles, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { Community } from "@/lib/models"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Explore } from "@/lib/data-communities"
import { resolveExploreCardRouting } from "@/app/(landing)/(communities)/components/explore-card-routing"
import { useTranslations } from "next-intl"
import { getUserProfileHref } from "@/lib/profile-handle"
import { getExploreAvatarFallback, getExploreImageFallback } from "@/lib/explore-image-fallbacks"
import { ExploreSafeImage } from "@/app/(landing)/(communities)/components/explore-safe-image"

type ItemType = "community" | "course" | "challenge" | "product" | "oneToOne" | "event"

interface FeaturedCommunityCardProps {
  community: Explore
  index: number
  slug?: string
  accessAware?: boolean
}

export function FeaturedCommunityCard({ community, index, slug, accessAware = false }: FeaturedCommunityCardProps) {
  const router = useRouter()
  const t = useTranslations("landing.explore")

  const formatMembers = (count: number) => (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString())
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
        ctaColors: "#3b82f6, #2563eb"
      },
      course: {
        badgeColor: "border-[#47c7ea]/50 text-[#47c7ea] bg-[#47c7ea]/10",
        ctaText: t("cta.start"),
        ctaColors: "#47c7ea, #86e4fd"
      },
      challenge: {
        badgeColor: "border-[#ff9b28]/50 text-[#ff9b28] bg-[#ff9b28]/10",
        ctaText: t("cta.join"),
        ctaColors: "#ff9b28, #fddab0"
      },
      product: {
        badgeColor: "border-purple-500/50 text-purple-600 bg-purple-50",
        ctaText: t("cta.buy"),
        ctaColors: "#9333ea, #a855f7"
      },
      oneToOne: {
        badgeColor: "border-[#f65887]/50 text-[#f65887] bg-[#f65887]/10",
        ctaText: t("cta.book"),
        ctaColors: "#f65887, #fddab0"
      },
      event: {
        badgeColor: "border-emerald-500/50 text-emerald-600 bg-emerald-50",
        ctaText: t("cta.register"),
        ctaColors: "#10b981, #34d399"
      }
    }

    return typeConfigs[itemType]
  }

  const itemType = (((community as any).type ?? "community") as ItemType)
  const typeConfig = getTypeConfig(itemType)
  const creatorProfileHref = getUserProfileHref({
    username: community.creatorSlug,
    name: community.creator,
  })

  // Fix: Use communitySlug if available (for courses/challenges/etc) otherwise use community.slug
  const targetSlug = (community as any).communitySlug || community.slug

  const defaultRouting = {
    href: itemType === "community"
      ? (community.isMember
        ? (community.link || `/${community.creator}/${community.slug}`)
        : `/community/${community.slug}#join-section`)
      : (community.link || `/community/${targetSlug}#join-section`),
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
  const imageFallback = getExploreImageFallback({
    category: community.category,
    title: community.name,
    type: itemType as any,
  })
  const avatarFallback = getExploreAvatarFallback({
    creator: community.creator,
    creatorInitials: (community as any).creatorInitials,
  })
  const imageSrc = (community.image as string) || (community as any).coverImage || (community as any).banner || (community as any).logo || community.creatorAvatar

  return (
    <div className="group hover:shadow-lg transition-all duration-300 border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden bg-gradient-to-br from-white to-gray-50/30 hover:scale-[1.01]">

      {/* Compact Image Section */}
      <div className="relative w-full aspect-[16/9] mb-1 overflow-hidden rounded-2xl bg-gray-100">
        <ExploreSafeImage
          src={imageSrc}
          fallbackSrc={imageFallback}
          alt={community.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />

        {/* Simple overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Compact Price Badge */}
        <div className="absolute top-2 right-2">
          <Badge
            className={`px-2 py-0.5 font-semibold text-[10px] border-0 shadow-md rounded-full ${community.priceType === "free"
              ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
              : "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
              }`}
          >
            {formatPrice(community.price, community.priceType)}
          </Badge>
        </div>
      </div>

      {/* Compact Content Section */}
      <div className="px-3 pb-3 space-y-2">
        {/* Simple Title */}
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-chabaqa-primary transition-colors duration-300 line-clamp-2 break-words">
          {community.name}
        </h3>

        {/* Simple Creator Section */}
        <Link href={creatorProfileHref} className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity">
          <div className="relative">
            <ExploreSafeImage
              src={community.creatorAvatar}
              fallbackSrc={avatarFallback}
              alt={community.creator}
              width={20}
              height={20}
              className="rounded-full ring-1 ring-gray-200"
            />
            {community.verified && (
              <CheckCircle className="w-3 h-3 text-blue-500 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-600 truncate">
              {t("by")} <span className="font-medium text-gray-800">{community.creator}</span>
            </p>
            {community.communityName && community.type !== "community" && (
              <p className="text-[11px] text-gray-500 truncate">
                {t("communityLabel")}: <span className="font-medium text-chabaqa-primary">{community.communityName}</span>
              </p>
            )}
          </div>
        </Link>

        {/* Compact Stats */}
        <div className="flex gap-2">
          <div className="flex items-center text-[11px] bg-chabaqa-primary/10 px-2 py-0.5 rounded-full font-medium text-chabaqa-primary">
            <Users className="w-3 h-3 mr-1 text-chabaqa-primary" />
            {formatMembers(community.members)}
          </div>
          <div className="flex items-center text-[11px] bg-chabaqa-primary/10 px-2 py-0.5 rounded-full font-medium text-chabaqa-primary">
            <Award className="w-3 h-3 mr-1 text-yellow-500" />
            {community.rating.toFixed(1)}
          </div>
          {/* Simple Type badge */}
          <Badge
            variant="outline"
            className={`text-[11px] px-2 py-0.5 font-medium capitalize border ${typeConfig.badgeColor}`}
          >
            {t(`types.${itemType}`)}
          </Badge>
        </div>

        {/* Simple CTA Button */}
        <Link href={ctaHref}>
          <button
            className="w-full mt-2 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300"
            style={{
              background: "linear-gradient(to right, #8e78fb, #8e78fb)"
            }}
          >
            {ctaLabel}
          </button>
        </Link>
      </div>
    </div>
  )
}
