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
      <DialogContent className="max-w-xl border-chabaqa-primary/20 p-0">
        <div className="h-1 w-full rounded-t-lg bg-gradient-to-r from-chabaqa-primary via-chabaqa-secondary2 to-chabaqa-secondary1" />

        <div className="space-y-5 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-chabaqa-primary/20 bg-white p-2 shadow-sm">
                <Image
                  src="/Logos/PNG/brandmark.png"
                  alt="Chabaqa"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1 rounded-full border border-chabaqa-primary/20 bg-chabaqa-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-chabaqa-primary">
                  <Settings2 className="h-3.5 w-3.5" />
                  Chabaqa Privacy
                </p>
                <DialogTitle className="text-xl text-slate-900">Cookie Preferences</DialogTitle>
              </div>
            </div>
          <DialogDescription>
            Essential cookies are always active. You can decide whether to enable analytics cookies.
          </DialogDescription>
        </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">
                    <LockKeyhole className="h-4 w-4" />
                    Essential
                  </p>
                  <p className="text-sm text-emerald-700">
                    Required for authentication, security, and basic site functions.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled>
                  Always active
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-chabaqa-primary/25 bg-gradient-to-br from-chabaqa-primary/5 via-white to-chabaqa-secondary2/5 p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                    <Activity className="h-4 w-4 text-chabaqa-primary" />
                    Analytics
                  </p>
                  <p className="text-sm text-slate-600">
                    Helps us understand usage and improve the product experience.
                  </p>
                </div>
                <Switch
                  aria-label="Enable analytics cookies"
                  checked={analytics}
                  onCheckedChange={(value) => setAnalytics(Boolean(value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onRejectNonEssential}>
                Reject non-essential
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onAcceptAll}
                className="border-chabaqa-primary/30 text-chabaqa-primary hover:bg-chabaqa-primary/10"
              >
                Accept all
              </Button>
            </div>
            <Button
              type="button"
              onClick={() => onSavePreferences({ analytics })}
              className="border-0 bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white shadow-md transition hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90"
            >
              Save preferences
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
