"use client"

import * as React from "react"
import { Check, X, Trash2, Archive } from "lucide-react"
import { FilterPanel, FilterConfig } from "./filter-panel"
import { BulkActionBar, BulkAction } from "./bulk-action-bar"
import { DataTable, ColumnDef } from "./data-table"
import { StatusBadge } from "./status-badge"

/**
 * Demo component showing how to use FilterPanel and BulkActionBar together
 * with DataTable for a complete list management interface.
 * 
 * This example demonstrates:
 * - Filter configuration with multiple filter types
 * - Bulk action configuration with confirmation
 * - Integration with DataTable for row selection
 * - State management for filters and selection
 */

interface DemoItem {
  id: string
  name: string
  status: 'active' | 'pending' | 'suspended'
  role: string
  createdAt: string
}

export function FilterBulkDemo() {
  // Sample data
  const [allItems] = React.useState<DemoItem[]>([
    { id: '1', name: 'John Doe', status: 'active', role: 'admin', createdAt: '2024-01-15' },
    { id: '2', name: 'Jane Smith', status: 'pending', role: 'user', createdAt: '2024-01-16' },
    { id: '3', name: 'Bob Johnson', status: 'suspended', role: 'moderator', createdAt: '2024-01-17' },
    { id: '4', name: 'Alice Brown', status: 'active', role: 'user', createdAt: '2024-01-18' },
    { id: '5', name: 'Charlie Wilson', status: 'active', role: 'admin', createdAt: '2024-01-19' },
  ])

  // Filter state
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({
    search: '',
    status: '',
    role: '',
    dateRange: { from: '', to: '' }
  })

  // Selection state
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])

  // Filtered data
  const [filteredItems, setFilteredItems] = React.useState<DemoItem[]>(allItems)

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'active' },
        { label: 'Pending', value: 'pending' },
        { label: 'Suspended', value: 'suspended' }
      ],
      placeholder: 'Select status...'
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'All Roles', value: '' },
        { label: 'Admin', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'User', value: 'user' }
      ],
      placeholder: 'Select role...'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange'
    }
  ]

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    {
      label: 'Approve',
      icon: Check,
      variant: 'success',
      onClick: async () => {
        console.log('Approving items:', selectedRows)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert(`Approved ${selectedRows.length} items`)
        setSelectedRows([])
      }
    },
    {
      label: 'Reject',
      icon: X,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationTitle: 'Reject Items',
      confirmationMessage: `Are you sure you want to reject ${selectedRows.length} items? This action cannot be undone.`,
      onClick: async () => {
        console.log('Rejecting items:', selectedRows)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert(`Rejected ${selectedRows.length} items`)
        setSelectedRows([])
      }
    },
    {
      label: 'Archive',
      icon: Archive,
      variant: 'outline',
      onClick: async () => {
        console.log('Archiving items:', selectedRows)
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert(`Archived ${selectedRows.length} items`)
        setSelectedRows([])
      }
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationTitle: 'Delete Items',
      confirmationMessage: `Are you sure you want to permanently delete ${selectedRows.length} items? This action cannot be undone.`,
      onClick: async () => {
        console.log('Deleting items:', selectedRows)
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert(`Deleted ${selectedRows.length} items`)
        setSelectedRows([])
      }
    }
  ]

  // Table columns
  const columns: ColumnDef<DemoItem>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
      sortable: true
    },
    {
      id: 'role',
      header: 'Role',
      accessorKey: 'role',
      sortable: true
    },
    {
      id: 'createdAt',
      header: 'Created At',
      accessorKey: 'createdAt',
      sortable: true
    }
  ]

  // Apply filters
  const handleApplyFilters = () => {
    let filtered = [...allItems]

    // Search filter
    if (filterValues.search) {
      const searchLower = filterValues.search.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filterValues.status) {
      filtered = filtered.filter(item => item.status === filterValues.status)
    }

    // Role filter
    if (filterValues.role) {
      filtered = filtered.filter(item => item.role === filterValues.role)
    }

    // Date range filter
    if (filterValues.dateRange?.from) {
      filtered = filtered.filter(item => item.createdAt >= filterValues.dateRange.from)
    }
    if (filterValues.dateRange?.to) {
      filtered = filtered.filter(item => item.createdAt <= filterValues.dateRange.to)
    }

    setFilteredItems(filtered)
    setSelectedRows([]) // Clear selection when filters change
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilterValues({
      search: '',
      status: '',
      role: '',
      dateRange: { from: '', to: '' }
    })
    setFilteredItems(allItems)
    setSelectedRows([])
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold">Filter & Bulk Action Demo</h1>
        <p className="text-muted-foreground mt-2">
          Example showing FilterPanel and BulkActionBar integration with DataTable
        </p>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        values={filterValues}
        onChange={(key, value) => {
          setFilterValues(prev => ({ ...prev, [key]: value }))
        }}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
        collapsible
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        selection={{
          selectedRows,
          onSelectionChange: setSelectedRows
        }}
        emptyMessage="No items found. Try adjusting your filters."
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedRows.length}
        totalCount={filteredItems.length}
        actions={bulkActions}
        onClearSelection={() => setSelectedRows([])}
      />
    </div>
  )
}

