"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, TransactionFilters } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search } from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  _id: string
  type: string
  amount: number
  currency: string
  status: string
  user: {
    _id: string
    username: string
    email: string
  }
  description?: string
  reference?: string
  createdAt: string
  processedAt?: string
}

interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function TransactionsListPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch transactions
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const response = await adminApi.financial.getTransactions({
          ...filters,
          page: pagination.page,
          limit: pagination.pageSize
        })

        const data: TransactionsResponse = response?.data || response
        setTransactions(data?.transactions || [])
        setPagination(prev => ({
          ...prev,
          total: data?.total || 0
        }))
      } catch (error) {
        console.error('[Transactions] Error:', error)
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [isAuthenticated, authLoading, pagination.page, pagination.pageSize, filters])

  const filterConfigs: FilterConfig[] = [
    {
      key: 'type',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Payment', value: 'payment' },
        { label: 'Refund', value: 'refund' },
        { label: 'Payout', value: 'payout' },
        { label: 'Subscription', value: 'subscription' }
      ]
    },
    {
      key: 'userId',
      label: 'User ID',
      type: 'text',
      placeholder: 'Filter by user ID...'
    },
    {
      key: 'minAmount',
      label: 'Min Amount',
      type: 'text',
      placeholder: '0.00'
    },
    {
      key: 'maxAmount',
      label: 'Max Amount',
      type: 'text',
      placeholder: '1000.00'
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

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'reference',
      header: 'Reference',
      accessorKey: 'reference',
      cell: (row) => (
        <div className="font-mono text-sm">
          {row.reference || row._id.slice(-8)}
        </div>
      )
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <span className="capitalize">{row.type}</span>
      )
    },
    {
      id: 'user',
      header: 'User',
      accessorKey: 'user',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.user?.username || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{row.user?.email || ''}</div>
        </div>
      )
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => {
        const amount = new Intl.NumberFormat('fr-TN', {
          style: 'currency',
          currency: row.currency || 'TND'
        }).format(row.amount || 0)
        return (
          <span className={`font-semibold ${row.type === 'refund' ? 'text-red-600' : ''}`}>
            {row.type === 'refund' ? '-' : ''}{amount}
          </span>
        )
      }
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <div className="max-w-xs truncate">
          {row.description || '-'}
        </div>
      )
    },
    {
      id: 'createdAt',
      header: 'Date',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <div>
          <div>{new Date(row.createdAt).toLocaleDateString()}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(row.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )
    }
  ]

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
      limit: 20,
      reference: undefined,
    })
    setSearchQuery('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterApply = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      reference: searchQuery.trim() || undefined,
    }))
    setPagination((prev) => ({ ...prev, page: 1 }))
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/financial')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View and search all platform transactions
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, user, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={transactions}
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
        emptyMessage="No transactions found"
      />
    </div>
  )
}
