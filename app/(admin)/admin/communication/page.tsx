"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Plus, Send, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { BulkMessageDialog } from "@/app/(admin)/_components/bulk-message-dialog"

interface EmailCampaign {
  _id: string
  name: string
  subject: string
  content: string
  targetAudience: 'all' | 'creators' | 'members' | 'custom'
  customAudienceIds?: string[]
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduledAt?: string
  sentAt?: string
  createdBy: {
    _id: string
    name: string
  }
  analytics?: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  createdAt: string
  updatedAt: string
}

interface CampaignsResponse {
  campaigns: EmailCampaign[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function CampaignsListPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  
  // Send campaign dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [campaignToSend, setCampaignToSend] = useState<EmailCampaign | null>(null)
  const [sending, setSending] = useState(false)
  
  // Bulk message dialog state
  const [bulkMessageDialogOpen, setBulkMessageDialogOpen] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch campaigns
  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await adminApi.communication.getEmailCampaigns({
        page: pagination.page,
        limit: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder
      })

      const data: CampaignsResponse = response?.data || response
      setCampaigns(data?.campaigns || [])
      setPagination(prev => ({
        ...prev,
        total: data?.total || 0
      }))
    } catch (error) {
      console.error('[Campaigns] Error:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    fetchCampaigns()
  }, [isAuthenticated, authLoading, pagination.page, pagination.pageSize, sorting])

  const handleSendCampaign = async () => {
    if (!campaignToSend) return

    setSending(true)
    try {
      await adminApi.communication.sendEmailCampaign(campaignToSend._id)
      toast.success('Campaign sent successfully')
      setSendDialogOpen(false)
      setCampaignToSend(null)
      fetchCampaigns() // Refresh list
    } catch (error) {
      console.error('[Send Campaign] Error:', error)
      toast.error('Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  const columns: ColumnDef<EmailCampaign>[] = [
    {
      id: 'name',
      header: 'Campaign Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.subject}</div>
        </div>
      )
    },
    {
      id: 'targetAudience',
      header: 'Target Audience',
      accessorKey: 'targetAudience',
      cell: (row) => {
        const audienceLabels = {
          all: 'All Users',
          creators: 'Creators',
          members: 'Members',
          custom: 'Custom'
        }
        return (
          <div>
            <div>{audienceLabels[row.targetAudience]}</div>
            {row.targetAudience === 'custom' && row.customAudienceIds && (
              <div className="text-sm text-muted-foreground">
                {row.customAudienceIds.length} recipients
              </div>
            )}
          </div>
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
      id: 'analytics',
      header: 'Analytics',
      accessorKey: 'analytics',
      cell: (row) => {
        if (!row.analytics) {
          return <span className="text-muted-foreground">-</span>
        }
        const { sent, delivered, opened, clicked } = row.analytics
        const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0'
        const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0'
        
        return (
          <div className="text-sm">
            <div>Sent: {sent}</div>
            <div className="text-muted-foreground">
              Open: {openRate}% | Click: {clickRate}%
            </div>
          </div>
        )
      }
    },
    {
      id: 'createdBy',
      header: 'Created By',
      accessorKey: 'createdBy',
      cell: (row) => row.createdBy?.name || 'N/A'
    },
    {
      id: 'scheduledAt',
      header: 'Scheduled',
      accessorKey: 'scheduledAt',
      cell: (row) => {
        if (!row.scheduledAt) return <span className="text-muted-foreground">-</span>
        return new Date(row.scheduledAt).toLocaleString()
      }
    },
    {
      id: 'sentAt',
      header: 'Sent',
      accessorKey: 'sentAt',
      sortable: true,
      cell: (row) => {
        if (!row.sentAt) return <span className="text-muted-foreground">-</span>
        return new Date(row.sentAt).toLocaleString()
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/communication/${row._id}`)}
          >
            View
          </Button>
          {(row.status === 'draft' || row.status === 'scheduled') && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setCampaignToSend(row)
                setSendDialogOpen(true)
              }}
            >
              <Send className="h-3 w-3 mr-1" />
              Send
            </Button>
          )}
        </div>
      )
    }
  ]

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage email campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/communication/notifications')}
          >
            Notifications
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/communication/analytics')}
          >
            Analytics
          </Button>
          <Button
            variant="outline"
            onClick={() => setBulkMessageDialogOpen(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Bulk Message
          </Button>
          <Button onClick={() => router.push('/admin/communication/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={campaigns}
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
        emptyMessage="No campaigns found. Create your first campaign to get started."
      />

      {/* Send Campaign Confirmation Dialog */}
      <ConfirmDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        title="Send Campaign"
        description={`Are you sure you want to send the campaign "${campaignToSend?.name}"? This action cannot be undone.`}
        confirmLabel={sending ? "Sending..." : "Send Campaign"}
        onConfirm={handleSendCampaign}
        variant="default"
      />

      {/* Bulk Message Dialog */}
      <BulkMessageDialog
        open={bulkMessageDialogOpen}
        onOpenChange={setBulkMessageDialogOpen}
        onSuccess={fetchCampaigns}
      />
    </div>
  )
}
