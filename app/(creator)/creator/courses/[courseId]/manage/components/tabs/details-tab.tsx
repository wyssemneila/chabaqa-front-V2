"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Upload } from "lucide-react"
import { Course } from "@/lib/models"
import { ThumbnailUpload } from "@/app/(creator)/creator/courses/new/components/thumbnail-upload"

interface DetailsTabProps {
  formData: any
  course: Course
  onInputChange: (field: string, value: any) => void
  onArrayChange: (field: string, index: number, value: string) => void
  onAddArrayItem: (field: string) => void
  onRemoveArrayItem: (field: string, index: number) => void
  totalChapters: number
  previewChapters: number
  totalRevenue: number
}

export function DetailsTab({
  formData,
  course,
  onInputChange,
  onArrayChange,
  onAddArrayItem,
  onRemoveArrayItem,
  totalChapters,
  previewChapters,
  totalRevenue,
}: DetailsTabProps) {

  const handleThumbnailChange = (url: string) => {
    onInputChange("thumbnail", url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your course basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => onInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Brief description for course cards and previews..."
                value={formData.description}
                onChange={(e) => onInputChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDescription">Detailed Description</Label>
              <Textarea
                id="longDescription"
                rows={6}
                placeholder="Comprehensive course description..."
                value={formData.longDescription}
                onChange={(e) => onInputChange("longDescription", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => onInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={formData.level} onValueChange={(value) => onInputChange("level", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="All Levels">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 40 hours, 6 weeks, 3 months"
                value={formData.duration}
                onChange={(e) => onInputChange("duration", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Learning Objectives</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddArrayItem("learningObjectives")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Objective
                </Button>
              </div>
              {formData.learningObjectives.map((objective: string, index: number) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="What will students learn?"
                    value={objective}
                    onChange={(e) => onArrayChange("learningObjectives", index, e.target.value)}
                  />
                  {formData.learningObjectives.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveArrayItem("learningObjectives", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Requirements</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => onAddArrayItem("requirements")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
              {formData.requirements.map((requirement: string, index: number) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="What do students need before starting?"
                    value={requirement}
                    onChange={(e) => onArrayChange("requirements", index, e.target.value)}
                  />
                  {formData.requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveArrayItem("requirements", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Course Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Add any notes, tips, or instructions for students..."
                value={formData.notes}
                onChange={(e) => onInputChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Course Thumbnail</CardTitle>
          </CardHeader>
          <CardContent>
            <ThumbnailUpload
              value={formData.thumbnail || course.thumbnail || ""}
              onChange={handleThumbnailChange}
            />
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sections</span>
              <span className="font-semibold">{course.sections?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chapters</span>
              <span className="font-semibold">{totalChapters}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Free Previews</span>
              <span className="font-semibold">{previewChapters}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Enrollments</span>
              <span className="font-semibold">{course.enrollments?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <span className="font-semibold text-green-600">${totalRevenue}</span>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Publication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.isPublished}
                onCheckedChange={(checked) => onInputChange("isPublished", checked)}
              />
              <Label htmlFor="published">Publish course</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {formData.isPublished
                ? "Course is live and visible to students"
                : "Course is in draft mode and not visible to students"}
            </p>
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  )
}
