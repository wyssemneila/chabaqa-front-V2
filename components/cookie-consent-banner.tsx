"use client"

import React from "react"
import Link from "next/link"

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
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-5 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none"
      style={{ animation: "slideUpCookie .4s cubic-bezier(.16,1,.3,1) both" }}
    >
      <style>{`
        @keyframes slideUpCookie {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="pointer-events-auto w-full max-w-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl px-4 py-3.5"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(142,120,251,.2)",
          boxShadow: "0 8px 32px rgba(142,120,251,.18), 0 2px 8px rgba(0,0,0,.06)",
        }}
      >
        {/* Cookie icon */}
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)" }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
            <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
          </svg>
        </div>

        {/* Text */}
        <p className="flex-1 text-[12.5px] leading-relaxed" style={{ color: "#374151" }}>
          We use cookies to keep Chabaqa secure and improve your experience.{" "}
          <Link href="/privacy-policy" className="font-semibold underline underline-offset-2" style={{ color: "#8e78fb" }}>
            Privacy Policy
          </Link>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onOpenSettings}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors cursor-pointer"
            style={{ borderColor: "#e5e7eb", color: "#6b7280", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#c4b8fd"; e.currentTarget.style.color="#8e78fb" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#6b7280" }}
          >
            Settings
          </button>
          <button
            type="button"
            onClick={onRejectNonEssential}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors cursor-pointer"
            style={{ borderColor: "#e5e7eb", color: "#6b7280", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#111827"; e.currentTarget.style.background="#f9fafb" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#6b7280"; e.currentTarget.style.background="transparent" }}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)", boxShadow: "0 4px 12px rgba(142,120,251,.4)" }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
