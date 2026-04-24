"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Unlock, Lock, Eye } from "lucide-react"
import Image from "next/image"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface ReviewPublishStepProps {
  formData: {
    title: string
    description: string
    thumbnail: string
    price: string
    currency: string
    category: string
    level: string
    duration: string
    isPublished: boolean
    learningObjectives: string[]
    requirements: string[]
    sections: {
      id: string
      title: string
      chapters: {
        id: string
        title: string
        duration?: number
        isPreview: boolean
        price?: string
      }[]
    }[]
  }
  handleInputChange: (field: string, value: any) => void
}

export function ReviewPublishStep({ formData, handleInputChange }: ReviewPublishStepProps) {
  const totalChapters = formData.sections.reduce((acc, section) => acc + section.chapters.length, 0)
  const previewChapters = formData.sections.reduce(
    (acc, section) => acc + section.chapters.filter((c) => c.isPreview).length,
    0,
  )
  const previewThumbnail = resolveImageUrl(formData.thumbnail) || formData.thumbnail

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2 text-courses-500" />
          Review & Publish
        </CardTitle>
        <CardDescription>Review your course details before publishing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Course Overview</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong> {formData.title || "Not set"}
                </div>
                <div>
                  <strong>Category:</strong> {formData.category || "Not set"}
                </div>
                <div>
                  <strong>Level:</strong> {formData.level || "Not set"}
                </div>
                <div>
                  <strong>Price:</strong> {formData.price ? `${formData.currency} ${formData.price}` : "Not set"}
                </div>
                <div>
                  <strong>Duration:</strong> {formData.duration || "Not set"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Course Structure</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Sections:</strong> {formData.sections.length}
                </div>
                <div>
                  <strong>Total Chapters:</strong> {totalChapters}
                </div>
                <div>
                  <strong>Free Preview Chapters:</strong> {previewChapters}
                </div>
                <div>
                  <strong>Paid Chapters:</strong> {totalChapters - previewChapters}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Learning Objectives</h3>
              <ul className="text-sm space-y-1">
                {formData.learningObjectives
                  .filter((obj) => obj.trim())
                  .map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-courses-500 mr-2">•</span>
                      {objective}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Course Preview</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center overflow-hidden">
                  {formData.thumbnail ? (
                    <Image
                      src={previewThumbnail}
                      alt="Course thumbnail"
                      width={400}
                      height={128}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-gray-500">Course Thumbnail</span>
                  )}
                </div>
                <h4 className="font-semibold">{formData.title || "Course Title"}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {formData.description || "Course description will appear here..."}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />0 enrolled
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formData.duration || "Duration"}
                    </span>
                  </div>
                  <div className="font-semibold text-courses-600">
                    {formData.price ? `${formData.currency} ${formData.price}` : "Free"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Course Content Preview</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {formData.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="border rounded p-3 bg-white">
                    <div className="font-medium text-sm mb-2">
                      Section {sectionIndex + 1}: {section.title || "Untitled Section"}
                    </div>
                    <div className="space-y-1 ml-3">
                      {section.chapters.map((chapter, chapterIndex) => (
                        <div key={chapter.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            {chapter.isPreview ? (
                              <Unlock className="h-3 w-3 text-green-500" />
                            ) : (
                              <Lock className="h-3 w-3 text-orange-500" />
                            )}
                            <span>{chapter.title || `Chapter ${chapterIndex + 1}`}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {!chapter.isPreview && chapter.price ? <span>${chapter.price}</span> : null}
                            {chapter.duration ? <span>{chapter.duration}m</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="publish"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
              />
              <Label htmlFor="publish">Publish course immediately</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
