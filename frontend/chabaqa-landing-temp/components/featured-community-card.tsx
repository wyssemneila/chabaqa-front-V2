import { Badge } from "@/components/ui/badge"
import { Users, Star, CheckCircle, Crown, Heart, ArrowRight, Sparkles } from "lucide-react"

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

interface FeaturedCommunityCardProps {
  community: Community
  index: number
}

export function FeaturedCommunityCard({ community, index }: FeaturedCommunityCardProps) {
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

  const cardThemes = [
    {
      gradient: "from-chabaqa-primary via-purple-500 to-chabaqa-secondary1",
      accent: "from-chabaqa-primary to-purple-600",
      glow: "shadow-chabaqa-primary/25",
      ring: "ring-chabaqa-primary/30",
    },
    {
      gradient: "from-chabaqa-accent via-orange-500 to-red-500",
      accent: "from-chabaqa-accent to-orange-600",
      glow: "shadow-orange-500/25",
      ring: "ring-orange-500/30",
    },
    {
      gradient: "from-chabaqa-secondary2 via-blue-500 to-indigo-600",
      accent: "from-chabaqa-secondary2 to-blue-600",
      glow: "shadow-blue-500/25",
      ring: "ring-blue-500/30",
    },
    {
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      accent: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/25",
      ring: "ring-emerald-500/30",
    },
  ]

  const theme = cardThemes[index % cardThemes.length]

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-xl ${theme.glow} hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.03] hover:-translate-y-1 h-[440px] border border-gray-100`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div
          className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr ${theme.gradient} rounded-full blur-2xl`}
        ></div>
      </div>

      {/* Top Image Section */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={community.image || "/placeholder.svg"}
          alt={community.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Subtle gradient overlay for better badge visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10"></div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-2 py-0.5 font-bold text-xs shadow-lg backdrop-blur-sm">
            <Crown className="w-2.5 h-2.5 mr-1" />
            Featured
          </Badge>
          {community.verified && (
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-1.5 py-0.5 text-xs shadow-lg">
              <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
              Verified
            </Badge>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute top-2 right-2">
          <Badge
            className={`px-2.5 py-1 font-bold text-sm shadow-xl border-0 backdrop-blur-sm ${
              community.priceType === "free"
                ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                : "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            }`}
          >
            {formatPrice(community.price, community.priceType)}
          </Badge>
        </div>

        {/* Floating Heart */}
        <button className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group-hover:bg-white">
          <Heart className="w-3.5 h-3.5 text-gray-600 hover:text-red-500 transition-colors" />
        </button>

        {/* Stats Overlay */}
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          <div className="flex items-center bg-white/90 backdrop-blur-sm text-gray-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            <Users className="w-3 h-3 mr-1 text-chabaqa-primary" />
            {formatMembers(community.members)}
          </div>
          <div className="flex items-center bg-white/90 backdrop-blur-sm text-gray-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            {community.rating}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative p-4 bg-gradient-to-br from-white to-gray-50/50 space-y-2 h-[264px] flex flex-col">
        {/* Category */}
        <Badge className={`bg-gradient-to-r ${theme.accent} text-white border-0 px-2 py-0.5 text-xs w-fit shadow-md`}>
          {community.category}
        </Badge>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-chabaqa-primary transition-colors duration-300">
          {community.name}
        </h3>

        {/* Creator */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <img
              src={community.creatorAvatar || "/placeholder.svg"}
              alt={community.creator}
              className={`w-7 h-7 rounded-full ring-2 ${theme.ring} shadow-md`}
            />
            {community.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center ring-1 ring-white shadow-lg">
                <CheckCircle className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium">Created by</p>
            <p className="text-gray-900 font-bold text-xs">{community.creator}</p>
          </div>
        </div>

        {/* Action Button - Pushed to bottom */}
        <div className="flex-1 flex items-end">
          <button
            className={`w-full bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group flex items-center justify-center transform hover:scale-[1.02] text-sm`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Join Community
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Accent Border */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient} opacity-60`}></div>

      {/* Hover Glow Effect */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
      ></div>
    </div>
  )
}
