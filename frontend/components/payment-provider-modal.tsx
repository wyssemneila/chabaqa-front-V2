"use client"

import React from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowRight, Check, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export type PaymentProvider = "stripe"

interface PaymentProviderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (provider: PaymentProvider) => Promise<void>
  title?: string
  description?: string
  isLoading?: boolean
  error?: string | null
}

function CardNetworkIcon() {
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16" aria-hidden="true">
      <rect x="1" y="1" width="62" height="42" rx="11" fill="#111827" />
      <rect x="8" y="9" width="18" height="13" rx="4" fill="#F7C65C" />
      <path d="M8 30h19M8 35h11" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="43" cy="30" r="7" fill="#EB001B" fillOpacity=".9" />
      <circle cx="51" cy="30" r="7" fill="#F79E1B" fillOpacity=".9" />
    </svg>
  )
}

const benefits = [
  { title: "Encrypted", text: "Payment details stay with Stripe", icon: ShieldCheck },
  { title: "Verified", text: "Signed confirmation before access", icon: Check },
  { title: "Fast", text: "Access unlocks after confirmation", icon: ArrowRight },
]

export function PaymentProviderModal({
  open,
  onOpenChange,
  onSelect,
  title = "Complete your payment",
  description = "Pay securely by card through Stripe Checkout.",
  isLoading = false,
  error = null,
}: PaymentProviderModalProps) {
  const showTestCards = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_TEST_CARDS === "true"

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isLoading) onOpenChange(value) }}>
      <DialogContent className="bottom-0 top-auto max-h-[94dvh] w-full translate-y-0 overflow-y-auto rounded-b-none rounded-t-[28px] border-0 bg-white p-0 shadow-[0_-28px_90px_rgba(15,23,42,.28)] sm:bottom-auto sm:top-1/2 sm:max-w-[760px] sm:-translate-y-1/2 sm:rounded-[28px]">
        <div className="relative overflow-hidden bg-[linear-gradient(118deg,#ffffff_0%,#ffffff_38%,#faf8ff_58%,#f4fbff_100%)] px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-6 sm:p-8">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(142,120,251,.16),transparent_38%),radial-gradient(circle_at_100%_18%,rgba(71,199,234,.14),transparent_42%)]" />
          <div aria-hidden="true" className="absolute inset-y-0 left-[38%] hidden w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent blur-2xl sm:block" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 pr-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-[#8e78fb]/15">
                  <Image src="/Logos/PNG/brandmark.png" alt="Chabaqa" width={36} height={36} className="h-9 w-9 object-contain" priority />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[.22em] text-[#8e78fb]">Chabaqa Pay</p>
                  <p className="text-sm font-semibold text-slate-700">Secure creator commerce</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:flex">
                <LockKeyhole className="h-3.5 w-3.5" /> Protected checkout
              </div>
            </div>

            <DialogHeader className="mt-6 space-y-2 text-left">
              <DialogTitle className="text-[26px] font-black tracking-[-.03em] text-slate-950 sm:text-[30px]">{title}</DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-6 text-slate-500">{description}</DialogDescription>
            </DialogHeader>

            <button
              type="button"
              onClick={() => { if (!isLoading) void onSelect("stripe") }}
              disabled={isLoading}
              aria-describedby="stripe-payment-description"
              className={cn(
                "group mt-6 w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,.05)] transition duration-200",
                "hover:-translate-y-0.5 hover:border-[#8e78fb]/50 hover:shadow-[0_18px_45px_rgba(99,91,255,.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e78fb] focus-visible:ring-offset-2",
                isLoading && "cursor-wait border-[#8e78fb]/40 bg-[#8e78fb]/[.03]",
              )}
            >
              <div className="flex items-center gap-4">
                <div className="shrink-0"><CardNetworkIcon /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-extrabold text-slate-950">Credit or debit card</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">Recommended</span>
                  </div>
                  <p id="stripe-payment-description" className="mt-1 text-xs leading-5 text-slate-500">Visa, Mastercard and supported international cards</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition group-hover:bg-[#635bff]">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <LockKeyhole className="h-3.5 w-3.5 text-[#8e78fb]" /> You will continue to Stripe
                </div>
                <Image src="/Logos/SVG/stripe-ar21.svg" alt="Stripe" width={72} height={36} className="h-8 w-[64px] object-contain" />
              </div>
            </button>

            {error && (
              <div role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {benefits.map(({ title: benefitTitle, text, icon: Icon }) => (
                <div key={benefitTitle} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#8e78fb] shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{benefitTitle}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-[11px] leading-5 text-amber-900">
              Chabaqa prices are shown in TND. Stripe may display the equivalent USD amount using the checkout exchange rate.
            </div>

            {showTestCards && (
              <details className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <summary className="cursor-pointer text-xs font-bold text-slate-700">Stripe test card details</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <code className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">4242 4242 4242 4242</code>
                  <code className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">4000 0000 0000 0002</code>
                </div>
              </details>
            )}

            <p className="mt-4 text-center text-[10px] leading-4 text-slate-400">Chabaqa never stores your full card number. Payments are processed by Stripe.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
