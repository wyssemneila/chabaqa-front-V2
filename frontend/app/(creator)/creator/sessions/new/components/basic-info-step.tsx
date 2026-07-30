
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"
import { CreatorWritingAssist } from '@/components/creator-dashboard/creator-writing-assist'

interface BasicInfoStepProps {
  formData: {
    title: string
    description: string
    thumbnail: string
    requirements: string
  }
  handleInputChange: (field: string, value: any) => void
  validationErrors?: Record<string, string>
}

export function BasicInfoStep({ formData, handleInputChange, validationErrors = {} }: BasicInfoStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-sessions-500" />
          Basic Session Information
        </CardTitle>
        <CardDescription>Start with the fundamentals of your session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label htmlFor="title">Session Title *</Label><CreatorWritingAssist value={formData.title} onApply={v=>handleInputChange('title',v)} surface="session" field="title" context="A one-to-one coaching session" maxCharacters={120}/></div>
          <Input
            id="title"
            placeholder="e.g., 1-on-1 Code Review Session"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={validationErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.title && (
            <p className="text-sm text-red-500">{validationErrors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label htmlFor="description">Session Description *</Label><CreatorWritingAssist value={formData.description} onApply={v=>handleInputChange('description',v)} surface="session" field="description" context={`Session title: ${formData.title}`} maxCharacters={1200}/></div>
          <Textarea
            id="description"
            placeholder="Describe what participants will get from this session..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={validationErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-500">{validationErrors.description}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="thumbnail">Session Cover (Optional)</Label>
          <Input
            id="thumbnail"
            placeholder="https://.../session-cover.jpg"
            value={formData.thumbnail}
            onChange={(e) => handleInputChange("thumbnail", e.target.value)}
          />
          <ImageUpload
            currentImage={formData.thumbnail}
            onImageChange={(url) => handleInputChange("thumbnail", url)}
            aspectRatio="wide"
            maxSize={5}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label htmlFor="requirements">Prerequisites/Requirements</Label><CreatorWritingAssist value={formData.requirements} onApply={v=>handleInputChange('requirements',v)} surface="session" field="requirements" context={`Session title: ${formData.title}`} maxCharacters={600}/></div>
          <Textarea
            id="requirements"
            placeholder="What should participants prepare or know beforehand?"
            rows={3}
            value={formData.requirements}
            onChange={(e) => handleInputChange("requirements", e.target.value)}
          />
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
