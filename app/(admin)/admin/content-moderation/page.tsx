"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Flag, AlertCircle, Clock, User, CheckCircle, XCircle } from "lucide-react"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { BulkActionBar, BulkAction } from "@/app/(admin)/_components/bulk-action-bar"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ModerationItem {
  _id: string
  contentType: 'post' | 'comment' | 'course' | 'event' | 'product' | 'community' | 'user_profile'
  contentId: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'under_review' | 'escalated'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  creator: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  community?: {
    _id: string
    name: string
    slug: string
  }
  reportCount: number
  reviewer?: {
    _id: string
    name: string
    email: string
  }
  submittedAt: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
}

export default function ContentModerationPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = React.useState(true)
  const [items, setItems] = React.useState<ModerationItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [sortBy, setSortBy] = React.useState('createdAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])

  // Filter state
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({
    status: '',
    contentType: '',
    priority: '',
    dateRange: { from: '', to: '' }
  })

  // Auth guard
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch moderation queue
  const fetchQueue = React.useCallback(async () => {
    if (!isAuthenticated || authLoading) return

    setLoading(true)
    try {
      const filters: any = {
        page,
        limit: pageSize,
        sortBy,
        sortOrder
      }

      // Add active filters
      if (filterValues.status && filterValues.status !== 'all') filters.status = filterValues.status
      if (filterValues.contentType && filterValues.contentType !== 'all') filters.contentType = filterValues.contentType
      if (filterValues.priority && filterValues.priority !== 'all') filters.priority = filterValues.priority
      if (filterValues.dateRange?.from) filters.reportedFrom = filterValues.dateRange.from
      if (filterValues.dateRange?.to) filters.reportedTo = filterValues.dateRange.to

      const response = await adminApi.contentModeration.getQueue(filters)
      // adminApi normalizes list endpoints to `{ data: { items, total, ... }, pagination? }`.
      // Be defensive here to avoid `data.map is not a function` crashes if the shape changes.
      const payload: any = (response as any)?.data
      const normalizedItems =
        Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload)
              ? payload
              : []

      setItems(normalizedItems)
      setTotal(
        typeof payload?.total === 'number'
          ? payload.total
          : typeof (response as any)?.pagination?.total === 'number'
            ? (response as any).pagination.total
            : 0
      )
    } catch (error) {
      console.error('[ContentModeration] Fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to load moderation queue. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, authLoading, page, pageSize, sortBy, sortOrder, filterValues, toast])

  React.useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }

  const handleFilterReset = () => {
    setFilterValues({
      status: '',
      contentType: '',
      priority: '',
      dateRange: { from: '', to: '' }
    })
  }

  const handleFilterApply = () => {
    setPage(1) // Reset to first page
    fetchQueue()
  }

  // Handle priority update
  const handlePriorityUpdate = async (itemId: string, priority: string) => {
    try {
      await adminApi.contentModeration.updatePriority(itemId, priority)
      toast({
        title: "Success",
        description: "Priority updated successfully"
      })
      fetchQueue()
    } catch (error) {
      console.error('[ContentModeration] Priority update error:', error)
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      })
    }
  }

  // Handle bulk moderation
  const handleBulkApprove = async () => {
    try {
      await adminApi.contentModeration.bulkModerate({
        itemIds: selectedRows,
        action: 'approve'
      })
      toast({
        title: "Success",
        description: `${selectedRows.length} items approved successfully`
      })
      setSelectedRows([])
      fetchQueue()
    } catch (error) {
      console.error('[ContentModeration] Bulk approve error:', error)
      toast({
        title: "Error",
        description: "Failed to approve items",
        variant: "destructive"
      })
    }
  }

  const handleBulkReject = async () => {
    try {
      await adminApi.contentModeration.bulkModerate({
        itemIds: selectedRows,
        action: 'reject',
        reason: 'Bulk rejection'
      })
      toast({
        title: "Success",
        description: `${selectedRows.length} items rejected successfully`
      })
      setSelectedRows([])
      fetchQueue()
    } catch (error) {
      console.error('[ContentModeration] Bulk reject error:', error)
      toast({
        title: "Error",
        description: "Failed to reject items",
        variant: "destructive"
      })
    }
  }

  const handleBulkFlag = async () => {
    try {
      await adminApi.contentModeration.bulkModerate({
        itemIds: selectedRows,
        action: 'flag'
      })
      toast({
        title: "Success",
        description: `${selectedRows.length} items flagged successfully`
      })
      setSelectedRows([])
      fetchQueue()
    } catch (error) {
      console.error('[ContentModeration] Bulk flag error:', error)
      toast({
        title: "Error",
        description: "Failed to flag items",
        variant: "destructive"
      })
    }
  }

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Flagged', value: 'flagged' }
      ]
    },
    {
      key: 'contentType',
      label: 'Content Type',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Post', value: 'post' },
        { label: 'Comment', value: 'comment' },
        { label: 'Course', value: 'course' },
        { label: 'Event', value: 'event' },
        { label: 'Product', value: 'product' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' }
      ]
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange'
    }
  ]

  // Table columns
  const columns: ColumnDef<ModerationItem>[] = [
    {
      id: 'contentType',
      header: 'Type',
      accessorKey: 'contentType',
      cell: (row) => (
        <span className="capitalize font-medium">
          {row.contentType}
        </span>
      ),
      sortable: true,
      width: '100px'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
      sortable: true,
      width: '120px'
    },
    {
      id: 'priority',
      header: 'Priority',
      cell: (row) => (
        <Select
          value={row.priority}
          onValueChange={(value) => handlePriorityUpdate(row._id, value)}
        >
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      ),
      width: '120px'
    },
    {
      id: 'creator',
      header: 'Creator',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {row.creator?.name || 'Unknown'}
          </span>
        </div>
      ),
      width: '150px'
    },
    {
      id: 'reportCount',
      header: 'Reports',
      accessorKey: 'reportCount',
      cell: (row) => (
        <span className="text-sm font-medium">
          {row.reportCount || 0}
        </span>
      ),
      sortable: true,
      width: '100px'
    },
    {
      id: 'reviewer',
      header: 'Reviewer',
      cell: (row) => (
        <span className="text-sm">
          {row.reviewer?.name || 'Unassigned'}
        </span>
      ),
      width: '150px'
    },
    {
      id: 'submittedAt',
      header: 'Submitted',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(row.submittedAt).toLocaleDateString()}
          </span>
        </div>
      ),
      sortable: true,
      width: '150px'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/admin/content-moderation/${row._id}`)
          }}
        >
          Review
        </Button>
      ),
      width: '100px'
    }
  ]

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: 'Approve',
      icon: CheckCircle,
      onClick: handleBulkApprove,
      variant: 'success',
      requiresConfirmation: true,
      confirmationTitle: 'Approve Items',
      confirmationMessage: `Are you sure you want to approve ${selectedRows.length} items?`
    },
    {
      label: 'Reject',
      icon: XCircle,
      onClick: handleBulkReject,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationTitle: 'Reject Items',
      confirmationMessage: `Are you sure you want to reject ${selectedRows.length} items?`
    },
    {
      label: 'Flag',
      icon: Flag,
      onClick: handleBulkFlag,
      variant: 'outline',
      requiresConfirmation: true,
      confirmationTitle: 'Flag Items',
      confirmationMessage: `Are you sure you want to flag ${selectedRows.length} items for review?`
    }
  ]

  if (authLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Review and moderate user-generated content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">{total} items in queue</p>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filterConfigs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
      />

      {/* Data Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            Click on any item to view details and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
              onPageSizeChange: setPageSize
            }}
            sorting={{
              sortBy,
              sortOrder,
              onSortChange: (newSortBy, newSortOrder) => {
                setSortBy(newSortBy)
                setSortOrder(newSortOrder)
              }
            }}
            selection={{
              selectedRows,
              onSelectionChange: setSelectedRows
            }}
            onRowClick={(row) => router.push(`/admin/content-moderation/${row._id}`)}
            emptyMessage="No items in moderation queue"
          />
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedRows.length}
        actions={bulkActions}
        onClearSelection={() => setSelectedRows([])}
        totalCount={total}
      />
    </div>
  )
}
