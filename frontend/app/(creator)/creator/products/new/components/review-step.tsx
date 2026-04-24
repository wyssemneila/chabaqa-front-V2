"use client"

import { useEffect, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, Package, FileText, AlertTriangle } from "lucide-react"
import { useProductForm } from "./product-form-context"
import { resolveImageUrl } from "@/lib/resolve-image-url"

export function ReviewStep() {
  const { formData, errors, handleInputChange } = useProductForm()
  const [imageLoadError, setImageLoadError] = useState(false)
  const previewImageSrc = resolveImageUrl(formData.thumbnail) || formData.thumbnail
  
  const hasErrors = Object.keys(errors).length > 0

  useEffect(() => {
    setImageLoadError(false)
  }, [previewImageSrc])

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2 text-primary-500" />
          Review & Publish
        </CardTitle>
        <CardDescription>Review your product details before publishing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasErrors && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention :</strong> Certains champs requis sont manquants ou invalides. 
              Veuillez les corriger avant de publier le produit.
              <ul className="mt-2 ml-4 list-disc text-sm">
                {Object.entries(errors).map(([key, value]) => (
                  <li key={key}>{value}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Product Overview</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Name:</strong> {formData.title || "Not set"}
                </div>
                <div>
                  <strong>Category:</strong> {formData.category || "Not set"}
                </div>
                <div>
                  <strong>Type:</strong> Digital
                </div>
                <div>
                  <strong>Base Price:</strong> {formData.price ? `${formData.currency} ${formData.price}` : "Free"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Product Structure</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Variants:</strong> {formData.variants.length}
                </div>
                <div>
                  <strong>Download Files:</strong> {formData.files.length}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Key Features</h3>
              <ul className="text-sm space-y-1">
                {formData.features
                  .filter((feature: string) => feature.trim())
                  .map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      {feature}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Product Preview</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="w-full h-32 bg-gray-200 rounded mb-3 overflow-hidden">
                  {previewImageSrc && !imageLoadError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImageSrc}
                      alt={formData.title || "Product thumbnail"}
                      className="w-full h-full object-cover"
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500">Product Thumbnail</span>
                    </div>
                  )}
                </div>
                <h4 className="font-semibold">{formData.title || "Product Name"}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {formData.description || "Product description will appear here..."}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      Digital Download
                    </span>
                  </div>
                  <div className="font-semibold text-primary-600">
                    {formData.price ? `${formData.currency} ${formData.price}` : "Free"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Files Included</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {formData.files.map((file: any, index: number) => (
                  <div key={file.id} className="border rounded p-3 bg-white">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>{file.name || `File ${index + 1}`}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="publish"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
              />
              <Label htmlFor="publish">Publish product immediately</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
