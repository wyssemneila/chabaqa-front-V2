"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, FileText, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { validateManageResource } from "@/app/(creator)/creator/challenges/_validation/challenge-validation"

interface Resource {
  id: string
  title: string
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link'
  url: string
  description: string
  order: number
}

interface Props {
  resources: Resource[]
  onAddResource: (resource: {
    title: string
    type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link'
    url: string
    description: string
  }) => Promise<void>
  onUpdateResource: (resourceId: string, resource: Partial<Resource>) => Promise<void>
  onDeleteResource: (resourceId: string) => Promise<void>
  isProcessing?: boolean
  fieldErrors?: Record<string, string>
}

export default function ChallengeResourcesTab({
  resources,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  isProcessing = false,
  fieldErrors = {},
}: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newResource, setNewResource] = useState({
    title: "",
    type: "pdf" as 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link',
    url: "",
    description: "",
  })
  const [newResourceErrors, setNewResourceErrors] = useState<Record<string, string>>({})
  const [editResourceErrors, setEditResourceErrors] = useState<Record<string, string>>({})

  const resetNewResource = () => {
    setNewResource({
      title: "",
      type: "pdf",
      url: "",
      description: "",
    })
    setNewResourceErrors({})
  }

  const handleAddResource = async () => {
    const validation = validateManageResource(newResource)
    if (!validation.isValid) {
      setNewResourceErrors(validation.fieldErrors)
      return
    }
    setIsSubmitting(true)
    try {
      await onAddResource({
        title: newResource.title,
        type: newResource.type,
        url: newResource.url,
        description: newResource.description,
      })
      resetNewResource()
      setIsAddOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditResource = async () => {
    if (!editingResource) return
    const validation = validateManageResource(editingResource)
    if (!validation.isValid) {
      setEditResourceErrors(validation.fieldErrors)
      return
    }
    setIsSubmitting(true)
    try {
      await onUpdateResource(editingResource.id, {
        title: editingResource.title,
        type: editingResource.type,
        url: editingResource.url,
        description: editingResource.description,
      })
      setEditingResource(null)
      setIsEditOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    await onDeleteResource(resourceId)
  }

  const openEditDialog = (resource: Resource) => {
    setEditingResource({ ...resource })
    setEditResourceErrors({})
    setIsEditOpen(true)
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Challenge Resources</CardTitle>
            <CardDescription>Manage additional resources for your challenge</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>Add a helpful resource for your challenge</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resourceTitle">Resource Title</Label>
                  <Input
                    id="resourceTitle"
                    placeholder="e.g., Challenge Starter Kit"
                    value={newResource.title}
                    onChange={(e) => setNewResource((prev) => ({ ...prev, title: e.target.value }))}
                    className={newResourceErrors.title || fieldErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {(newResourceErrors.title || fieldErrors.title) && (
                    <p className="text-sm text-red-500">{newResourceErrors.title || fieldErrors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceType">Resource Type</Label>
                  <Select
                    value={newResource.type}
                    onValueChange={(value: any) => setNewResource((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className={newResourceErrors.type || fieldErrors.type ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                  {(newResourceErrors.type || fieldErrors.type) && (
                    <p className="text-sm text-red-500">{newResourceErrors.type || fieldErrors.type}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceUrl">URL</Label>
                  <Input
                    id="resourceUrl"
                    placeholder="https://example.com/resource"
                    value={newResource.url}
                    onChange={(e) => setNewResource((prev) => ({ ...prev, url: e.target.value }))}
                    className={newResourceErrors.url || fieldErrors.url ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {(newResourceErrors.url || fieldErrors.url) && (
                    <p className="text-sm text-red-500">{newResourceErrors.url || fieldErrors.url}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceDescription">Description</Label>
                  <Textarea
                    id="resourceDescription"
                    placeholder="Brief description of this resource"
                    value={newResource.description}
                    onChange={(e) => setNewResource((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddResource} disabled={isSubmitting || isProcessing}>
                  {isSubmitting ? "Adding..." : "Add Resource"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No resources added yet</p>
            </div>
          ) : (
            resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {resource.type}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(resource)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{resource.title}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteResource(resource.id)} className="bg-red-600">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update the resource details</DialogDescription>
          </DialogHeader>
          {editingResource && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editResourceTitle">Resource Title</Label>
                <Input
                  id="editResourceTitle"
                  value={editingResource.title}
                  onChange={(e) => setEditingResource((prev) => prev ? { ...prev, title: e.target.value } : null)}
                  className={editResourceErrors.title || fieldErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {(editResourceErrors.title || fieldErrors.title) && (
                  <p className="text-sm text-red-500">{editResourceErrors.title || fieldErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editResourceType">Resource Type</Label>
                <Select
                  value={editingResource.type}
                  onValueChange={(value: any) => setEditingResource((prev) => prev ? { ...prev, type: value } : null)}
                >
                  <SelectTrigger className={editResourceErrors.type || fieldErrors.type ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
                {(editResourceErrors.type || fieldErrors.type) && (
                  <p className="text-sm text-red-500">{editResourceErrors.type || fieldErrors.type}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editResourceUrl">URL</Label>
                <Input
                  id="editResourceUrl"
                  value={editingResource.url}
                  onChange={(e) => setEditingResource((prev) => prev ? { ...prev, url: e.target.value } : null)}
                  className={editResourceErrors.url || fieldErrors.url ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {(editResourceErrors.url || fieldErrors.url) && (
                  <p className="text-sm text-red-500">{editResourceErrors.url || fieldErrors.url}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editResourceDescription">Description</Label>
                <Textarea
                  id="editResourceDescription"
                  value={editingResource.description}
                  onChange={(e) => setEditingResource((prev) => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditResource} disabled={isSubmitting || isProcessing}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EnhancedCard>
  )
}
