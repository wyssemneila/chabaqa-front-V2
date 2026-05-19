"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Plus, X } from "lucide-react"
import { CreatorAdvancedSection } from "@/components/creator-dashboard/create-flow"

const categories = [
  "General",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Design",
  "Marketing",
  "Business",
  "Photography",
  "Music",
]

const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"]

interface PricingDetailsStepProps {
  formData: {
    price: string
    currency: string
    duration: string
    category: string
    level: string
    learningObjectives: string[]
    requirements: string[]
  }
  handleInputChange: (field: string, value: any) => void
  handleArrayChange: (field: string, index: number, value: string) => void
  addArrayItem: (field: string) => void
  removeArrayItem: (field: string, index: number) => void
  validationErrors?: Record<string, boolean>
}

export function PricingDetailsStep({
  formData,
  handleInputChange,
  handleArrayChange,
  addArrayItem,
  removeArrayItem,
  validationErrors = {},
}: PricingDetailsStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Coins className="h-5 w-5 mr-2 text-courses-500" />
          Course Details
        </CardTitle>
        <CardDescription>These details improve discovery, but the course draft can be saved without perfect polish</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-gray-50 p-4">
          <Label className="text-sm font-medium">Pricing mode</Label>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={Number(formData.price || 0) === 0 ? "default" : "outline"}
              onClick={() => handleInputChange("price", "0")}
              className={Number(formData.price || 0) === 0 ? "bg-courses-500 hover:bg-courses-600" : ""}
            >
              Free course
            </Button>
            <Button
              type="button"
              variant={Number(formData.price || 0) > 0 ? "default" : "outline"}
              onClick={() => {
                if (Number(formData.price || 0) === 0) handleInputChange("price", "")
              }}
              className={Number(formData.price || 0) > 0 ? "bg-courses-500 hover:bg-courses-600" : ""}
            >
              Paid course
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">Course Price</Label>
            <div className="flex">
              <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
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
                placeholder="0"
                className={validationErrors.price ? "rounded-l-none border-red-500 focus-visible:ring-red-500" : "rounded-l-none"}
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />
            </div>
            {validationErrors.price && (
              <p className="text-sm text-red-500">Please enter a valid price</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration</Label>
            <Input
              id="duration"
              placeholder="e.g., 10 hours"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className={validationErrors.category ? "border-red-500" : ""}>
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
            {validationErrors.category && (
              <p className="text-sm text-red-500">Please select a category</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Difficulty Level</Label>
            <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
              <SelectTrigger className={validationErrors.level ? "border-red-500" : ""}>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.level && (
              <p className="text-sm text-red-500">Please select a difficulty level</p>
            )}
          </div>
        </div>

        <CreatorAdvancedSection
          title="Learning outcomes"
          description="Optional for drafts. Add these when you want the course page to explain the value more clearly."
          status={formData.learningObjectives.some((objective) => objective.trim()) ? "Added" : "Optional"}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>What will members learn?</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("learningObjectives")}>
                <Plus className="h-4 w-4 mr-1" />
                Add Objective
              </Button>
            </div>
            {formData.learningObjectives.map((objective, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  placeholder="e.g., Build responsive websites with HTML, CSS, and JavaScript"
                  value={objective}
                  onChange={(e) => handleArrayChange("learningObjectives", index, e.target.value)}
                  className={validationErrors.learningObjectives && !objective.trim() ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {formData.learningObjectives.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem("learningObjectives", index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {validationErrors.learningObjectives && (
              <p className="text-sm text-red-500">Add a learning objective or remove the empty row</p>
            )}
          </div>
        </CreatorAdvancedSection>

        <CreatorAdvancedSection
          title="Requirements"
          description="Optional prerequisites members should know before starting."
          status={formData.requirements.some((requirement) => requirement.trim()) ? "Added" : "Optional"}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>Course Requirements</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("requirements")}>
                <Plus className="h-4 w-4 mr-1" />
                Add Requirement
              </Button>
            </div>
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  placeholder="e.g., Basic computer skills and internet access"
                  value={requirement}
                  onChange={(e) => handleArrayChange("requirements", index, e.target.value)}
                />
                {formData.requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem("requirements", index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CreatorAdvancedSection>
      </CardContent>
    </EnhancedCard>
  )
}
