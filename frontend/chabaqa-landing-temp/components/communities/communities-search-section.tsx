import { CommunitiesSearchAndResultsClient } from "@/components/communities/communities-search-and-results-client"

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

interface CommunitiesSearchSectionProps {
  communities: Community[]
}

export function CommunitiesSearchSection({ communities }: CommunitiesSearchSectionProps) {
  return (
    <section id="communities-search" className="py-12 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Community</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use our search to discover communities that match your interests and goals.
          </p>
        </div>
        <CommunitiesSearchAndResultsClient communities={communities} />
      </div>
    </section>
  )
}
