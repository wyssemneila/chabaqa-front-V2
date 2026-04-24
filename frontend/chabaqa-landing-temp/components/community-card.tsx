import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Star, CheckCircle, Heart, Eye } from "lucide-react"
import { CommunityCardClient } from "@/components/community-card-client"

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

interface CommunityCardProps {
  community: Community
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
    return `$${price}/${type === "monthly" ? "mo" : type}`
  }

  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden bg-white hover:scale-[1.01] transform">
        <div className="flex h-48">
          {/* Image Section */}
          <div className="relative w-72 flex-shrink-0 overflow-hidden">
            <img
              src={community.image || "/placeholder.svg"}
              alt={community.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />

            {/* Image Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Price Badge */}
            <div className="absolute top-3 right-3">
              <Badge
                className={`px-2.5 py-1 font-bold text-sm shadow-xl backdrop-blur-sm border-0 ${
                  community.priceType === "free"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-chabaqa-primary to-purple-600 text-white"
                }`}
              >
                {formatPrice(community.price, community.priceType)}
              </Badge>
            </div>

            {/* Floating Actions */}
            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 space-y-1.5">
              <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                <Heart className="w-3.5 h-3.5 text-gray-600 hover:text-red-500" />
              </button>
              <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                <Eye className="w-3.5 h-3.5 text-gray-600 hover:text-chabaqa-primary" />
              </button>
            </div>

            {/* Category Badge */}
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-white/95 text-gray-900 border-0 px-2.5 py-1 text-xs font-semibold shadow-lg">
                {community.category}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {community.verified && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-xs px-2 py-0.5">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-1 text-chabaqa-primary" />
                    <span className="font-semibold text-sm">{formatMembers(community.members)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{community.rating}</span>
                  </div>
                </div>
              </div>

              {/* Title & Creator */}
              <div className="space-y-2.5">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-chabaqa-primary transition-colors duration-300 leading-tight line-clamp-2">
                  {community.name}
                </h3>

                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={community.creatorAvatar || "/placeholder.svg"}
                      alt={community.creator}
                      className="w-8 h-8 rounded-full ring-2 ring-chabaqa-primary/20 shadow-md"
                    />
                    {community.verified && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                        <CheckCircle className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="ml-2.5">
                    <p className="text-gray-500 text-xs">Created by</p>
                    <p className="text-gray-900 font-semibold text-sm">{community.creator}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed line-clamp-2 text-sm">{community.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
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

            {/* Actions */}
            <div className="pt-3">
              <CommunityCardClient />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Grid View
  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden bg-white hover:scale-105 hover:-translate-y-2 transform">
      {/* Image Section */}
      <div className="relative overflow-hidden h-40">
        <img
          src={community.image || "/placeholder.svg"}
          alt={community.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {community.verified && (
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-xs px-2 py-0.5 shadow-lg backdrop-blur-sm">
              <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
              Verified
            </Badge>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute top-2.5 right-2.5">
          <Badge
            className={`px-2.5 py-1 font-bold text-sm shadow-lg backdrop-blur-sm border-0 ${
              community.priceType === "free"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                : "bg-gradient-to-r from-chabaqa-primary to-purple-600 text-white"
            }`}
          >
            {formatPrice(community.price, community.priceType)}
          </Badge>
        </div>

        {/* Bottom Stats */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
          <div className="flex items-center bg-white/95 backdrop-blur-sm text-gray-900 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
            <Users className="w-3.5 h-3.5 mr-1 text-chabaqa-primary" />
            {formatMembers(community.members)}
          </div>
          <div className="flex items-center bg-white/95 backdrop-blur-sm text-gray-900 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
            <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400 text-yellow-400" />
            {community.rating}
          </div>
        </div>

        {/* Floating Actions */}
        <div className="absolute bottom-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button className="p-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
            <Heart className="w-3.5 h-3.5 text-gray-600 hover:text-red-500" />
          </button>
          <button className="p-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
            <Eye className="w-3.5 h-3.5 text-gray-600 hover:text-chabaqa-primary" />
          </button>
        </div>
      </div>

      {/* Content Section - Much Smaller */}
      <CardContent className="p-3.5 space-y-2.5">
        {/* Category */}
        <Badge
          variant="outline"
          className="border-chabaqa-primary/30 text-chabaqa-primary bg-chabaqa-primary/5 font-semibold text-xs px-2 py-0.5 w-fit"
        >
          {community.category}
        </Badge>

        {/* Title & Creator */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-chabaqa-primary transition-colors duration-300 leading-tight line-clamp-2">
            {community.name}
          </h3>

          <div className="flex items-center">
            <div className="relative">
              <img
                src={community.creatorAvatar || "/placeholder.svg"}
                alt={community.creator}
                className="w-6 h-6 rounded-full ring-2 ring-chabaqa-primary/20 shadow-sm"
              />
              {community.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center ring-1 ring-white">
                  <CheckCircle className="w-1.5 h-1.5 text-white" />
                </div>
              )}
            </div>
            <div className="ml-2">
              <p className="text-gray-500 text-xs">by</p>
              <p className="text-gray-900 font-semibold text-xs">{community.creator}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">{community.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {community.tags.slice(0, 3).map((tag, tagIndex) => (
            <Badge
              key={tagIndex}
              variant="outline"
              className="border-gray-200 text-gray-600 bg-gray-50 font-medium text-xs px-1.5 py-0.5 hover:border-chabaqa-primary hover:text-chabaqa-primary transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="pt-1">
          <CommunityCardClient />
        </div>
      </CardContent>
    </Card>
  )
}
