"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmailCampaign, EmailCampaignStatus } from "@/lib/api/email-campaigns.api"
import { Copy, Loader2, Mail, Pencil, Play, Trash2, Users, XCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface EmailCampaignListProps {
  campaigns: EmailCampaign[]
  loading: boolean
  actionLoadingId?: string | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onSendCampaign?: (campaign: EmailCampaign) => void
  onCancelCampaign?: (campaign: EmailCampaign) => void
  onDuplicateCampaign?: (campaign: EmailCampaign) => void
  onDeleteCampaign?: (campaign: EmailCampaign) => void
  onEditCampaign?: (campaign: EmailCampaign) => void
  onViewRecipients?: (campaign: EmailCampaign) => void
  onSendTestEmail?: (campaign: EmailCampaign) => void
}

export function EmailCampaignList({
  campaigns,
  loading,
  actionLoadingId,
  pagination,
  onPageChange,
  onSendCampaign,
  onCancelCampaign,
  onDuplicateCampaign,
  onDeleteCampaign,
  onEditCampaign,
  onViewRecipients,
  onSendTestEmail,
}: EmailCampaignListProps) {
  const getStatusColor = (status: EmailCampaignStatus) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "sending":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "failed":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "cancelled":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatType = (type: string) => {
    return type.replace(/-|_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center min-h-[320px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading campaigns...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!campaigns?.length) {
    return (
      <Card>
        <div className="p-10 text-center">
          <p className="text-lg font-semibold mb-1">No campaigns yet</p>
          <p className="text-sm text-muted-foreground">Create your first campaign to start engaging your members.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Opened</TableHead>
              <TableHead className="text-right">Clicked</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const isMutating = actionLoadingId === campaign._id
              const canEdit = campaign.status === "draft" || campaign.status === "scheduled"
              const canRetryFailedRecipients =
                (campaign.status === "failed" || campaign.status === "sent") &&
                campaign.failedCount > 0
              const canSend =
                campaign.status === "draft" || campaign.status === "scheduled" || canRetryFailedRecipients
              const canCancel = campaign.status === "scheduled"
              const canDelete = campaign.status === "draft" || campaign.status === "scheduled"
              const sendTitle = (() => {
                if (canRetryFailedRecipients) return "Retry failed recipients (queues a send job)"
                if (campaign.status === "scheduled") return "Send now (overrides the scheduled time)"
                return "Send now (queues a send job)"
              })()

              return (
                <TableRow key={campaign._id}>
                  <TableCell className="font-medium">{campaign.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {formatType(campaign.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{campaign.sentCount}</TableCell>
                  <TableCell className="text-right text-sm">
                    {campaign.openCount}
                    {campaign.sentCount > 0 ? ` (${Math.round((campaign.openCount / campaign.sentCount) * 100)}%)` : ""}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {campaign.clickCount}
                    {campaign.sentCount > 0 ? ` (${Math.round((campaign.clickCount / campaign.sentCount) * 100)}%)` : ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(campaign.sentAt || campaign.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-wrap justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewRecipients?.(campaign)}
                        disabled={isMutating}
                        title="View Recipients"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSendTestEmail?.(campaign)}
                        disabled={isMutating}
                        title="Send Test"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDuplicateCampaign?.(campaign)}
                        disabled={isMutating}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditCampaign?.(campaign)}
                          disabled={isMutating}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canSend && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onSendCampaign?.(campaign)}
                          disabled={isMutating}
                          title={sendTitle}
                        >
                          {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onCancelCampaign?.(campaign)}
                          disabled={isMutating}
                          title="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => onDeleteCampaign?.(campaign)}
                          disabled={isMutating}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} campaigns
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm font-medium px-2">Page {pagination.page} of {pagination.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
