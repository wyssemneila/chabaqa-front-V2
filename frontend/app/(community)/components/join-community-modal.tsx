"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, CreditCard, Shield, CheckCircle, Users, Star, Clock, Gift, ArrowRight, Sparkles } from "lucide-react"
import { communitiesApi } from "@/lib/api/communities.api"
import { PaymentProviderModal } from "@/components/payment-provider-modal"
import { usePaymentProviderModal } from "@/lib/hooks/use-payment-provider-modal"

interface JoinCommunityModalProps {
  community: any
  onClose: () => void
}

export function JoinCommunityModal({ community, onClose }: JoinCommunityModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<"details" | "payment" | "success">("details")
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

  const communityId = community?._id || community?.id

  const paymentModal = usePaymentProviderModal({
    initStripe: () => (communitiesApi as any).initStripePayment(communityId),
    initKonnect: () => (communitiesApi as any).initKonnectPayment(communityId),
  })

  const formatPrice = (price: number, type: string) => {
    if (type === "free") return "Free"
    return `${price} TND/${type === "monthly" ? "mo" : type}`
  }

  const handleJoin = async () => {
    if (community.priceType === "free") {
      setStep("success")
      return
    }

    setIsProcessing(true)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setStep("success")
  }

  const handlePayment = () => {
    if (!communityId) return
    paymentModal.open()
  }

  return (
    <>
      <PaymentProviderModal
        open={paymentModal.isOpen}
        onOpenChange={paymentModal.close}
        onSelect={paymentModal.handleSelect}
      />
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Join {community.name}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {step === "details" && (
            <div className="space-y-6">
              {/* Community Info */}
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={community.creatorAvatar || "/placeholder.svg"} alt={community.creator} />
                      <AvatarFallback>{community.creator.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{community.name}</h3>
                      <p className="text-gray-600">{community.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="text-sm">{community.members.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{community.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatPrice(community.price, community.priceType)}
                      </div>
                      {community.priceType !== "free" && <div className="text-sm text-gray-500">per month</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {community.settings.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Details Form */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Your Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {community.priceType === "free" ? (
                    <div className="flex items-center text-green-600">
                      <Gift className="w-4 h-4 mr-2" />
                      <span>Completely Free!</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>7-day free trial</span>
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        <span>Cancel anytime</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={() => (community.priceType === "free" ? handleJoin() : setStep("payment"))}
                  disabled={!formData.name || !formData.email}
                  className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white px-8"
                >
                  {community.priceType === "free" ? "Join for Free" : "Continue to Payment"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <Card className="border border-gray-200 bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{community.name}</h3>
                      <p className="text-gray-600">Monthly subscription</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${community.price}/mo</div>
                      <div className="text-sm text-green-600">7-day free trial</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Secure Checkout
                </h4>
                <div className="text-sm text-gray-600">
                  You will be redirected to Stripe to complete your payment securely.
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Secure Payment</p>
                  <p>Your payment information is encrypted and secure.</p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setStep("details")}>
                  Back
                </Button>

                <Button
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white px-8"
                >
                  {isProcessing ? "Processing..." : `Start Free Trial`}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to {community.name}!</h3>
                <p className="text-gray-600">
                  {community.priceType === "free"
                    ? "You've successfully joined the community."
                    : "Your free trial has started. You'll be charged after 7 days."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-green-500" />
                    <span>Instant access</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-green-500" />
                    <span>Join {community.members.toLocaleString()}+ members</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => {
                    const slug = (community as any)?.slug
                    if (slug) {
                      router.push(`/community/${slug}/home`)
                    } else {
                      onClose()
                    }
                  }}
                  className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white px-8"
                >
                  Start Exploring
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
