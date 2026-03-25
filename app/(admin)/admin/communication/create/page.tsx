"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, CreateEmailCampaignDto } from "@/lib/api/admin-api"
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
  targetAudience: z.enum(['all', 'creators', 'members', 'custom']),
  customAudienceIds: z.string().optional(),
  scheduledAt: z.string().optional(),
  templateId: z.string().optional()
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface EmailTemplate {
  _id: string
  name: string
  subject: string
  content: string
  variables: string[]
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [submitting, setSubmitting] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      targetAudience: 'all'
    }
  })

  const targetAudience = watch('targetAudience')

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch templates
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const response = await adminApi.communication.getEmailTemplates()
        const data = response?.data || response
        setTemplates(Array.isArray(data) ? data : data?.templates || [])
      } catch (error) {
        console.error('[Templates] Error:', error)
        toast.error('Failed to load templates')
      } finally {
        setLoadingTemplates(false)
      }
    }

    fetchTemplates()
  }, [isAuthenticated, authLoading])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t._id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setValue('subject', template.subject)
      setValue('content', template.content)
      setValue('templateId', template._id)
    }
  }

  const onSubmit = async (data: CampaignFormData) => {
    setSubmitting(true)
    try {
      // Parse custom audience IDs if provided
      let customAudienceIds: string[] | undefined
      if (data.targetAudience === 'custom' && data.customAudienceIds) {
        customAudienceIds = data.customAudienceIds
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0)
        
        if (customAudienceIds.length === 0) {
          toast.error('Please provide at least one recipient ID for custom audience')
          setSubmitting(false)
          return
        }
      }

      const audienceTarget =
        data.targetAudience === 'all'
          ? 'all_users'
          : data.targetAudience === 'custom'
          ? 'specific_users'
          : 'user_role'
      const targetRoles =
        data.targetAudience === 'creators'
          ? ['creator']
          : data.targetAudience === 'members'
          ? ['user']
          : undefined

      const campaignData: CreateEmailCampaignDto = {
        title: data.name,
        subject: data.subject,
        content: data.content,
        type: 'custom',
        audienceTarget,
        specificUserIds: customAudienceIds,
        targetRoles,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        templateId: data.templateId,
        isHtml: true,
        trackOpens: true,
        trackClicks: true,
      }

      const response = await adminApi.communication.createEmailCampaign(campaignData)
      const campaign = response?.data || response
      
      toast.success('Campaign created successfully')
      router.push(`/admin/communication/${campaign._id || campaign.id}`)
    } catch (error: any) {
      console.error('[Create Campaign] Error:', error)
      toast.error(error?.response?.data?.message || 'Failed to create campaign')
    } finally {
      setSubmitting(false)
    }
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/communication')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Email Campaign</h1>
          <p className="text-muted-foreground mt-1">
            Create a new email campaign to send to your users
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Provide the basic information for your email campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Newsletter - January 2026"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Template Selector */}
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
              {selectedTemplate && (
                <p className="text-sm text-muted-foreground">
                  Template selected: {selectedTemplate.name}
                </p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g., Exciting Updates This Month!"
                {...register('subject')}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your email content here..."
                rows={10}
                {...register('content')}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                You can use HTML formatting in your content
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Audience</CardTitle>
            <CardDescription>
              Select who should receive this campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Audience *</Label>
              <Select
                value={targetAudience}
                onValueChange={(value) => setValue('targetAudience', value as any)}
              >
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

            {/* Custom Audience IDs */}
            {targetAudience === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customAudienceIds">Recipient IDs *</Label>
                <Textarea
                  id="customAudienceIds"
                  placeholder="Enter user IDs separated by commas (e.g., 123abc, 456def, 789ghi)"
                  rows={4}
                  {...register('customAudienceIds')}
                />
                {errors.customAudienceIds && (
                  <p className="text-sm text-destructive">{errors.customAudienceIds.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Enter user IDs separated by commas
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduling (Optional)</CardTitle>
            <CardDescription>
              Schedule your campaign to be sent at a specific time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule For</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                {...register('scheduledAt')}
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to save as draft. You can send it manually later.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={submitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Creating...' : 'Create Campaign'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/communication')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
