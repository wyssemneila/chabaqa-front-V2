"use client"

import * as React from "react"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Column definition interface
export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

// Pagination configuration
export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

// Sorting configuration
export interface SortingConfig {
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

// Selection configuration
export interface SelectionConfig {
  selectedRows: string[]
  onSelectionChange: (ids: string[]) => void
}

// DataTable props
export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  pagination?: PaginationConfig
  sorting?: SortingConfig
  selection?: SelectionConfig
  onRowClick?: (row: T) => void
  emptyMessage?: string
  getRowId?: (row: T) => string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  sorting,
  selection,
  onRowClick,
  emptyMessage = "No data available",
  getRowId = (row) => row._id || row.id,
}: DataTableProps<T>) {
  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!sorting) return
    
    const column = columns.find(col => col.id === columnId)
    if (!column?.sortable) return

    const newOrder = 
      sorting.sortBy === columnId && sorting.sortOrder === 'asc' 
        ? 'desc' 
        : 'asc'
    
    sorting.onSortChange(columnId, newOrder)
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return
    
    if (checked) {
      const allIds = data.map(row => getRowId(row))
      selection.onSelectionChange(allIds)
    } else {
      selection.onSelectionChange([])
    }
  }

  // Handle individual row selection
  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (!selection) return
    
    if (checked) {
      selection.onSelectionChange([...selection.selectedRows, rowId])
    } else {
      selection.onSelectionChange(
        selection.selectedRows.filter(id => id !== rowId)
      )
    }
  }

  // Check if all rows are selected
  const allSelected = selection 
    ? data.length > 0 && data.every(row => selection.selectedRows.includes(getRowId(row)))
    : false

  // Check if some rows are selected
  const someSelected = selection
    ? selection.selectedRows.length > 0 && !allSelected
    : false

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="admin-table-shell">
          <Table>
            <TableHeader>
              <TableRow className="admin-table-head hover:bg-transparent">
                {selection && (
                  <TableHead className="w-12">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.id} style={{ width: column.width }}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {selection && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <span className="sr-only">Loading table data...</span>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="admin-table-shell">
        <Table>
          <TableHeader>
            <TableRow className="admin-table-head hover:bg-transparent">
              {selection && (
                <TableHead className="w-12">
                  <Checkbox disabled />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.id} style={{ width: column.width }}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length + (selection ? 1 : 0)}
                className="h-24 text-center"
              >
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p>{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="admin-table-shell overflow-x-auto" role="region" aria-label="Data table">
        <Table>
          <TableHeader>
            <TableRow className="admin-table-head hover:bg-transparent">
              {selection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                    className={cn(
                      someSelected && "data-[state=checked]:bg-primary/50"
                    )}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.id} style={{ width: column.width }}>
                  {column.sortable ? (
                  <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 rounded-xl text-[hsl(var(--admin-muted))] data-[state=open]:bg-accent hover:bg-[hsl(var(--admin-primary)/0.08)] hover:text-foreground"
                      onClick={() => handleSort(column.id)}
                      aria-label={`Sort by ${column.header}`}
                      aria-sort={
                        sorting?.sortBy === column.id
                          ? sorting.sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <span>{column.header}</span>
                      <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const rowId = getRowId(row)
              const isSelected = selection?.selectedRows.includes(rowId) || false

              return (
                <TableRow
                  key={rowId}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    "border-b border-[hsl(var(--admin-border)/0.55)] transition-colors hover:bg-[hsl(var(--admin-primary)/0.05)]",
                    isSelected && "bg-[hsl(var(--admin-primary)/0.08)]"
                  )}
                  onClick={() => onRowClick?.(row)}
                  aria-selected={isSelected}
                >
                  {selection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => 
                          handleSelectRow(rowId, checked as boolean)
                        }
                        aria-label={`Select row ${rowId}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell 
                        ? column.cell(row)
                        : column.accessorKey 
                          ? String(row[column.accessorKey] ?? '')
                          : ''
                      }
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <nav
          className="admin-surface-muted flex flex-col gap-3 rounded-2xl border border-[hsl(var(--admin-border)/0.8)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          role="navigation"
          aria-label="Table pagination"
        >
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <p className="text-sm text-muted-foreground">
              Rows per page
            </p>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
            >
              <SelectTrigger 
                className="h-8 w-[70px] rounded-xl border-[hsl(var(--admin-border)/0.9)] bg-white/80"
                aria-label="Select page size"
              >
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:space-x-6 lg:space-x-8">
            <div 
              className="flex items-center justify-center text-sm font-medium sm:w-[100px]"
              aria-live="polite"
              aria-atomic="true"
            >
              Page {pagination.page} of{" "}
              {Math.ceil(pagination.total / pagination.pageSize)}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 rounded-xl border-[hsl(var(--admin-border)/0.9)] bg-white/80 p-0"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Go to previous page"
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 rounded-xl border-[hsl(var(--admin-border)/0.9)] bg-white/80 p-0"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={
                  pagination.page >= Math.ceil(pagination.total / pagination.pageSize)
                }
                aria-label="Go to next page"
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}
