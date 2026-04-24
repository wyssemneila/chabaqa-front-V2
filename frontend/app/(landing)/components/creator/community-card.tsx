import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Star, CheckCircle, Heart, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type ItemType = "community" | "course" | "challenge" | "product" | "oneToOne" | "event"

interface CommunityCardProps {
  community: {
    id: string
    slug: string
    name: string
    creator: string
    creatorId: string
    creatorAvatar: string
    description: string
    category: string
    members: number
    rating: number
    price: number
    priceType: string
    image: string
    tags: string[]
    verified: boolean
    type?: ItemType
    community?: string // Community name for non-community content types
  }
  viewMode?: "grid" | "list"
}

export function CommunityCard({ community, viewMode = "grid" }: CommunityCardProps) {
  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const formatPrice = (price: number, type: string) => {
    if (type === "free") return "Free"
    if (type === "per session") return `${price} TND/session`
    return `${price} TND/${type === "monthly" ? "mo" : type}`
  }

  const getTypeConfig = (type?: ItemType) => {
    const itemType = type || "community"

    const typeConfigs = {
      community: {
        badgeColor: "border-blue-500/50 text-blue-600 bg-blue-50",
        ctaText: "Join",
        ctaGradient: "from-blue-500 to-blue-600",
      },
      course: {
        badgeColor: "border-[#47c7ea]/50 text-[#47c7ea] bg-[#47c7ea]/10",
        ctaText: "Start",
        ctaGradient: "from-[#47c7ea] to-[#86e4fd]",
      },
      challenge: {
        badgeColor: "border-[#ff9b28]/50 text-[#ff9b28] bg-[#ff9b28]/10",
        ctaText: "Join",
        ctaGradient: "from-[#ff9b28] to-[#fdb863]",
      },
      product: {
        badgeColor: "border-purple-500/50 text-purple-600 bg-purple-50",
        ctaText: "Buy",
        ctaGradient: "from-purple-500 to-purple-600",
      },
      oneToOne: {
        badgeColor: "border-[#f65887]/50 text-[#f65887] bg-[#f65887]/10",
        ctaText: "Book",
        ctaGradient: "from-[#f65887] to-[#fb8ba8]",
      },
      event: {
        badgeColor: "border-indigo-500/50 text-indigo-600 bg-indigo-50",
        ctaText: "Register",
        ctaGradient: "from-indigo-500 to-indigo-600",
      },
    }

    return typeConfigs[itemType]
  }

  const getPlaceholderImage = (type?: ItemType) => {
    const itemType = type || "community"
    const queries = {
      community: "community group discussion networking",
      course: "online learning education course",
      challenge: "fitness challenge goal achievement",
      product: "digital product software tool",
      oneToOne: "one on one consultation meeting",
      event: "live event workshop conference",
    }
    return `/placeholder.svg?height=400&width=600&query=${queries[itemType]}`
  }

  const getAvatarPlaceholder = () => {
    return `/placeholder.svg?height=100&width=100&query=professional avatar portrait`
  }

  const typeConfig = getTypeConfig(community.type)

  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-2xl shadow-sm overflow-hidden bg-white hover:scale-[1.01]">
        <div className="flex flex-col sm:flex-row h-auto sm:h-48">
          <div className="relative w-full sm:w-96 aspect-video sm:aspect-auto flex-shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={community.image || getPlaceholderImage(community.type)}
              alt={community.name || 'Community thumbnail'}
              fill
              className="object-cover rounded-2xl p-2"
              sizes="(max-width: 640px) 100vw, 384px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="absolute top-3 right-3">
              <Badge
                className={`px-2.5 py-1 font-bold text-sm shadow-xl border-0 ${
                  community.priceType === "free"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-[#8e78fb] to-purple-600 text-white"
                }`}
              >
                {formatPrice(community.price, community.priceType)}
              </Badge>
            </div>

            <div className="absolute top-2 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 space-y-1.5">
              <button className="p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                <Heart className="w-3.5 h-3.5 text-gray-600 hover:text-red-500" />
              </button>
              <button className="p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                <Eye className="w-3.5 h-3.5 text-gray-600 hover:text-[#8e78fb]" />
              </button>
            </div>

            <div className="absolute bottom-3 left-3">
              <Badge className="bg-white/95 text-gray-900 border-0 px-2.5 py-1 text-xs font-semibold shadow-lg">
                {community.category}
              </Badge>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#8e78fb] transition-colors duration-300 leading-tight line-clamp-2 text-balance">
                  {community.name}
                </h3>
                {community.verified && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-[10px] sm:text-sm px-2 py-0.5 sm:py-1 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Image
                  src={community.creatorAvatar || getAvatarPlaceholder()}
                  alt={community.creator}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-[#8e78fb]/20 shadow-md"
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Created by <span className="font-semibold text-gray-800">{community.creator}</span>
                  </p>
                  {community.community && community.type !== 'community' && (
                    <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                      Community: <span className="font-medium text-chabaqa-primary">{community.community}</span>
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed line-clamp-2 text-xs sm:text-sm text-pretty">
                {community.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {community.tags.slice(0, 4).map((tag, tagIndex) => (
                  <Badge
                    key={tagIndex}
                    variant="outline"
                    className="border-[#8e78fb]/30 text-[#8e78fb] bg-[#8e78fb]/5 font-medium text-xs sm:text-sm px-2 py-0.5 sm:py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex gap-2">
                <div className="flex items-center text-[11px] sm:text-sm bg-gray-50 px-2 py-0.5 sm:py-1 rounded-full font-medium text-gray-700">
                  <Users className="w-3 h-3 mr-1 text-[#8e78fb]" />
                  {formatMembers(community.members)}
                </div>
                <div className="flex items-center text-[11px] sm:text-sm bg-gray-50 px-2 py-0.5 sm:py-1 rounded-full font-medium text-gray-700">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {community.rating}
                </div>
                <Badge
                  variant="outline"
                  className={`text-[11px] sm:text-sm px-2 py-0.5 sm:py-1 font-medium capitalize border ${typeConfig.badgeColor}`}
                >
                  {community.type || "community"}
                </Badge>
              </div>

              <Link href={`/${community.slug}`}>
                <button
                  className={`px-8 py-1.5 sm:py-2 text-sm sm:text-base font-semibold rounded-lg text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r ${typeConfig.ctaGradient}`}
                >
                  {typeConfig.ctaText}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-500 border border-gray-200 rounded-2xl overflow-hidden bg-white hover:scale-[1.015]">
      <div className="relative w-full aspect-[16/9] mb-1 overflow-hidden rounded-2xl">
        <Image
          src={community.image || getPlaceholderImage(community.type)}
          alt={community.name}
          fill
          className="object-cover p-2 rounded-2xl"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="absolute top-2 right-3">
          <Badge
            className={`px-2 py-0.5 sm:py-1 font-semibold text-xs sm:text-sm border-0 shadow-md ${
              community.priceType === "free"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                : "bg-gradient-to-r from-[#8e78fb] to-purple-600 text-white"
            }`}
          >
            {formatPrice(community.price, community.priceType)}
          </Badge>
        </div>
      </div>

      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-[#8e78fb] transition-colors duration-300 line-clamp-2 text-balance">
          {community.name}
        </h3>

        <div className="flex items-center gap-2">
          <Image
            src={community.creatorAvatar || getAvatarPlaceholder()}
            alt={community.creator}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-[#8e78fb]/20 shadow-md"
          />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              Created by <span className="font-semibold text-gray-800">{community.creator}</span>
            </p>
            {community.community && community.type !== "community" && (
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                Community: <span className="font-medium text-chabaqa-primary">{community.community}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <div className="flex items-center text-[10px] sm:text-[11px] bg-gray-50 px-2 py-0.5 sm:py-1 rounded-full font-medium text-gray-700">
            <Users className="w-3 h-3 mr-1 text-[#8e78fb]" />
            {formatMembers(community.members)}
          </div>
          <div className="flex items-center text-[10px] sm:text-[11px] bg-gray-50 px-2 py-0.5 sm:py-1 rounded-full font-medium text-gray-700">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            {community.rating}
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] sm:text-[11px] px-2 py-0.5 sm:py-1 font-medium capitalize border ${typeConfig.badgeColor}`}
          >
            {community.type || "community"}
          </Badge>
        </div>

        <Link
  href={`/${community.creator
    .toLowerCase()
    .replace(/\s+/g, "-")}/${community.slug}`}
>

          <button
            className={`w-full mt-2 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg text-white shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 bg-gradient-to-r ${typeConfig.ctaGradient} min-h-[44px] touch-manipulation`}
          >
            {typeConfig.ctaText}
          </button>
        </Link>
      </CardContent>
    </Card>
  )
}
