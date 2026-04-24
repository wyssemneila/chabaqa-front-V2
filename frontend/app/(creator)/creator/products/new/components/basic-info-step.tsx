"use client"

import { useRef, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, X, ShoppingBag, Upload, ImageOff } from "lucide-react"
import { useProductForm } from "./product-form-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { resolveImageUrl } from "@/lib/resolve-image-url"

const categories = [
  "E-books",
  "Software",
  "Templates",
  "Courses",
  "Music",
  "Art",
  "Photography",
  "Membership",
]

export function BasicInfoStep() {
  const { formData, errors, handleInputChange, handleArrayChange, addArrayItem, removeArrayItem } = useProductForm()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const thumbnailPreviewSrc = resolveImageUrl(formData.thumbnail) || formData.thumbnail

  const onPick = () => inputRef.current?.click()

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!/image\/(png|jpeg|jpg)/i.test(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload PNG or JPG.", variant: "destructive" as any })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB.", variant: "destructive" as any })
      return
    }
    try {
      setUploading(true)
      const res = await api.storage.upload(file).catch(() => null as any)
      const url = (res as any)?.data?.url || (res as any)?.url
      if (!url) throw new Error("Upload failed")
      handleInputChange("thumbnail", url)
      toast({ title: "Thumbnail uploaded" })
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Try again.", variant: "destructive" as any })
    } finally {
      setUploading(false)
    }
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    onFiles(e.dataTransfer.files)
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2 text-primary-500" />
          Basic Product Information
        </CardTitle>
        <CardDescription>Start with the fundamentals of your digital product</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Product Name *</Label>
          <Input
            id="title"
            placeholder="e.g., Ultimate Photoshop Toolkit"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Product Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe what customers will get with this product..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={errors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Product Thumbnail</Label>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onFiles(e.target.files)} />
          {formData.thumbnail ? (
            <div className="relative border rounded-lg overflow-hidden">
              <div className="relative w-full aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailPreviewSrc} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2 p-3">
                <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-1" /> Replace
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleInputChange("thumbnail", "")}>
                  <ImageOff className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed ${uploading ? 'opacity-60' : ''} border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer`}
              onClick={onPick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">{uploading ? 'Uploading...' : 'Click to upload or drag and drop'}</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB (1920x1080 recommended - 16:9)</p>
            </div>
          )}
        </div>

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
            <p className="text-sm text-red-500 mt-1">{errors.category}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Key Features *</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("features")}>
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
          </div>
          {errors.features && (
            <p className="text-sm text-red-500">{errors.features}</p>
          )}
          {formData.features.map((feature: any, index: number) => (
            <div key={index} className="flex space-x-2">
              <Input
                placeholder="e.g., 50+ high-quality templates"
                value={feature}
                onChange={(e) => handleArrayChange("features", index, e.target.value)}
                className={errors.features && !feature.trim() ? "border-red-500" : ""}
              />
              {formData.features.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("features", index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
