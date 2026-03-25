"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Flag, AlertTriangle, User, Clock, FileText } from "lucide-react"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ContentDetails {
  _id: string
  contentType: 'post' | 'comment' | 'course' | 'event' | 'product'
  contentId: string
  content: any
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reportedBy?: {
    _id: string
    username: string
    email: string
  }
  reportReason?: string
  assignedTo?: {
    _id: string
    name: string
  }
  createdAt: string
  reviewedAt?: string
  reviewedBy?: {
    _id: string
    name: string
  }
  moderationNotes?: string
}

interface ModerationAction {
  action: 'approve' | 'reject' | 'flag'
  reason?: string
  notes?: string
}

export default function ContentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = React.useState(true)
  const [details, setDetails] = React.useState<ContentDetails | null>(null)
  const [priority, setPriority] = React.useState<string>('')
  const [assignedTo, setAssignedTo] = React.useState<string>('')
  const [notes, setNotes] = React.useState('')
  const [rejectReason, setRejectReason] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState(false)

  // Dialog state
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean
    action: 'approve' | 'reject' | 'flag' | null
  }>({
    open: false,
    action: null
  })

  // Auth guard
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch content details
  React.useEffect(() => {
    const fetchDetails = async () => {
      if (!isAuthenticated || authLoading) return

      setLoading(true)
      try {
        const response = await adminApi.contentModeration.getContentDetails(params.id)
        const data = response.data as ContentDetails

        setDetails(data)
        setPriority(data.priority)
        setAssignedTo(data.assignedTo?._id || '')
        setNotes(data.moderationNotes || '')
      } catch (error) {
        console.error('[ContentDetails] Fetch error:', error)
        toast({
          title: "Error",
          description: "Failed to load content details. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [params.id, isAuthenticated, authLoading, toast])

  // Handle priority update
  const handlePriorityUpdate = async (newPriority: string) => {
    try {
      await adminApi.contentModeration.updatePriority(params.id, newPriority)
      setPriority(newPriority)
      toast({
        title: "Success",
        description: "Priority updated successfully"
      })
    } catch (error) {
      console.error('[ContentDetails] Priority update error:', error)
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      })
    }
  }

  // Handle moderator assignment
  const handleAssignment = async (moderatorId: string) => {
    try {
      await adminApi.contentModeration.assignContent(params.id, moderatorId)
      setAssignedTo(moderatorId)
      toast({
        title: "Success",
        description: "Moderator assigned successfully"
      })
    } catch (error) {
      console.error('[ContentDetails] Assignment error:', error)
      toast({
        title: "Error",
        description: "Failed to assign moderator",
        variant: "destructive"
      })
    }
  }

  // Handle moderation actions
  const handleAction = async (action: 'approve' | 'reject' | 'flag') => {
    setActionLoading(true)
    try {
      const payload: any = {
        action,
        notes: notes || undefined,
        notifyUser: true
      }

      if (action === 'reject' && rejectReason) {
        payload.reason = rejectReason
      }

      await adminApi.contentModeration.moderateContent(params.id, payload)

      toast({
        title: "Success",
        description: `Content ${action}ed successfully`
      })

      // Navigate back to queue
      router.push('/admin/content-moderation')
    } catch (error) {
      console.error('[ContentDetails] Action error:', error)
      toast({
        title: "Error",
        description: `Failed to ${action} content`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
      setConfirmDialog({ open: false, action: null })
    }
  }

  // Open confirmation dialog
  const openConfirmDialog = (action: 'approve' | 'reject' | 'flag') => {
    if (action === 'reject' && !rejectReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      })
      return
    }
    setConfirmDialog({ open: true, action })
  }

  // Render content preview based on type
  const renderContentPreview = () => {
    if (!details?.content) return null

    const content = details.content

    switch (details.contentType) {
      case 'post':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Post Content:</p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{content.content || content.text || 'No content'}</p>
              {content.images && content.images.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">{content.images.length} image(s) attached</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'comment':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Comment:</p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{content.text || content.content || 'No content'}</p>
            </div>
          </div>
        )

      case 'course':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Course Details:</p>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">{content.title || 'Untitled Course'}</p>
              <p className="text-sm text-muted-foreground">{content.description || 'No description'}</p>
              {content.price && (
                <p className="text-sm">Price: ${content.price}</p>
              )}
            </div>
          </div>
        )

      case 'event':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Event Details:</p>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">{content.title || 'Untitled Event'}</p>
              <p className="text-sm text-muted-foreground">{content.description || 'No description'}</p>
              {content.date && (
                <p className="text-sm">Date: {new Date(content.date).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )

      case 'product':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Product Details:</p>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">{content.name || content.title || 'Untitled Product'}</p>
              <p className="text-sm text-muted-foreground">{content.description || 'No description'}</p>
              {content.price && (
                <p className="text-sm">Price: ${content.price}</p>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 bg-muted rounded-lg">
            <pre className="text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>
          </div>
        )
    }
  }

  if (authLoading || !isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Content not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              The content you're looking for doesn't exist or has been removed.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/admin/content-moderation')}
            >
              Back to Queue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/content-moderation')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Queue
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Review</h1>
            <p className="text-muted-foreground mt-1">
              Review and moderate this {details.contentType}
            </p>
          </div>
        </div>
        <StatusBadge status={details.status} size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Preview */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Preview
              </CardTitle>
              <CardDescription>
                Type: <span className="capitalize font-medium">{details.contentType}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderContentPreview()}
            </CardContent>
          </Card>

          {/* Reporter Information */}
          {details.reportedBy && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Reporter Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Username</Label>
                    <p className="text-sm font-medium">{details.reportedBy.username}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{details.reportedBy.email}</p>
                  </div>
                </div>
                {details.reportReason && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Report Reason</Label>
                    <p className="text-sm mt-1">{details.reportReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Moderation Notes */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Moderation Notes</CardTitle>
              <CardDescription>
                Add notes about your review decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejecting) */}
          <Card className="border-0 shadow-lg border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Rejection Reason</CardTitle>
              <CardDescription>
                Required if you choose to reject this content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Explain why this content is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Content ID</Label>
                <p className="text-sm font-mono">{details.contentId}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Reported</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{new Date(details.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {details.reviewedAt && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Reviewed</Label>
                    <p className="text-sm">{new Date(details.reviewedAt).toLocaleString()}</p>
                    {details.reviewedBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {details.reviewedBy.name}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Priority */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Priority</CardTitle>
              <CardDescription>Set review priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={priority} onValueChange={handlePriorityUpdate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Assign to a moderator</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={assignedTo} onValueChange={handleAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select moderator..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  <SelectItem value="mod1">Moderator 1</SelectItem>
                  <SelectItem value="mod2">Moderator 2</SelectItem>
                  <SelectItem value="mod3">Moderator 3</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Take action on this content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => openConfirmDialog('approve')}
                disabled={actionLoading || details.status === 'approved'}
              >
                <CheckCircle className="h-4 w-4" />
                Approve Content
              </Button>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => openConfirmDialog('reject')}
                disabled={actionLoading || details.status === 'rejected'}
              >
                <XCircle className="h-4 w-4" />
                Reject Content
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => openConfirmDialog('flag')}
                disabled={actionLoading || details.status === 'flagged'}
              >
                <Flag className="h-4 w-4" />
                Flag for Review
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, action: null })
          }
        }}
        title={`${confirmDialog.action ? confirmDialog.action.charAt(0).toUpperCase() + confirmDialog.action.slice(1) : ''} Content`}
        description={
          confirmDialog.action === 'approve'
            ? 'Are you sure you want to approve this content? It will be published and visible to users.'
            : confirmDialog.action === 'reject'
            ? 'Are you sure you want to reject this content? The creator will be notified.'
            : 'Are you sure you want to flag this content for further review?'
        }
        confirmLabel={confirmDialog.action ? confirmDialog.action.charAt(0).toUpperCase() + confirmDialog.action.slice(1) : 'Confirm'}
        variant={confirmDialog.action === 'reject' ? 'destructive' : 'default'}
        onConfirm={() => confirmDialog.action && handleAction(confirmDialog.action)}
      />
    </div>
  )
}
