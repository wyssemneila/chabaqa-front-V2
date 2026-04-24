"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Plus, X } from "lucide-react"

const categories = [
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
          Pricing & Course Details
        </CardTitle>
        <CardDescription>Set your course price and additional details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">Course Price *</Label>
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
                placeholder="99"
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
            <Label htmlFor="category">Category *</Label>
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
            <Label htmlFor="level">Difficulty Level *</Label>
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>What will students learn? *</Label>
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
            <p className="text-sm text-red-500">Please add at least one learning objective</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
      </CardContent>
    </EnhancedCard>
  )
}