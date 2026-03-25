"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Cookie, ShieldCheck } from "lucide-react"

type CookieConsentBannerProps = {
  onAcceptAll: () => void
  onRejectNonEssential: () => void
  onOpenSettings: () => void
}

export function CookieConsentBanner({
  onAcceptAll,
  onRejectNonEssential,
  onOpenSettings,
}: CookieConsentBannerProps) {
  return (
    <section
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4"
    >
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-chabaqa-primary/20 bg-white/95 shadow-[0_-10px_35px_rgba(142,120,251,0.25)] backdrop-blur-xl">
        <div className="px-5 pt-4 sm:px-7 sm:pt-5">
          <div
            aria-hidden
            className="h-1.5 w-full rounded-full bg-gradient-to-r from-chabaqa-primary via-chabaqa-secondary2 to-chabaqa-secondary1"
          />
        </div>

        <div className="relative overflow-hidden px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 right-0 h-28 w-28 rounded-full bg-chabaqa-secondary2/20 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-chabaqa-secondary1/20 blur-2xl"
          />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
              <div className="mt-0.5 rounded-2xl border border-chabaqa-primary/20 bg-white p-2.5 shadow-sm">
                <Image
                  src="/Logos/PNG/brandmark.png"
                  alt="Chabaqa"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              </div>

              <div className="min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-chabaqa-primary/20 bg-chabaqa-primary/10 px-2.5 py-1 text-xs font-semibold text-chabaqa-primary">
                    <Cookie className="h-3.5 w-3.5" />
                    Cookie Notice
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Essential protected
                  </span>
                </div>

                <p className="max-w-3xl text-[15px] leading-relaxed text-slate-700">
                  We use essential cookies to keep Chabaqa secure and functional. Analytics cookies are optional and
                  help us improve the product. See our{" "}
                  <Link
                    href="/privacy-policy"
                    className="font-semibold text-chabaqa-primary underline underline-offset-4 hover:text-chabaqa-secondary1"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/terms-of-service"
                    className="font-semibold text-chabaqa-primary underline underline-offset-4 hover:text-chabaqa-secondary1"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap lg:pl-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="h-9 min-w-[122px] whitespace-nowrap border-chabaqa-primary/30 text-chabaqa-primary hover:bg-chabaqa-primary/10"
              >
                Settings
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRejectNonEssential}
                className="h-9 min-w-[166px] whitespace-nowrap border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Reject non-essential
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onAcceptAll}
                className="h-9 min-w-[116px] whitespace-nowrap border-0 bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white shadow-md transition hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90"
              >
                Accept all
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
