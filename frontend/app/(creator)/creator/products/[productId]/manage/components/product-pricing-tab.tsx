"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useProductForm } from "./product-form-context"

export function ProductPricingTab() {
  const { formData, handleInputChange } = useProductForm()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Set your product price</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Price (TND)</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange("price", Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License Terms</CardTitle>
          <CardDescription>Define how customers can use your product</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.licenseTerms}
            onChange={(e) => handleInputChange("licenseTerms", e.target.value)}
            rows={6}
            placeholder="Example: This product is licensed for personal use only. Commercial use requires additional permission..."
          />
        </CardContent>
      </Card>
    </div>
  )
}