"use client"

import { useState, useRef } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Upload, X, ImageIcon } from "lucide-react"
import { storageApi } from "@/lib/api/storage.api"
import { useToast } from "@/hooks/use-toast"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface BasicInfoStepProps {
  formData: any
  handleInputChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

const categories = [
  "Technology",
  "Business",
  "Design",
  "Marketing",
  "Health",
  "Education",
  "Entertainment",
  "Other",
]

const eventTypes = ["In-person", "Online", "Hybrid"]

export function BasicInfoStep({ formData, handleInputChange, errors = {} }: BasicInfoStepProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewImageSrc = resolveImageUrl(formData.image) || formData.image

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive' as any
      })
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 2MB',
        variant: 'destructive' as any
      })
      return
    }

    setIsUploading(true)

    try {
      const response = await storageApi.uploadImage(file)
      const imageUrl = response.url || (response as any)?.data?.url

      if (imageUrl) {
        handleInputChange("image", imageUrl)
        toast({ title: 'Success', description: 'Image uploaded successfully' })
      } else {
        throw new Error('No URL returned from upload')
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload image. Please try again.',
        variant: 'destructive' as any
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile) {
      handleFileSelect(imageFile)
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please drop an image file',
        variant: 'destructive' as any
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleRemoveImage = () => {
    handleInputChange("image", "")
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-events-500" />
          Basic Event Information
        </CardTitle>
        <CardDescription>Start with the fundamentals of your event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Annual Tech Conference"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Event Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe what attendees can expect from this event..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Event Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Event Image</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="hidden"
          />

          {previewImageSrc ? (
            <div className="relative group">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 border-2 border-gray-300">
                <img
                  src={previewImageSrc}
                  alt="Event image"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                onClick={handleRemoveImage}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-1" />
                Replace
              </Button>
            </div>
          ) : (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? 'border-events-500 bg-events-500/5' : 'border-gray-300 hover:border-events-500'}
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center space-y-4">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-events-500"></div>
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-gray-100 rounded-full">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB (1920x1080 recommended - 16:9)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      className="bg-events-500 hover:bg-events-600 text-white border-events-500"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
          {errors.image && (
            <p className="text-sm text-red-500">{errors.image}</p>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
