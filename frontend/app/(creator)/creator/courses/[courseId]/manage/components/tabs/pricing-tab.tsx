"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Course } from "@/lib/models"

interface PricingTabProps {
  formData: any
  course: Course
  onInputChange: (field: string, value: any) => void
}

export function PricingTab({ formData, course, onInputChange }: PricingTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Course Pricing</CardTitle>
          <CardDescription>Set the main course price and currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coursePrice">Course Price</Label>
            <div className="flex">
              <Select value={formData.currency} onValueChange={(value) => onInputChange("currency", value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="coursePrice"
                type="number"
                className="rounded-l-none"
                placeholder="199"
                value={formData.price}
                onChange={(e) => onInputChange("price", e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Set to 0 for a free course. Students will have access to all non-premium chapters.
            </p>
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Chapter Pricing</CardTitle>
          <CardDescription>Individual chapter pricing overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(course.sections || []).map((section) =>
              section.chapters
                .filter((chapter) => chapter.price)
                .map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{chapter.title}</h4>
                      <p className="text-sm text-muted-foreground">{section.title}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {chapter.price} TND
                    </Badge>
                  </div>
                )),
            )}
            {(course.sections || []).every((s) => s.chapters.every((c) => !c.price)) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No individual chapter pricing set. All paid content is included in the main course price.
              </p>
            )}
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}