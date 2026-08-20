"use client"

import React, { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("cookieConsent")
  const [analytics, setAnalytics] = useState<boolean>(analyticsEnabled)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setAnalytics(analyticsEnabled)
  }, [open, analyticsEnabled])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ animation: "ckFade .25s ease both" }}
    >
      <style>{`
        @keyframes ckFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ckSlide {
          from { opacity: 0; transform: translateY(16px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,23,48,.35)", backdropFilter: "blur(8px)" }}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        className="relative w-full max-w-[380px] rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 20px 60px rgba(26,23,48,.14), 0 0 0 1px rgba(142,120,251,.08)",
          animation: "ckSlide .3s cubic-bezier(.16,1,.3,1) .05s both",
        }}
      >
        <div className="px-6 pt-6 pb-5">

          {/* Header — icon + title row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#8e78fb,#6c52f0)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h2 id="cookie-modal-title" className="text-[15px] font-bold" style={{ color: "#1a1730", letterSpacing: "-0.01em" }}>
                  {t("modalTitle")}
                </h2>
                <p className="text-[11.5px]" style={{ color: "#9590b8" }}>{t("modalBadge")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: "#9590b8" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f4f2fc"; e.currentTarget.style.color = "#6c52f0" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9590b8" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-[12.5px] leading-relaxed mb-5" style={{ color: "#46426a" }}>
            {t("modalDesc")}
          </p>

          {/* Cookie categories */}
          <div className="flex flex-col gap-2.5 mb-5">

            {/* Essential */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #dcfce7" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dcfce7" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold" style={{ color: "#15803d" }}>{t("essentialTitle")}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#16a34a" }}>{t("essentialDesc")}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ background: "#dcfce7", color: "#15803d" }}>
                {t("alwaysActive")}
              </span>
            </div>

            {/* Analytics */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{
                background: analytics ? "#f4f2fc" : "#fafafa",
                border: analytics ? "1px solid #e4dffb" : "1px solid #f0f0f0",
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: analytics ? "#e4dffb" : "#f0f0f0" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={analytics ? "#8e78fb" : "#9590b8"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold" style={{ color: "#1a1730" }}>{t("analyticsTitle")}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#9590b8" }}>{t("analyticsDesc")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                aria-label={t("analyticsTitle")}
                onClick={() => setAnalytics(v => !v)}
                className="relative shrink-0 transition-colors"
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: analytics ? "linear-gradient(135deg,#8e78fb,#6c52f0)" : "#dcd8ec",
                }}
              >
                <span
                  className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: analytics ? 20 : 3 }}
                />
              </button>
            </div>
          </div>

          {/* Actions — clean row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRejectNonEssential}
              className="flex-1 h-9 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer"
              style={{ background: "#f7f6fb", color: "#46426a" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#efedf8" }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f7f6fb" }}
            >
              {t("reject")}
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="flex-1 h-9 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer"
              style={{ background: "#f4f2fc", color: "#8e78fb" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#ede9ff" }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f4f2fc" }}
            >
              {t("acceptAll")}
            </button>
            <button
              type="button"
              onClick={() => onSavePreferences({ analytics })}
              className="flex-1 h-9 rounded-xl text-[12px] font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-[.97]"
              style={{
                background: "linear-gradient(135deg,#8e78fb,#6c52f0)",
                boxShadow: "0 4px 12px rgba(142,120,251,.3)",
              }}
            >
              {t("savePreferences")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
