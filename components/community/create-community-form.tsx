"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Lock,
  Globe,
  Coins,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Check,
  Globe2,
  Copy,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { communitiesApi, type CreateCommunityData } from "@/lib/api/communities.api"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"
import { useAuthContext } from "@/app/providers/auth-provider"

interface CreateCommunityFormProps {
  onSuccess?: (communityId: string) => void
  backUrl?: string
  backLabel?: string
}

export function CreateCommunityForm({ 
  onSuccess, 
  backUrl = "/dashboard", 
  backLabel = "Back to Dashboard" 
}: CreateCommunityFormProps) {
  const router = useRouter()
  const { updateAuth } = useAuthContext()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    country: "",
    logo: "",
    coverImage: "",
    status: "public",
    joinFee: "free",
    feeAmount: "0",
    currency: "TND",
    socialLinks: {
      instagram: "",
      tiktok: "",
      facebook: "",
      youtube: "",
      linkedin: "",
      website: "",
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [createdCommunity, setCreatedCommunity] = useState<{
    id: string
    slug: string
    name: string
    isPrivate: boolean
    inviteLink?: string
  } | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)

  const updateFormData = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const submitCommunity = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      const communityData: CreateCommunityData = {
        name: formData.name,
        country: formData.country,
        status: formData.status as 'public' | 'private',
        joinFee: formData.joinFee as 'free' | 'paid',
        feeAmount: formData.feeAmount,
        currency: formData.currency as 'USD' | 'TND' | 'EUR',
        socialLinks: formData.socialLinks,
        bio: formData.bio || undefined,
        logo: formData.logo || undefined,
        coverImage: formData.coverImage || undefined,
        category: 'General',
        tags: [],
      }

      const response = await communitiesApi.create(communityData)

      if (response.success) {
        setSuccess(true)
        
        // If the backend returned a new token (role upgrade), apply it immediately
        if (response.accessToken && response.user) {
          updateAuth(response.accessToken, response.user)
        }

        const newCommunity = response.data as any
        const newCommunityId = newCommunity?._id || newCommunity?.id
        const isPrivate =
          typeof newCommunity?.isPrivate === "boolean"
            ? Boolean(newCommunity.isPrivate)
            : newCommunity?.settings?.visibility === "private"
        setCreatedCommunity({
          id: String(newCommunityId || ""),
          slug: String(newCommunity?.slug || ""),
          name: String(newCommunity?.name || formData.name),
          isPrivate,
          inviteLink:
            typeof newCommunity?.inviteLink === "string" ? newCommunity.inviteLink : undefined,
        })

        if (!isPrivate && onSuccess && newCommunityId) {
          onSuccess(newCommunityId)
        } else if (!isPrivate) {
          // Default redirect to creator dashboard
          setTimeout(() => {
            router.push('/creator/dashboard')
          }, 1500)
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create community. Please try again.")
      console.error("Error creating community:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== "" && formData.country.trim() !== ""
      case 2:
        if (formData.joinFee === "paid") {
          return formData.feeAmount && parseFloat(formData.feeAmount) > 0
        }
        return true
      case 3:
        const socialLinks = formData.socialLinks
        return Object.values(socialLinks).some(link => link && link.trim() !== "")
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canContinue() && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
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

      case 2:
        return (
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Community Settings</h2>
              <p className="text-gray-600">Configure access control and pricing options.</p>
            </div>

            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-8">
              <label className="block text-lg font-bold text-gray-900 mb-6">Community Status</label>
              <RadioGroup
                value={formData.status}
                onValueChange={(value) => updateFormData("status", value)}
                className="space-y-4"
              >
                <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.status === "public" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <RadioGroupItem value="public" id="public" className="w-5 h-5 text-[#8e78fb]" />
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="public" className="text-base font-semibold cursor-pointer text-gray-900">Public</Label>
                      <p className="text-sm text-gray-600 mt-1">Anyone can discover and join your community</p>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.status === "private" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <RadioGroupItem value="private" id="private" className="w-5 h-5 text-[#8e78fb]" />
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="private" className="text-base font-semibold cursor-pointer text-gray-900">Private</Label>
                      <p className="text-sm text-gray-600 mt-1">Only members you invite can access</p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-8">
              <label className="block text-lg font-bold text-gray-900 mb-6">Membership Fee</label>
              <RadioGroup
                value={formData.joinFee}
                onValueChange={(value) => updateFormData("joinFee", value)}
                className="space-y-4"
              >
                <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.joinFee === "free" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <RadioGroupItem value="free" id="free" className="w-5 h-5 text-[#8e78fb]" />
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="free" className="text-base font-semibold cursor-pointer text-gray-900">Free Community</Label>
                      <p className="text-sm text-gray-600 mt-1">Everyone can join without paying</p>
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.joinFee === "paid" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem value="paid" id="paid" className="w-5 h-5 text-[#8e78fb]" />
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Coins className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="paid" className="text-base font-semibold cursor-pointer text-gray-900">Paid Community</Label>
                        <p className="text-sm text-gray-600 mt-1">Members pay a fee to join</p>
                      </div>
                    </div>
                  </div>
                  {formData.joinFee === "paid" && (
                    <div className="mt-6 ml-14 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Currency</label>
                        <Select value={formData.currency} onValueChange={(value) => updateFormData("currency", value)}>
                          <SelectTrigger className="border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-0">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TND">🇹🇳 TND - Tunisian Dinar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Entry Fee Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 25.50"
                          value={formData.feeAmount}
                          onChange={(e) => updateFormData("feeAmount", e.target.value)}
                          className="border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-0"
                        />
                        <p className="text-xs text-gray-500 mt-2">Members must pay this amount to join your community</p>
                      </div>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Social Media Links</h2>
              <p className="text-gray-600">Connect your community with social platforms. (At least one is required)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: "instagram", icon: Instagram, color: "from-pink-400 to-pink-600", label: "Instagram" },
                { id: "tiktok", icon: null, color: "from-black to-gray-800", label: "TikTok", text: "TT" },
                { id: "facebook", icon: Facebook, color: "from-blue-500 to-blue-700", label: "Facebook" },
                { id: "youtube", icon: Youtube, color: "from-red-500 to-red-600", label: "YouTube" },
                { id: "linkedin", icon: Linkedin, color: "from-blue-600 to-blue-700", label: "LinkedIn" },
                { id: "website", icon: Globe2, color: "from-gray-500 to-gray-700", label: "Website" },
              ].map((social) => (
                <div key={social.id} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#8e78fb] transition-all">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${social.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {social.icon ? <social.icon className="w-6 h-6 text-white" /> : <div className="text-white font-bold text-sm">{social.text}</div>}
                    </div>
                    <label className="block text-sm font-semibold text-gray-900">{social.label}</label>
                  </div>
                  <Input
                    placeholder={`Your ${social.label} ${social.id === "website" ? "URL" : "username"}`}
                    value={(formData.socialLinks as any)[social.id]}
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

      default:
        return null
    }
  }

  const handleCopyInviteLink = async () => {
    if (!createdCommunity?.inviteLink) return
    try {
      await navigator.clipboard.writeText(createdCommunity.inviteLink)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 1800)
    } catch {
      setError("Unable to copy invite link. Please copy it manually.")
    }
  }

  if (success && createdCommunity?.isPrivate) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900">Private community created</h2>
          <p className="mt-2 text-gray-700">
            Share this invitation link to allow people to join <span className="font-semibold">{createdCommunity.name}</span>.
          </p>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invite link</p>
            <p className="mt-2 break-all text-sm text-gray-800">
              {createdCommunity.inviteLink || "Invite link is being prepared. You can generate it from your communities page."}
            </p>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={handleCopyInviteLink}
              disabled={!createdCommunity.inviteLink}
              className="sm:w-auto"
            >
              <Copy className="w-4 h-4 mr-2" />
              {inviteCopied ? "Copied" : "Copy invite link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/community/${createdCommunity.slug}`)}
              disabled={!createdCommunity.slug}
              className="sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to community
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/creator/communities")}
              className="sm:w-auto"
            >
              Manage communities
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-12">
        <Button
          variant="ghost"
          onClick={() => router.push(backUrl)}
          className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>

        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">Create Your Community</h1>
          <p className="text-lg text-gray-600 mt-4">Build a thriving space for your audience in just 3 steps</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-3 md:gap-4 mb-12">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold transition-all duration-300 shadow-md ${step === currentStep
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105"
                : step < currentStep
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gray-200 text-gray-500"
                }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`h-1 mx-2 md:mx-4 rounded-full transition-all duration-300 w-8 md:w-16 ${step < currentStep ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-200"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-medium">
          ✕ {error}
        </div>
      )}

      {success && (
        <div className="mb-8 p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 text-sm font-medium">
          ✓ Your community has been created successfully! Redirecting...
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10 lg:p-12 mb-10">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        {currentStep > 1 ? (
          <Button 
            variant="outline" 
            onClick={prevStep}
            className="px-8 py-3 rounded-xl font-semibold border-2 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        ) : <div />}

        <Button
          onClick={currentStep === 3 ? submitCommunity : nextStep}
          disabled={!canContinue() || isSubmitting}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${canContinue() && !isSubmitting
            ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:shadow-xl hover:scale-105 text-white"
            : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Community...
            </div>
          ) : currentStep === 3 ? (
            <>
              Create Community
              <Check className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
