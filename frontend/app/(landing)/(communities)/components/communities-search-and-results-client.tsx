"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  X,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { communitiesData } from "@/lib/data-communities"
import { CommunityCard } from "@/app/(landing)/(communities)/components/community-card"
import { Explore } from "@/lib/data-communities"
import { useTranslations } from "next-intl"

type ItemType = "community" | "course" | "challenge" | "product" | "oneToOne" | "event"

type ExploreWithType = Explore & { type?: ItemType }

interface SearchFilters {
  query: string
  category: string
  priceType: string
  sortBy: string
  minMembers: string
  quickFilters: string[]
  type: "all" | ItemType
}

interface CommunitiesSearchAndResultsClientProps {
  communities: ExploreWithType[]
}

export function CommunitiesSearchAndResultsClient({ communities }: CommunitiesSearchAndResultsClientProps) {
  const t = useTranslations("landing.explore")
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "All",
    priceType: "all",
    sortBy: "popular",
    minMembers: "all",
    quickFilters: [],
    type: "all",
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // SWAPPED: Now these are the quick filter badges with gradient colors
  const typeQuickFilters: { key: ItemType; label: string; color: string }[] = [
    { key: "community", label: t("types.community"), color: "bg-gradient-to-r from-[#5d67ff] to-[#8e78fb]" },
    { key: "course", label: t("types.course"), color: "bg-gradient-to-r from-[#47c7ea] to-[#86e4fd]" },
    { key: "challenge", label: t("types.challenge"), color: "bg-gradient-to-r from-[#ff9b28] to-[#fddab0]" },
    { key: "product", label: t("types.product"), color: "bg-gradient-to-r from-[#5d67ff] to-[#86e4fd]" },
    { key: "oneToOne", label: t("types.oneToOne"), color: "bg-gradient-to-r from-[#f65887] to-[#fddab0]" },
    { key: "event", label: t("types.event"), color: "bg-gradient-to-r from-[#8e78fb] to-[#86e4fd]" },

  ]

  // SWAPPED: Now these are dropdown options (previously quickFilterOptions)
  const filterDropdownOptions = [
    { value: "free", label: t("filters.freeOnly") },
    { value: "verified", label: t("filters.verifiedOnly") },
    { value: "1000+", label: t("filters.members1000") },
    { value: "high-rated", label: t("filters.topRated") },
  ]

const handleFilterChange = <K extends keyof Omit<SearchFilters, "quickFilters">>(
  key: K,
  value: SearchFilters[K]
) => {
  setFilters((prev) => ({ ...prev, [key]: value }))
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

  // NEW: Handle type filter as quick badge
  const handleTypeToggle = (type: ItemType) => {
    const newType: "all" | ItemType = filters.type === type ? "all" : type
    const newFilters: SearchFilters = { ...filters, type: newType }
    setFilters(newFilters)
    setCurrentPage(1)
  }


  const clearAllFilters = () => {
    const defaultFilters: SearchFilters = {
      query: "",
      category: "All",
      priceType: "all",
      sortBy: "popular",
      minMembers: "all",
      quickFilters: [],
      type: "all",
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

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((community) => {
        const itemType: ItemType = community.type ?? "community"
        return itemType === filters.type
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
          return Number(b.id) - Number(a.id)
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
    if (key === "type") return value !== "all"
    return value !== "all"
  }).length

  const getVisiblePages = () => {
    const delta = 1
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []

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
    <div className="space-y-2">
      {/* Combined Search, Filters & Results Header */}
      <div className="bg-white rounded-xl p-2 sm:p-4 shadow border border-gray-200">
        {/* Search & Main Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              className="pl-8 sm:pl-10 h-7 sm:h-9 border-gray-300 focus:border-chabaqa-primary text-[10px] sm:text-sm rounded-md"
            />
          </div>

          {/* Dropdowns - NOW INCLUDES QUICK FILTERS AS DROPDOWNS */}
          <div className="flex gap-1 flex-wrap sm:gap-2">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="h-7 sm:h-9 px-1 sm:px-2 bg-white border border-gray-300 rounded-md text-[10px] sm:text-sm min-w-[80px] sm:min-w-[110px]"
            >
              {communitiesData.categories.slice(0, 6).map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? t("all") : category.split(" ")[0]}
                </option>
              ))}
            </select>

            {/* NEW: Quick filters dropdown */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleQuickFilterToggle(e.target.value)
                  e.target.value = "" // Reset dropdown
                }
              }}
              className="h-7 sm:h-9 px-1 sm:px-2 bg-white border border-gray-300 rounded-md text-[10px] sm:text-sm min-w-[80px] sm:min-w-[110px]"
            >
              <option value="">{t("filters.label")}</option>
              {filterDropdownOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={filters.quickFilters.includes(option.value)}
                >
                  {option.label} {filters.quickFilters.includes(option.value) ? "✓" : ""}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="h-7 sm:h-9 px-1 sm:px-2 bg-white border border-gray-300 rounded-md text-[10px] sm:text-sm min-w-[80px] sm:min-w-[100px]"
            >
              {communitiesData.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === "popular"
                    ? t("sort.popular")
                    : option.value === "newest"
                      ? t("sort.newest")
                      : option.value === "members"
                        ? t("sort.members")
                        : option.value === "rating"
                          ? t("sort.rating")
                          : option.value === "price-low"
                            ? t("sort.priceLow")
                            : option.value === "price-high"
                              ? t("sort.priceHigh")
                              : option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Quick Filters & Actions - SWAPPED POSITIONS */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 sm:gap-2 pt-1 sm:pt-3 border-t border-gray-200">
          {/* Type Quick Filters - NOW AS BADGES */}
          <div className="flex flex-wrap gap-1">
            {typeQuickFilters.map((typeFilter) => (
              <Button
                key={typeFilter.key}
                variant={filters.type === typeFilter.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeToggle(typeFilter.key)}
                className={`h-5 sm:h-6 px-1 sm:px-2 text-[10px] sm:text-xs ${
                  filters.type === typeFilter.key
                    ? `${typeFilter.color} text-white border-transparent`
                    : "bg-white hover:bg-gray-50 text-gray-600 border-gray-300"
                }`}
              >
                {typeFilter.label}
                {filters.type === typeFilter.key && <X className="w-2 h-2 sm:w-2.5 sm:h-2.5 ml-1" />}
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
              {filters.query && (
                <span>
                  {t("resultsFor")} "<span className="font-medium text-chabaqa-primary">{filters.query}</span>" •{" "}
                </span>
              )}
              {t("showing", { start: startIndex + 1, end: Math.min(endIndex, totalItems), total: totalItems })}
              {activeFiltersCount > 0 && (
                <Badge className="bg-chabaqa-primary/10 text-chabaqa-primary border border-chabaqa-primary/20 text-xs px-2 py-0.5 ml-1 sm:ml-2">
                  {t("activeCount", { count: activeFiltersCount })}
                </Badge>
              )}
            </div>

            {/* View Mode Selector: HIDDEN on mobile */}
            <div className="hidden sm:flex bg-gray-100 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-6 px-2 text-xs transition-all duration-300 ${
                  viewMode === "grid" ? "bg-white text-chabaqa-primary shadow-sm" : "text-gray-600"
                }`}
              >
                <Grid className="w-3 h-3 mr-1" />
                {t("view.grid")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-6 px-2 text-xs transition-all duration-300 ${
                  viewMode === "list" ? "bg-white text-chabaqa-primary shadow-sm" : "text-gray-600"
                }`}
              >
                <List className="w-3 h-3 mr-1" />
                {t("view.list")}
              </Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-5 sm:h-6 px-1 sm:px-2 text-[10px] sm:text-xs text-red-600 hover:text-red-700"
              >
                <X className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                {t("clear")} ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">{t("price")}</label>
              <select
                value={filters.priceType}
                onChange={(e) => handleFilterChange("priceType", e.target.value)}
                className="w-full h-7 sm:h-8 px-2 bg-white border border-gray-300 rounded text-[10px] sm:text-sm focus:outline-none focus:ring-1 focus:ring-chabaqa-primary"
              >
                <option value="all">{t("all")}</option>
                <option value="free">{t("filters.freeOnly")}</option>
                <option value="paid">{t("filters.paidOnly")}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">{t("minMembers")}</label>
              <select
                value={filters.minMembers}
                onChange={(e) => handleFilterChange("minMembers", e.target.value)}
                className="w-full h-7 sm:h-8 px-2 bg-white border border-gray-300 rounded text-[10px] sm:text-sm focus:outline-none focus:ring-1 focus:ring-chabaqa-primary"
              >
                <option value="all">{t("anySize")}</option>
                <option value="100">100+</option>
                <option value="500">500+</option>
                <option value="1000">1000+</option>
                <option value="2000">2000+</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Quick Filters Display */}
        {filters.quickFilters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-[10px] sm:text-xs text-gray-500 mr-1">{t("activeFilters")}:</span>
            {filters.quickFilters.map((filter) => {
              const filterOption = filterDropdownOptions.find(opt => opt.value === filter)
              return (
                <Button
                  key={filter}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilterToggle(filter)}
                  className="h-5 px-2 text-[10px] bg-chabaqa-primary/10 text-chabaqa-primary border-chabaqa-primary/20"
                >
                  {filterOption?.label}
                  <X className="w-2 h-2 ml-1" />
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Communities Grid/List */}
      <div id="search-results">
        {paginatedCommunities.length > 0 ? (
          <>
            <div
              className={`grid gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 max-w-6xl mx-auto"
              }`}
            >
              {paginatedCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  viewMode={viewMode}
                  accessAware={true}
                />
              ))}
            </div>

            {/* Compact Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 rounded-xl border border-gray-200 shadow-sm mt-6">
                <div className="text-sm text-gray-600">
                  {t("pageOf", { current: currentPage, total: totalPages })}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t("noResultsTitle")}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t("noResultsDescription")}
            </p>
            <Button
              onClick={clearAllFilters}
              className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-white px-6 py-2 font-semibold"
            >
              {t("clearAll")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
