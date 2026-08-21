"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Tag, Users, Star, Loader2, ShieldCheck, Percent } from "lucide-react"
import { communitiesApi } from "@/lib/api"
import type { CommunityThemeTokens } from "@/lib/community-theme"
import { PaymentProviderModal } from "@/components/payment-provider-modal"
import { usePaymentProviderModal } from "@/lib/hooks/use-payment-provider-modal"
import { Label } from "@/components/ui/label"
import { creatorIntegrationsApi, type ContactConsentOption } from "@/lib/api/creator-integrations.api"

interface CheckoutFormProps {
  community: any
  embedded?: boolean
  themeTokens?: CommunityThemeTokens
  inviteCode?: string
}

export function CheckoutForm({
  community,
  embedded = false,
  themeTokens,
  inviteCode,
}: CheckoutFormProps) {
  const router = useRouter()

  const [promoCode, setPromoCode] = useState("")
  const [promoError, setPromoError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [contactConsentOptions, setContactConsentOptions] = useState<ContactConsentOption[]>([])
  const [selectedContactConsents, setSelectedContactConsents] = useState<Record<string, boolean>>({})

  const pricing = community as any
  const normalizedInviteCode = typeof inviteCode === "string" ? inviteCode.trim() : ""

  const paymentModal = usePaymentProviderModal({
    initStripe: (key) => (communitiesApi as any).initStripePayment(
      community?.id,
      promoCode || undefined,
      normalizedInviteCode || undefined,
      key,
    ),
  })

  const isPrivateCommunity =
    typeof pricing?.isPrivate === "boolean"
      ? pricing.isPrivate
      : pricing?.settings && typeof pricing.settings === "object"
        ? pricing.settings.visibility === "private"
        : false
  const gradient = themeTokens?.gradient || "linear-gradient(90deg, #8e78fb, #f48fb1)"
  const primary = themeTokens?.primary || "#8e78fb"
  const mutedBorder = themeTokens?.mutedBorder

  useEffect(() => {
    const communityId = String(community?.id || community?._id || "")
    if (!communityId) return
    creatorIntegrationsApi.contactConsentOptionsForCommunity(communityId)
      .then((response: any) => {
        const options = response?.data || response || []
        setContactConsentOptions(Array.isArray(options) ? options : [])
        // Consent must always be an explicit checkout choice, never preselected.
        setSelectedContactConsents({})
      })
      .catch(() => setContactConsentOptions([]))
  }, [community?.id, community?._id])

  const saveSelectedContactConsents = async () => {
    const selected = contactConsentOptions.filter((option) => selectedContactConsents[`${option.communityId}:${option.provider}`])
    await Promise.all(selected.map((option) => creatorIntegrationsApi.setContactConsent({
      provider: option.provider,
      communityId: option.communityId,
      policyVersion: option.policyVersion,
      granted: true,
    })))
  }

  const basePrice = useMemo(() => {
    const toNumber = (value: unknown): number => {
      if (typeof value === "number") return Number.isFinite(value) ? value : 0
      if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
      }
      return 0
    }

    return toNumber(pricing?.pricing?.price ?? pricing?.fees_of_join ?? pricing?.price)
  }, [pricing])

  const currency: string = useMemo(() => {
    return (
      pricing?.pricing?.currency ||
      pricing?.currency ||
      "TND"
    )
  }, [pricing])

  const discountAmount = 0

  const total = useMemo(() => {
    return Math.max(basePrice - discountAmount, 0)
  }, [basePrice])

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "TND"
      }).format(amount)
    } catch {
      return `${amount.toFixed(2)} ${currency || "TND"}`
    }
  }

  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const getAuthHeaderToken = () => {
    if (typeof window === "undefined") return null
    const rawLocalToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token")

    if (!rawLocalToken) return null
    return rawLocalToken.toLowerCase().startsWith("bearer ")
      ? rawLocalToken
      : `Bearer ${rawLocalToken}`
  }

  const handleCompletePurchase = async () => {
    if (isProcessing) return

    if (!community?.id) {
      setError("Missing community information")
      return
    }

    if (isPrivateCommunity && !normalizedInviteCode) {
      setError("This private community requires a valid invitation link.")
      return
    }

    setError(null)
    setPromoError(null)

    try {
      await saveSelectedContactConsents()
    } catch (err: any) {
      setError(err?.message || "Unable to save your marketing consent. Please try again.")
      return
    }

    // For paid communities, open the payment provider modal
    if (basePrice > 0) {
      paymentModal.open()
      return
    }

    // For free communities, join directly
    setIsProcessing(true)

    try {
      const result = await communitiesApi.join({
        ...(normalizedInviteCode ? { inviteCode: normalizedInviteCode } : { communityId: community.id }),
      })

      const message = (result.message || "").toLowerCase()

      if (message.includes("déjà") || message.includes("already")) {
        setAlreadyMember(true)
        setSuccess(true)
        setTimeout(() => {
          router.push(`/community/${community.slug}/home?joined=1`)
        }, 2000)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/community/${community.slug}/home?joined=1`)
      }, 2000)
    } catch (err: any) {
      console.error("Checkout error:", err)
      const rawMsg = typeof err?.message === 'string'
        ? err.message
        : err?.message?.message || err?.error?.message || err?.error || "";
      const msg = String(rawMsg).toLowerCase();

      if (msg.includes("authentication") || msg.includes("unauthorized") || msg.includes("login")) {
        if (typeof window !== "undefined") {
          const returnPath = `${window.location.pathname}${window.location.search || ""}`
          const returnUrl = encodeURIComponent(returnPath)
          router.push(`/signin?redirect=${returnUrl}&returnUrl=${returnUrl}`)
          return
        }
      }

      if (msg.includes("promo")) {
        setPromoError(err.message || "Invalid promo code")
        return
      }

      if (msg.includes("déjà") || msg.includes("already")) {
        setAlreadyMember(true)
        setSuccess(true)
        setTimeout(() => {
          router.push(`/community/${community.slug}/home?joined=1`)
        }, 2000)
        return
      }

      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBackToCommunity = () => {
    if (embedded) {
      // In embedded mode, we might want to just close the modal via event or direct prop
      // For now, if it's the modal, we don't necessarily want to navigate away
      return
    }
    router.push(`/community/${community.slug}`)
  }

  return (
    <>
      <PaymentProviderModal
        open={paymentModal.isOpen}
        onOpenChange={paymentModal.close}
        onSelect={paymentModal.handleSelect}
        isLoading={paymentModal.isLoading}
        error={paymentModal.error}
      />
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left Column - Community Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!embedded && (
            <button
              type="button"
              onClick={handleBackToCommunity}
              className="inline-flex items-center text-sm text-gray-600 hover:text-chabaqa-primary transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </button>
          )}

          <div className={`flex flex-col sm:flex-row gap-4 ${embedded ? 'items-center sm:items-start text-center sm:text-left' : ''}`}>
            <div className={`relative flex-shrink-0 ${embedded ? 'h-24 w-24' : 'h-32 w-32'}`}>
              <Image
                src={community.logo || community.image || "/placeholder.svg"}
                alt={`${community.name} logo`}
                fill
                className="object-cover rounded-2xl border-4 border-white shadow-md"
                unoptimized
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1
                className={`${embedded ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'} font-black tracking-tight bg-clip-text text-transparent`}
                style={{ backgroundImage: gradient }}
              >
                {community.name}
              </h1>
              <p className="text-gray-500 text-base font-normal leading-normal">
                @{community.slug}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {community.creator?.avatar && (
                  <Image
                    src={community.creator.avatar}
                    alt={`Avatar of ${community.creator.name}`}
                    width={24}
                    height={24}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <p className="text-gray-500 text-sm font-normal leading-normal">
                  Created by {community.creator?.name || "Unknown"}
                </p>
                {community.creator?.verified && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
                <Badge className="ml-1 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Secure checkout
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-chabaqa-primary/10 px-3">
              <Tag className="w-4 h-4" style={{ color: primary }} />
              <p className="text-sm font-medium leading-normal" style={{ color: primary }}>
                {community.category}
              </p>
            </div>
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-chabaqa-primary/10 px-3">
              <Users className="w-4 h-4" style={{ color: primary }} />
              <p className="text-sm font-medium leading-normal" style={{ color: primary }}>
                {formatMembers(Array.isArray(community.members) ? community.members.length : (community.members || 0))} Members
              </p>
            </div>
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-chabaqa-primary/10 px-3">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <p className="text-sm font-medium leading-normal" style={{ color: primary }}>
                {Number(community.rating || 0).toFixed(1)}/5 Rating
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What you get</h2>
            <p className="text-gray-600 text-base font-normal leading-relaxed mb-3">
              Your membership unlocks premium channels, exclusive resources, and direct access to the community creator.
            </p>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
              <li>Access to members-only discussions and events</li>
              <li>Exclusive content, resources, and templates</li>
              <li>Creator feedback from the community</li>
              <li>Early access to new features and challenges</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Checkout */}
        <div className="lg:col-span-1 lg:sticky top-16 h-fit">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200" style={{ borderColor: mutedBorder || undefined }}>
            <h2 className="text-gray-900 text-2xl font-bold leading-tight tracking-tight">
              Complete your purchase
            </h2>


            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Membership price</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(basePrice)}</p>
              </div>
              <Badge className="bg-chabaqa-primary/10 border flex items-center gap-1" style={{ color: primary, borderColor: mutedBorder || undefined }}>
                <Percent className="w-3 h-3" />
                Backend-verified total
              </Badge>
            </div>

            <div className="mb-4">
              <Label htmlFor="promo" className="block text-sm font-medium text-gray-900 mb-1">
                Promo code (optional)
              </Label>
              <div className="flex gap-2">
                <input
                  id="promo"
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value)
                    setPromoError(null)
                  }}
                  placeholder="Enter promo code"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chabaqa-primary focus:border-chabaqa-primary bg-white"
                  style={{ borderColor: mutedBorder || undefined }}
                  disabled={isProcessing || success}
                />
              </div>
              {promoError && (
                <p className="mt-1 text-xs text-red-600">{promoError}</p>
              )}
            </div>

            <div className="mb-6 rounded-lg bg-white border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span>Community access</span>
                <span>{formatCurrency(basePrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Promo discount</span>
                <span className="text-emerald-600">-{formatCurrency(discountAmount)}</span>
              </div>
              <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
                Creator transaction fees are calculated by the backend from the creator plan and are not added as a separate buyer fee here.
              </p>
              <div className="border-t border-dashed border-gray-200 pt-3 mt-2 flex items-center justify-between font-semibold">
                <span>Total due today</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {contactConsentOptions.length > 0 && !success && (
              <fieldset className="mb-6 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <legend className="px-1 text-sm font-semibold text-amber-950">Optional marketing updates</legend>
                <p className="text-xs text-amber-900">Choose separately for each provider. Nothing is selected by default, and you can withdraw consent later in Settings.</p>
                {contactConsentOptions.map((option) => {
                  const key = `${option.communityId}:${option.provider}`
                  const providerName = option.provider === "kit" ? "Kit" : "Brevo"
                  return <label key={key} className="flex cursor-pointer items-start gap-2 text-xs text-amber-950">
                    <input
                      type="checkbox"
                      checked={selectedContactConsents[key] === true}
                      onChange={(event) => setSelectedContactConsents((current) => ({ ...current, [key]: event.target.checked }))}
                    />
                    <span>I agree that {option.communityName} may share my contact details with {providerName} for updates and offers under policy version {option.policyVersion}.</span>
                  </label>
                })}
              </fieldset>
            )}

            {basePrice > 0 && !success && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Instant Access
                </p>
                <p className="mt-1 opacity-90">Pay securely with your credit/debit card and get instant access to the community.</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  {alreadyMember
                    ? "You are already a member of this community. Redirecting to community..."
                    : "Successfully joined! Redirecting to your community..."}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleCompletePurchase}
                disabled={isProcessing || success}
                className="w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-[1.02] flex items-center justify-center disabled:bg-opacity-70 disabled:cursor-wait"
                style={{ backgroundImage: gradient, color: themeTokens?.primaryText || "#fff" }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    <span>{basePrice <= 0 ? 'Joining...' : 'Processing...'}</span>
                  </>
                ) : success ? (
                  <span>{basePrice <= 0 ? 'Joined ✓' : 'Redirecting...'}</span>
                ) : (
                  <span>{basePrice <= 0 ? 'Join Community (Free)' : 'Complete Purchase'}</span>
                )}
              </Button>
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              By completing this purchase, you agree to the community rules,{" "}
              <Link href="/terms-of-service" className="underline hover:text-gray-700">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy-policy" className="underline hover:text-gray-700">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
