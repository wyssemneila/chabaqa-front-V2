"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, ChevronDown, Check, ArrowLeft, ArrowRight, Mail, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { challengesApi, coursesApi, emailCampaignsApi, eventsApi, productsApi, sessionsApi } from "@/lib/api"
import type { InactivityPeriod, InactiveUserStats, ContentType } from "@/lib/api/creator/email-campaigns.api"
import { resolveScheduledAt } from "./campaign-form-utils"
import { SingleInviteDialog } from "../contacts/components/single-invite-dialog"
import { ImportContactsDialog } from "../contacts/components/import-contacts-dialog"

type CampaignKind = "announcement" | "inactive-users" | "content-reminder" | "course-progress" | "custom-invitation"
type SendingTime = "now" | "scheduled"

type BuilderSeed = Partial<{
  title: string
  kind: CampaignKind
  subject: string
  content: string
  isHtml: boolean
  trackOpens: boolean
  trackClicks: boolean
  inactivityPeriod: InactivityPeriod
  contentType: ContentType
  contentId: string
  contentLabel: string
}>

type ContentPick = { id: string; title: string }

type VariableBucket = "base" | "inactive" | "content" | "course"

const VARIABLE_DEFS: Array<{
  key: string
  label: string
  description: string
  showFor: Array<VariableBucket>
}> = [
  { key: "userName", label: "User name", description: "Member’s name", showFor: ["base"] },
  { key: "communityName", label: "Community name", description: "Your community’s name", showFor: ["base"] },
  { key: "currentDate", label: "Current date", description: "Today’s date (YYYY-MM-DD)", showFor: ["base"] },
  { key: "currentYear", label: "Current year", description: "Current year", showFor: ["base"] },
  { key: "daysThreshold", label: "Days threshold", description: "Days since last login (inactive campaigns)", showFor: ["inactive"] },
  { key: "inactivityPeriod", label: "Inactivity period", description: "Selected inactive period label", showFor: ["inactive"] },
  { key: "contentTypeLabel", label: "Content type label", description: "Selected content type label (content reminder)", showFor: ["content"] },
  { key: "contentType", label: "Content type", description: "Selected content type key", showFor: ["content"] },
  { key: "progressPct", label: "Progress %", description: "Learner's current course completion %", showFor: ["course"] },
  { key: "enrolledDays", label: "Enrolled days", description: "Days since the learner enrolled", showFor: ["course"] },
]

const renderTemplate = (template: string, variables: Record<string, string | number | boolean | null | undefined>): string => {
  let result = template || ""
  for (const [key, value] of Object.entries(variables)) {
    const replacement = value === null || value === undefined ? "" : String(value)
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), replacement)
  }
  return result
}

const inactivityPeriodLabel = (period?: InactivityPeriod): string => {
  if (!period) return ""
  if (period === "last_7_days") return "7 days"
  if (period === "last_15_days") return "15 days"
  if (period === "last_30_days") return "30 days"
  if (period === "last_60_days") return "60 days"
  return "60+ days"
}

const inactivityPeriodDaysThreshold = (period?: InactivityPeriod): number | "" => {
  if (!period) return ""
  if (period === "last_7_days") return 7
  if (period === "last_15_days") return 15
  if (period === "last_30_days") return 30
  if (period === "last_60_days") return 60
  return 61
}

const contentTypeLabel = (type?: ContentType): string => {
  if (!type) return ""
  if (type === "cours") return "course"
  if (type === "all") return "content"
  return type
}

const extractList = (raw: any): any[] => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.data?.data)) return raw.data.data
  if (Array.isArray(raw?.data?.items)) return raw.data.items
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.data?.campaigns)) return raw.data.campaigns
  if (Array.isArray(raw?.campaigns)) return raw.campaigns
  if (Array.isArray(raw?.data?.products)) return raw.data.products
  if (Array.isArray(raw?.products)) return raw.products
  return []
}

