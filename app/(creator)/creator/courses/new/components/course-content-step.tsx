
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Plus, Trash2, Lock, Unlock, PlayCircle, BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { mediaApi } from "@/lib/api/media.api"
import { getCreatorVideoUrlError, normalizeVideoUrl } from "@/lib/utils/video-source"

function ensureAbsoluteUploadUrl(value: unknown): string {
  const v = typeof value === 'string' ? value.trim() : ''
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  const apiBase = process.env.NEXT_PUBLIC_API_URL || ""
  const inferredOrigin = apiBase ? apiBase.replace(/\/api$/, "") : ""
  const origin = inferredOrigin && !/^https?:\/\/localhost(:\d+)?$/i.test(inferredOrigin)
    ? inferredOrigin
    : "https://api.chabaqa.io"
  if (v.startsWith("/")) return `${origin}${v}`
  return `${origin}/${v}`
}

interface CourseChapterForm {
  id: string
  title: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
  isPreview: boolean
  price?: string
  notes?: string
}

interface CourseSectionForm {
  id: string
  title: string
  description?: string
  order: number
  chapters: CourseChapterForm[]
}

interface CourseContentStepProps {
  formData: {
    sections: CourseSectionForm[]
  }
  addSection: () => void
  updateSection: (sectionId: string, field: string, value: any) => void
  removeSection: (sectionId: string) => void
  addChapter: (sectionId: string) => void
  updateChapter: (sectionId: string, chapterId: string, field: string, value: any) => void
  removeChapter: (sectionId: string, chapterId: string) => void
  validationErrors?: Record<string, boolean>
  chapterValidationErrors?: Record<string, string>
}

