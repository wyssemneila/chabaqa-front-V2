"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, UserFilters } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { UserDialog } from "./user-dialog"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  UserPlus, 
  MoreHorizontal, 
  Pencil, 
  Trash,
  Shield,
  Ban,
  CheckCircle,
  RefreshCcw
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface User {
  _id: string
  name: string
  email: string
  status: 'active' | 'suspended' | 'deleted'
  role: string
  createdAt: string
  lastLogin?: string
  isSuspended: boolean
}

interface UsersResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

export default function UsersPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<UserFilters>({
    status: undefined,
    roles: undefined,
    searchTerm: undefined,
    registeredFrom: undefined,
    registeredTo: undefined,
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch users
  const fetchUsers = async () => {
    if (!isAuthenticated) return
    
    setLoading(true)
    try {
      const response = await adminApi.users.getUsers({
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        ...filters,
      })

      // The API returns { success: true, data: { data: [], total: 0, ... } }
      // response.data contains the PaginatedResult object
      if (response.success && response.data) {
        setUsers(response.data.data || [])
        setTotal(response.data.total || 0)
      } else {
        setUsers([])
        setTotal(0)
      }
    } catch (error: any) {
      console.error('[Users] Fetch error:', error)
      if (error?.message?.includes('401')) {
        await logout()
        return
      }
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isAuthenticated, authLoading, page, pageSize, sortBy, sortOrder, filters])

  // Handlers
  const handleCreateSuccess = () => {
    fetchUsers()
    setIsCreateOpen(false)
  }

  const handleEditSuccess = () => {
    fetchUsers()
    setIsEditOpen(false)
    setSelectedUser(null)
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      await adminApi.users.deleteUser(selectedUser._id)
      toast.success("User deleted successfully")
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user")
    }
  }

  const handleSuspendToggle = async (user: User) => {
    if (!user) return
    try {
      if (user.isSuspended) {
        await adminApi.users.activateUser(user._id, { reason: "Admin activation" })
        toast.success("User activated successfully")
      } else {
        await adminApi.users.suspendUser(user._id, { reason: "Admin suspension" })
        toast.success("User suspended successfully")
      }
      fetchUsers()
    } catch (error: any) {
      console.error('Suspend toggle error:', error)
      // If the error suggests state mismatch (400 Bad Request), refresh the list
      if (error.message?.includes('400') || error.message?.includes('not suspended') || error.message?.includes('already suspended')) {
        toast.warning("User status mismatch. Refreshing list...")
        fetchUsers()
      } else {
        toast.error(error.message || "Failed to update user status")
      }
    }
  }

  // Column definitions
  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{row.name || 'N/A'}</div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
      cell: (row) => (
        <div className="text-sm text-muted-foreground">{row.email}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <StatusBadge 
          status={row.isSuspended ? 'suspended' : row.status || 'active'}
          variant={
            row.isSuspended ? 'danger' :
            row.status === 'active' ? 'success' :
            'default'
          }
        />
      ),
    },
    {
      id: 'role',
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => (
        <div className="text-sm capitalize flex items-center gap-1">
          {row.role === 'admin' && <Shield className="h-3 w-3 text-blue-500" />}
          {row.role}
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Registered',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedUser(row)
                setIsEditOpen(true)
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // We pass the user directly to avoid state timing issues
                handleSuspendToggle(row)
              }}>
                {row.isSuspended ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate User
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend User
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  setSelectedUser(row)
                  setIsDeleteOpen(true)
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
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
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
      placeholder: 'Filter by status',
    },
    {
      key: 'roles',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'User', value: 'user' },
        { label: 'Creator', value: 'creator' },
        { label: 'Admin', value: 'admin' },
      ],
      placeholder: 'Filter by role',
    },
    {
      key: 'searchTerm',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name or email',
    },
  ]

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
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

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      status: undefined,
      roles: undefined,
      searchTerm: undefined,
      registeredFrom: undefined,
      registeredTo: undefined,
    })
  }

  // Handle filter apply
  const handleFilterApply = () => {
    setPage(1) // Reset to first page when filters change
  }

  // Handle row click
  const handleRowClick = (user: User) => {
    // Optional: navigate on row click, or keep it for the actions menu only
    // router.push(`/admin/users/${user._id}`)
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
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and their accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
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
        data={users}
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
        emptyMessage="No users found. Try adjusting your filters."
      />

      {/* Create User Dialog */}
      <UserDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={handleCreateSuccess} 
      />

      {/* Edit User Dialog */}
      <UserDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        user={selectedUser}
        onSuccess={handleEditSuccess} 
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmLabel="Delete User"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