export function CampaignBuilderDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialValues?: BuilderSeed
}) {
  const { open, onOpenChange, onSuccess, initialValues } = props
  const { toast } = useToast()
  const { selectedCommunityId, selectedCommunity } = useCreatorCommunity()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [kind, setKind] = useState<CampaignKind>("announcement")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")

  const [inactivityPeriod, setInactivityPeriod] = useState<InactivityPeriod | "">("")
  const [contentType, setContentTypeState] = useState<ContentType | "">("")
  const [contentId, setContentId] = useState("")
  const [contentLabelValue, setContentLabelValue] = useState("")

  // course-progress specific
  const [targetCourseId, setTargetCourseId] = useState("")
  const [targetCourseName, setTargetCourseName] = useState("")
  const [targetMaxProgressPct, setTargetMaxProgressPct] = useState("20")
  const [targetMinEnrolledDays, setTargetMinEnrolledDays] = useState("15")
  const [coursePickerOpen, setCoursePickerOpen] = useState(false)
  const [courseItems, setCourseItems] = useState<ContentPick[]>([])
  const [courseItemsLoading, setCourseItemsLoading] = useState(false)
  const [audiencePreview, setAudiencePreview] = useState<{ total: number; sample: any[] } | null>(null)
  const [previewingAudience, setPreviewingAudience] = useState(false)

  const [sendingTime, setSendingTime] = useState<SendingTime>("now")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")

  const [isHtml, setIsHtml] = useState(false)
  const [trackOpens, setTrackOpens] = useState(true)
  const [trackClicks, setTrackClicks] = useState(true)

  const [inactiveStats, setInactiveStats] = useState<InactiveUserStats | null>(null)
  const [inactiveStatsLoading, setInactiveStatsLoading] = useState(false)
  const [inactiveStatsError, setInactiveStatsError] = useState<string | null>(null)

  const [contentItems, setContentItems] = useState<ContentPick[]>([])
  const [contentItemsLoading, setContentItemsLoading] = useState(false)
  const [contentItemsError, setContentItemsError] = useState<string | null>(null)

  const [contentPickerOpen, setContentPickerOpen] = useState(false)

  const [isSingleInviteOpen, setIsSingleInviteOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleInvitationSuccess = useCallback(() => {
    onOpenChange(false)
    onSuccess?.()
  }, [onOpenChange, onSuccess])

  const subjectRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [activeField, setActiveField] = useState<"subject" | "content">("subject")

  const resetToSeed = useCallback(() => {
    setStep(1)
    setIsSubmitting(false)

    setKind(initialValues?.kind || "announcement")
    setTitle(initialValues?.title || "")
    setSubject(initialValues?.subject || "")
    setContent(initialValues?.content || "")

    setInactivityPeriod(initialValues?.inactivityPeriod || "")
    setContentTypeState(initialValues?.contentType || "")
    setContentId(initialValues?.contentId || "")
    setContentLabelValue(initialValues?.contentLabel || "")

    setTargetCourseId("")
    setTargetCourseName("")
    setTargetMaxProgressPct("20")
    setTargetMinEnrolledDays("15")
    setCoursePickerOpen(false)
    setCourseItems([])
    setCourseItemsLoading(false)
    setAudiencePreview(null)
    setPreviewingAudience(false)

    setSendingTime("now")
    setScheduledDate("")
    setScheduledTime("")

    setIsHtml(Boolean(initialValues?.isHtml))
    setTrackOpens(initialValues?.trackOpens !== false)
    setTrackClicks(initialValues?.trackClicks !== false)

    setContentItems([])
    setContentItemsError(null)
    setContentItemsLoading(false)
    setContentPickerOpen(false)
  }, [initialValues])

  useEffect(() => {
    if (!open) return
    resetToSeed()
  }, [open, resetToSeed])

  useEffect(() => {
    if (!open || !selectedCommunityId) return
    let cancelled = false
    setInactiveStatsLoading(true)
    setInactiveStatsError(null)
    emailCampaignsApi
      .getInactiveUserStats(selectedCommunityId)
      .then((stats) => {
        if (cancelled) return
        setInactiveStats(stats)
      })
      .catch((error: any) => {
        if (cancelled) return
        setInactiveStats(null)
        setInactiveStatsError(typeof error?.message === "string" ? error.message : "Failed to load recipient estimate.")
      })
      .finally(() => {
        if (cancelled) return
        setInactiveStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, selectedCommunityId])

  // Fetch course list for course-progress picker
  useEffect(() => {
    if (!open || kind !== "course-progress" || !selectedCommunityId) return
    let cancelled = false
    setCourseItemsLoading(true)
    ;(async () => {
      try {
        const slug = typeof selectedCommunity?.slug === "string" ? selectedCommunity.slug : ""
        if (!slug) return
        const response = await coursesApi.getByCommunity(slug, { page: 1, limit: 100, published: true })
        const normalize = (items: any[]): ContentPick[] =>
          items
            .map((it) => ({ id: String(it?.id || it?._id || "").trim(), title: String(it?.title || it?.name || it?.titre || "").trim() }))
            .filter((it) => it.id && it.title)
        if (!cancelled) setCourseItems(normalize(extractList(response)))
      } catch { if (!cancelled) setCourseItems([]) }
      finally { if (!cancelled) setCourseItemsLoading(false) }
    })()
    return () => { cancelled = true }
  }, [kind, open, selectedCommunity?.slug, selectedCommunityId])

  const handlePreviewCourseAudience = useCallback(async () => {
    if (!selectedCommunityId || !targetCourseId) return
    const maxPct = parseInt(targetMaxProgressPct, 10)
    const minDays = parseInt(targetMinEnrolledDays, 10)
    if (isNaN(maxPct) || isNaN(minDays)) return
    setPreviewingAudience(true)
    setAudiencePreview(null)
    try {
      const result = await emailCampaignsApi.previewAudience({
        communityId: selectedCommunityId,
        filterType: "course_progress",
        courseProgressFilter: { courseId: targetCourseId, maxProgressPct: maxPct, minEnrolledDays: minDays },
      })
      setAudiencePreview({ total: result.total, sample: result.sample })
    } catch (err: any) {
      toast({ title: "Preview failed", description: err?.message ?? "Could not estimate audience", variant: "destructive" })
    } finally {
      setPreviewingAudience(false)
    }
  }, [selectedCommunityId, targetCourseId, targetMaxProgressPct, targetMinEnrolledDays, toast])

  const recipientsEstimate = useMemo(() => {
    if (!inactiveStats) return null
    if (kind === "inactive-users") {
      if (inactivityPeriod === "last_7_days") return inactiveStats.inactive7d
      if (inactivityPeriod === "last_15_days") return inactiveStats.inactive15d
      if (inactivityPeriod === "last_30_days") return inactiveStats.inactive30d
      if (inactivityPeriod === "last_60_days") return inactiveStats.inactive30d
      if (inactivityPeriod === "more_than_60_days") return inactiveStats.inactive60dPlus
      return null
    }
    return inactiveStats.totalMembers
  }, [inactiveStats, inactivityPeriod, kind])

  const recipientsEstimateNote = useMemo(() => {
    if (kind === "inactive-users" && inactivityPeriod === "last_60_days") {
      return "Estimate uses the 30–60 days segment (exact 60-day count is not available)."
    }
    return ""
  }, [inactivityPeriod, kind])

  const availableVariables = useMemo(() => {
    const buckets: Array<VariableBucket> = ["base"]
    if (kind === "inactive-users") buckets.push("inactive")
    if (kind === "content-reminder") buckets.push("content")
    if (kind === "course-progress") buckets.push("course")
    return VARIABLE_DEFS.filter((v) => v.showFor.some((b) => buckets.includes(b)))
  }, [kind])

  const previewVariables = useMemo(() => {
    const now = new Date()
    const communityName = (selectedCommunity?.name ? String(selectedCommunity.name) : "Your community").trim()
    const contentTypeKey = contentType ? String(contentType) : ""
    return {
      userName: "Test User",
      communityName,
      currentDate: now.toISOString().slice(0, 10),
      currentYear: now.getUTCFullYear(),
      daysThreshold: inactivityPeriodDaysThreshold(inactivityPeriod || undefined),
      inactivityPeriod: inactivityPeriodLabel(inactivityPeriod || undefined),
      contentType: contentTypeKey,
      contentTypeLabel: contentTypeLabel(contentType || undefined),
    }
  }, [contentType, inactivityPeriod, selectedCommunity?.name])

  const previewSubject = useMemo(() => renderTemplate(subject, previewVariables), [previewVariables, subject])
  const previewContent = useMemo(() => renderTemplate(content, previewVariables), [previewVariables, content])

  useEffect(() => {
    if (!open) return
    if (kind !== "content-reminder") return
    if (!selectedCommunityId) {
      setContentItems([])
      setContentItemsError("Select a community first.")
      setContentItemsLoading(false)
      return
    }
    if (!contentType || contentType === "all") {
      setContentItems([])
      setContentItemsError(null)
      setContentItemsLoading(false)
      return
    }

    let cancelled = false
    const communityId = selectedCommunityId
    setContentItemsLoading(true)
    setContentItemsError(null)
    setContentItems([])

    ;(async () => {
      try {
        const slug = typeof selectedCommunity?.slug === "string" ? selectedCommunity.slug : ""
        const normalize = (items: any[]): ContentPick[] =>
          items
            .map((it) => ({
              id: String(it?.id || it?._id || "").trim(),
              title: String(it?.title || it?.name || it?.titre || it?.slug || "").trim(),
            }))
            .filter((it) => it.id && it.title)

        let list: ContentPick[] = []
        if (contentType === "event") {
          const response = await eventsApi.getAll({ communityId, isPublished: true, page: 1, limit: 100 } as any)
          list = normalize(extractList(response))
        } else if (contentType === "product") {
          const response = await productsApi.getByCommunity(communityId)
          list = normalize(extractList(response))
        } else if (contentType === "session") {
          if (!slug) throw new Error("Missing community slug")
          const response = await sessionsApi.getByCommunity(slug)
          list = normalize(extractList(response))
        } else if (contentType === "challenge") {
          if (!slug) throw new Error("Missing community slug")
          const response = await challengesApi.getByCommunity(slug)
          list = normalize(extractList(response))
        } else if (contentType === "cours") {
          if (!slug) throw new Error("Missing community slug")
          const response = await coursesApi.getByCommunity(slug, { page: 1, limit: 100, published: true })
          list = normalize(extractList(response))
        }

        if (cancelled) return
        setContentItems(list)
      } catch (error: any) {
        if (cancelled) return
        setContentItemsError(typeof error?.message === "string" ? error.message : "Failed to load content items.")
      } finally {
        if (cancelled) return
        setContentItemsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [contentType, kind, open, selectedCommunity?.slug, selectedCommunityId])

  const insertVariableAtCursor = useCallback(
    (key: string) => {
      const token = `{{${key}}}`
      const targetField = activeField === "content" ? "content" : "subject"
      const el = targetField === "content" ? contentRef.current : subjectRef.current
      if (!el) {
        setSubject((prev) => `${prev}${token}`)
        return
      }
      const start = (el as any).selectionStart ?? 0
      const end = (el as any).selectionEnd ?? 0

      if (targetField === "subject") {
        setSubject((prev) => {
          const next = prev.slice(0, start) + token + prev.slice(end)
          return next
        })
        queueMicrotask(() => {
          subjectRef.current?.focus()
          const nextPos = start + token.length
          subjectRef.current?.setSelectionRange(nextPos, nextPos)
        })
        return
      }

      setContent((prev) => {
        const next = prev.slice(0, start) + token + prev.slice(end)
        return next
      })
      queueMicrotask(() => {
        contentRef.current?.focus()
        const nextPos = start + token.length
        contentRef.current?.setSelectionRange(nextPos, nextPos)
      })
    },
    [activeField],
  )

  const validateStep = useCallback((): string | null => {
    if (!selectedCommunityId) return "Select a community first."

    if (step === 1) {
      if (kind === "custom-invitation") return null
      if (kind === "inactive-users" && !inactivityPeriod) return "Pick an inactivity period."
      if (kind === "content-reminder" && !contentType) return "Pick a content type."
      if (kind === "course-progress") {
        if (!targetCourseId) return "Select a course to target."
        const maxPct = parseInt(targetMaxProgressPct, 10)
        const minDays = parseInt(targetMinEnrolledDays, 10)
        if (isNaN(maxPct) || maxPct < 1 || maxPct > 99) return "Max progress must be between 1 and 99%."
        if (isNaN(minDays) || minDays < 1) return "Enrolled days must be at least 1."
      }
      return null
    }

    if (step === 2) {
      if (!title.trim()) return "Campaign title is required."
      if (!subject.trim()) return "Subject line is required."
      if (!content.trim()) return "Email content is required."
      return null
    }

    if (step === 3) {
      if (sendingTime === "scheduled") {
        try {
          resolveScheduledAt({
            title,
            type: kind,
            subject,
            content,
            sendingTime,
            scheduledDate,
            scheduledTime,
            inactivityPeriod: inactivityPeriod || undefined,
            contentType: contentType || undefined,
            contentId: contentId || undefined,
            isHtml,
            trackOpens,
            trackClicks,
          } as any)
        } catch (error: any) {
          return typeof error?.message === "string" ? error.message : "Invalid schedule."
        }
      }
      return null
    }

    return null
  }, [
    content,
    contentId,
    contentType,
    inactivityPeriod,
    isHtml,
    kind,
    scheduledDate,
    scheduledTime,
    selectedCommunityId,
    sendingTime,
    step,
    subject,
    title,
    trackClicks,
    trackOpens,
  ])

  const goNext = useCallback(() => {
    if (kind === "custom-invitation") return
    const error = validateStep()
    if (error) {
      toast({ title: "Fix required fields", description: error, variant: "destructive" })
      return
    }
    setStep((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 3))
  }, [kind, toast, validateStep])

  const goBack = useCallback(() => {
    setStep((prev) => (prev === 3 ? 2 : prev === 2 ? 1 : 1))
  }, [])

  const submit = useCallback(async () => {
    const error = validateStep()
    if (error) {
      toast({ title: "Fix required fields", description: error, variant: "destructive" })
      return
    }
    if (!selectedCommunityId) return

    setIsSubmitting(true)
    try {
      const scheduledAt = (() => {
        if (sendingTime !== "scheduled") return undefined
        return resolveScheduledAt({
          title,
          type: kind,
          subject,
          content,
          sendingTime,
          scheduledDate,
          scheduledTime,
          inactivityPeriod: inactivityPeriod || undefined,
          contentType: contentType || undefined,
          contentId: contentId || undefined,
          isHtml,
          trackOpens,
          trackClicks,
        } as any)
      })()

      if (kind === "content-reminder") {
        const response = await emailCampaignsApi.createContentReminder({
          title: title.trim(),
          subject: subject.trim(),
          content,
          communityId: selectedCommunityId,
          contentType: (contentType || "all") as any,
          contentId: contentId.trim() || undefined,
          scheduledAt,
          isHtml,
          trackOpens,
          trackClicks,
          metadata: contentLabelValue ? { contentLabel: contentLabelValue } : undefined,
        } as any)

        toast({
          title: scheduledAt ? "Campaign scheduled" : "Campaign queued",
          description: scheduledAt ? "Your campaign will be sent automatically at the scheduled time." : "Your campaign was queued for sending.",
        })
        onOpenChange(false)
        onSuccess?.()
        return response
      }

      if (kind === "course-progress") {
        const created = await emailCampaignsApi.createCourseProgressCampaign({
          title: title.trim(),
          subject: subject.trim(),
          content,
          communityId: selectedCommunityId,
          targetCourseId,
          targetMaxProgressPct: parseInt(targetMaxProgressPct, 10),
          targetMinEnrolledDays: parseInt(targetMinEnrolledDays, 10),
          scheduledAt,
          isHtml,
          trackOpens,
          trackClicks,
        })

        if (!scheduledAt && sendingTime === "now") {
          try {
            await emailCampaignsApi.sendCampaign(created._id)
            toast({ title: "Campaign created & queued", description: "Course progress reminder queued for sending." })
          } catch (sendError: any) {
            toast({ title: "Campaign created (not sent)", description: sendError?.message || "Campaign created as draft.", variant: "destructive" })
          }
        } else {
          toast({ title: scheduledAt ? "Campaign scheduled" : "Campaign created", description: scheduledAt ? "Will be sent at the scheduled time." : "Saved as draft." })
        }
        onOpenChange(false)
        onSuccess?.()
        return created
      }

      if (kind === "inactive-users") {
        const created = await emailCampaignsApi.createInactiveUserCampaign({
          title: title.trim(),
          subject: subject.trim(),
          content,
          communityId: selectedCommunityId,
          inactivityPeriod: inactivityPeriod as any,
          scheduledAt,
          isHtml,
          trackOpens,
          trackClicks,
        } as any)

        if (!scheduledAt && sendingTime === "now") {
          try {
            await emailCampaignsApi.sendCampaign(created._id)
            toast({
              title: "Campaign created & queued",
              description: "Campaign created and queued for sending.",
            })
          } catch (sendError: any) {
            toast({
              title: "Campaign created (not sent)",
              description: sendError?.message || "Campaign created as draft. You can send it from the list.",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: scheduledAt ? "Campaign scheduled" : "Campaign created",
            description: scheduledAt ? "Your campaign will be sent automatically at the scheduled time." : "Campaign created as draft.",
          })
        }

        onOpenChange(false)
        onSuccess?.()
        return created
      }

      // announcement
      const created = await emailCampaignsApi.createCampaign({
        title: title.trim(),
        subject: subject.trim(),
        content,
        communityId: selectedCommunityId,
        type: "announcement" as any,
        scheduledAt,
        isHtml,
        trackOpens,
        trackClicks,
      } as any)

      if (!scheduledAt && sendingTime === "now") {
        try {
          await emailCampaignsApi.sendCampaign(created._id)
          toast({
            title: "Campaign created & queued",
            description: "Campaign created and queued for sending.",
          })
        } catch (sendError: any) {
          toast({
            title: "Campaign created (not sent)",
            description: sendError?.message || "Campaign created as draft. You can send it from the list.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: scheduledAt ? "Campaign scheduled" : "Campaign created",
          description: scheduledAt ? "Your campaign will be sent automatically at the scheduled time." : "Campaign created as draft.",
        })
      }

      onOpenChange(false)
      onSuccess?.()
      return created
    } catch (error: any) {
      toast({
        title: "Failed to create campaign",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    content,
    contentId,
    contentLabelValue,
    contentType,
    inactivityPeriod,
    isHtml,
    kind,
    onOpenChange,
    onSuccess,
    scheduledDate,
    scheduledTime,
    selectedCommunityId,
    sendingTime,
    subject,
    title,
    toast,
    trackClicks,
    trackOpens,
    validateStep,
  ])

  const dialogTitle = initialValues ? "Create Campaign" : "Create New Campaign"
  const dialogDescription = initialValues ? "Review and customize this campaign before sending." : "Build a campaign for your community members."

  const primaryCtaLabel = sendingTime === "scheduled" ? "Schedule Campaign" : "Create & Send"
  const canSubmit = step === 3 && !isSubmitting

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1 text-xs border",
                      step === n ? "border-chabaqa-primary bg-chabaqa-primary/10 text-chabaqa-primary" : "border-gray-200 text-gray-600",
                    )}
                  >
                    <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-semibold", step === n ? "bg-chabaqa-primary text-white" : "bg-gray-100 text-gray-700")}>
                      {n}
                    </span>
                    <span className="font-medium">
                      {n === 1 ? "Goal" : n === 2 ? "Compose" : "Schedule"}
                    </span>
                  </div>
                ))}
              </div>

              {inactiveStatsLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading recipients…
                </div>
              ) : inactiveStatsError ? (
                <div className="text-xs text-amber-700" title={inactiveStatsError}>
                  Recipient estimate unavailable
                </div>
              ) : recipientsEstimate != null ? (
                <div className="text-xs text-gray-600">
                  Estimated recipients: <span className="font-semibold text-gray-900">{recipientsEstimate.toLocaleString()}</span>
                </div>
              ) : null}
            </div>

            {recipientsEstimateNote ? <p className="text-xs text-gray-500">{recipientsEstimateNote}</p> : null}

            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign goal</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors",
                        kind === "announcement" ? "border-chabaqa-primary bg-chabaqa-primary/5" : "border-gray-200",
                      )}
                      onClick={() => setKind("announcement")}
                    >
                      <p className="text-sm font-semibold text-gray-900">Announcement</p>
                      <p className="text-xs text-gray-600 mt-1">Send a message to all community members.</p>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors",
                        kind === "inactive-users" ? "border-chabaqa-primary bg-chabaqa-primary/5" : "border-gray-200",
                      )}
                      onClick={() => setKind("inactive-users")}
                    >
                      <p className="text-sm font-semibold text-gray-900">Inactive users</p>
                      <p className="text-xs text-gray-600 mt-1">Re-engage members who haven’t been active.</p>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors",
                        kind === "content-reminder" ? "border-chabaqa-primary bg-chabaqa-primary/5" : "border-gray-200",
                      )}
                      onClick={() => setKind("content-reminder")}
                    >
                      <p className="text-sm font-semibold text-gray-900">Content reminder</p>
                      <p className="text-xs text-gray-600 mt-1">Remind members about a content type or item.</p>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors",
                        kind === "course-progress" ? "border-chabaqa-primary bg-chabaqa-primary/5" : "border-gray-200",
                      )}
                      onClick={() => { setKind("course-progress"); setAudiencePreview(null) }}
                    >
                      <p className="text-sm font-semibold text-gray-900">Course progress</p>
                      <p className="text-xs text-gray-600 mt-1">Remind learners who haven't completed a course yet.</p>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors",
                        kind === "custom-invitation" ? "border-chabaqa-primary bg-chabaqa-primary/5" : "border-gray-200",
                      )}
                      onClick={() => setKind("custom-invitation")}
                    >
                      <p className="text-sm font-semibold text-gray-900">Custom invitation</p>
                      <p className="text-xs text-gray-600 mt-1">Invite people outside your community via email.</p>
                    </button>
                  </div>
                </div>

                {kind === "inactive-users" ? (
                  <div className="space-y-2">
                    <Label htmlFor="campaign-inactivity-period">Inactive period</Label>
                    <Select value={inactivityPeriod} onValueChange={(v) => setInactivityPeriod(v as any)}>
                      <SelectTrigger id="campaign-inactivity-period">
                        <SelectValue placeholder="Select inactive period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_7_days">7 days</SelectItem>
                        <SelectItem value="last_15_days">15 days</SelectItem>
                        <SelectItem value="last_30_days">30 days</SelectItem>
                        <SelectItem value="last_60_days">60 days</SelectItem>
                        <SelectItem value="more_than_60_days">60+ days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Targets users based on their last login.</p>
                  </div>
                ) : null}

                {kind === "content-reminder" ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-content-type">Content type</Label>
                      <Select
                        value={contentType}
                        onValueChange={(v) => {
                          setContentTypeState(v as any)
                          setContentId("")
                          setContentLabelValue("")
                        }}
                      >
                        <SelectTrigger id="campaign-content-type">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="challenge">Challenge</SelectItem>
                          <SelectItem value="cours">Course</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="session">Session</SelectItem>
                          <SelectItem value="all">General content</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Pick a type, then optionally choose a specific item.</p>
                    </div>

                    {contentType && contentType !== "all" ? (
                      <div className="space-y-2">
                        <Label htmlFor="campaign-content-item">Content item (optional)</Label>
                        <Popover open={contentPickerOpen} onOpenChange={setContentPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button id="campaign-content-item" variant="outline" className="w-full justify-between">
                              <span className="truncate">
                                {contentLabelValue ? contentLabelValue : "Select an item…"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[420px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search by title…" />
                              <CommandList>
                                <CommandEmpty>
                                  {contentItemsLoading ? "Loading…" : contentItemsError ? "Could not load items." : "No results."}
                                </CommandEmpty>
                                <CommandGroup heading="Items">
                                  {contentItems.slice(0, 120).map((item) => (
                                    <CommandItem
                                      key={item.id}
                                      value={item.title}
                                      onSelect={() => {
                                        setContentId(item.id)
                                        setContentLabelValue(item.title)
                                        setContentPickerOpen(false)
                                      }}
                                    >
                                      <div className="flex items-center justify-between w-full gap-3">
                                        <span className="truncate">{item.title}</span>
                                        {contentId && contentId === item.id ? <Check className="h-4 w-4" /> : null}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {contentItemsError ? (
                          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs text-amber-800">Could not load items: {contentItemsError}</p>
                            <div className="mt-2 space-y-2">
                              <Label htmlFor="campaign-content-id-fallback" className="text-xs text-amber-900">
                                Paste ID manually (fallback)
                              </Label>
                              <Input
                                id="campaign-content-id-fallback"
                                value={contentId}
                                onChange={(e) => {
                                  setContentId(e.target.value)
                                  if (!contentLabelValue) setContentLabelValue("")
                                }}
                                placeholder="Content ID…"
                              />
                            </div>
                          </div>
                        ) : null}

                        {contentId ? <p className="text-xs text-gray-500">Selected ID: {contentId}</p> : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {kind === "course-progress" ? (
                  <div className="space-y-4">
                    {/* Course picker */}
                    <div className="space-y-2">
                      <Label>Select course</Label>
                      <Popover open={coursePickerOpen} onOpenChange={setCoursePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span className="truncate">{targetCourseName || "Pick a course…"}</span>
                            <ChevronDown className="h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[420px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search course…" />
                            <CommandList>
                              <CommandEmpty>{courseItemsLoading ? "Loading…" : "No courses found."}</CommandEmpty>
                              <CommandGroup heading="Courses">
                                {courseItems.map((c) => (
                                  <CommandItem key={c.id} value={c.title} onSelect={() => { setTargetCourseId(c.id); setTargetCourseName(c.title); setCoursePickerOpen(false); setAudiencePreview(null) }}>
                                    <span className="truncate">{c.title}</span>
                                    {targetCourseId === c.id && <Check className="ml-auto h-4 w-4" />}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Thresholds */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cp-max-pct">Max progress %</Label>
                        <Input id="cp-max-pct" type="number" min={1} max={99} value={targetMaxProgressPct} onChange={(e) => { setTargetMaxProgressPct(e.target.value); setAudiencePreview(null) }} placeholder="20" />
                        <p className="text-xs text-gray-400">Email learners below this completion</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cp-min-days">Min enrolled days</Label>
                        <Input id="cp-min-days" type="number" min={1} value={targetMinEnrolledDays} onChange={(e) => { setTargetMinEnrolledDays(e.target.value); setAudiencePreview(null) }} placeholder="15" />
                        <p className="text-xs text-gray-400">Only target users enrolled ≥ N days</p>
                      </div>
                    </div>
                    {/* Audience preview */}
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={handlePreviewCourseAudience} disabled={previewingAudience || !targetCourseId}>
                        {previewingAudience ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                        Preview audience
                      </Button>
                      {audiencePreview && (
                        <span className="text-sm font-medium text-gray-700">
                          {audiencePreview.total} matching learner{audiencePreview.total !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {audiencePreview && audiencePreview.sample.length > 0 && (
                      <div className="rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-600 space-y-1">
                        <p className="font-medium text-gray-700 mb-1">Sample (up to 10)</p>
                        {audiencePreview.sample.map((u, i) => (
                          <p key={i}>{u.name} — {u.email}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {kind === "custom-invitation" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Choose how you'd like to send invitations:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="rounded-lg border border-gray-200 p-4 text-left hover:border-chabaqa-primary hover:bg-chabaqa-primary/5 transition-colors group"
                        onClick={() => setIsSingleInviteOpen(true)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="rounded-full bg-chabaqa-primary/10 p-2 group-hover:bg-chabaqa-primary/20 transition-colors">
                            <Mail className="h-5 w-5 text-chabaqa-primary" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">Invite one person</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Send a personalised invitation email to a single person with a custom message.
                        </p>
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-gray-200 p-4 text-left hover:border-chabaqa-primary hover:bg-chabaqa-primary/5 transition-colors group"
                        onClick={() => setIsImportOpen(true)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="rounded-full bg-chabaqa-primary/10 p-2 group-hover:bg-chabaqa-primary/20 transition-colors">
                            <UserPlus className="h-5 w-5 text-chabaqa-primary" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">Import contacts</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Bulk-import contacts from a CSV file or paste a list of emails.
                        </p>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">Invitations are sent immediately and tracked in your dashboard.</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-title">Campaign title</Label>
                  <Input
                    id="campaign-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. March update"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Subject line</Label>
                  <Input
                    id="campaign-subject"
                    ref={subjectRef}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onFocus={() => setActiveField("subject")}
                    placeholder="Enter email subject…"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-content">Email content</Label>
                  <Textarea
                    id="campaign-content"
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setActiveField("content")}
                    placeholder="Write your email content…"
                    className="min-h-[160px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Variables</Label>
                  <TooltipProvider delayDuration={150}>
                    <div className="flex flex-wrap gap-2">
                      {availableVariables.map((v) => (
                        <Tooltip key={v.key}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
                              onClick={() => insertVariableAtCursor(v.key)}
                            >
                              <Badge variant="secondary" className="rounded-full">
                                {`{{${v.key}}}`}
                              </Badge>
                              <span className="hidden sm:inline">{v.label}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{v.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                  <p className="text-xs text-gray-500">Click to insert into the focused field (subject or content).</p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="advanced">
                    <AccordionTrigger>Advanced</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-gray-900">HTML email</p>
                            <p className="text-xs text-gray-500">Enable if your content contains HTML.</p>
                          </div>
                          <Switch checked={isHtml} onCheckedChange={(v) => setIsHtml(Boolean(v))} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-gray-900">Track opens</p>
                            <p className="text-xs text-gray-500">Adds a tracking pixel for opens.</p>
                          </div>
                          <Switch checked={trackOpens} onCheckedChange={(v) => setTrackOpens(Boolean(v))} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-gray-900">Track clicks</p>
                            <p className="text-xs text-gray-500">Rewrites links to measure clicks.</p>
                          </div>
                          <Switch checked={trackClicks} onCheckedChange={(v) => setTrackClicks(Boolean(v))} />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-sending-time">When to send</Label>
                  <Select value={sendingTime} onValueChange={(v) => setSendingTime(v as any)}>
                    <SelectTrigger id="campaign-sending-time">
                      <SelectValue placeholder="Select when to send" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sendingTime === "scheduled" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-scheduled-date">Date</Label>
                      <Input
                        id="campaign-scheduled-date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campaign-scheduled-time">Time</Label>
                      <Input
                        id="campaign-scheduled-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}

                <Card className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{kind.replace(/-/g, " ")}</Badge>
                    {kind === "inactive-users" && inactivityPeriod ? (
                      <Badge variant="secondary">Inactive: {inactivityPeriodLabel(inactivityPeriod as any)}</Badge>
                    ) : null}
                    {kind === "content-reminder" && contentType ? (
                      <Badge variant="secondary">Content: {contentTypeLabel(contentType as any)}</Badge>
                    ) : null}
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Review</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Recipients: {recipientsEstimate != null ? recipientsEstimate.toLocaleString() : "—"} ·{" "}
                      {sendingTime === "scheduled" ? "Scheduled" : "Send now"} ·{" "}
                      {isHtml ? "HTML" : "Simple text"} ·{" "}
                      {trackOpens ? "Open tracking" : "No open tracking"} ·{" "}
                      {trackClicks ? "Click tracking" : "No click tracking"}
                    </p>
                    {kind === "content-reminder" && contentLabelValue ? (
                      <p className="text-xs text-gray-500 mt-1">Item: {contentLabelValue}</p>
                    ) : null}
                  </div>
                </Card>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={step === 1 ? () => onOpenChange(false) : goBack} disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {step === 1 ? "Cancel" : "Back"}
              </Button>

              {kind === "custom-invitation" ? null : step < 3 ? (
                <Button type="button" onClick={goNext} disabled={isSubmitting}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={submit} disabled={!canSubmit}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isSubmitting ? "Working…" : primaryCtaLabel}
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Live preview</p>
              <p className="text-xs text-gray-500 mt-1">Preview uses sample values (Test User, your community, today).</p>
              <div className="mt-3 space-y-2">
                <div className="rounded-md border bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600">Subject</p>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap" dir="auto">
                    {previewSubject || "—"}
                  </p>
                </div>

                <div className="rounded-md border bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600">Content</p>
                  {isHtml ? (
                    <iframe
                      title="Email preview"
                      sandbox=""
                      className="mt-2 w-full rounded-md border bg-white"
                      style={{ height: 360 }}
                      srcDoc={previewContent || "<div style='padding:12px;color:#6b7280;'>No content yet.</div>"}
                    />
                  ) : (
                    <div className="mt-2 max-h-[360px] overflow-auto rounded-md border bg-white p-3">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap" dir="auto">
                        {previewContent || "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Tips</p>
              <ul className="mt-2 space-y-2 text-xs text-gray-600">
                <li>Keep your subject short and clear (40–60 chars).</li>
                <li>Start with a promise, then a single CTA.</li>
                <li>Use variables to personalize at scale.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {selectedCommunityId ? (
      <>
        <SingleInviteDialog
          open={isSingleInviteOpen}
          onOpenChange={setIsSingleInviteOpen}
          communityId={selectedCommunityId}
          onSuccess={handleInvitationSuccess}
        />
        <ImportContactsDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          communityId={selectedCommunityId}
          onSuccess={handleInvitationSuccess}
        />
      </>
    ) : null}
  </>
  )
}
