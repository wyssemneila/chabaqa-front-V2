"use client"

import { useState, useMemo } from "react"
import { CommunitiesSearch } from "@/components/communities-search"
import { CommunitiesGrid } from "./communities-grid"
import { CommunitiesCTA } from "./communities-cta"
import { Community } from "@/lib/models"

interface SearchFilters {
  query: string
  category: string
  priceType: string
  sortBy: string
  minMembers: string
  quickFilters: string[]
}


interface CommunitiesSearchClientProps {
  communities: Community[]
}

export function CommunitiesSearchClient({ communities }: CommunitiesSearchClientProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "All",
    priceType: "all",
    sortBy: "popular",
    minMembers: "all",
    quickFilters: [],
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const filteredAndSortedCommunities = useMemo(() => {
    let filtered = [...communities]

    // Search query filter
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filtered = filtered.filter((community) => {
        return (
          community.name.toLowerCase().includes(query) ||
          community.creator.toLowerCase().includes(query) ||
          community.description.toLowerCase().includes(query) ||
          community.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      })
    }

    // Category filter
    if (filters.category !== "All") {
      filtered = filtered.filter((community) => community.category === filters.category)
    }

    // Price type filter
    if (filters.priceType !== "all") {
      if (filters.priceType === "free") {
        filtered = filtered.filter((community) => community.priceType === "free")
      } else if (filters.priceType === "paid") {
        filtered = filtered.filter((community) => community.priceType !== "free")
      }
    }

    // Minimum members filter
    if (filters.minMembers !== "all") {
      const minCount = Number.parseInt(filters.minMembers)
      filtered = filtered.filter((community) => community.members >= minCount)
    }

    // Quick filters
    filters.quickFilters.forEach((quickFilter) => {
      switch (quickFilter) {
        case "free":
          filtered = filtered.filter((community) => community.priceType === "free")
          break
        case "verified":
          filtered = filtered.filter((community) => community.verified)
          break
        case "1000+":
          filtered = filtered.filter((community) => community.members >= 1000)
          break
        case "high-rated":
          filtered = filtered.filter((community) => community.rating >= 4.5)
          break
        case "recent":
          filtered = filtered
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()) // newest first
            .slice(0, 5); // keep only 5 most recent
          break;
      }
    })

    // Sort communities
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();

        case "members":
          return b.members - a.members
        case "rating":
          return b.rating - a.rating
        case "price-low":
          if (a.priceType === "free" && b.priceType !== "free") return -1
          if (b.priceType === "free" && a.priceType !== "free") return 1
          return a.price - b.price
        case "price-high":
          if (a.priceType === "free" && b.priceType !== "free") return 1
          if (b.priceType === "free" && a.priceType !== "free") return -1
          return b.price - a.price
        case "popular":
        default:
          if (a.featured && !b.featured) return -1
          if (b.featured && !a.featured) return 1
          if (a.rating !== b.rating) return b.rating - a.rating
          return b.members - a.members
      }
    })

    return filtered
  }, [filters, communities])

  // Pagination calculations
  const totalItems = filteredAndSortedCommunities.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCommunities = filteredAndSortedCommunities.slice(startIndex, endIndex)

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    document.getElementById("communities-results")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when items per page changes
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "query") return value !== ""
    if (key === "category") return value !== "All"
    if (key === "sortBy") return value !== "popular"
    if (key === "quickFilters") return (value as string[]).length > 0
    return value !== "all"
  }).length

  return (
    <div className="space-y-8">
      <CommunitiesSearch onFiltersChange={handleFiltersChange} />
      <div id="communities-results">
        <CommunitiesGrid
          communities={paginatedCommunities}
          searchQuery={filters.query}
          activeFiltersCount={activeFiltersCount}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={Math.min(endIndex, totalItems)}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
      <CommunitiesCTA />
    </div>
  )
}
