"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Zap,
  Calendar,
  Clock,
  Coins,
  Trophy,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
  TrendingUp,
  Award,
  Gift,
  Tag,
  ArrowRight
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useState } from "react"
import { challengesApi } from "@/lib/api/learning/challenges.api"

interface ChallengeSelectionModalProps {
  challenge: any
  setSelectedChallenge: (id: string | null) => void
  onJoined?: () => void
  redirectPath?: string
}

export default function ChallengeSelectionModal({
  challenge,
  setSelectedChallenge,
  onJoined,
  redirectPath,
}: ChallengeSelectionModalProps) {
  const { toast } = useToast()

  const [promoCode, setPromoCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!challenge) return null

  const paymentAmount = challenge?.depositAmount ?? challenge?.pricing?.depositAmount ?? challenge?.participationFee ?? challenge?.pricing?.participationFee ?? challenge?.pricing?.price ?? 0
  const completionReward = challenge?.completionReward ?? challenge?.pricing?.completionReward ?? 0

  const handleJoin = async () => {
    setIsSubmitting(true)
    try {
      const challengeId = String(challenge.id || challenge._id)
      console.log('[Join Challenge] Challenge ID:', challengeId)
      console.log('[Join Challenge] Deposit Amount:', paymentAmount)

      if (!paymentAmount || paymentAmount <= 0) {
        const response = await challengesApi.join(challengeId)
        toast({
          title: "Success!",
          description: response?.message || "You have joined the challenge successfully!",
        })
        onJoined?.()
        if (redirectPath) {
          window.location.href = redirectPath
          return
        }
        setSelectedChallenge(null)
        return
      }

      const result = await (challengesApi as any).initStripePayment(challengeId, promoCode.trim() || undefined)
      const checkoutUrl = result?.data?.checkoutUrl || result?.checkoutUrl
      if (!checkoutUrl) {
        throw new Error('Unable to start checkout. Please try again.')
      }
      window.location.href = checkoutUrl
    } catch (error: any) {
      console.error('[Join Challenge] Error:', error)
      toast({
        title: "Failed to join",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!challenge} onOpenChange={() => setSelectedChallenge(null)}>
      <DialogContent className="w-[95vw] max-w-2xl sm:w-full p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-challenges-600 via-challenges-500 to-orange-500 p-6 pb-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-12 -translate-x-12" />

          <DialogHeader className="relative">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-white mb-1 line-clamp-2">
                  {challenge.title}
                </DialogTitle>
                <p className="text-white/90 text-sm flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Join the challenge and transform your habits
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
          {/* Stats Grid - Enhanced */}
          <div className="grid grid-cols-4 gap-3 -mt-12 relative z-10">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="p-2 rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Start</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(challenge.startDate).split(',')[0]}</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Duration</p>
              <p className="text-sm font-bold text-gray-900">{challenge.duration || '30 days'}</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Coins className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Deposit</p>
              <p className="text-sm font-bold text-gray-900">{paymentAmount > 0 ? `${paymentAmount} TND` : 'Free'}</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="p-2 rounded-lg bg-amber-50">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Reward</p>
              <p className="text-sm font-bold text-gray-900">${completionReward}</p>
            </div>
          </div>

          {/* Benefits Section - Enhanced */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-5 border border-emerald-100 shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl" />
            <div className="relative">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-900">
                <div className="p-1.5 rounded-lg bg-emerald-500">
                  <Gift className="h-4 w-4 text-white" />
                </div>
                What You'll Get
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { text: "Daily tasks & tracking", icon: CheckCircle2, color: "text-emerald-600" },
                  { text: "Community support", icon: Users, color: "text-blue-600" },
                  { text: "Progress analytics", icon: TrendingUp, color: "text-purple-600" },
                  { text: "Achievement rewards", icon: Award, color: "text-amber-600" }
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/60 backdrop-blur-sm">
                    <div className="p-1.5 rounded-md bg-white shadow-sm">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Information - Enhanced */}
          {paymentAmount > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 border border-amber-200 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500 shadow-sm">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Investment & Return
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Pay <span className="font-bold text-amber-900">${paymentAmount}</span> to join.
                    Complete the challenge to get <span className="font-bold text-emerald-700">${completionReward}</span> back!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Promo Code Section - Enhanced */}
          <div className="space-y-2">
            <Label htmlFor="promoCode" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Tag className="h-4 w-4 text-challenges-500" />
              Have a promo code?
            </Label>
            <Input
              id="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter your promo code"
              disabled={isSubmitting}
              className="h-11 text-sm border-gray-200 focus:border-challenges-500 focus:ring-challenges-500"
            />
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 h-12 text-sm font-semibold bg-gradient-to-r from-challenges-600 to-orange-500 hover:from-challenges-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 group"
                onClick={handleJoin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {paymentAmount > 0 ? "Proceed to Payment" : "Join Challenge Free"}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 text-sm font-medium border-gray-300 hover:bg-gray-50"
                onClick={() => setSelectedChallenge(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
