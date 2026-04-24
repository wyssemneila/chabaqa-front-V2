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
import { Plus, Edit, Trash2, PlayCircle, Lock, Unlock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { Course } from "@/lib/models"
import { coursesApi } from "@/lib/api/courses.api"
import { mediaApi } from "@/lib/api/media.api"
import { getCreatorVideoUrlError, normalizeVideoUrl } from "@/lib/utils/video-source"

type ContentTabProps = {
  course: Course
  courseId: string
  highlightChapterId?: string
  onRefreshCourse?: () => Promise<void>
  onAddSection: (payload: { titre: string; description?: string }) => Promise<void>
  onAddChapter: (sectionId: string, payload: any) => Promise<void>
  onDeleteSection: (sectionId: string) => Promise<void>
  onDeleteChapter: (sectionId: string, chapterId: string) => Promise<void>
  onUpdateSection: (sectionId: string, payload: { title: string; description: string }) => Promise<void>
  onUpdateChapter: (
    sectionId: string,
    chapterId: string,
    payload: {
      title: string
      content: string
      videoUrl: string
      duration: string
      isPreview: boolean
      price: string
      notes: string
    },
  ) => Promise<void>
}

function ensureAbsoluteUploadUrl(value: unknown): string {
  const v = typeof value === 'string' ? value.trim() : ''
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const origin = apiBase.replace(/\/api$/, "")
  if (v.startsWith("/")) return `${origin}${v}`
  return `${origin}/${v}`
}

export function ContentTab({
  course,
  courseId,
  highlightChapterId,
  onRefreshCourse,
  onAddSection,
  onAddChapter,
  onDeleteSection,
  onDeleteChapter,
  onUpdateSection,
  onUpdateChapter,
}: ContentTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
  })

  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false)
  const [editSectionId, setEditSectionId] = useState<string | null>(null)
  const [editSectionTitle, setEditSectionTitle] = useState("")
  const [editSectionDescription, setEditSectionDescription] = useState("")

  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false)
  const [editChapterSectionId, setEditChapterSectionId] = useState<string | null>(null)
  const [editChapterId, setEditChapterId] = useState<string | null>(null)
  const [editChapterVideoUrlError, setEditChapterVideoUrlError] = useState<string | null>(null)
  const [editChapterFormError, setEditChapterFormError] = useState<string | null>(null)
  const [editChapter, setEditChapter] = useState({
    title: "",
    content: "",
    videoUrl: "",
    duration: "",
    isPreview: false,
    price: "",
    notes: "",
  })

  const [newChapter, setNewChapter] = useState({
    title: "",
    content: "",
    videoUrl: "",
    duration: "",
    isPreview: false,
    price: "",
    notes: "",
  })
  const [newChapterVideoUrlError, setNewChapterVideoUrlError] = useState<string | null>(null)
  const [newChapterFormError, setNewChapterFormError] = useState<string | null>(null)

  const validateChapterDraft = (chapter: { title: string; content: string; videoUrl: string }) => {
    const title = chapter.title.trim()
    const content = chapter.content.trim()
    const videoUrl = normalizeVideoUrl(chapter.videoUrl)

    if (!title) {
      return { formError: "Chapter title is required.", videoError: null as string | null }
    }

    if (!content && !videoUrl) {
      return { formError: "Add chapter content or a video URL.", videoError: null as string | null }
    }

    const videoError = getCreatorVideoUrlError(videoUrl)
    if (videoError) {
      return { formError: null as string | null, videoError }
    }

    return { formError: null as string | null, videoError: null as string | null }
  }

  const uploadNewChapterVideo = async (file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const result = await mediaApi.uploadSmart(file, {
        purpose: "course_video",
        entityType: "course_chapter",
        visibility: "public",
      })
      const url = ensureAbsoluteUploadUrl(result?.url)
      setNewChapterVideoUrlError(getCreatorVideoUrlError(url))
      return url || null
    } finally {
      setIsUploading(false)
    }
  }

  const uploadExistingChapterVideo = async (sectionId: string, chapterId: string, file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const result = await coursesApi.uploadChapterVideo(courseId, sectionId, chapterId, file)
      const updatedCourse = result?.data || result?.cours || result
      const updatedSection = updatedCourse?.sections?.find((s: any) => String(s.id) === String(sectionId))
      const updatedChapter = updatedSection?.chapitres?.find((c: any) => String(c.id) === String(chapterId))
      const newUrl = updatedChapter?.videoUrl || updatedChapter?.video_url || ""
      if (newUrl) {
        setEditChapter((p) => ({ ...p, videoUrl: String(newUrl) }))
        setEditChapterVideoUrlError(getCreatorVideoUrlError(newUrl))
      }
      if (onRefreshCourse) {
        await onRefreshCourse()
      }
      return newUrl || null
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddSection = () => {
    void onAddSection({ titre: newSection.title, description: newSection.description })
    setNewSection({ title: "", description: "" })
  }

  const openEditSection = (section: any) => {
    setEditSectionId(String(section.id))
    setEditSectionTitle(String(section.title || ""))
    setEditSectionDescription(String(section.description || ""))
    setIsEditSectionOpen(true)
  }

  const saveEditSection = () => {
    if (!editSectionId) return
    void onUpdateSection(editSectionId, { title: editSectionTitle, description: editSectionDescription })
    setIsEditSectionOpen(false)
    setEditSectionId(null)
  }

  const openEditChapter = (sectionId: string, chapter: any) => {
    setEditChapterSectionId(sectionId)
    setEditChapterId(String(chapter.id))
    setEditChapter({
      title: String(chapter.title || ""),
      content: String(chapter.content || ""),
      videoUrl: String(chapter.videoUrl || ""),
      duration: String(chapter.duration || ""),
      isPreview: Boolean(chapter.isPreview),
      price: chapter.price ? String(chapter.price) : "",
      notes: String(chapter.notes || ""),
    })
    setEditChapterVideoUrlError(getCreatorVideoUrlError(chapter.videoUrl || ""))
    setEditChapterFormError(null)
    setIsEditChapterOpen(true)
  }

  const saveEditChapter = () => {
    if (!editChapterSectionId || !editChapterId) return
    const validation = validateChapterDraft(editChapter)
    setEditChapterFormError(validation.formError)
    setEditChapterVideoUrlError(validation.videoError)
    if (validation.formError || validation.videoError) {
      return
    }
    void onUpdateChapter(editChapterSectionId, editChapterId, editChapter)
    setIsEditChapterOpen(false)
    setEditChapterSectionId(null)
    setEditChapterId(null)
    setEditChapterFormError(null)
    setEditChapterVideoUrlError(null)
  }

  const handleDeleteSection = (sectionId: string) => {
    const confirmed = window.confirm("Delete this section? This will also remove all its chapters.")
    if (!confirmed) return
    void onDeleteSection(sectionId)
  }

  const handleDeleteChapter = (sectionId: string, chapterId: string) => {
    const confirmed = window.confirm("Delete this chapter?")
    if (!confirmed) return
    void onDeleteChapter(sectionId, chapterId)
  }

  const handleAddChapter = (sectionId: string) => {
    const validation = validateChapterDraft(newChapter)
    setNewChapterFormError(validation.formError)
    setNewChapterVideoUrlError(validation.videoError)
    if (validation.formError || validation.videoError) {
      return
    }

    void onAddChapter(sectionId, {
      ...newChapter,
      videoUrl: normalizeVideoUrl(newChapter.videoUrl),
    })
    setNewChapter({
      title: "",
      content: "",
      videoUrl: "",
      duration: "",
      isPreview: false,
      price: "",
      notes: "",
    })
    setNewChapterFormError(null)
    setNewChapterVideoUrlError(null)
  }

  useEffect(() => {
    if (!highlightChapterId || typeof window === "undefined") return
    const target = document.getElementById(`chapter-${highlightChapterId}`)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [highlightChapterId, course?.sections?.length])

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>Manage your course sections and chapters</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
                <DialogDescription>Create a new section to organize your course content</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sectionTitle">Section Title</Label>
                  <Input
                    id="sectionTitle"
                    placeholder="e.g., HTML Fundamentals"
                    value={newSection.title}
                    onChange={(e) => setNewSection((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectionDescription">Description</Label>
                  <Textarea
                    id="sectionDescription"
                    placeholder="Brief description of what this section covers"
                    value={newSection.description}
                    onChange={(e) => setNewSection((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSection}>Add Section</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Dialog open={isEditSectionOpen} onOpenChange={setIsEditSectionOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Section</DialogTitle>
                <DialogDescription>Update section title and description</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={editSectionTitle} onChange={(e) => setEditSectionTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={editSectionDescription} onChange={(e) => setEditSectionDescription(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={saveEditSection}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditChapterOpen} onOpenChange={setIsEditChapterOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Chapter</DialogTitle>
                <DialogDescription>Update chapter details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Chapter Title</Label>
                    <Input value={editChapter.title} onChange={(e) => setEditChapter((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" value={editChapter.duration} onChange={(e) => setEditChapter((p) => ({ ...p, duration: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Chapter Video (Upload)</Label>
                  <Input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void (async () => {
                        if (!editChapterSectionId || !editChapterId) return
                        await uploadExistingChapterVideo(editChapterSectionId, editChapterId, file)
                      })()
                    }}
                  />
                  {editChapter.videoUrl ? (
                    <p className="text-xs text-muted-foreground break-all">{editChapter.videoUrl}</p>
                  ) : null}
                  {isUploading ? (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  ) : null}
                  <Label>Video URL (YouTube or /uploads/...)</Label>
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={editChapter.videoUrl}
                    onChange={(e) => {
                      const nextVideoUrl = e.target.value
                      setEditChapter((p) => ({ ...p, videoUrl: nextVideoUrl }))
                      setEditChapterVideoUrlError(getCreatorVideoUrlError(nextVideoUrl))
                    }}
                    className={editChapterVideoUrlError ? "border-red-500" : ""}
                  />
                  {editChapterVideoUrlError ? (
                    <p className="text-xs text-red-500">{editChapterVideoUrlError}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Chapter Content</Label>
                  <Textarea rows={4} value={editChapter.content} onChange={(e) => setEditChapter((p) => ({ ...p, content: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Chapter Notes</Label>
                  <Textarea rows={3} value={editChapter.notes} onChange={(e) => setEditChapter((p) => ({ ...p, notes: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={editChapter.isPreview} onCheckedChange={(checked) => setEditChapter((p) => ({ ...p, isPreview: checked }))} />
                    <Label>Free Preview</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Chapter Price</Label>
                    <Input type="number" value={editChapter.price} onChange={(e) => setEditChapter((p) => ({ ...p, price: e.target.value }))} disabled={editChapter.isPreview} />
                  </div>
                </div>
                {editChapterFormError ? (
                  <p className="text-sm text-red-500">{editChapterFormError}</p>
                ) : null}
              </div>
              <DialogFooter>
                <Button type="button" onClick={saveEditChapter}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {(course.sections || []).map((section, sectionIndex) => (
            <div key={section.id} className="border rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Section {sectionIndex + 1}: {section.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{section.chapters.length} chapters</Badge>
                  <Button variant="outline" size="sm" onClick={() => openEditSection(section)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 bg-transparent"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {section.chapters.map((chapter, chapterIndex) => (
                  <div
                    key={chapter.id}
                    id={`chapter-${chapter.id}`}
                    className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${
                      highlightChapterId && String(chapter.id) === String(highlightChapterId)
                        ? "ring-2 ring-blue-400 bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {chapter.isPreview ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-orange-500" />
                        )}
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {chapterIndex + 1}. {chapter.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{chapter.duration} min</span>
                          {chapter.isPreview && (
                            <Badge variant="outline" className="text-xs">
                              Free Preview
                            </Badge>
                          )}
                          {chapter.price && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              {chapter.price} TND
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditChapter(section.id, chapter)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteChapter(section.id, chapter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter to {section.title}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Chapter</DialogTitle>
                      <DialogDescription>Add a new chapter to {section.title}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="chapterTitle">Chapter Title</Label>
                          <Input
                            id="chapterTitle"
                            placeholder="e.g., Introduction to HTML"
                            value={newChapter.title}
                            onChange={(e) => setNewChapter((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chapterDuration">Duration (minutes)</Label>
                          <Input
                            id="chapterDuration"
                            type="number"
                            placeholder="15"
                            value={newChapter.duration}
                            onChange={(e) => setNewChapter((prev) => ({ ...prev, duration: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chapterVideo">Chapter Video (Upload)</Label>
                        <Input
                          id="chapterVideo"
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            void (async () => {
                              const url = await uploadNewChapterVideo(file)
                              if (url) {
                                setNewChapter((prev) => ({ ...prev, videoUrl: url }))
                              }
                            })()
                          }}
                        />
                        {newChapter.videoUrl ? (
                          <p className="text-xs text-muted-foreground break-all">{newChapter.videoUrl}</p>
                        ) : null}
                        {isUploading ? (
                          <p className="text-xs text-muted-foreground">Uploading...</p>
                        ) : null}
                        <Label htmlFor="chapterVideoUrl">Video URL (YouTube or /uploads/...)</Label>
                        <Input
                          id="chapterVideoUrl"
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={newChapter.videoUrl}
                          onChange={(e) => {
                            const nextVideoUrl = e.target.value
                            setNewChapter((prev) => ({ ...prev, videoUrl: nextVideoUrl }))
                            setNewChapterVideoUrlError(getCreatorVideoUrlError(nextVideoUrl))
                          }}
                          className={newChapterVideoUrlError ? "border-red-500" : ""}
                        />
                        {newChapterVideoUrlError ? (
                          <p className="text-xs text-red-500">{newChapterVideoUrlError}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chapterContent">Chapter Content</Label>
                        <Textarea
                          id="chapterContent"
                          rows={4}
                          placeholder="Describe what students will learn in this chapter..."
                          value={newChapter.content}
                          onChange={(e) => setNewChapter((prev) => ({ ...prev, content: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chapterNotes">Chapter Notes</Label>
                        <Textarea
                          id="chapterNotes"
                          rows={3}
                          placeholder="Additional notes or instructions for this chapter..."
                          value={newChapter.notes}
                          onChange={(e) => setNewChapter((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="chapterPreview"
                            checked={newChapter.isPreview}
                            onCheckedChange={(checked) =>
                              setNewChapter((prev) => ({ ...prev, isPreview: checked }))
                            }
                          />
                          <Label htmlFor="chapterPreview">Free Preview</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chapterPrice">Individual Price (optional)</Label>
                          <Input
                            id="chapterPrice"
                            type="number"
                            placeholder="9.99"
                            value={newChapter.price}
                            disabled={newChapter.isPreview}
                            onChange={(e) => setNewChapter((prev) => ({ ...prev, price: e.target.value }))}
                          />
                        </div>
                      </div>
                      {newChapterFormError ? (
                        <p className="text-sm text-red-500">{newChapterFormError}</p>
                      ) : null}
                    </div>
                    <DialogFooter>
                      <Button onClick={() => handleAddChapter(section.id)}>Add Chapter</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
