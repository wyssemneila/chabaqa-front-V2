"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storageApi } from "@/lib/api/storage.api"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface ThumbnailUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ThumbnailUpload({ value, onChange }: ThumbnailUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string>(value)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Sync preview with value prop
  useEffect(() => {
    setPreview(value)
  }, [value])

  const previewSrc = resolveImageUrl(preview) || preview

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, JPEG, GIF, WebP)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      const uploaded = await storageApi.uploadImage(file)
      const imageUrl = uploaded.url
      if (!imageUrl) {
        throw new Error('Upload succeeded but no URL was returned')
      }
      const normalizedUrl = resolveImageUrl(imageUrl) || imageUrl
      setPreview(normalizedUrl)
      onChange(normalizedUrl)

      toast({
        title: "Upload successful",
        description: "Thumbnail uploaded successfully"
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleRemove = () => {
    setPreview("")
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${preview
            ? 'border-gray-300 hover:border-gray-400'
            : 'border-gray-300 hover:border-courses-500'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        {preview ? (
          // Image preview
          <div className="relative aspect-video w-full">
            <Image
              src={previewSrc}
              alt="Course thumbnail"
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {/* Overlay with remove button */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="rounded-full"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          // Upload placeholder
          <div className="p-8 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 mx-auto text-gray-400 animate-spin mb-4" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG, GIF, WebP up to 2MB</p>
                <p className="text-xs text-gray-500 mt-1">Recommended: 1920x1080px (16:9)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload button as alternative */}
      {!preview && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Image
        </Button>
      )}
    </div>
  )
}
