
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen } from "lucide-react"
import { ThumbnailUpload } from "./thumbnail-upload"
import { CreatorWritingAssist } from '@/components/creator-dashboard/creator-writing-assist'

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
          Start Your Course
        </CardTitle>
        <CardDescription>Name the course and describe the result members will get</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label htmlFor="title">Course Title *</Label><CreatorWritingAssist value={formData.title} onApply={v=>handleInputChange('title',v)} surface="course" field="title" context="An online course for community members" maxCharacters={120}/></div>
          <Input
            id="title"
            placeholder="e.g., Complete Web Development Bootcamp"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={validationErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.title && (
            <p className="text-sm text-red-500">Title must be at least 2 characters</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label htmlFor="description">What will members learn? *</Label><CreatorWritingAssist value={formData.description} onApply={v=>handleInputChange('description',v)} surface="course" field="description" context={`Course title: ${formData.title}`} maxCharacters={1200}/></div>
          <Textarea
            id="description"
            placeholder="Describe the promise of this course in a few sentences..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={validationErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-500">Add a short course description</p>
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
