import { Badge } from "@/components/ui/badge"
import { CommunitiesHeroClient } from "@/components/communities/communities-hero-client"
import { Sparkles, Users, Star, TrendingUp } from "lucide-react"

interface CommunitiesHeroProps {
  stats: {
    total: number
    totalMembers: number
    avgRating: number
    freeCount: number
  }
}

export function CommunitiesHero({ stats }: CommunitiesHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-chabaqa-primary via-chabaqa-primary to-chabaqa-secondary1 text-white py-16 overflow-hidden">
      {/* Subtle Background Decorations */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 left-8 w-40 h-40 bg-chabaqa-accent/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Elegant Badge */}
          <div className="inline-flex items-center px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            <span className="text-sm font-medium">Discover Communities</span>
          </div>

          {/* Refined Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Find Your{" "}
              <span className="bg-gradient-to-r from-chabaqa-accent to-chabaqa-secondary2 bg-clip-text text-transparent">
                Perfect Community
              </span>
            </h1>
            <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              Connect with creators and learners who share your passions. Join communities that inspire growth and
              success.
            </p>
          </div>

          {/* Client Component for Interactive CTAs */}
          <CommunitiesHeroClient />

          {/* Compact Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-8">
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 mr-1" />
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="text-xs opacity-80">Communities</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 mr-1" />
                <div className="text-2xl font-bold">{(stats.totalMembers / 1000).toFixed(0)}K+</div>
              </div>
              <div className="text-xs opacity-80">Members</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 mr-1" />
                <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
              </div>
              <div className="text-xs opacity-80">Avg Rating</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 mr-1" />
                <div className="text-2xl font-bold">{stats.freeCount}</div>
              </div>
              <div className="text-xs opacity-80">Free</div>
            </div>
          </div>

          {/* Minimal Categories */}
          <div className="pt-6">
            <div className="flex flex-wrap justify-center gap-2">
              {["Fitness", "Education", "Technology", "Business", "Creative Arts"].map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-white/15 text-white border-white/20 hover:bg-white/25 cursor-pointer transition-colors text-xs px-3 py-1"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