export function CourseContentStep({
  formData,
  addSection,
  updateSection,
  removeSection,
  addChapter,
  updateChapter,
  removeChapter,
  validationErrors = {},
  chapterValidationErrors = {},
}: CourseContentStepProps) {
  const totalChapters = formData.sections.reduce((acc, section) => acc + section.chapters.length, 0)
  const hasValidationError = validationErrors?.courseContent || false

  const [uploadingChapterIds, setUploadingChapterIds] = useState<Record<string, boolean>>({})
  const [chapterVideoUrlErrors, setChapterVideoUrlErrors] = useState<Record<string, string>>({})

  const setChapterVideoUrlError = (chapterId: string, error: string | null) => {
    setChapterVideoUrlErrors((prev) => {
      const next = { ...prev }
      if (error) {
        next[chapterId] = error
      } else {
        delete next[chapterId]
      }
      return next
    })
  }

  const uploadVideoForChapter = async (sectionId: string, chapterId: string, file: File) => {
    console.log('🎬 [VIDEO UPLOAD] Starting upload for chapter:', chapterId)
    console.log('   📁 File:', file.name, 'Size:', file.size, 'Type:', file.type)
    
    setUploadingChapterIds((prev) => ({ ...prev, [chapterId]: true }))
    try {
      const result = await mediaApi.uploadSmart(file, {
        purpose: "course_video",
        entityType: "course_chapter",
        entityId: chapterId,
        visibility: "public",
      })
      console.log('✅ [VIDEO UPLOAD] Upload successful:', result)
      const url = ensureAbsoluteUploadUrl(result?.url)
      console.log('   🔗 URL received:', url)
      
      if (url) {
        updateChapter(sectionId, chapterId, "videoUrl", url)
        setChapterVideoUrlError(chapterId, getCreatorVideoUrlError(url))
        console.log('✅ [VIDEO UPLOAD] Video URL set in chapter state:', url)
      } else {
        console.error('❌ [VIDEO UPLOAD] No URL in response:', result)
      }
    } catch (error) {
      console.error('❌ [VIDEO UPLOAD] Upload failed:', error)
    } finally {
      setUploadingChapterIds((prev) => ({ ...prev, [chapterId]: false }))
    }
  }

  return (
    <EnhancedCard className={hasValidationError ? "border-2 border-red-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-courses-500" />
            Course Content
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {formData.sections.length} sections, {totalChapters} chapters
            </Badge>
            <Button onClick={addSection} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Organize your course into sections and chapters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.sections.length === 0 ? (
          <div className={`text-center py-12 border-2 border-dashed rounded-lg ${
            hasValidationError 
              ? "border-red-300 bg-red-50" 
              : "border-gray-300 bg-gray-50"
          }`}>
            <BookOpen className={`h-16 w-16 mx-auto mb-4 ${
              hasValidationError ? "text-red-400" : "text-gray-400"
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              hasValidationError ? "text-red-700" : "text-gray-700"
            }`}>
              No sections added yet
            </h3>
            <p className={`mb-2 ${
              hasValidationError ? "text-red-600" : "text-muted-foreground"
            }`}>
              Start building your course by adding your first section
            </p>
            {hasValidationError && (
              <p className="text-sm text-red-500 mb-6">At least one section with one chapter is required</p>
            )}
            <Button 
              onClick={addSection}
              className={hasValidationError 
                ? "bg-red-500 hover:bg-red-600" 
                : ""
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Section
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {formData.sections.map((section, sectionIndex) => (
              <EnhancedCard key={section.id} className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">Section {sectionIndex + 1}</Badge>
                      <CardTitle className="text-lg">{section.title || `Section ${sectionIndex + 1}`}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {section.chapters.length} chapters
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(section.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Section Title *</Label>
                      <Input
                        placeholder="e.g., HTML Fundamentals"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Section Description</Label>
                      <Input
                        placeholder="Brief description of this section"
                        value={section.description}
                        onChange={(e) => updateSection(section.id, "description", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Chapters */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Chapters</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addChapter(section.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Chapter
                      </Button>
                    </div>

                    {section.chapters.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <PlayCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No chapters in this section</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => addChapter(section.id)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Chapter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {section.chapters.map((chapter, chapterIndex) => {
                          const chapterTitleError = chapterValidationErrors[`chapter:${chapter.id}:title`]
                          const chapterVideoError =
                            chapterVideoUrlErrors[chapter.id] ||
                            chapterValidationErrors[`chapter:${chapter.id}:videoUrl`]
                          const chapterContentVideoError =
                            chapterValidationErrors[`chapter:${chapter.id}:contentVideo`]

                          return (
                          <div
                            key={chapter.id}
                            className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {chapterIndex + 1}
                                </Badge>
                                <span className="font-medium">{chapter.title || `Chapter ${chapterIndex + 1}`}</span>
                                {chapter.isPreview ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Free Preview
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeChapter(section.id, chapter.id)}
                                className="text-red-500 hover:text-red-700 h-8 w-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Chapter Title *</Label>
                                <Input
                                  placeholder="e.g., Introduction to HTML"
                                  value={chapter.title}
                                  onChange={(e) => updateChapter(section.id, chapter.id, "title", e.target.value)}
                                  className={`h-8 text-sm ${chapterTitleError ? "border-red-500" : ""}`}
                                />
                                {chapterTitleError ? (
                                  <p className="text-xs text-red-500 mt-1">{chapterTitleError}</p>
                                ) : null}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Chapter Video Upload</Label>
                                <Input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                                  disabled={Boolean(uploadingChapterIds[chapter.id])}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    void uploadVideoForChapter(section.id, chapter.id, file)
                                  }}
                                  className="h-8 text-sm"
                                />
                                {uploadingChapterIds[chapter.id] ? (
                                  <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
                                ) : null}
                                <Label className="text-xs mt-2 block">Video URL (YouTube or /uploads/...)</Label>
                                <Input
                                  type="url"
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  value={chapter.videoUrl || ""}
                                  onChange={(e) => {
                                    const nextVideoUrl = e.target.value
                                    updateChapter(section.id, chapter.id, "videoUrl", nextVideoUrl)
                                    setChapterVideoUrlError(
                                      chapter.id,
                                      getCreatorVideoUrlError(normalizeVideoUrl(nextVideoUrl)),
                                    )
                                  }}
                                  className={`h-8 text-sm ${chapterVideoError ? "border-red-500" : ""}`}
                                />
                                {chapterVideoError ? (
                                  <p className="text-xs text-red-500 mt-1">{chapterVideoError}</p>
                                ) : chapter.videoUrl ? (
                                  <p className="text-xs text-muted-foreground mt-1 break-all">{chapter.videoUrl}</p>
                                ) : null}
                              </div>
                            </div>

                            <div className="space-y-1 mb-3">
                              <Label className="text-xs">Chapter Content</Label>
                              <Textarea
                                placeholder="Describe what students will learn in this chapter..."
                                value={chapter.content}
                                onChange={(e) => updateChapter(section.id, chapter.id, "content", e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                              {chapterContentVideoError ? (
                                <p className="text-xs text-red-500 mt-1">{chapterContentVideoError}</p>
                              ) : null}
                            </div>

                            <div className="space-y-1 mb-3">
                              <Label className="text-xs">Instructor Notes (optional)</Label>
                              <Textarea
                                placeholder="Additional notes, tips, or instructions for students..."
                                value={chapter.notes || ""}
                                onChange={(e) => updateChapter(section.id, chapter.id, "notes", e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    placeholder="15"
                                    value={chapter.duration || ""}
                                    onChange={(e) =>
                                      updateChapter(
                                        section.id,
                                        chapter.id,
                                        "duration",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="h-8 w-20 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Chapter Price</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="9.99"
                                    disabled={chapter.isPreview}
                                    value={chapter.price || ""}
                                    onChange={(e) =>
                                      updateChapter(
                                        section.id,
                                        chapter.id,
                                        "price",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 w-24 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={chapter.isPreview}
                                  onCheckedChange={(checked) =>
                                    updateChapter(section.id, chapter.id, "isPreview", checked)
                                  }
                                />
                                <Label className="text-xs">Free Preview</Label>
                              </div>
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                </CardContent>
              </EnhancedCard>
            ))}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}
