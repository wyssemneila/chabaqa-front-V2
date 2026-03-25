"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, CommunityFilters } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
import { toast } from "sonner"

interface Community {
  _id: string
  name: string
  description: string
  creator: {
    _id: string
    username: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'suspended'
  isActive?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  isSuspended?: boolean
  featured: boolean
  verified: boolean
  membersCount: number
  contentCount: number
  createdAt: string
}

interface CommunitiesResponse {
  communities: Community[]
  total: number
  page: number
  limit: number
}

const deriveCommunityStatus = (community: Partial<Community>): Community["status"] => {
  if (community.isSuspended) return "suspended"
  if (community.approvalStatus === "rejected") return "rejected"
  if (community.isActive) return "active"
  if (community.approvalStatus === "pending" || !community.approvalStatus) return "pending"
  return (community.status as Community["status"]) || "inactive"
}

export default function CommunitiesPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [communities, setCommunities] = useState<Community[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Filter state
  const [filters, setFilters] = useState<CommunityFilters>({
    status: undefined,
    searchTerm: undefined,
    createdAfter: undefined,
    createdBefore: undefined,
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch communities
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchCommunities = async () => {
      setLoading(true)
      try {
        const response = await adminApi.communities.getCommunities({
          page,
          limit: pageSize,
          sortBy,
          sortOrder,
          ...filters,
        })

        if (response.success && response.data) {
          // The API returns nested data: { success: true, data: { data: [], total: ... } }
          // But apiClient response.data is the full object.
          // Wait, let's verify the apiClient wrapper. 
          // If apiClient.get returns the body, then response is the body.
          // The body is { success: true, message: "...", data: { data: [], total: ... } }
          // So response.data is the PaginatedResult.
          const paginatedResult = response.data as any
          const normalizedCommunities = (paginatedResult.data || []).map((community: Community) => ({
            ...community,
            status: deriveCommunityStatus(community),
          }))
          setCommunities(normalizedCommunities)
          setTotal(paginatedResult.total || 0)
        } else {
          setCommunities([])
          setTotal(0)
        }
      } catch (error: any) {
        console.error('[Communities] Fetch error:', error)
        if (error?.message?.includes('401')) {
          await logout()
          return
        }
        toast.error('Failed to load communities')
      } finally {
        setLoading(false)
      }
    }

    fetchCommunities()
  }, [isAuthenticated, authLoading, page, pageSize, sortBy, sortOrder, filters])

  // Column definitions
  const columns: ColumnDef<Community>[] = [
    {
      id: 'name',
      header: 'Community Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {row.description}
          </div>
        </div>
      ),
    },
    {
      id: 'creator',
      header: 'Creator',
      cell: (row) => (
        <div className="text-sm">{row.creator?.username || 'Unknown'}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <StatusBadge status={row.status || 'unknown'} />
      ),
    },
    {
      id: 'badges',
      header: 'Badges',
      cell: (row) => (
        <div className="flex gap-1">
          {row.featured && (
            <StatusBadge status="Featured" variant="info" size="sm" />
          )}
          {row.verified && (
            <StatusBadge status="Verified" variant="success" size="sm" />
          )}
        </div>
      ),
    },
    {
      id: 'membersCount',
      header: 'Members',
      accessorKey: 'membersCount',
      sortable: true,
      cell: (row) => (
        <div className="text-sm">{row.membersCount || 0}</div>
      ),
    },
    {
      id: 'contentCount',
      header: 'Content',
      accessorKey: 'contentCount',
      sortable: true,
      cell: (row) => (
        <div className="text-sm">{row.contentCount || 0}</div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ]

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      placeholder: 'Filter by status',
    },
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by community name',
    },
    {
      key: 'dateRange',
      label: 'Created Date',
      type: 'dateRange',
    },
  ]

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    if (key === 'dateRange') {
      setFilters(prev => ({
        ...prev,
        createdAfter: value?.from,
        createdBefore: value?.to,
      }))
    } else if (key === 'search') {
      setFilters(prev => ({
        ...prev,
        searchTerm: value || undefined,
      }))
    } else {
      if (value === 'all') {
        setFilters(prev => ({
          ...prev,
          [key]: undefined,
        }))
        return
      }
      setFilters(prev => ({
        ...prev,
        [key]: value || undefined,
      }))
    }
  }

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      status: undefined,
      searchTerm: undefined,
      createdAfter: undefined,
      createdBefore: undefined,
    })
  }

  // Handle filter apply
  const handleFilterApply = () => {
    setPage(1) // Reset to first page when filters change
  }

  // Handle row click
  const handleRowClick = (community: Community) => {
    router.push(`/admin/communities/${community._id}`)
  }

  // Handle sorting
  const handleSortChange = (column: string, order: 'asc' | 'desc') => {
    setSortBy(column)
    setSortOrder(order)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Community Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage platform communities and approvals
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={communities}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSortChange: handleSortChange,
        }}
        onRowClick={handleRowClick}
        emptyMessage="No communities found. Try adjusting your filters."
      />
    </div>
  )
}
