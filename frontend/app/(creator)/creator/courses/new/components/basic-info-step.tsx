
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen } from "lucide-react"
import { ThumbnailUpload } from "./thumbnail-upload"

interface BasicInfoStepProps {
  formData: {
    title: string
    description: string
    thumbnail: string
  }
  handleInputChange: (field: string, value: any) => void
  validationErrors?: Record<string, boolean>
}

export function BasicInfoStep({ formData, handleInputChange, validationErrors = {} }: BasicInfoStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-courses-500" />
          Basic Course Information
        </CardTitle>
        <CardDescription>Start with the fundamentals of your course</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Complete Web Development Bootcamp"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={validationErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.title && (
            <p className="text-sm text-red-500">Title must be at least 3 characters</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Course Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe what students will learn in this course..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={validationErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-500">Description must be at least 10 characters</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Course Thumbnail</Label>
          <ThumbnailUpload
            value={formData.thumbnail}
            onChange={(url) => handleInputChange("thumbnail", url)}
          />
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
