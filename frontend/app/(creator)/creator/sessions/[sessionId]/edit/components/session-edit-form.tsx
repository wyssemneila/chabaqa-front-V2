"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"

interface SessionEditFormProps {
  session: any
  sessionId: string
}

export function SessionEditForm({ session, sessionId }: SessionEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    title: session.title || "",
    description: session.description || "",
    thumbnail: (session as any).thumbnail || (session as any).image || "",
    duration: session.duration || 60,
    price: session.price || 0,
    currency: session.currency || "TND",
    category: (session as any).category || "",
    maxBookingsPerWeek: (session as any).maxBookingsPerWeek || 5,
    notes: (session as any).notes || "",
    isActive: session.isActive || false,
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.title || formData.title.trim().length < 2) {
      errors.title = 'Session title must be at least 2 characters.'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'Session description must be at least 10 characters.'
    }
    if (!formData.duration || formData.duration < 15 || formData.duration > 480) {
      errors.duration = 'Session duration must be between 15 and 480 minutes.'
    }
    if (formData.price < 0) {
      errors.price = 'Session price must be zero or greater.'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: Object.values(validationErrors)[0],
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)

    try {
      console.log('[SessionEdit] Submitting:', formData)
      
      const response = await api.sessions.update(sessionId, formData)
      
      console.log('[SessionEdit] Update response:', response)
      
      toast({
        title: "Success",
        description: "Session updated successfully",
      })
      
      router.refresh()
    } catch (error: any) {
      console.error('[SessionEdit] Error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || error.message || "Failed to update session",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Session Details</CardTitle>
        <CardDescription>Update your session information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., 1-on-1 Code Review"
              className={validationErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {validationErrors.title && (
              <p className="text-sm text-red-500">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this session is about"
              rows={4}
              className={validationErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {validationErrors.description && (
              <p className="text-sm text-red-500">{validationErrors.description}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="thumbnail">Session Cover</Label>
            <Input
              id="thumbnail"
              value={formData.thumbnail}
              onChange={(e) => handleChange('thumbnail', e.target.value)}
              placeholder="https://.../session-cover.jpg"
            />
            <ImageUpload
              currentImage={formData.thumbnail}
              onImageChange={(url) => handleChange('thumbnail', url)}
              aspectRatio="wide"
              maxSize={5}
            />
          </div>

          {/* Duration & Price Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                className={validationErrors.duration ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {validationErrors.duration && (
                <p className="text-sm text-red-500">{validationErrors.duration}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                  placeholder="0.00"
                  className={validationErrors.price ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="px-3 py-2 border rounded-md bg-white"
                >
                  <option value="TND">TND</option>
                </select>
              </div>
              {validationErrors.price && (
                <p className="text-sm text-red-500">{validationErrors.price}</p>
              )}
            </div>
          </div>

          {/* Category & Max Bookings Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="e.g., Code Review, Mentoring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBookingsPerWeek">Max Bookings/Week</Label>
              <Input
                id="maxBookingsPerWeek"
                type="number"
                min="1"
                value={formData.maxBookingsPerWeek}
                onChange={(e) => handleChange('maxBookingsPerWeek', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information for participants"
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Active Status</Label>
              <p className="text-sm text-gray-600 mt-1">Make this session available for booking</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
