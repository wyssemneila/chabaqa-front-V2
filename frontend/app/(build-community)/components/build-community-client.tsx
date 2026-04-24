"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  Play,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { communitiesApi, type CreateCommunityData } from "@/lib/api/communities.api"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"
import { storageApi } from "@/lib/api"

export default function CommunityPage() {
  const router = useRouter()
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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

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

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true)
    try {
      const response = await storageApi.upload(file)
      if (response && response.url) {
        updateFormData("logo", response.url)
      }
    } catch (err) {
      console.error("Error uploading logo:", err)
      setError("Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  // Handle cover image upload
  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true)
    try {
      const response = await storageApi.upload(file)
      if (response && response.url) {
        updateFormData("coverImage", response.url)
      }
    } catch (err) {
      console.error("Error uploading cover:", err)
      setError("Failed to upload cover image")
    } finally {
      setUploadingCover(false)
    }
  }

  // Submit community to backend using typed API client
  const submitCommunity = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // Map form data to API format matching backend DTO exactly
      const communityData: CreateCommunityData = {
        // Required fields
        name: formData.name,
        country: formData.country,
        status: formData.status as 'public' | 'private',
        joinFee: formData.joinFee as 'free' | 'paid',
        feeAmount: formData.feeAmount,
        currency: formData.currency as 'USD' | 'TND' | 'EUR',
        socialLinks: formData.socialLinks,

        // Optional fields using backend DTO field names
        bio: formData.bio || undefined, // Backend expects 'bio', not 'description'
        logo: formData.logo || undefined,
        coverImage: formData.coverImage || undefined,
        category: 'General',
        tags: [],
      }

      // Call API using typed client
      const response = await communitiesApi.create(communityData)

      if (response.success) {
        setSuccess(true)
        console.log("Community created successfully:", response.data)

        // If the backend returned a new token (role upgrade), apply it immediately
        // Note: BuildCommunityClient doesn't have access to AuthContext directly here 
        // because it's not using the hook, but we can handle it or let the next page load handle it.
        if (response.accessToken && response.user) {
          localStorage.setItem('accessToken', response.accessToken)
          localStorage.setItem('user', JSON.stringify(response.user))
        }

        // Redirect to community selector after short delay
        setTimeout(() => {
          router.push('/creator/dashboard')
        }, 1500)
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
        // Vérifier si les champs de l'étape 2 sont valides
        if (formData.joinFee === "paid") {
          return formData.feeAmount && parseFloat(formData.feeAmount) > 0
        }
        return true
      case 3:
        // Vérifier qu'au moins un réseau social est renseigné
        const socialLinks = formData.socialLinks
        return Object.values(socialLinks).some(link => link.trim() !== "")
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Name your community</h2>
              <p className="text-gray-600 mb-6">You can always change this later.</p>

              {/* Community Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Community Logo</label>
                <div className="max-w-xs">
                  <ImageUpload
                    currentImage={formData.logo}
                    onImageChange={(url) => updateFormData("logo", url)}
                    aspectRatio="square"
                    maxSize={2}
                    showPreview={true}
                  />
                </div>
              </div>

              {/* Community Cover Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (optional)</label>
                <ImageUpload
                  currentImage={formData.coverImage}
                  onImageChange={(url) => updateFormData("coverImage", url)}
                  aspectRatio="wide"
                  maxSize={5}
                  showPreview={true}
                />
              </div>

              <Input
                placeholder="e.g Creators Club"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className="text-lg py-3 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <Input
                placeholder="e.g Tunis, France, Morocco..."
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                className="text-lg py-3 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio (optional)</label>
              <Textarea
                placeholder="Tell people what your community is about..."
                value={formData.bio}
                onChange={(e) => updateFormData("bio", e.target.value)}
                className="min-h-[120px] border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] resize-none"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Settings</h2>
              <p className="text-gray-600 mb-6">Configure your community access and pricing.</p>

              <div className="space-y-6">
                {/* Status Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">Community Status</label>
                  <RadioGroup
                    value={formData.status}
                    onValueChange={(value) => updateFormData("status", value)}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="public" id="public" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Label htmlFor="public" className="text-base font-medium cursor-pointer">
                            Public
                          </Label>
                          <p className="text-sm text-gray-500">Anyone can find and join your community</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="private" id="private" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Label htmlFor="private" className="text-base font-medium cursor-pointer">
                            Private
                          </Label>
                          <p className="text-sm text-gray-500">Only invited members can join</p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Join Fee Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">Join Fee</label>
                  <RadioGroup
                    value={formData.joinFee}
                    onValueChange={(value) => updateFormData("joinFee", value)}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="free" id="free" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Label htmlFor="free" className="text-base font-medium cursor-pointer">
                            Free
                          </Label>
                          <p className="text-sm text-gray-500">No cost to join your community</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="paid" id="paid" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center community-gradient-btn"
                        >
                          <Coins className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="paid" className="text-base font-medium cursor-pointer">
                            Paid
                          </Label>
                          <p className="text-sm text-gray-500 mb-3">Set a membership fee</p>
                          {formData.joinFee === "paid" && (
                            <div className="space-y-2">
                              <Select value={formData.currency} onValueChange={(value) => updateFormData("currency", value)}>
                                <SelectTrigger className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-2 focus:ring-[#8e78fb] focus:ring-opacity-20 bg-white shadow-sm transition-all duration-200 hover:border-gray-300">
                                  <SelectValue placeholder="Select currency">
                                    {formData.currency === "TND" && "🇹🇳 TND - Tunisian Dinar"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TND">
                                    <div className="flex flex-col">
                                      <span className="font-medium">🇹🇳 TND</span>
                                      <span className="text-sm text-gray-500">Tunisian Dinar</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              <div className="mt-2">
                                <Input
                                  type="number"
                                  placeholder="Montant (ex: 25.50)"
                                  value={formData.feeAmount}
                                  onChange={(e) => updateFormData("feeAmount", e.target.value)}
                                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-2 focus:ring-[#8e78fb] focus:ring-opacity-20 bg-white shadow-sm transition-all duration-200 hover:border-gray-300"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Media Links</h2>
              <p className="text-gray-600 mb-6">Connect your community with social platforms.</p>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="Instagram username or URL"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => updateFormData("socialLinks.instagram", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center">
                    <div className="text-white font-bold text-sm">TT</div>
                  </div>
                  <Input
                    placeholder="TikTok username or URL"
                    value={formData.socialLinks.tiktok}
                    onChange={(e) => updateFormData("socialLinks.tiktok", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center community-gradient-facebook"
                  >
                    <Facebook className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="Facebook page URL"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => updateFormData("socialLinks.facebook", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="YouTube channel URL"
                    value={formData.socialLinks.youtube}
                    onChange={(e) => updateFormData("socialLinks.youtube", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="LinkedIn page URL"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => updateFormData("socialLinks.linkedin", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                    <Globe2 className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="Your website URL"
                    value={formData.socialLinks.website}
                    onChange={(e) => updateFormData("socialLinks.website", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const communities = [
    {
      name: "Fitness Hub",
      members: "2.1k members",
      color: "bg-gradient-to-br from-orange-400 to-orange-600",
      icon: <div className="w-6 h-6 bg-orange-200 rounded opacity-60" />,
    },
    {
      name: "Tech Talks",
      members: "5.2k members",
      color: "bg-gradient-to-br from-teal-400 to-teal-600",
      icon: <div className="w-8 h-8 bg-teal-200 rounded opacity-60" />,
    },
    {
      name: "Art Studio",
      members: "1.8k members",
      color: "bg-gradient-to-br from-pink-400 to-pink-600",
      icon: <div className="w-5 h-5 bg-pink-200 rounded opacity-60" />,
    },
    {
      name: "Music Makers",
      members: "3.1k members",
      color: "bg-gradient-to-br from-amber-400 to-amber-600",
      icon: <div className="w-7 h-7 bg-amber-200 rounded opacity-60" />,
    },
    {
      name: "Book Club",
      members: "2.7k members",
      color: "bg-gradient-to-br from-indigo-400 to-indigo-600",
      icon: <div className="w-6 h-6 bg-indigo-200 rounded opacity-60" />,
    },
    {
      name: "Photography",
      members: "4.3k members",
      color: "bg-gradient-to-br from-purple-400 to-purple-600",
      icon: <Camera className="w-6 h-6 text-purple-200" />,
    },
    {
      name: "Gaming Zone",
      members: "6.8k members",
      color: "bg-gradient-to-br from-green-400 to-green-600",
      icon: <Play className="w-6 h-6 text-green-200" />,
    },
    {
      name: "Cooking Club",
      members: "2.9k members",
      color: "bg-gradient-to-br from-red-400 to-red-600",
      icon: <div className="w-6 h-6 bg-red-200 rounded-full opacity-60" />,
    },
    {
      name: "Travel Stories",
      members: "3.7k members",
      color: "bg-gradient-to-br from-cyan-400 to-cyan-600",
      icon: <div className="w-5 h-5 bg-cyan-200 rounded opacity-60" />,
    },
    {
      name: "Design Hub",
      members: "4.1k members",
      color: "bg-gradient-to-br from-violet-400 to-violet-600",
      icon: <div className="w-6 h-6 bg-violet-200 rounded-lg opacity-60" />,
    },
    {
      name: "Startup Club",
      members: "2.3k members",
      color: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      icon: <div className="w-5 h-5 bg-emerald-200 rounded-full opacity-60" />,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Formulaire à gauche - SANS card */}
          <div className="p-8">
            {/* Logo dans le formulaire */}
            <div className="mb-8">
              <Image
                src="/logo_chabaqa.png"
                alt="Chabaqa Logo"
                width={200}
                height={80}
                sizes="200px"
                className="drop-shadow-md"
                priority
              />
            </div>

            <div className="mb-8">
              {/* Steps */}
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300 ${step === currentStep
                        ? "text-white shadow-lg community-step-active"
                        : step < currentStep
                          ? "text-white community-step-active"
                          : "bg-gray-200 text-gray-500"
                        }`}
                    >
                      {step < currentStep ? <Check className="w-4 h-4" /> : step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${step < currentStep ? "community-step-connector-active" : "bg-gray-200"
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="mb-8">
              {/* Messages d'erreur ou de succès */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 text-sm">Votre communauté a été créée avec succès!</p>
                </div>
              )}

              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                {currentStep > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}

                <Button
                  onClick={currentStep === 3 ? submitCommunity : nextStep}
                  disabled={!canContinue() || isSubmitting}
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 ${canContinue() && !isSubmitting
                    ? "shadow-lg hover:shadow-xl hover:scale-105 community-button-active"
                    : "opacity-50 cursor-not-allowed community-button-inactive"
                    }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      En cours...
                    </div>
                  ) : currentStep === 3 ? "Create Community" : "Continue"}
                  {currentStep < 3 && !isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Grille de communautés à droite - AVEC card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-3 gap-3">
              {communities.map((community, index) => (
                <Card
                  key={index}
                  className={`${community.color} border-0 text-white cursor-pointer hover:scale-105 transition-transform duration-200 ${index === 1 ? "row-span-2 col-span-1" : "aspect-square"
                    }`}
                >
                  <CardContent className="p-4 h-full flex flex-col justify-between relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-2 right-2 opacity-30">{community.icon}</div>
                    <div className="absolute top-4 right-8 w-3 h-3 bg-white rounded-full opacity-20" />
                    <div className="absolute bottom-8 right-4 w-2 h-2 bg-white rounded opacity-20" />

                    {/* Play button for first card */}
                    {index === 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    <div className="mt-auto">
                      <h3 className="font-semibold text-lg mb-1">{community.name}</h3>
                      <p className="text-sm opacity-90">{community.members}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}