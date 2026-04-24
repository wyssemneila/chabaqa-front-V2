"use client"

import { Input } from "@/components/ui/input"
import { Instagram, Facebook, Youtube, Linkedin, Globe2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface SocialLinksData {
  instagram: string
  tiktok: string
  facebook: string
  youtube: string
  linkedin: string
  website: string
}

interface StepSocialLinksProps {
  socialLinks: SocialLinksData
  updateFormData: (field: string, value: any) => void
}

const socialFields: {
  id: keyof SocialLinksData
  icon: LucideIcon | null
  color: string
  label: string
  text?: string
}[] = [
  { id: "instagram", icon: Instagram, color: "from-pink-400 to-pink-600", label: "Instagram" },
  { id: "tiktok", icon: null, color: "from-black to-gray-800", label: "TikTok", text: "TT" },
  { id: "facebook", icon: Facebook, color: "from-blue-500 to-blue-700", label: "Facebook" },
  { id: "youtube", icon: Youtube, color: "from-red-500 to-red-600", label: "YouTube" },
  { id: "linkedin", icon: Linkedin, color: "from-blue-600 to-blue-700", label: "LinkedIn" },
  { id: "website", icon: Globe2, color: "from-gray-500 to-gray-700", label: "Website" },
]

export function StepSocialLinks({ socialLinks, updateFormData }: StepSocialLinksProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Social Media Links</h2>
        <p className="text-gray-600">Connect your community with social platforms. (At least one is required)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialFields.map((social) => (
          <div key={social.id} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#8e78fb] transition-all">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${social.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {social.icon ? <social.icon className="w-6 h-6 text-white" /> : <div className="text-white font-bold text-sm">{social.text}</div>}
              </div>
              <label className="block text-sm font-semibold text-gray-900">{social.label}</label>
            </div>
            <Input
              placeholder={`Your ${social.label} ${social.id === "website" ? "URL" : "username"}`}
              value={socialLinks[social.id]}
              onChange={(e) => updateFormData(`socialLinks.${social.id}`, e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg focus:border-[#8e78fb] focus:ring-0 transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Tip:</span> Adding social links helps members connect with you across platforms and increases community visibility.
        </p>
      </div>
    </div>
  )
}
