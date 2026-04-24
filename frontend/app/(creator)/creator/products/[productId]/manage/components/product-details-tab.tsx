"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Upload, Plus, X } from "lucide-react"
import { useProductForm } from "./product-form-context"
import { resolveImageUrl } from "@/lib/resolve-image-url"

export function ProductDetailsTab() {
  const {
    formData,
    handleInputChange,
    handleArrayChange,
    addArrayItem,
    removeArrayItem
  } = useProductForm()
  const thumbnail = Array.isArray(formData.images) ? (formData.images[0] || "") : ""
  const previewImageSrc = resolveImageUrl(thumbnail) || thumbnail

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Title and description of your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Ultimate UI Kit"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={5}
                placeholder="Describe your product in detail..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Features</CardTitle>
            <CardDescription>Highlight what makes your product special</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.features.map((feature: string, index: number) => (
              <div key={index} className="flex space-x-2">
                <Input
                  value={feature}
                  onChange={(e) => handleArrayChange("features", index, e.target.value)}
                  placeholder="Feature description"
                />
                {formData.features.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem("features", index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => addArrayItem("features")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
            <CardDescription>Main thumbnail for your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={thumbnail}
              onChange={(e) => handleInputChange("images", e.target.value ? [e.target.value] : [])}
              placeholder="https://.../thumbnail.jpg"
            />
            <div className="border rounded-lg overflow-hidden text-center">
              <div className="relative w-full aspect-video bg-gray-50 flex items-center justify-center">
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImageSrc} alt="Product thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="p-8">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600">No thumbnail set</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              placeholder="e.g., Templates, Courses, Assets"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publish Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="publish-status"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
              />
              <Label htmlFor="publish-status">
                {formData.isPublished ? "Published" : "Draft"}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
