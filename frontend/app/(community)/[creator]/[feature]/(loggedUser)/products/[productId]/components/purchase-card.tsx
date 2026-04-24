"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Download } from "lucide-react"
import { useProductPurchaseFlow } from "@/lib/hooks/use-product-purchase-flow"
import { PaymentProviderModal } from "@/components/payment-provider-modal"

interface PurchaseCardProps {
  product: any
  purchase: any
  isPurchased: boolean
  hasAccess: boolean
  totalDownloads: number
  onOpenFiles?: () => void
}

export default function PurchaseCard({
  product,
  purchase,
  isPurchased,
  hasAccess,
  totalDownloads,
  onOpenFiles,
}: PurchaseCardProps) {
  const { toast } = useToast()

  const {
    isStripeLoading,
    initStripePayment,
    paymentModal,
  } = useProductPurchaseFlow()

  const isPaidProduct = useMemo(() => Number(product?.price ?? 0) > 0, [product])

  const handleStripePayment = () => {
    if (!product) return
    initStripePayment(
      String(product.id || product._id),
    )
  }

  return (
    <>
      <PaymentProviderModal
        open={paymentModal.isOpen}
        onOpenChange={paymentModal.close}
        onSelect={paymentModal.handleSelect}
      />
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold">
            {isPurchased ? 'Your Purchase' : hasAccess ? 'Product Access' : 'Get This Product'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 pb-5 sm:space-y-4 sm:pb-6">
          {hasAccess ? (
            <>
              {/* Purchase Details */}
              <div className="space-y-2 sm:space-y-3">
                {isPurchased && purchase?.purchasedAt && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">Purchased on:</span>
                    <span className="text-xs sm:text-sm font-medium text-right">
                      {new Date(purchase.purchasedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {!isPurchased && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">Access:</span>
                    <span className="text-xs sm:text-sm font-medium">
                      {isPaidProduct ? "Creator access" : "Free access"}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">Downloads:</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {totalDownloads} time{totalDownloads !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <Button
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
                onClick={() => {
                  onOpenFiles?.()
                  if (typeof window !== 'undefined') {
                    window.setTimeout(() => {
                      document.getElementById('files')?.scrollIntoView({ behavior: 'smooth' })
                    }, 120)
                  }
                }}
              >
                  <Download className="h-4 w-4 mr-2 shrink-0" />
                  <span>Download Files</span>
              </Button>
            </>
          ) : (
            <>
              {/* Price Display */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <span className="text-sm sm:text-base text-muted-foreground font-medium">Price:</span>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {product.price === 0 ? 'Free' : `${product.price} TND`}
                  </span>
                  {product.price > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      One-time purchase
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Button */}
              <Button
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90"
                onClick={() => {
                  void handleStripePayment()
                }}
                disabled={isStripeLoading}
              >
                {isStripeLoading ? 'Redirecting...' : 'Purchase Now'}
              </Button>

              {/* Money Back Guarantee */}
              {isPaidProduct && (
                <div className="text-center">
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-muted-foreground sm:text-sm">
                    <span className="font-medium">30-day</span> money back guarantee
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
