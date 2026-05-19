"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { communitiesApi, type CreateCommunityData } from "@/lib/api/communities.api"
import { useAuthContext } from "@/app/providers/auth-provider"
import { StepBasicInfo } from "./step-basic-info"
import { StepCommunitySettings } from "./step-community-settings"
import { PrivateCommunitySuccess } from "./private-community-success"

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

  const hasValidMainLink = () => {
    const value = formData.socialLinks.website.trim()
    if (!value) return false
    try {
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
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
        return formData.name.trim() !== "" && formData.country.trim() !== "" && hasValidMainLink()
      case 2:
        if (formData.joinFee === "paid") {
          return formData.feeAmount && parseFloat(formData.feeAmount) > 0
        }
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canContinue() && currentStep < 2) {
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
        return <StepBasicInfo formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepCommunitySettings formData={formData} updateFormData={updateFormData} />
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
      <PrivateCommunitySuccess
        createdCommunity={createdCommunity}
        inviteCopied={inviteCopied}
        onCopyInviteLink={handleCopyInviteLink}
      />
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(backUrl)}
          className="mb-5 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>

        <div className="max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-950 leading-tight">Create Community</h1>
          <p className="text-sm text-gray-600 mt-2">Set up the required basics now. Branding and social polish can come after creation.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 mb-8">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors ${step === currentStep
                ? "bg-chabaqa-primary text-white"
                : step < currentStep
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-500"
                }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < 2 && (
              <div
                className={`h-px mx-2 md:mx-4 transition-colors w-10 md:w-20 ${step < currentStep ? "bg-emerald-600" : "bg-gray-200"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 text-sm font-medium">
          Your community has been created successfully. Redirecting...
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
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
          onClick={currentStep === 2 ? submitCommunity : nextStep}
          disabled={!canContinue() || isSubmitting}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${canContinue() && !isSubmitting
            ? "bg-chabaqa-primary hover:bg-chabaqa-primary/90 text-white"
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
          ) : currentStep === 2 ? (
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
