"use client"

import * as React from "react"
import { DataTable, ColumnDef } from "./data-table"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"

// Sample data type
interface User {
  _id: string
  username: string
  email: string
  status: 'active' | 'suspended' | 'deleted'
  role: string
  createdAt: string
}

// Sample data
const sampleUsers: User[] = [
  {
    _id: "1",
    username: "john_doe",
    email: "john@example.com",
    status: "active",
    role: "creator",
    createdAt: "2024-01-15"
  },
  {
    _id: "2",
    username: "jane_smith",
    email: "jane@example.com",
    status: "active",
    role: "member",
    createdAt: "2024-01-20"
  },
  {
    _id: "3",
    username: "bob_wilson",
    email: "bob@example.com",
    status: "suspended",
    role: "creator",
    createdAt: "2024-02-01"
  },
  {
    _id: "4",
    username: "alice_brown",
    email: "alice@example.com",
    status: "active",
    role: "admin",
    createdAt: "2024-02-10"
  },
  {
    _id: "5",
    username: "charlie_davis",
    email: "charlie@example.com",
    status: "deleted",
    role: "member",
    createdAt: "2024-02-15"
  },
]

export function DataTableDemo() {
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<User[]>(sampleUsers)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("username")
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])

  // Column definitions
  const columns: ColumnDef<User>[] = [
    {
      id: "username",
      header: "Username",
      accessorKey: "username",
      sortable: true,
      width: "200px"
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge 
          status={row.status}
          variant={
            row.status === 'active' ? 'success' :
            row.status === 'suspended' ? 'warning' :
            'default'
          }
        />
      )
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      sortable: true,
    },
    {
      id: "createdAt",
      header: "Created At",
      accessorKey: "createdAt",
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <Button variant="ghost" size="sm">
          View
        </Button>
      )
    }
  ]

  // Handle sorting
  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    
    // Sort data
    const sorted = [...data].sort((a, b) => {
      const aValue = a[newSortBy as keyof User]
      const bValue = b[newSortBy as keyof User]
      
      if (aValue < bValue) return newSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return newSortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    setData(sorted)
  }

  // Simulate loading
  const handleLoadData = () => {
    setLoading(true)
    setTimeout(() => {
      setData(sampleUsers)
      setLoading(false)
    }, 1500)
  }

  // Clear data to show empty state
  const handleClearData = () => {
    setData([])
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">DataTable Demo</h2>
        <div className="flex gap-2">
          <Button onClick={handleLoadData} variant="outline">
            Reload Data
          </Button>
          <Button onClick={handleClearData} variant="outline">
            Clear Data
          </Button>
          <Button onClick={() => setData(sampleUsers)} variant="outline">
            Reset Data
          </Button>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm">
            Selected {selectedRows.length} row(s)
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: data.length,
          onPageChange: setPage,
          onPageSizeChange: setPageSize
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSortChange: handleSortChange
        }}
        selection={{
          selectedRows,
          onSelectionChange: setSelectedRows
        }}
        onRowClick={(row) => console.log('Row clicked:', row)}
        emptyMessage="No users found. Try resetting the data."
      />
    </div>
  )
}
