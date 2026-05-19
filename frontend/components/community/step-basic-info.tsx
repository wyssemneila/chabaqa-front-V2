"use client"

import { Globe2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface StepBasicInfoProps {
  formData: {
    name: string
    country: string
    socialLinks: {
      website: string
    }
  }
  updateFormData: (field: string, value: any) => void
}

export function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-950">Community basics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Only the required setup fields. Branding can be added after creation.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">Community name</label>
          <Input
            placeholder="e.g. Motion School"
            value={formData.name}
            onChange={(event) => updateFormData("name", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Use the name members will recognize in the dashboard.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">Country</label>
          <Input
            placeholder="e.g. Tunisia"
            value={formData.country}
            onChange={(event) => updateFormData("country", event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">Main link</label>
        <div className="relative">
          <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://your-site.com"
            value={formData.socialLinks.website}
            onChange={(event) => updateFormData("socialLinks.website", event.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">A website, profile, or public page is needed for the current backend community draft.</p>
      </div>
    </div>
  )
}
