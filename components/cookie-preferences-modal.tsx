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

  // Close on Escape
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
      style={{ animation: "fadeInOverlay .2s ease both" }}
    >
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cookie-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 12px;
          border: 2px solid var(--bd,#e5e7eb);
          background: var(--bg,#f3f4f6);
          cursor: pointer;
          transition: background .2s, border-color .2s;
          flex-shrink: 0;
        }
        .cookie-toggle.on {
          background: linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%);
          border-color: #8e78fb;
        }
        .cookie-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
          transition: transform .2s cubic-bezier(.16,1,.3,1);
        }
        .cookie-toggle.on .cookie-toggle-thumb {
          transform: translateX(20px);
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          background: "var(--white,#fff)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18), 0 4px 16px rgba(142,120,251,.15)",
          animation: "slideUpModal .3s cubic-bezier(.16,1,.3,1) both",
        }}
      >
        {/* Gradient top bar */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,#8e78fb,#a78bfa,#6c52f0)" }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)", boxShadow: "0 4px 12px rgba(142,120,251,.35)" }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
                  <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
                </svg>
              </div>

              <div>
                {/* Badge */}
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ background: "rgba(142,120,251,.12)", color: "#8e78fb", border: "1px solid rgba(142,120,251,.2)" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={10} height={10} aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {t("modalBadge")}
                </span>
                <h2 id="cookie-modal-title" className="text-[17px] font-black" style={{ color: "var(--t1,#111827)" }}>
                  {t("modalTitle")}
                </h2>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
              style={{ color: "var(--t3,#9ca3af)", border: "1px solid var(--bd,#e5e7eb)" }}
              onMouseEnter={e => { e.currentTarget.style.color="var(--t1,#111827)"; e.currentTarget.style.background="var(--bg,#f3f4f6)" }}
              onMouseLeave={e => { e.currentTarget.style.color="var(--t3,#9ca3af)"; e.currentTarget.style.background="transparent" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-[13px] mb-5 leading-relaxed" style={{ color: "var(--t2,#6b7280)" }}>
            {t("modalDesc")}
          </p>

          {/* Cookie rows */}
          <div className="space-y-3 mb-6">
            {/* Essential */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(16,185,129,.06)",
                border: "1px solid rgba(16,185,129,.18)",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "#065f46" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {t("essentialTitle")}
                  </p>
                  <p className="text-[12px]" style={{ color: "#047857" }}>{t("essentialDesc")}</p>
                </div>
                <span
                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(16,185,129,.15)", color: "#065f46" }}
                >
                  {t("alwaysActive")}
                </span>
              </div>
            </div>

            {/* Analytics */}
            <div
              className="rounded-xl p-4"
              style={{
                background: analytics ? "rgba(142,120,251,.06)" : "var(--bg,#f9fafb)",
                border: analytics ? "1px solid rgba(142,120,251,.25)" : "1px solid var(--bd,#e5e7eb)",
                transition: "background .2s, border-color .2s",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "var(--t1,#111827)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={analytics ? "#8e78fb" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true">
                      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    {t("analyticsTitle")}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--t2,#6b7280)" }}>{t("analyticsDesc")}</p>
                </div>

                {/* Custom toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={analytics}
                  aria-label={t("analyticsTitle")}
                  onClick={() => setAnalytics(v => !v)}
                  className={`cookie-toggle${analytics ? " on" : ""}`}
                >
                  <span className="cookie-toggle-thumb" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onRejectNonEssential}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold border transition-colors cursor-pointer"
              style={{ borderColor: "var(--bd,#e5e7eb)", color: "var(--t2,#6b7280)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background="var(--bg,#f3f4f6)"; e.currentTarget.style.color="var(--t1,#111827)" }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--t2,#6b7280)" }}
            >
              {t("rejectNonEssential")}
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold border transition-colors cursor-pointer"
              style={{ borderColor: "rgba(142,120,251,.3)", color: "#8e78fb", background: "rgba(142,120,251,.06)" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(142,120,251,.12)" }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(142,120,251,.06)" }}
            >
              {t("acceptAll")}
            </button>
            <button
              type="button"
              onClick={() => onSavePreferences({ analytics })}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-[.98]"
              style={{
                background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)",
                boxShadow: "0 4px 14px rgba(142,120,251,.4)",
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
