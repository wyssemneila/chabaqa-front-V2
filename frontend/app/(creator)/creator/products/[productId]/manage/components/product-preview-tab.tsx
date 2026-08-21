"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, CheckCircle } from "lucide-react"
import { FileText, FileArchive, FileAudio, FileVideo, FileInput, Box } from "lucide-react"
import { resolveImageUrl } from "@/lib/resolve-image-url"
import { useProductForm } from "./product-form-context"

function getFileTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'pdf': return <FileText className="h-4 w-4 text-red-500" />
    case 'zip': return <FileArchive className="h-4 w-4 text-yellow-500" />
    case 'mp3': return <FileAudio className="h-4 w-4 text-blue-500" />
    case 'mp4': return <FileVideo className="h-4 w-4 text-purple-500" />
    case 'figma': return <FileInput className="h-4 w-4 text-green-500" />
    default: return <Box className="h-4 w-4 text-gray-500" />
  }
}

export function ProductPreviewTab() {
  const { formData } = useProductForm()
  const [imageLoadError, setImageLoadError] = useState(false)
  const thumbnail = Array.isArray(formData.images) ? (formData.images[0] || "") : ""
  const previewImageSrc = resolveImageUrl(thumbnail) || thumbnail

  useEffect(() => {
    setImageLoadError(false)
  }, [previewImageSrc])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Preview</CardTitle>
        <CardDescription>How your product will appear to customers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                {previewImageSrc && !imageLoadError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImageSrc}
                    alt={formData.title || "Product preview"}
                    className="h-full w-full object-cover rounded-lg"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <Box className="h-10 w-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">No thumbnail preview</span>
                  </div>
                )}
              </div>
            </div>
            <div className="md:w-2/3 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{formData.title || "Product Title"}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  {formData.price > 0 ? (
                    <span className="text-xl font-semibold">{formData.price} TND</span>
                  ) : (
                    <Badge className="bg-green-500 text-white">Free</Badge>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>4.8 (124 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Description</h3>
                <p className="text-muted-foreground">
                  {formData.description || "Product description will appear here"}
                </p>
              </div>

              {formData.features.filter((f: string) => f.trim()).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Features</h3>
                  <ul className="space-y-1 text-sm">
                    {formData.features.filter((f: string) => f.trim()).map((feature: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">Files Included</h3>
                <div className="space-y-2">
                  {formData.files.slice(0, 3).map((file: any, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      {getFileTypeIcon(file.type)}
                      <span>{file.name || `File ${index + 1}`}</span>
                      <span className="text-muted-foreground text-xs ml-2">{file.type}</span>
                    </div>
                  ))}
                  {formData.files.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      +{formData.files.length - 3} more files
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
