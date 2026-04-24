import { CommunitiesGridClient } from "@/components/communities/communities-grid-client"

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

interface CommunitiesGridProps {
  communities: Community[]
  searchQuery: string
  activeFiltersCount: number
  totalItems: number
  currentPage: number
  totalPages: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export function CommunitiesGrid({
  communities,
  searchQuery,
  activeFiltersCount,
  totalItems,
  currentPage,
  totalPages,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
}: CommunitiesGridProps) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <CommunitiesGridClient
          communities={communities}
          searchQuery={searchQuery}
          activeFiltersCount={activeFiltersCount}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </div>
    </section>
  )
}
