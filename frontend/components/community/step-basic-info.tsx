"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"

interface StepBasicInfoProps {
  formData: {
    name: string
    bio: string
    country: string
    logo: string
    coverImage: string
  }
  updateFormData: (field: string, value: any) => void
}

export function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Name your community</h2>
        <p className="text-gray-600">You can always change these details later.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-4">Community Logo *</label>
          <div className="bg-gray-50 rounded-2xl p-6">
            <ImageUpload
              currentImage={formData.logo}
              onImageChange={(url) => updateFormData("logo", url)}
              aspectRatio="square"
              maxSize={2}
              showPreview={true}
            />
            <p className="text-xs text-gray-500 mt-4">Up to 2MB, Square format recommended (1:1)</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Community Name *</label>
            <Input
              placeholder="e.g Creators Club, Digital Pioneers"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className="text-lg py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-0 focus:ring-[#8e78fb] transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">Choose a name that represents your community</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Country *</label>
            <Input
              placeholder="e.g Tunisia, France, Morocco"
              value={formData.country}
              onChange={(e) => updateFormData("country", e.target.value)}
              className="text-lg py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-0 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Cover Image (optional)</label>
        <ImageUpload
          currentImage={formData.coverImage}
          onImageChange={(url) => updateFormData("coverImage", url)}
          aspectRatio="wide"
          maxSize={5}
          showPreview={true}
        />
        <p className="text-xs text-gray-500 mt-4">Up to 5MB, Landscape format recommended (16:9)</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Bio (optional)</label>
        <Textarea
          placeholder="Tell people what your community is about. What value does it provide? Who should join?"
          value={formData.bio}
          onChange={(e) => updateFormData("bio", e.target.value)}
          className="min-h-[140px] text-base px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-0 transition-colors resize-none"
        />
        <p className="text-xs text-gray-500 mt-2">{formData.bio.length}/500 characters</p>
      </div>
    </div>
  )
}
