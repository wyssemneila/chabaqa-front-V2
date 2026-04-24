import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CommunitiesHero } from "@/components/communities/communities-hero"
import { FeaturedCommunities } from "@/components/communities/featured-communities"
import { CommunitiesCategories } from "@/components/communities/communities-categories"
import { CommunitiesSearchSection } from "@/components/communities/communities-search-section"
import { CommunitiesCTA } from "@/components/communities/communities-cta"
import { communitiesData } from "@/lib/data-communities"

export default function CommunitiesPage() {
  // Calculate stats on server side
  const stats = {
    total: communitiesData.communities.length,
    totalMembers: communitiesData.communities.reduce((sum, c) => sum + c.members, 0),
    avgRating: communitiesData.communities.reduce((sum, c) => sum + c.rating, 0) / communitiesData.communities.length,
    freeCount: communitiesData.communities.filter((c) => c.priceType === "free").length,
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16">
        <CommunitiesHero stats={stats} />
        <FeaturedCommunities communities={communitiesData.communities} />
        <CommunitiesCategories communities={communitiesData.communities} />
        <CommunitiesSearchSection communities={communitiesData.communities} />
        <CommunitiesCTA />
      </main>

      <Footer />
    </div>
  )
}
