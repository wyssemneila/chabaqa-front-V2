"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Grid, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { CommunityCard } from "@/app/(landing)/(communities)/components/community-card"
import { Community } from "@/lib/models"
import { communitiesApi } from "@/lib/api"

interface CommunitiesGridClientProps {
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

export function CommunitiesGridClient({
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
}: CommunitiesGridClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchJoinedCommunities = async () => {
      try {
        console.log("Fetching joined communities...")
        const response = await communitiesApi.getMyJoined()
        console.log("Joined communities response:", response)
        if (response.success && Array.isArray(response.data)) {
          // Handle both id and _id
          const ids = new Set(response.data.map(c => c.id || (c as any)._id))
          console.log("Joined community IDs:", Array.from(ids))
          setJoinedCommunityIds(ids)
        }
      } catch (error) {
        // Silently fail if user is not logged in or other error
        console.error("Failed to fetch joined communities", error)
      }
    }

    fetchJoinedCommunities()
  }, [])

  // Debug log for communities prop
  useEffect(() => {
    if (communities.length > 0) {
      console.log("First community in grid:", communities[0])
      console.log("First community ID:", communities[0].id, " _id:", (communities[0] as any)._id)
    }
  }, [communities])

  const getVisiblePages = () => {
    const delta = 2
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
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-5 bg-white/80  rounded-2xl border border-gray-200 shadow-lg">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900">
            {totalItems} {totalItems === 1 ? "Community" : "Communities"} Found
          </h2>
          {searchQuery && (
            <p className="text-gray-600 text-sm">
              Showing results for "<span className="font-semibold text-chabaqa-primary">{searchQuery}</span>"
            </p>
          )}
          {totalItems > 0 && (
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1}-{endIndex} of {totalItems} results
            </p>
          )}
          {activeFiltersCount > 0 && (
            <div className="flex items-center">
              <Badge className="bg-chabaqa-primary/10 text-chabaqa-primary border border-chabaqa-primary/20 text-xs px-2 py-0.5">
                {activeFiltersCount} {activeFiltersCount === 1 ? "Filter" : "Filters"} Active
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 whitespace-nowrap">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-chabaqa-primary focus:border-chabaqa-primary transition-all duration-300"
            >
              <option value={8}>8 per page</option>
              <option value={12}>12 per page</option>
              <option value={16}>16 per page</option>
              <option value={24}>24 per page</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`transition-all duration-300 text-xs px-3 py-1.5 ${viewMode === "grid"
                ? "bg-white text-chabaqa-primary shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              <Grid className="w-3.5 h-3.5 mr-1.5" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`transition-all duration-300 text-xs px-3 py-1.5 ${viewMode === "list"
                ? "bg-white text-chabaqa-primary shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Communities Grid/List */}
      {communities.length > 0 ? (
        <>
          <div
            className={`grid ${viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "grid-cols-1 max-w-6xl mx-auto gap-5"
              }`}
          >
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={{
                  ...community,
                  type: "community",
                  link: `/communities/${community.slug}`,
                  priceType: community.priceType as any,
                  isMember: joinedCommunityIds.has(community.id || (community as any)._id)
                }}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80  rounded-2xl border border-gray-200 shadow-lg">
              {/* Pagination Info */}
              <div className="text-xs text-gray-600">
                Page {currentPage} of {totalPages} ({totalItems} total results)
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                  className="border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getVisiblePages().map((page, index) => (
                    <div key={index}>
                      {page === "..." ? (
                        <span className="px-2 py-1 text-gray-400 text-xs">...</span>
                      ) : (
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange(page as number)}
                          className={`min-w-[32px] h-8 text-xs ${currentPage === page
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

                {/* Next Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="border-gray-300 hover:border-chabaqa-primary hover:text-chabaqa-primary disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
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
          <Button className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-white px-6 py-2 font-semibold">
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
