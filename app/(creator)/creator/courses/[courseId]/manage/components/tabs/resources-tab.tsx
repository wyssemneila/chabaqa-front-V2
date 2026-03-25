"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Plus, Trash2, FileText, ExternalLink, Video, Code, Link as LinkIcon, FileType, Wrench } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Course } from "@/lib/models"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-5 w-5 text-purple-500" />
    case 'article':
      return <FileText className="h-5 w-5 text-blue-500" />
    case 'code':
      return <Code className="h-5 w-5 text-green-500" />
    case 'outil':
    case 'tool':
      return <Wrench className="h-5 w-5 text-orange-500" />
    case 'pdf':
      return <FileType className="h-5 w-5 text-red-500" />
    case 'lien':
    case 'link':
      return <LinkIcon className="h-5 w-5 text-cyan-500" />
    default:
      return <FileText className="h-5 w-5 text-gray-500" />
  }
}

interface ResourcesTabProps {
  course: Course
  onRefresh?: () => Promise<void>
}

export function ResourcesTab({ course, onRefresh }: ResourcesTabProps) {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedChapter, setSelectedChapter] = useState<string>("")
  const [newResource, setNewResource] = useState({
    title: "",
    type: "pdf",
    url: "",
    description: "",
  })

  // Get all chapters with their resources
  const allChaptersWithResources = (course.sections || []).flatMap((section) =>
    (section.chapters || []).map((chapter) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      resources: chapter.resources || [],
    }))
  )

  const handleAddResource = async () => {
    if (!selectedSection || !selectedChapter) {
      toast({ title: "Please select a section and chapter", variant: "destructive" })
      return
    }
    if (!newResource.title || !newResource.url) {
      toast({ title: "Title and URL are required", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const courseId = course.mongoId || course.id
      await apiClient.post(
        `/cours/${courseId}/sections/${selectedSection}/chapitres/${selectedChapter}/ressources`,
        {
          titre: newResource.title,
          type: newResource.type,
          url: newResource.url,
          description: newResource.description,
          ordre: 1,
        }
      )
      toast({ title: "Resource added successfully" })
      setNewResource({ title: "", type: "pdf", url: "", description: "" })
      setIsAddDialogOpen(false)
      if (onRefresh) await onRefresh()
    } catch (error: any) {
      toast({ 
        title: "Failed to add resource", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const chaptersForSelectedSection = selectedSection
    ? (course.sections || []).find((s) => s.id === selectedSection)?.chapters || []
    : []

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Course Resources</CardTitle>
            <CardDescription>Manage additional resources for your course chapters</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>Add a helpful resource to a chapter</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Section</Label>
                  <Select value={selectedSection} onValueChange={(v) => { setSelectedSection(v); setSelectedChapter(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {(course.sections || []).map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Chapter</Label>
                  <Select value={selectedChapter} onValueChange={setSelectedChapter} disabled={!selectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chaptersForSelectedSection.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceTitle">Resource Title</Label>
                  <Input
                    id="resourceTitle"
                    placeholder="e.g., HTML5 Cheat Sheet"
                    value={newResource.title}
                    onChange={(e) => setNewResource((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceType">Resource Type</Label>
                  <Select
                    value={newResource.type}
                    onValueChange={(value) => setNewResource((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="outil">Tool</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="lien">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceUrl">URL</Label>
                  <Input
                    id="resourceUrl"
                    placeholder="https://example.com/resource"
                    value={newResource.url}
                    onChange={(e) => setNewResource((prev) => ({ ...prev, url: e.target.value }))}
                  />
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
                <Button onClick={handleAddResource} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Resource"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {allChaptersWithResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No chapters found. Add sections and chapters first.</p>
            </div>
          ) : (
            allChaptersWithResources.map((item) => (
              <div key={`${item.sectionId}-${item.chapterId}`} className="border rounded-lg p-4">
                <div className="mb-3">
                  <h4 className="font-medium">{item.chapterTitle}</h4>
                  <p className="text-sm text-muted-foreground">Section: {item.sectionTitle}</p>
                </div>
                {item.resources.length > 0 ? (
                  <div className="space-y-2">
                    {item.resources.map((resource: any, idx: number) => (
                      <div key={resource.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getResourceIcon(resource.type)}
                          <div>
                            <p className="font-medium text-sm">{resource.titre || resource.title}</p>
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                          {resource.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              toast({ 
                                title: "Delete not available yet", 
                                description: "Resource deletion will be available soon.",
                              })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No resources for this chapter</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}