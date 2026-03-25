"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { communitiesData } from "@/lib/data-communities"

interface SearchFilters {
  query: string
  category: string
  priceType: string
  sortBy: string
  minMembers: string
  quickFilters: string[]
}

interface CommunitiesSearchProps {
  onFiltersChange: (filters: SearchFilters) => void
}

export function CommunitiesSearch({ onFiltersChange }: CommunitiesSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "All",
    priceType: "all",
    sortBy: "popular",
    minMembers: "all",
    quickFilters: [],
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = <K extends keyof Omit<SearchFilters, "quickFilters">>(
    key: K,
    value: SearchFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleQuickFilterToggle = (quickFilter: string) => {
    const newQuickFilters = filters.quickFilters.includes(quickFilter)
      ? filters.quickFilters.filter((f) => f !== quickFilter)
      : [...filters.quickFilters, quickFilter]

    const newFilters = { ...filters, quickFilters: newQuickFilters }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    const defaultFilters: SearchFilters = {
      query: "",
      category: "All",
      priceType: "all",
      sortBy: "popular",
      minMembers: "all",
      quickFilters: [],
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "query") return value !== ""
    if (key === "category") return value !== "All"
    if (key === "sortBy") return value !== "popular"
    if (key === "quickFilters") return (value as string[]).length > 0
    return value !== "all"
  }).length

  const filterDropdownOptions = [
    { value: "free", label: "Free Only" },
    { value: "verified", label: "Verified Only" },
    { value: "1000+", label: "1000+ Members" },
    { value: "high-rated", label: "Top Rated (4.5+)" },
  ]

  return (
    <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
      {/* Search & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search communities..."
            value={filters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
            className="pl-10 h-9 border-gray-300 focus:border-chabaqa-primary"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="h-9 px-3 bg-white border border-gray-300 rounded-md min-w-[120px]"
          >
            {communitiesData.categories.slice(0, 6).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="h-9 px-3 bg-white border border-gray-300 rounded-md min-w-[120px]"
          >
            {communitiesData.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200">
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {filterDropdownOptions.map((option) => (
            <Button
              key={option.value}
              variant={filters.quickFilters.includes(option.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilterToggle(option.value)}
              className={`h-7 px-3 text-xs ${
                filters.quickFilters.includes(option.value)
                  ? "bg-chabaqa-primary text-white border-transparent"
                  : "bg-white hover:bg-gray-50 text-gray-600 border-gray-300"
              }`}
            >
              {option.label}
              {filters.quickFilters.includes(option.value) && <X className="w-3 h-3 ml-1" />}
            </Button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {activeFiltersCount > 0 && (
              <Badge className="bg-chabaqa-primary/10 text-chabaqa-primary border border-chabaqa-primary/20">
                {activeFiltersCount} Active
              </Badge>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 px-3 text-xs text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
            <select
              value={filters.priceType}
              onChange={(e) => handleFilterChange("priceType", e.target.value)}
              className="w-full h-8 px-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-chabaqa-primary"
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
              className="w-full h-8 px-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-chabaqa-primary"
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
  )
}
