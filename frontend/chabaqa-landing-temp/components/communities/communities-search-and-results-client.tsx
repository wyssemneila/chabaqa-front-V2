"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { communitiesData } from "@/lib/data-communities"
import { CommunityCard } from "@/components/community-card"

interface SearchFilters {
  query: string
  category: string
  priceType: string
  sortBy: string
  minMembers: string
  quickFilters: string[]
}

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

interface CommunitiesSearchAndResultsClientProps {
  communities: Community[]
}

export function CommunitiesSearchAndResultsClient({ communities }: CommunitiesSearchAndResultsClientProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "All",
    priceType: "all",
    sortBy: "popular",
    minMembers: "all",
    quickFilters: [],
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const quickFilterOptions = [
    { key: "free", label: "Free", color: "bg-green-500" },
    { key: "verified", label: "Verified", color: "bg-blue-500" },
    { key: "1000+", label: "1000+", color: "bg-purple-500" },
    { key: "high-rated", label: "Top Rated", color: "bg-yellow-500" },
  ]

  const handleFilterChange = (key: keyof Omit<SearchFilters, "quickFilters">, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleQuickFilterToggle = (quickFilter: string) => {
    const newQuickFilters = filters.quickFilters.includes(quickFilter)
      ? filters.quickFilters.filter((f) => f !== quickFilter)
      : [...filters.quickFilters, quickFilter]

    const newFilters = { ...filters, quickFilters: newQuickFilters }
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    const defaultFilters = {
      query: "",
      category: "All",
      priceType: "all",
      sortBy: "popular",
      minMembers: "all",
      quickFilters: [],
    }
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

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
      }
    })

    // Sort communities
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return b.id - a.id
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth" })
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "query") return value !== ""
    if (key === "category") return value !== "All"
    if (key === "sortBy") return value !== "popular"
    if (key === "quickFilters") return (value as string[]).length > 0
    return value !== "all"
  }).length

  const getVisiblePages = () => {
    const delta = 1
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="space-y-4">
      {/* Combined Search, Filters & Results Header */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
        {/* Search & Main Controls */}
        <div className="flex flex-col lg:flex-row gap-3 mb-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search communities..."
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              className="pl-10 h-9 border-gray-300 focus:border-chabaqa-primary text-sm"
            />
          </div>

          {/* Main Dropdowns */}
          <div className="flex gap-2">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="h-9 px-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-chabaqa-primary text-sm min-w-[110px]"
            >
              {communitiesData.categories.slice(0, 6).map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "All" : category.split(" ")[0]}
                </option>
              ))}
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="h-9 px-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-chabaqa-primary text-sm min-w-[100px]"
            >
              {communitiesData.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label.replace("Most ", "").replace("Highest ", "")}
                </option>
              ))}
            </select>
          </div>

          {/* Results Summary & View Controls */}
          <div className="flex items-center gap-3 lg:min-w-[300px] justify-end">
            <div className="text-sm font-semibold text-gray-900">{totalItems} Found</div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="h-9 px-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-chabaqa-primary"
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
            </select>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-8 px-2 text-xs transition-all duration-300 ${
                  viewMode === "grid" ? "bg-white text-chabaqa-primary shadow-sm" : "text-gray-600"
                }`}
              >
                <Grid className="w-3 h-3 mr-1" />
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-8 px-2 text-xs transition-all duration-300 ${
                  viewMode === "list" ? "bg-white text-chabaqa-primary shadow-sm" : "text-gray-600"
                }`}
              >
                <List className="w-3 h-3 mr-1" />
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filters & Advanced Controls */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-1.5">
            {quickFilterOptions.map((option) => (
              <Button
                key={option.key}
                variant={filters.quickFilters.includes(option.key) ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilterToggle(option.key)}
                className={`h-6 px-2 text-xs transition-all duration-200 ${
                  filters.quickFilters.includes(option.key)
                    ? `${option.color} text-white border-transparent`
                    : "bg-white hover:bg-gray-50 text-gray-600 border-gray-300"
                }`}
              >
                {option.label}
                {filters.quickFilters.includes(option.key) && <X className="w-2.5 h-2.5 ml-1" />}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Results Info */}
            <div className="text-xs text-gray-500 hidden sm:block">
              {filters.query && (
                <span>
                  Results for "<span className="font-medium text-chabaqa-primary">{filters.query}</span>" •{" "}
                </span>
              )}
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              {activeFiltersCount > 0 && (
                <Badge className="bg-chabaqa-primary/10 text-chabaqa-primary border border-chabaqa-primary/20 text-xs px-2 py-0.5 ml-2">
                  {activeFiltersCount} Active
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-6 px-2 text-xs text-gray-600 hover:text-chabaqa-primary"
            >
              <Filter className="w-3 h-3 mr-1" />
              More
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3 mr-1" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
              <select
                value={filters.priceType}
                onChange={(e) => handleFilterChange("priceType", e.target.value)}
                className="w-full h-7 px-2 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-chabaqa-primary"
              >
                <option value="all">All</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Members</label>
              <select
                value={filters.minMembers}
                onChange={(e) => handleFilterChange("minMembers", e.target.value)}
                className="w-full h-7 px-2 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-chabaqa-primary"
              >
                <option value="all">Any Size</option>
                <option value="100">100+</option>
                <option value="500">500+</option>
                <option value="1000">1000+</option>
                <option value="2000">2000+</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Communities Grid/List */}
      <div id="search-results">
        {paginatedCommunities.length > 0 ? (
          <>
            <div
              className={`grid gap-4 ${
                viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-6xl mx-auto"
              }`}
            >
              {paginatedCommunities.map((community) => (
                <CommunityCard key={community.id} community={community} viewMode={viewMode} />
              ))}
            </div>

            {/* Compact Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm mt-6">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50"
                  >
                    <ChevronsLeft className="w-3 h-3" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {getVisiblePages().map((page, index) => (
                      <div key={index}>
                        {page === "..." ? (
                          <span className="px-2 py-1 text-gray-400 text-sm">...</span>
                        ) : (
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
                            className={`h-8 w-8 p-0 text-sm ${
                              currentPage === page
                                ? "bg-chabaqa-primary text-white border-chabaqa-primary"
                                : "border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary"
                            }`}
                          >
                            {page}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50"
                  >
                    <ChevronsRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No communities found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Try adjusting your search criteria or browse all communities.
            </p>
            <Button
              onClick={clearAllFilters}
              className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-white px-6 py-2 font-semibold"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
