"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { ArrowLeft, Send, Edit, Trash2, Mail, MousePointerClick, Eye } from "lucide-react"
import { toast } from "sonner"

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
    email: string
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

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  
  // Dialog states
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch campaign details
  const fetchCampaign = async () => {
    setLoading(true)
    try {
      const response = await adminApi.communication.getEmailCampaignById(params.id)
      const data = response?.data || response
      setCampaign(data?.campaign || data)
    } catch (error) {
      console.error('[Campaign Details] Error:', error)
      toast.error('Failed to load campaign details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    fetchCampaign()
  }, [isAuthenticated, authLoading, params.id])

  const handleSendCampaign = async () => {
    setSending(true)
    try {
      await adminApi.communication.sendEmailCampaign(params.id)
      toast.success('Campaign sent successfully')
      setSendDialogOpen(false)
      fetchCampaign() // Refresh data
    } catch (error) {
      console.error('[Send Campaign] Error:', error)
      toast.error('Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteCampaign = async () => {
    setDeleting(true)
    try {
      await adminApi.communication.deleteEmailCampaign(params.id)
      toast.success('Campaign deleted successfully')
      router.push('/admin/communication')
    } catch (error) {
      console.error('[Delete Campaign] Error:', error)
      toast.error('Failed to delete campaign')
      setDeleting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/admin/communication')}
          >
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  const audienceLabels = {
    all: 'All Users',
    creators: 'Creators',
    members: 'Members',
    custom: 'Custom'
  }

  const canSend = campaign.status === 'draft' || campaign.status === 'scheduled'
  const canEdit = campaign.status === 'draft'
  const canDelete = campaign.status !== 'sending'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/communication')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">
              Campaign Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSend && (
            <Button onClick={() => setSendDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/communication/${params.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Subject</div>
              <div className="mt-1">{campaign.subject}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Content</div>
              <div className="mt-1 p-4 bg-muted rounded-md">
                <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Target Audience</div>
                <div className="mt-1">{audienceLabels[campaign.targetAudience]}</div>
                {campaign.targetAudience === 'custom' && campaign.customAudienceIds && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {campaign.customAudienceIds.length} recipients
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">
                  <StatusBadge status={campaign.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created By</div>
                <div className="mt-1">{campaign.createdBy?.name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{campaign.createdBy?.email || ''}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Created At</div>
                <div className="mt-1">{new Date(campaign.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {campaign.scheduledAt && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Scheduled For</div>
                <div className="mt-1">{new Date(campaign.scheduledAt).toLocaleString()}</div>
              </div>
            )}

            {campaign.sentAt && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Sent At</div>
                <div className="mt-1">{new Date(campaign.sentAt).toLocaleString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Analytics</CardTitle>
            <CardDescription>
              Performance metrics for this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaign.analytics ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sent</span>
                  </div>
                  <span className="font-semibold">{campaign.analytics.sent}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Delivered</span>
                  </div>
                  <span className="font-semibold">{campaign.analytics.delivered}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Opened</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{campaign.analytics.opened}</div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.analytics.sent > 0
                        ? `${((campaign.analytics.opened / campaign.analytics.sent) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Clicked</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{campaign.analytics.clicked}</div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.analytics.sent > 0
                        ? `${((campaign.analytics.clicked / campaign.analytics.sent) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Bounced</span>
                  </div>
                  <span className="font-semibold">{campaign.analytics.bounced}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Unsubscribed</span>
                  </div>
                  <span className="font-semibold">{campaign.analytics.unsubscribed}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No analytics available yet</p>
                <p className="text-sm mt-2">
                  Analytics will be available after the campaign is sent
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Campaign Confirmation Dialog */}
      <ConfirmDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        title="Send Campaign"
        description={`Are you sure you want to send the campaign "${campaign.name}"? This action cannot be undone.`}
        confirmLabel={sending ? "Sending..." : "Send Campaign"}
        onConfirm={handleSendCampaign}
        variant="default"
      />

      {/* Delete Campaign Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Campaign"
        description={`Are you sure you want to delete the campaign "${campaign.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Campaign"}
        onConfirm={handleDeleteCampaign}
        variant="destructive"
      />
    </div>
  )
}
