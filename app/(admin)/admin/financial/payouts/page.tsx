"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, PayoutFilters, CalculatePayoutDto, InitiatePayoutDto } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { BulkActionBar, BulkAction } from "@/app/(admin)/_components/bulk-action-bar"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Calculator, Send, Check } from "lucide-react"
import { toast } from "sonner"
import { localizeHref } from "@/lib/i18n/client"
import { useLocale } from "next-intl"
import { formatCurrency, formatDate } from "@/lib/i18n/format"

interface Payout {
  _id: string
  creator: {
    _id: string
    username: string
    email: string
  }
  community: {
    _id: string
    name: string
  }
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  method: 'bank_transfer' | 'paypal' | 'stripe'
  initiatedAt: string
  processedAt?: string
  transactionReference?: string
  notes?: string
}

interface PayoutsResponse {
  payouts: Payout[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function PayoutsListPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const [sorting, setSorting] = useState({
    sortBy: 'initiatedAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<PayoutFilters>({
    page: 1,
    limit: 20
  })

  // Dialog states
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false)
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false)
  const [bulkProcessDialogOpen, setBulkProcessDialogOpen] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [initiating, setInitiating] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Form states
  const [calculateForm, setCalculateForm] = useState<CalculatePayoutDto>({
    communityId: '',
    creatorId: '',
    startDate: '',
    endDate: ''
  })
  const [initiateForm, setInitiateForm] = useState<InitiatePayoutDto>({
    communityId: '',
    creatorId: '',
    amount: 0,
    currency: 'TND',
    method: 'bank_transfer',
    notes: ''
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(localizeHref(pathname, '/admin/login'))
    }
  }, [authLoading, isAuthenticated, pathname, router])

  // Fetch payouts
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchPayouts = async () => {
      setLoading(true)
      try {
        const response = await adminApi.financial.getPayouts({
          ...filters,
          page: pagination.page,
          limit: pagination.pageSize,
          sortBy: sorting.sortBy,
          sortOrder: sorting.sortOrder
        })

        const data: PayoutsResponse = response?.data || response
        setPayouts(data?.payouts || [])
        setPagination(prev => ({
          ...prev,
          total: data?.total || 0
        }))
      } catch (error) {
        console.error('[Payouts] Error:', error)
        toast.error('Failed to load payouts')
      } finally {
        setLoading(false)
      }
    }

    fetchPayouts()
  }, [isAuthenticated, authLoading, pagination.page, pagination.pageSize, sorting, filters])

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' }
      ]
    },
    {
      key: 'method',
      label: 'Payment Method',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Bank Transfer', value: 'bank_transfer' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Stripe', value: 'stripe' }
      ]
    },
    {
      key: 'creatorId',
      label: 'Creator ID',
      type: 'text',
      placeholder: 'Filter by creator ID...'
    },
    {
      key: 'communityId',
      label: 'Community ID',
      type: 'text',
      placeholder: 'Filter by community ID...'
    },
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date'
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'date'
    }
  ]

  const columns: ColumnDef<Payout>[] = [
    {
      id: 'creator',
      header: 'Creator',
      accessorKey: 'creator',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.creator?.username || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{row.creator?.email || ''}</div>
        </div>
      )
    },
    {
      id: 'community',
      header: 'Community',
      accessorKey: 'community',
      cell: (row) => row.community?.name || 'N/A'
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => {
        const amount = formatCurrency(row.amount || 0, row.currency || "TND", locale)
        return <span className="font-semibold">{amount}</span>
      }
    },
    {
      id: 'method',
      header: 'Method',
      accessorKey: 'method',
      cell: (row) => (
        <span className="capitalize">{row.method?.replace('_', ' ')}</span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      id: 'initiatedAt',
      header: 'Initiated',
      accessorKey: 'initiatedAt',
      sortable: true,
      cell: (row) => formatDate(row.initiatedAt, locale)
    },
    {
      id: 'processedAt',
      header: 'Processed',
      accessorKey: 'processedAt',
      cell: (row) => {
        if (!row.processedAt) return <span className="text-muted-foreground">-</span>
        return formatDate(row.processedAt, locale)
      }
    }
  ]

  const bulkActions: BulkAction[] = [
    {
      label: 'Process Selected',
      icon: Check,
      onClick: () => setBulkProcessDialogOpen(true),
      variant: 'success',
      requiresConfirmation: true,
      confirmationMessage: `Process ${selectedRows.length} payout(s)?`
    }
  ]

  const handleCalculatePayout = async () => {
    setCalculating(true)
    try {
      const response = await adminApi.financial.calculatePayout(calculateForm)
      const data = response?.data || response
      toast.success(`Payout calculated: ${data?.amount || 0} ${data?.currency || 'TND'}`)
      setCalculateDialogOpen(false)
      setCalculateForm({
        communityId: '',
        creatorId: '',
        startDate: '',
        endDate: ''
      })
    } catch (error) {
      console.error('[Calculate Payout] Error:', error)
      toast.error('Failed to calculate payout')
    } finally {
      setCalculating(false)
    }
  }

  const handleInitiatePayout = async () => {
    setInitiating(true)
    try {
      await adminApi.financial.initiatePayout(initiateForm)
      toast.success('Payout initiated successfully')
      setInitiateDialogOpen(false)
      setInitiateForm({
        communityId: '',
        creatorId: '',
        amount: 0,
        currency: 'TND',
        method: 'bank_transfer',
        notes: ''
      })
      // Refresh payouts list
      setPagination(prev => ({ ...prev, page: 1 }))
    } catch (error) {
      console.error('[Initiate Payout] Error:', error)
      toast.error('Failed to initiate payout')
    } finally {
      setInitiating(false)
    }
  }

  const handleBulkProcess = async () => {
    setProcessing(true)
    try {
      await adminApi.financial.bulkProcessPayouts(selectedRows)
      toast.success(`${selectedRows.length} payout(s) processed successfully`)
      setBulkProcessDialogOpen(false)
      setSelectedRows([])
      // Refresh payouts list
      setPagination(prev => ({ ...prev, page: 1 }))
    } catch (error) {
      console.error('[Bulk Process] Error:', error)
      toast.error('Failed to process payouts')
    } finally {
      setProcessing(false)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    if (value === 'all') {
      setFilters(prev => ({
        ...prev,
        [key]: undefined
      }))
      return
    }
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFilterReset = () => {
    setFilters({
      page: 1,
      limit: 20
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterApply = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, page: 1 }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSorting({ sortBy, sortOrder })
  }

  const handleRowClick = (row: Payout) => {
    router.push(`/admin/financial/payouts/${row._id}`)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(localizeHref(pathname, '/admin/financial'))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payouts</h1>
            <p className="text-muted-foreground mt-1">
              Manage creator payouts and earnings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCalculateDialogOpen(true)}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Payout
          </Button>
          <Button onClick={() => setInitiateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Initiate Payout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
      />

      {/* Bulk Action Bar */}
      {selectedRows.length > 0 && (
        <BulkActionBar
          selectedCount={selectedRows.length}
          actions={bulkActions}
          onClearSelection={() => setSelectedRows([])}
        />
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payouts}
        loading={loading}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange
        }}
        sorting={{
          sortBy: sorting.sortBy,
          sortOrder: sorting.sortOrder,
          onSortChange: handleSortChange
        }}
        selection={{
          selectedRows,
          onSelectionChange: setSelectedRows
        }}
        onRowClick={handleRowClick}
        emptyMessage="No payouts found"
      />

      {/* Calculate Payout Dialog */}
      <Dialog open={calculateDialogOpen} onOpenChange={setCalculateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculate Payout</DialogTitle>
            <DialogDescription>
              Calculate earnings for a creator in a specific period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="calc-community">Community ID</Label>
              <Input
                id="calc-community"
                value={calculateForm.communityId}
                onChange={(e) => setCalculateForm(prev => ({ ...prev, communityId: e.target.value }))}
                placeholder="Enter community ID"
              />
            </div>
            <div>
              <Label htmlFor="calc-creator">Creator ID</Label>
              <Input
                id="calc-creator"
                value={calculateForm.creatorId}
                onChange={(e) => setCalculateForm(prev => ({ ...prev, creatorId: e.target.value }))}
                placeholder="Enter creator ID"
              />
            </div>
            <div>
              <Label htmlFor="calc-start">Start Date</Label>
              <Input
                id="calc-start"
                type="date"
                value={calculateForm.startDate}
                onChange={(e) => setCalculateForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="calc-end">End Date</Label>
              <Input
                id="calc-end"
                type="date"
                value={calculateForm.endDate}
                onChange={(e) => setCalculateForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalculateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCalculatePayout} disabled={calculating}>
              {calculating ? 'Calculating...' : 'Calculate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initiate Payout Dialog */}
      <Dialog open={initiateDialogOpen} onOpenChange={setInitiateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Payout</DialogTitle>
            <DialogDescription>
              Create a new payout for a creator
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="init-community">Community ID</Label>
              <Input
                id="init-community"
                value={initiateForm.communityId}
                onChange={(e) => setInitiateForm(prev => ({ ...prev, communityId: e.target.value }))}
                placeholder="Enter community ID"
              />
            </div>
            <div>
              <Label htmlFor="init-creator">Creator ID</Label>
              <Input
                id="init-creator"
                value={initiateForm.creatorId}
                onChange={(e) => setInitiateForm(prev => ({ ...prev, creatorId: e.target.value }))}
                placeholder="Enter creator ID"
              />
            </div>
            <div>
              <Label htmlFor="init-amount">Amount</Label>
              <Input
                id="init-amount"
                type="number"
                step="0.01"
                value={initiateForm.amount}
                onChange={(e) => setInitiateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="init-currency">Currency</Label>
              <Select
                value={initiateForm.currency}
                onValueChange={(value) => setInitiateForm(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger id="init-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="init-method">Payment Method</Label>
              <Select
                value={initiateForm.method}
                onValueChange={(value: any) => setInitiateForm(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger id="init-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="init-notes">Notes (Optional)</Label>
              <Input
                id="init-notes"
                value={initiateForm.notes}
                onChange={(e) => setInitiateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInitiateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInitiatePayout} disabled={initiating}>
              {initiating ? 'Initiating...' : 'Initiate Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Process Confirmation */}
      <ConfirmDialog
        open={bulkProcessDialogOpen}
        onOpenChange={setBulkProcessDialogOpen}
        title="Process Payouts"
        description={`Are you sure you want to process ${selectedRows.length} payout(s)? This action cannot be undone.`}
        confirmLabel="Process"
        onConfirm={handleBulkProcess}
        variant="default"
      />
    </div>
  )
}
