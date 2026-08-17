"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Activity, LockKeyhole, Settings2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type CookiePreferencesModalProps = {
  open: boolean
  analyticsEnabled: boolean
  onOpenChange: (open: boolean) => void
  onSavePreferences: (preferences: { analytics: boolean }) => void
  onAcceptAll: () => void
  onRejectNonEssential: () => void
}

export function CookiePreferencesModal({
  open,
  analyticsEnabled,
  onOpenChange,
  onSavePreferences,
  onAcceptAll,
  onRejectNonEssential,
}: CookiePreferencesModalProps) {
  const [analytics, setAnalytics] = useState<boolean>(analyticsEnabled)

  useEffect(() => {
    if (open) {
      setAnalytics(analyticsEnabled)
    }
  }, [open, analyticsEnabled])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] overflow-hidden border-chabaqa-primary/10 p-0 shadow-[0_20px_60px_rgba(26,23,48,0.14)]">
        <div className="space-y-5 px-6 py-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-chabaqa-primary to-chabaqa-secondary1 p-2.5 shadow-sm">
                <Image
                  src="/Logos/PNG/brandmark.png"
                  alt="Chabaqa"
                  width={24}
                  height={24}
                  sizes="24px"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-chabaqa-primary">
                  <Settings2 className="h-3.5 w-3.5" />
                  Chabaqa Privacy
                </p>
                <DialogTitle className="text-[15px] text-slate-900">Cookie Preferences</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-[12.5px] leading-relaxed text-slate-600">
              Essential cookies are always active. You can decide whether to enable analytics cookies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-800">
                    <LockKeyhole className="h-4 w-4" />
                    Essential
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Required for authentication, security, and basic site functions.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled className="h-7 border-emerald-200 px-2 text-[10px] text-emerald-800">
                  Always active
                </Button>
              </div>
            </div>

            <div className={`rounded-xl border p-3 transition-colors ${analytics ? "border-chabaqa-primary/20 bg-chabaqa-primary/5" : "border-slate-100 bg-slate-50"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-900">
                    <Activity className="h-4 w-4 text-chabaqa-primary" />
                    Analytics
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Helps us understand usage and improve the product experience.
                  </p>
                </div>
                <Switch
                  aria-label="Enable analytics cookies"
                  checked={analytics}
                  onCheckedChange={(value) => setAnalytics(Boolean(value))}
                  className="data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-chabaqa-primary data-[state=checked]:to-chabaqa-secondary1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-3 gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={onRejectNonEssential} className="h-9 border-0 bg-slate-100 px-1 text-[11px] text-slate-700 hover:bg-slate-200">
              Reject
            </Button>
            <Button type="button" variant="outline" onClick={onAcceptAll} className="h-9 border-0 bg-chabaqa-primary/10 px-1 text-[11px] text-chabaqa-primary hover:bg-chabaqa-primary/20">
              Accept all
            </Button>
            <Button
              type="button"
              onClick={() => onSavePreferences({ analytics })}
              className="h-9 border-0 bg-gradient-to-br from-chabaqa-primary to-chabaqa-secondary1 px-1 text-[10px] text-white shadow-md transition hover:opacity-90"
            >
              Save preferences
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
