"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, Tag, Users, Star, Loader2, ShieldCheck, Percent, UploadCloud } from "lucide-react"
import { communitiesApi } from "@/lib/api"
import type { CommunityThemeTokens } from "@/lib/community-theme"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Wallet } from "lucide-react"

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
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "manual">("stripe")

  const pricing = community as any
  const normalizedInviteCode = typeof inviteCode === "string" ? inviteCode.trim() : ""
  const isPrivateCommunity =
    typeof pricing?.isPrivate === "boolean"
      ? pricing.isPrivate
      : pricing?.settings && typeof pricing.settings === "object"
        ? pricing.settings.visibility === "private"
        : false
  const gradient = themeTokens?.gradient || "linear-gradient(90deg, #8e78fb, #f48fb1)"
  const primary = themeTokens?.primary || "#8e78fb"
  const mutedBorder = themeTokens?.mutedBorder

  const basePrice = useMemo(() => {
    const toNumber = (value: unknown): number => {
      if (typeof value === "number") return Number.isFinite(value) ? value : 0
      if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
      }
      return 0
    }

    const feesOfJoin = toNumber(pricing?.fees_of_join)
    const directPrice = toNumber(pricing?.price)
    const nestedPrice = toNumber(pricing?.pricing?.price)

    // Different endpoints may populate only one price field; use the highest valid value.
    return Math.max(feesOfJoin, directPrice, nestedPrice, 0)
  }, [pricing])

  const currency: string = useMemo(() => {
    return (
      pricing?.pricing?.currency ||
      pricing?.currency ||
      "TND"
    )
  }, [pricing])

  const platformFee = useMemo(() => {
    return Math.round(basePrice * 0.05 * 100) / 100
  }, [basePrice])

  const discountAmount = 0

  const total = useMemo(() => {
    return Math.max(basePrice + platformFee - discountAmount, 0)
  }, [basePrice, platformFee])

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

    setIsProcessing(true)
    setError(null)
    setPromoError(null)

    try {
      // Check if community is free
      if (basePrice <= 0) {
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
      } else if (paymentMethod === "stripe") {
        // Stripe payment
        const result = await (communitiesApi as any).initStripePayment(
          community.id,
          promoCode || undefined,
          normalizedInviteCode || undefined,
        )
        // Handle both wrapped (data.checkoutUrl) and direct (checkoutUrl) response formats
        const checkoutUrl = result?.data?.checkoutUrl || result?.checkoutUrl
        if (checkoutUrl) {
          window.location.href = checkoutUrl
        } else {
          console.error("Stripe result:", result)
          throw new Error("Failed to get checkout URL from Stripe")
        }
      } else {
        // Paid community: initiate manual payment
        if (!paymentProof) {
          setError("Please upload a payment proof")
          setIsProcessing(false)
          return
        }

        await communitiesApi.initManualPayment({
          communityId: community.id,
          proof: paymentProof,
          inviteCode: normalizedInviteCode || undefined,
          promoCode: promoCode || undefined,
        })

        setSuccess(true)
        // For manual payment, we show a success message but DO NOT redirect
        // The user must wait for creator approval
        // setTimeout(() => {
        //   router.push(`/community/${community.slug}/home?payment=pending`)
        // }, 2000)
      }
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
              <ArrowLeft className="w-4 h-4 me-2" />
              Back to Community
            </button>
          )}

          <div className={`flex flex-col sm:flex-row gap-4 ${embedded ? 'items-center sm:items-start text-center sm:text-start' : ''}`}>
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
                <Badge className="ms-1 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
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
              <li>Priority support and feedback from the community</li>
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
              <Badge
                className="bg-chabaqa-primary/10 border flex items-center gap-1"
                style={{ color: primary, borderColor: mutedBorder || undefined }}
              >
                <Percent className="w-3 h-3" />
                No hidden fees
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
                <span>Platform fee</span>
                <span>{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Promo discount</span>
                <span className="text-emerald-600">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 mt-2 flex items-center justify-between font-semibold">
                <span>Total due today</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {basePrice > 0 && !success && (
              <div className="mb-6">
                <Label className="block text-sm font-medium text-gray-900 mb-3">
                  Select Payment Method
                </Label>
                <Tabs defaultValue="stripe" value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="stripe" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Card (Stripe)</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      <span>Transfer</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stripe" className="mt-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Instant Access
                      </p>
                      <p className="mt-1 opacity-90">Pay securely with your credit/debit card and get instant access to the community.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="mt-4">
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                      <p className="font-semibold flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-amber-600" />
                        Requires Approval
                      </p>
                      <p className="mt-1 opacity-90">Upload your proof of payment. The community creator will verify it manually before granting access (usually within 24-48h).</p>
                    </div>
                  </TabsContent>
                </Tabs>
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
                    : basePrice <= 0
                      ? "Successfully joined! Redirecting to your community..."
                      : "Demande de paiement reçue. Veuillez attendre l'approbation du créateur pour accéder à la communauté."}
                </p>
              </div>
            )}

            {basePrice > 0 && paymentMethod === "manual" && !success && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <h3 className="font-bold mb-2">Instructions de virement</h3>
                <p>Veuillez effectuer un virement du montant total ({formatCurrency(total)}) vers le compte suivant :</p>
                <div className="mt-2 bg-white p-3 rounded border border-blue-100 font-mono text-gray-700">
                  <p className="mb-1"><span className="font-semibold">Bénéficiaire:</span> {community.creatorBankDetails?.ownerName || community.creator?.name || "Chabaqa Creator"}</p>
                  <p className="mb-1"><span className="font-semibold">Banque:</span> {community.creatorBankDetails?.bankName || "Banque Tunisienne"}</p>
                  <p><span className="font-semibold">RIB:</span> {community.creatorBankDetails?.rib || "0000 0000 0000 0000 0000"}</p>
                </div>
                <p className="mt-2 text-xs">Une fois le virement effectué, veuillez télécharger la preuve de paiement (capture d&apos;écran ou reçu) ci-dessous.</p>
              </div>
            )}

            {basePrice > 0 && paymentMethod === "manual" && !success && (
              <div className="mb-6">
                <Label htmlFor="proof" className="block text-sm font-medium text-gray-900 mb-2">
                  Preuve de paiement (Requis)
                </Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-chabaqa-primary transition-colors cursor-pointer relative bg-white"
                  style={{ borderColor: mutedBorder || undefined }}
                  onClick={() => document.getElementById('proof-upload')?.click()}>
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="proof-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-chabaqa-primary hover:text-chabaqa-primary/80 focus-within:outline-none">
                        <span style={{ color: primary }}>Upload a file</span>
                        <input id="proof-upload" name="proof-upload" type="file" className="sr-only" accept="image/*,application/pdf" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPaymentProof(e.target.files[0])
                          }
                        }}
                        />
                      </label>
                      <p className="ps-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </p>
                    {paymentProof && (
                      <p className="text-sm text-emerald-600 font-semibold mt-2">
                        Selected: {paymentProof.name}
                      </p>
                    )}
                  </div>
                </div>
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
                    <Loader2 className="animate-spin -ms-1 me-3 h-5 w-5" />
                    <span>{basePrice <= 0 ? 'Joining...' : 'Processing...'}</span>
                  </>
                ) : success ? (
                  <span>{basePrice <= 0 ? 'Joined ✓' : 'Redirecting...'}</span>
                ) : (
                  <span>{basePrice <= 0 ? 'Join Community (Free)' : 'Complete Purchase'}</span>
                )}
              </Button>

              <Link href={`/community/${community.slug}`}>
                <Button
                  variant="secondary"
                  className="w-full bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                >
                  View Community
                </Button>
              </Link>
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
  )
}
