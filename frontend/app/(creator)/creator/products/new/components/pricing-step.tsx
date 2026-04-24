"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, X, Coins, Codesandbox } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useProductForm } from "./product-form-context"
import { Textarea } from "@/components/ui/textarea"
export function PricingStep() {
  const {
    formData,
    errors,
    handleInputChange,
    addVariant,
    updateVariant,
    removeVariant,
  } = useProductForm()

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Coins className="h-5 w-5 mr-2 text-primary-500" />
          Pricing & Variants
        </CardTitle>
        <CardDescription>Set your product price and options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">Base Price *</Label>
            <div className="flex">
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange("currency", value)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="price"
                type="number"
                placeholder="29.99"
                className={`rounded-l-none ${errors.price ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                value={formData.price}
                onChange={(e) => handleInputChange("price", Number(e.target.value))}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-red-500 mt-1">{errors.price}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Product Variants</Label>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="h-4 w-4 mr-1" />
              Add Variant
            </Button>
          </div>

          {formData.variants.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <Codesandbox className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No variants added yet</p>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" />
                Add First Variant
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.variants.map((variant: any, index: number) => (
                <div
                  key={variant.id}
                  className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Variant {index + 1}
                      </Badge>
                      <span className="font-medium">{variant.name || `Variant ${index + 1}`}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(variant.id)}
                      className="text-red-500 hover:text-red-700 h-8 w-8"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Variant Name *</Label>
                      <Input
                        placeholder="e.g., Standard License"
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, "name", e.target.value)}
                        className={`h-8 text-sm ${errors[`variant_${variant.id}_name`] ? "border-red-500" : ""}`}
                      />
                      {errors[`variant_${variant.id}_name`] && (
                        <p className="text-xs text-red-500">{errors[`variant_${variant.id}_name`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price *</Label>
                      <Input
                        type="number"
                        placeholder="29.99"
                        value={variant.price}
                        onChange={(e) => updateVariant(variant.id, "price", Number(e.target.value))}
                        className={`h-8 text-sm ${errors[`variant_${variant.id}_price`] ? "border-red-500" : ""}`}
                      />
                      {errors[`variant_${variant.id}_price`] && (
                        <p className="text-xs text-red-500">{errors[`variant_${variant.id}_price`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      placeholder="Describe what's included in this variant..."
                      value={variant.description || ""}
                      onChange={(e) => updateVariant(variant.id, "description", e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
