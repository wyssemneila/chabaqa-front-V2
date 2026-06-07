"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ArrowRight, Check, Clock3, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"

export type PaymentProvider = "stripe" | "konnect"

interface PaymentProviderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (provider: PaymentProvider) => Promise<void>
  title?: string
  description?: string
  walletBalance?: string | number | null
}

type ProviderOption = {
  id: PaymentProvider | "flouci" | "manual"
  label: string
  sublabel: string
  icon: string
  accent: string
  bg: string
  available: boolean
}

const isProviderEnabled = (provider: PaymentProvider) => {
  if (provider === "stripe") return true
  if (provider === "konnect") {
    return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PAYMENT_ENABLE_KONNECT === "true"
  }
  return false
}

const providerOptions: ProviderOption[] = [
  {
    id: "stripe",
    label: "International Card",
    sublabel: "Visa, Mastercard, global cards",
    icon: "/payement/stripe_international_icon.png",
    accent: "#8e78fb",
    bg: "from-[#8e78fb]/12 to-[#47c7ea]/10",
    available: true,
  },
  {
    id: "konnect",
    label: "Konnect",
    sublabel: isProviderEnabled("konnect") ? "Tunisian card checkout" : "Disabled in production",
    icon: "/payement/konnect_payment_icon.png",
    accent: "#47c7ea",
    bg: "from-[#47c7ea]/14 to-[#8e78fb]/10",
    available: isProviderEnabled("konnect"),
  },
  {
    id: "flouci",
    label: "Flouci",
    sublabel: "Mobile wallet, coming soon",
    icon: "/payement/flouci_payment_icon.png",
    accent: "#f65887",
    bg: "from-[#f65887]/14 to-[#8e78fb]/10",
    available: false,
  },
  {
    id: "manual",
    label: "Manual Transfer",
    sublabel: "Proof review, coming soon",
    icon: "/payement/manual_transfer_icon.png",
    accent: "#ff9b28",
    bg: "from-[#ff9b28]/14 to-[#8e78fb]/8",
    available: false,
  },
]

const trustItems = [
  {
    label: "Secure",
    description: "Encrypted checkout",
    icon: "/payement/secure_payment_icon.png",
  },
  {
    label: "Instant",
    description: "Fast access after payment",
    icon: "/payement/instant_access_icon.png",
  },
  {
    label: "Protected",
    description: "Clear payment records",
    icon: "/payement/deposit_protection_icon.png",
  },
]

export function PaymentProviderModal({
  open,
  onOpenChange,
  onSelect,
  title = "Choose Payment Method",
  description = "Select your preferred payment provider to complete your purchase.",
  walletBalance = null,
}: PaymentProviderModalProps) {
  const [processingProvider, setProcessingProvider] = useState<PaymentProvider | null>(null)
  const showTestCards = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_TEST_CARDS === "true"

  const handleSelect = async (provider: PaymentProvider) => {
    if (processingProvider) return
    setProcessingProvider(provider)
    try {
      await onSelect(provider)
    } catch {
      setProcessingProvider(null)
    }
  }

  const isLoading = processingProvider !== null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLoading) onOpenChange(v) }}>
      <DialogContent className="bottom-0 top-auto max-h-[92vh] w-full translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-3xl border-0 p-0 shadow-[0_-24px_80px_rgba(15,23,42,0.24)] sm:bottom-auto sm:top-1/2 sm:max-w-4xl sm:-translate-y-1/2 sm:rounded-3xl">
        <div className="grid max-h-[92vh] overflow-y-auto bg-white pb-[env(safe-area-inset-bottom)] md:grid-cols-[0.92fr_1.08fr]">
          <section className="relative overflow-hidden border-b border-slate-100 bg-white p-5 text-slate-950 sm:border-b-0 sm:border-r sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(142,120,251,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(71,199,234,0.10),transparent_30%)]" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8e78fb]/10 ring-1 ring-[#8e78fb]/15">
                  <Image src="/payement/chabaqa_wallet_icon.png" alt="" width={30} height={30} className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Chabaqa Pay</p>
                  <p className="text-sm font-semibold text-slate-900">Creator commerce checkout</p>
                </div>
              </div>

              <div className="relative aspect-[1.6/1] overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-800 to-pink-700 p-5 text-white shadow-[0_20px_48px_rgba(88,28,135,0.28)] transition-all duration-300 hover:rotate-1 hover:scale-[1.01]">
                <div className="absolute inset-0 shimmer-glow opacity-10 pointer-events-none" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-purple-100/80">Chabaqa Card</p>
                      <p className="mt-1 text-sm font-semibold tracking-widest text-white">Wallet Value</p>
                    </div>
                    <div className="flex h-7 w-9 items-center justify-center rounded-md bg-gradient-to-tr from-yellow-300 to-yellow-500 shadow-sm">
                      <div className="h-4 w-6 rounded-sm border border-yellow-700/35" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black tracking-tight">
                        {walletBalance == null ? "Secure" : walletBalance}
                      </p>
                      {walletBalance != null && <span className="text-xs font-bold text-purple-100/80">DT / PTS</span>}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wide text-purple-100/70">
                      <span>Verified Member</span>
                      <span className="font-mono">EXP: --/--</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {trustItems.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <Image src={item.icon} alt="" width={30} height={30} className="h-8 w-8 object-contain" />
                    <p className="mt-2 text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="p-5 sm:p-7">
            <DialogHeader className="space-y-2 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8e78fb]/15 bg-[#8e78fb]/10 px-3 py-1 text-xs font-semibold text-[#8e78fb]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Protected checkout
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-[#0f172a]">{title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-500">{description}</DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {providerOptions.map((provider) => {
                const isAvailable = provider.available
                const isThis = processingProvider === provider.id
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      if (isAvailable) handleSelect(provider.id as PaymentProvider)
                    }}
                    disabled={isLoading || !isAvailable}
                    className={cn(
                      "group relative min-h-[132px] overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all duration-200",
                      isAvailable
                        ? "cursor-pointer border-slate-200 hover:-translate-y-0.5 hover:border-[#8e78fb]/40 hover:shadow-[0_18px_38px_rgba(15,23,42,0.10)]"
                        : "cursor-not-allowed border-slate-100 opacity-70",
                      isThis && "border-[#8e78fb] shadow-[0_18px_38px_rgba(142,120,251,0.18)]",
                    )}
                  >
                    <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${provider.bg}`} />
                    <div className="relative flex h-full flex-col justify-between gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                          <Image src={provider.icon} alt="" width={38} height={38} className="h-10 w-10 object-contain" />
                        </div>
                        {isThis ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[#8e78fb]" />
                        ) : isAvailable ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-black/5 transition-colors group-hover:text-[#8e78fb]">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 shadow-sm">
                            <Clock3 className="h-3 w-3" />
                            Soon
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-950">{provider.label}</p>
                          {isAvailable && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: `${provider.accent}1f`, color: provider.accent }}>
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{provider.sublabel}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {showTestCards && (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-[#47c7ea]" />
                Test card details
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Success</p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-emerald-900">4242 4242 4242 4242</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-rose-700">Declined</p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-rose-900">4000 0000 0000 0002</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">Any future expiry, any CVC, any ZIP.</p>
            </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
