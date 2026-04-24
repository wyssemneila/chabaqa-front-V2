"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutomationsTab } from "../components/automations-tab"
import { CampaignStats } from "../components/campaign-stats"
import { CampaignBuilderDialog } from "../components/campaign-builder-dialog"
import { EmailCampaignList } from "../components/email-campaign-list"
import { EmailTemplateCards } from "../components/email-template-cards"
import {
  emailCampaignsApi,
  EmailCampaign,
  CampaignStats as CampaignStatsType,
  EmailCampaignStatus,
  EmailCampaignType,
} from "@/lib/api"
import { toLocalDateTimeFields, toUtcIsoFromLocalDateTime } from "../components/campaign-form-utils"

const PAGE_LIMIT = 10
const RECIPIENTS_LIMIT = 20
const SENDING_POLL_INTERVAL_MS = 10_000

type FilterState = {
  status: "all" | EmailCampaignStatus
  type: "all" | EmailCampaignType
  search: string
}

const DEFAULT_FILTERS: FilterState = {
  status: "all",
  type: "all",
  search: "",
}

export default function EmailCampaignsPage() {
  const { guard, selectedCommunity, selectedCommunityId } = useCommunityGuard()
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCampaigns, setTotalCampaigns] = useState(0)

  const [stats, setStats] = useState<CampaignStatsType | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [pendingFilters, setPendingFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const [editCampaign, setEditCampaign] = useState<EmailCampaign | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editSubject, setEditSubject] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editSendingTime, setEditSendingTime] = useState<"now" | "scheduled">("now")
  const [editScheduledDate, setEditScheduledDate] = useState("")
  const [editScheduledTime, setEditScheduledTime] = useState("")

  const [testCampaign, setTestCampaign] = useState<EmailCampaign | null>(null)
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const [recipientsCampaign, setRecipientsCampaign] = useState<EmailCampaign | null>(null)
  const [recipients, setRecipients] = useState<any[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [recipientsPage, setRecipientsPage] = useState(1)
  const [recipientsTotal, setRecipientsTotal] = useState(0)
  const [recipientsStatus, setRecipientsStatus] = useState<"all" | "pending" | "sent" | "failed" | "bounced">("all")
  const [recipientsOpened, setRecipientsOpened] = useState<"all" | "opened" | "not_opened">("all")

  const recipientTotalPages = useMemo(
    () => Math.max(1, Math.ceil(recipientsTotal / RECIPIENTS_LIMIT)),
    [recipientsTotal],
  )

  const fetchCampaigns = useCallback(
    async (page: number = 1, filters: FilterState, options?: { silent?: boolean }) => {
      if (!selectedCommunityId) return
      const isSilent = options?.silent === true
      try {
        if (!isSilent) {
          setCampaignsLoading(true)
        }
        setCampaignsError(null)
        const response = await emailCampaignsApi.getCommunityCampaigns(selectedCommunityId, {
          page,
          limit: PAGE_LIMIT,
          status: filters.status === "all" ? undefined : filters.status,
          type: filters.type === "all" ? undefined : filters.type,
          search: filters.search.trim() || undefined,
        })
        setCampaigns(response.campaigns || [])
        setCurrentPage(response.page || page)
        setTotalCampaigns(response.total || 0)
        setTotalPages(Math.max(1, Math.ceil((response.total || 0) / (response.limit || PAGE_LIMIT))))
      } catch (error: any) {
        setCampaignsError(error?.message || "Failed to load campaigns")
        setCampaigns([])
      } finally {
        if (!isSilent) {
          setCampaignsLoading(false)
        }
      }
    },
    [selectedCommunityId],
  )

  const fetchStats = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!selectedCommunityId) return
      const isSilent = options?.silent === true
      try {
        if (!isSilent) {
          setStatsLoading(true)
        }
        setStatsError(null)
        const response = await emailCampaignsApi.getCampaignStats(selectedCommunityId)
        setStats(response)
      } catch (error: any) {
        setStatsError(error?.message || "Failed to load statistics")
        setStats(null)
      } finally {
        if (!isSilent) {
          setStatsLoading(false)
        }
      }
    },
    [selectedCommunityId],
  )

  useEffect(() => {
    if (!selectedCommunityId) return
    setActiveFilters(DEFAULT_FILTERS)
    setPendingFilters(DEFAULT_FILTERS)
    fetchCampaigns(1, DEFAULT_FILTERS)
    fetchStats()
  }, [fetchCampaigns, fetchStats, selectedCommunityId])

  useEffect(() => {
    if (!selectedCommunityId) return
    const hasSendingCampaign = campaigns.some((campaign) => campaign.status === "sending")
    if (!hasSendingCampaign) return

    const interval = window.setInterval(() => {
      Promise.all([
        fetchCampaigns(currentPage, activeFilters, { silent: true }),
        fetchStats({ silent: true }),
      ]).catch(() => undefined)
    }, SENDING_POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [selectedCommunityId, campaigns, currentPage, activeFilters, fetchCampaigns, fetchStats])

  const refreshCurrentPage = async () => {
    await Promise.all([fetchCampaigns(currentPage, activeFilters), fetchStats()])
  }

  const runCampaignAction = async (campaign: EmailCampaign, action: () => Promise<any>, successMessage: string) => {
    try {
      setActionLoadingId(campaign._id)
      await action()
      toast({ title: "Success", description: successMessage })
      await refreshCurrentPage()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Campaign action failed",
        variant: "destructive",
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const openEditDialog = (campaign: EmailCampaign) => {
    const localFields = toLocalDateTimeFields(campaign.scheduledAt)
    setEditCampaign(campaign)
    setEditTitle(campaign.title)
    setEditSubject(campaign.subject)
    setEditContent(campaign.content)
    setEditSendingTime(campaign.scheduledAt ? "scheduled" : "now")
    setEditScheduledDate(localFields.date)
    setEditScheduledTime(localFields.time)
  }

  const saveEditCampaign = async () => {
    if (!editCampaign) return
    try {
      setActionLoadingId(editCampaign._id)
      let scheduledAt: string | undefined
      if (editSendingTime === "scheduled") {
        if (!editScheduledDate || !editScheduledTime) {
          throw new Error("Scheduled date and time are required")
        }
        scheduledAt = toUtcIsoFromLocalDateTime(editScheduledDate, editScheduledTime)
        if (new Date(scheduledAt).getTime() <= Date.now()) {
          throw new Error("Scheduled time must be in the future")
        }
      }

      await emailCampaignsApi.updateCampaign(editCampaign._id, {
        title: editTitle,
        subject: editSubject,
        content: editContent,
        scheduledAt,
      })

      toast({ title: "Success", description: "Campaign updated successfully" })
      setEditCampaign(null)
      await refreshCurrentPage()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update campaign",
        variant: "destructive",
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const loadRecipients = async (
    campaign: EmailCampaign,
    page: number = 1,
    status: typeof recipientsStatus = recipientsStatus,
    opened: typeof recipientsOpened = recipientsOpened,
  ) => {
    try {
      setRecipientsLoading(true)
      const response = await emailCampaignsApi.getCampaignRecipients(campaign._id, {
        page,
        limit: RECIPIENTS_LIMIT,
        status: status === "all" ? undefined : status,
        opened: opened === "all" ? undefined : opened === "opened",
      })
      setRecipients(response.recipients || [])
      setRecipientsPage(response.page || page)
      setRecipientsTotal(response.total || 0)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load recipients",
        variant: "destructive",
      })
    } finally {
      setRecipientsLoading(false)
    }
  }

  const openRecipientsDialog = async (campaign: EmailCampaign) => {
    setRecipientsCampaign(campaign)
    setRecipientsStatus("all")
    setRecipientsOpened("all")
    await loadRecipients(campaign, 1, "all", "all")
  }

  const sendTestEmail = async () => {
    if (!testCampaign || !selectedCommunityId) return
    if (!testEmailAddress.trim()) {
      toast({ title: "Error", description: "Enter a valid email", variant: "destructive" })
      return
    }
    try {
      setSendingTestEmail(true)
      await emailCampaignsApi.sendTestEmail({
        toEmail: testEmailAddress.trim(),
        subject: testCampaign.subject,
        content: testCampaign.content,
        communityId: selectedCommunityId,
        isHtml: testCampaign.isHtml,
      })
      toast({ title: "Success", description: "Test email sent successfully" })
      setTestCampaign(null)
      setTestEmailAddress("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send test email",
        variant: "destructive",
      })
    } finally {
      setSendingTestEmail(false)
    }
  }

  if (!selectedCommunity) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a community to manage email campaigns.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (guard) return guard

  return (
    <PageShell className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Email Marketing</h1>
          <p className="text-gray-500">Campaigns &amp; automations for {selectedCommunity.name}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chabaqa-primary hover:bg-chabaqa-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6 mt-4">

      <CampaignStats stats={stats} loading={statsLoading} error={statsError} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select
          value={pendingFilters.status}
          onValueChange={(value) => setPendingFilters((prev) => ({ ...prev, status: value as any }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={pendingFilters.type}
          onValueChange={(value) => setPendingFilters((prev) => ({ ...prev, type: value as any }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="promotion">Promotion</SelectItem>
            <SelectItem value="event_reminder">Event reminder</SelectItem>
            <SelectItem value="course_update">Course update</SelectItem>
            <SelectItem value="inactive_user_reactivation">Inactive user reactivation</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={pendingFilters.search}
          onChange={(event) => setPendingFilters((prev) => ({ ...prev, search: event.target.value }))}
          placeholder="Search title or subject"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setPendingFilters(DEFAULT_FILTERS)
              setActiveFilters(DEFAULT_FILTERS)
              fetchCampaigns(1, DEFAULT_FILTERS)
            }}
          >
            Reset
          </Button>
          <Button
            className="w-full"
            onClick={() => {
              setActiveFilters(pendingFilters)
              fetchCampaigns(1, pendingFilters)
            }}
          >
            Apply
          </Button>
        </div>
      </div>

      <EmailTemplateCards onCampaignCreated={refreshCurrentPage} />

      {campaignsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{campaignsError}</AlertDescription>
        </Alert>
      )}

      <EmailCampaignList
        campaigns={campaigns}
        loading={campaignsLoading}
        actionLoadingId={actionLoadingId}
        pagination={{
          page: currentPage,
          limit: PAGE_LIMIT,
          total: totalCampaigns,
          totalPages,
        }}
        onPageChange={(page) => fetchCampaigns(page, activeFilters)}
        onSendCampaign={(campaign) =>
          runCampaignAction(campaign, () => emailCampaignsApi.sendCampaign(campaign._id), "Campaign queued for sending")
        }
        onCancelCampaign={(campaign) =>
          runCampaignAction(campaign, () => emailCampaignsApi.cancelCampaign(campaign._id), "Scheduled campaign cancelled")
        }
        onDuplicateCampaign={(campaign) =>
          runCampaignAction(campaign, () => emailCampaignsApi.duplicateCampaign(campaign._id), "Campaign duplicated")
        }
        onDeleteCampaign={(campaign) => {
          if (!window.confirm("Delete this campaign?")) return
          runCampaignAction(campaign, () => emailCampaignsApi.deleteCampaign(campaign._id), "Campaign deleted")
        }}
        onEditCampaign={openEditDialog}
        onViewRecipients={openRecipientsDialog}
        onSendTestEmail={(campaign) => setTestCampaign(campaign)}
      />

      <CampaignBuilderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refreshCurrentPage}
      />

        </TabsContent>

        <TabsContent value="automations" className="mt-4">
          <AutomationsTab />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editCampaign} onOpenChange={(open) => !open && setEditCampaign(null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update title, content, and scheduling for this campaign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={editSubject} onChange={(event) => setEditSubject(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea className="h-36" value={editContent} onChange={(event) => setEditContent(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>When to send</Label>
              <Select value={editSendingTime} onValueChange={(value) => setEditSendingTime(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Send immediately (manual)</SelectItem>
                  <SelectItem value="scheduled">Schedule for later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editSendingTime === "scheduled" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={editScheduledDate} onChange={(event) => setEditScheduledDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={editScheduledTime} onChange={(event) => setEditScheduledTime(event.target.value)} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCampaign(null)}>
              Cancel
            </Button>
            <Button onClick={saveEditCampaign} disabled={!!actionLoadingId}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!testCampaign} onOpenChange={(open) => !open && setTestCampaign(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Send this campaign content to your email before launch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={testEmailAddress}
              onChange={(event) => setTestEmailAddress(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestCampaign(null)}>
              Cancel
            </Button>
            <Button onClick={sendTestEmail} disabled={sendingTestEmail}>
              {sendingTestEmail ? "Sending..." : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recipientsCampaign} onOpenChange={(open) => !open && setRecipientsCampaign(null)}>
        <DialogContent className="sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle>Recipients</DialogTitle>
            <DialogDescription>
              {recipientsCampaign ? `Campaign: ${recipientsCampaign.title}` : "Campaign recipients"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={recipientsStatus}
              onValueChange={async (value) => {
                const next = value as any
                setRecipientsStatus(next)
                if (recipientsCampaign) {
                  await loadRecipients(recipientsCampaign, 1, next, recipientsOpened)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Delivery status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={recipientsOpened}
              onValueChange={async (value) => {
                const next = value as any
                setRecipientsOpened(next)
                if (recipientsCampaign) {
                  await loadRecipients(recipientsCampaign, 1, recipientsStatus, next)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Open status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All open states</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="not_opened">Not opened</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-md max-h-[380px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Opened</th>
                  <th className="text-left p-2">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {recipientsLoading ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={5}>
                      Loading recipients...
                    </td>
                  </tr>
                ) : recipients.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={5}>
                      No recipients found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  recipients.map((recipient, index) => (
                    <tr key={`${recipient.email}-${index}`} className="border-t">
                      <td className="p-2">{recipient.name}</td>
                      <td className="p-2">{recipient.email}</td>
                      <td className="p-2">{recipient.status}</td>
                      <td className="p-2">{recipient.opened ? "Yes" : "No"}</td>
                      <td className="p-2">{recipient.clickCount || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Page {recipientsPage} of {recipientTotalPages} ({recipientsTotal} recipients)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={recipientsPage <= 1 || recipientsLoading || !recipientsCampaign}
                onClick={() => recipientsCampaign && loadRecipients(recipientsCampaign, recipientsPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  recipientsPage >= recipientTotalPages || recipientsLoading || !recipientsCampaign
                }
                onClick={() => recipientsCampaign && loadRecipients(recipientsCampaign, recipientsPage + 1)}
              >
                Next
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
