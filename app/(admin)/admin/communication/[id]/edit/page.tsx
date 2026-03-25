"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  targetAudience: z.enum(["all", "creators", "members", "custom"]),
  customAudienceIds: z.string().optional(),
  scheduledAt: z.string().optional(),
  templateId: z.string().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface EmailTemplate {
  _id: string
  name: string
  subject: string
  content: string
  variables: string[]
}

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      targetAudience: "all",
    },
  })

  const targetAudience = watch("targetAudience")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchData = async () => {
      setLoading(true)
      setLoadingTemplates(true)
      try {
        const [campaignRes, templatesRes] = await Promise.all([
          adminApi.communication.getEmailCampaignById(params.id),
          adminApi.communication.getEmailTemplates(),
        ])

        const campaignData = campaignRes?.data?.campaign || campaignRes?.data || {}
        const templatesData = templatesRes?.data || {}
        const templatesList = Array.isArray(templatesData)
          ? templatesData
          : templatesData?.templates || []
        setTemplates(templatesList)

        reset({
          name: campaignData?.name || campaignData?.title || "",
          subject: campaignData?.subject || "",
          content: campaignData?.content || "",
          targetAudience: campaignData?.targetAudience || "all",
          customAudienceIds: (campaignData?.customAudienceIds || []).join(", "),
          scheduledAt: campaignData?.scheduledAt
            ? new Date(campaignData.scheduledAt).toISOString().slice(0, 16)
            : "",
          templateId: campaignData?.templateId || "",
        })
      } catch (error) {
        console.error("[Edit Campaign] Fetch error:", error)
        toast.error("Failed to load campaign data")
        router.push(`/admin/communication/${params.id}`)
      } finally {
        setLoading(false)
        setLoadingTemplates(false)
      }
    }

    fetchData()
  }, [isAuthenticated, authLoading, params.id, reset, router])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t._id === templateId)
    if (template) {
      setValue("subject", template.subject)
      setValue("content", template.content)
      setValue("templateId", template._id)
    }
  }

  const onSubmit = async (data: CampaignFormData) => {
    setSubmitting(true)
    try {
      const customAudienceIds =
        data.targetAudience === "custom"
          ? (data.customAudienceIds || "")
              .split(",")
              .map((id) => id.trim())
              .filter((id) => id.length > 0)
          : []

      await adminApi.communication.updateEmailCampaign(params.id, {
        name: data.name,
        subject: data.subject,
        content: data.content,
        targetAudience: data.targetAudience,
        customAudienceIds,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        templateId: data.templateId || undefined,
      } as any)

      toast.success("Campaign updated successfully")
      router.push(`/admin/communication/${params.id}`)
    } catch (error: any) {
      console.error("[Edit Campaign] Update error:", error)
      toast.error(error?.message || "Failed to update campaign")
    } finally {
      setSubmitting(false)
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/communication/${params.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Campaign</h1>
          <p className="text-muted-foreground mt-1">Update campaign content and targeting before sending</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Edit campaign metadata and message content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Email Template (Optional)</Label>
              <Select onValueChange={handleTemplateSelect} disabled={loadingTemplates}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" {...register("subject")} />
              {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea id="content" rows={10} {...register("content")} />
              {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Targeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Audience *</Label>
              <Select value={targetAudience} onValueChange={(value) => setValue("targetAudience", value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="creators">Creators Only</SelectItem>
                  <SelectItem value="members">Members Only</SelectItem>
                  <SelectItem value="custom">Custom Audience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetAudience === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customAudienceIds">Custom Audience IDs *</Label>
                <Textarea id="customAudienceIds" rows={4} {...register("customAudienceIds")} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule Send (Optional)</Label>
              <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/communication/${params.id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4 mr-2" />
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
