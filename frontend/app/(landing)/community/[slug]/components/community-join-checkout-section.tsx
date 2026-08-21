"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CheckoutForm } from "../checkout/components/checkout-form"
import type { CommunityThemeTokens } from "@/lib/community-theme"

interface CommunityJoinCheckoutSectionProps {
  community: any
  themeTokens?: CommunityThemeTokens
}

const JOIN_HASH = "#join-section"

export function CommunityJoinCheckoutSection({ community, themeTokens }: CommunityJoinCheckoutSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const syncWithHash = () => {
    if (window.location.hash === JOIN_HASH) {
      setIsOpen(true)
    }
  }

  useEffect(() => {
    // We only listen for hash changes to sync if the user manually changes the URL
    // We removed the initial hash check on mount to prevent auto-opening
    window.addEventListener("hashchange", syncWithHash)
    return () => window.removeEventListener("hashchange", syncWithHash)
  }, [])

  useEffect(() => {
    // Listen for custom events to open the checkout modal
    const handleOpenCheckout = () => setIsOpen(true)
    window.addEventListener("open-community-checkout", handleOpenCheckout)
    return () => window.removeEventListener("open-community-checkout", handleOpenCheckout)
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open && window.location.hash === JOIN_HASH) {
      window.history.replaceState(null, "", window.location.pathname)
    }
  }

  return (
    <>
      <div id="join-section" className="scroll-mt-24" />
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="w-[95vw] max-w-6xl max-h-[92vh] overflow-y-auto p-2 sm:p-4"
          style={{ borderColor: themeTokens?.mutedBorder || undefined }}
        >
          <CheckoutForm community={community} embedded themeTokens={themeTokens} />
        </DialogContent>
      </Dialog>
    </>
  )
}
