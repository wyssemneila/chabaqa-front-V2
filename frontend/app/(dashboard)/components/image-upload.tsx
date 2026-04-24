"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (url: string) => void
  aspectRatio?: "square" | "wide" | "tall"
  maxSize?: number // in MB
  showPreview?: boolean
  className?: string
}

export function ImageUpload({
  currentImage,
  onImageChange,
  aspectRatio = "wide",
  maxSize = 5,
  showPreview = true,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`)
      return
    }

    setIsUploading(true)

    try {
      // Import storage API dynamically to avoid circular dependencies
      const { storageApi } = await import('@/lib/api')

      // Upload to backend storage
      const response = await storageApi.upload(file)

      if (response && response.url) {
        onImageChange(resolveImageUrl(response.url) || response.url)
      } else {
        throw new Error('No URL returned from upload')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
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

  const aspectRatioClasses = {
    square: "aspect-square",
    wide: "aspect-[16/9]",
    tall: "aspect-[9/16]",
  }
  const previewImage = resolveImageUrl(currentImage) || currentImage || ""

  return (
    <div className={cn("space-y-4", className)}>
      {showPreview && previewImage ? (
        <div className="relative group">
          <div className={cn("relative w-full overflow-hidden rounded-lg bg-gray-100", aspectRatioClasses[aspectRatio])}>
            <img
              src={previewImage}
              alt="Current image"
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            onClick={() => onImageChange("")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-chabaqa-primary bg-chabaqa-primary/5" : "border-gray-300 hover:border-gray-400",
            !showPreview && aspectRatioClasses[aspectRatio],
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
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

          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900">{isUploading ? "Uploading..." : "Upload Image"}</p>
              <p className="text-sm text-gray-500">Drag and drop or click to select (Max {maxSize}MB)</p>
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Choose File"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
