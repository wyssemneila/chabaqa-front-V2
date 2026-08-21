"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, type AdminEmailTemplate } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { ArrowLeft, Plus, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

interface EmailTemplate {
  _id: string
  name: string
  subject: string
  content: string
  variables: string[]
  createdAt: string
  updatedAt: string
}

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  variables: z.string().optional()
})

type TemplateFormData = z.infer<typeof templateSchema>

const toUiTemplate = (template: AdminEmailTemplate): EmailTemplate => {
  const now = new Date().toISOString()
  return {
    _id: template._id,
    name: template.name,
    subject: template.subject ?? "",
    content: template.content ?? "",
    variables: template.variables ?? [],
    createdAt: (template as { createdAt?: string }).createdAt ?? now,
    updatedAt: (template as { updatedAt?: string }).updatedAt ?? now,
  }
}

export default function EmailTemplatesPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  
  // Action states
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema)
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await adminApi.communication.getEmailTemplates()
      const data = response?.data || response
      const apiTemplates = (Array.isArray(data) ? data : data?.templates || []) as AdminEmailTemplate[]
      setTemplates(apiTemplates.map(toUiTemplate))
    } catch (error) {
      console.error('[Templates] Error:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    fetchTemplates()
  }, [isAuthenticated, authLoading])

  const handleCreateTemplate = async (data: TemplateFormData) => {
    setSubmitting(true)
    try {
      const variables = data.variables
        ? data.variables.split(',').map(v => v.trim()).filter(v => v.length > 0)
        : []

      await adminApi.communication.createEmailTemplate({
        name: data.name,
        subject: data.subject,
        content: data.content,
        variables
      })

      toast.success('Template created successfully')
      setCreateDialogOpen(false)
      reset()
      fetchTemplates()
    } catch (error) {
      console.error('[Create Template] Error:', error)
      toast.error('Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTemplate = async (data: TemplateFormData) => {
    if (!selectedTemplate) return

    setSubmitting(true)
    try {
      const variables = data.variables
        ? data.variables.split(',').map(v => v.trim()).filter(v => v.length > 0)
        : []

      await adminApi.communication.updateEmailTemplate(selectedTemplate._id, {
        name: data.name,
        subject: data.subject,
        content: data.content,
        variables
      })

      toast.success('Template updated successfully')
      setEditDialogOpen(false)
      setSelectedTemplate(null)
      reset()
      fetchTemplates()
    } catch (error) {
      console.error('[Update Template] Error:', error)
      toast.error('Failed to update template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return

    setDeleting(true)
    try {
      await adminApi.communication.deleteEmailTemplate(selectedTemplate._id)
      toast.success('Template deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedTemplate(null)
      fetchTemplates()
    } catch (error) {
      console.error('[Delete Template] Error:', error)
      toast.error('Failed to delete template')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateDialog = () => {
    reset()
    setCreateDialogOpen(true)
  }

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setValue('name', template.name)
    setValue('subject', template.subject)
    setValue('content', template.content)
    setValue('variables', template.variables?.join(', ') || '')
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
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
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage reusable email templates
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No templates found</p>
              <p className="text-sm mt-2">Create your first template to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template._id}>
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.subject}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Content Preview</div>
                  <div className="text-sm line-clamp-3 p-3 bg-muted rounded-md">
                    {template.content.replace(/<[^>]*>/g, '')}
                  </div>
                </div>

                {template.variables && template.variables.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Variables</div>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/admin/communication/templates/${template._id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(template)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a reusable email template for campaigns
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateTemplate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Template Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Monthly Newsletter"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-subject">Subject *</Label>
              <Input
                id="create-subject"
                placeholder="e.g., {{month}} Newsletter"
                {...register('subject')}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-content">Content *</Label>
              <Textarea
                id="create-content"
                placeholder="Write your template content here..."
                rows={10}
                {...register('content')}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-variables">Variables (Optional)</Label>
              <Input
                id="create-variables"
                placeholder="e.g., name, month, year (comma-separated)"
                {...register('variables')}
              />
              <p className="text-sm text-muted-foreground">
                Variables can be used in subject and content with {'{{'} and {'}}'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditTemplate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Template Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Monthly Newsletter"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject *</Label>
              <Input
                id="edit-subject"
                placeholder="e.g., {{month}} Newsletter"
                {...register('subject')}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                placeholder="Write your template content here..."
                rows={10}
                {...register('content')}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-variables">Variables (Optional)</Label>
              <Input
                id="edit-variables"
                placeholder="e.g., name, month, year (comma-separated)"
                {...register('variables')}
              />
              <p className="text-sm text-muted-foreground">
                Variables can be used in subject and content with {'{{'} and {'}}'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Template"
        description={`Are you sure you want to delete the template "${selectedTemplate?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Template"}
        onConfirm={handleDeleteTemplate}
        variant="destructive"
      />
    </div>
  )
}
