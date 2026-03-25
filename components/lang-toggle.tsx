"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { LOCALE_COOKIE } from "@/lib/i18n/config"

interface LangToggleProps {
  className?: string
  size?: "sm" | "md"
}

export function LangToggle({ className = "", size = "md" }: LangToggleProps) {
  const router = useRouter()
  const locale = useLocale()
  const isAr   = locale === "ar"

  const dim = size === "sm" ? "w-8 h-8 text-[11px]" : "w-9 h-9 text-[12px]"

  const toggle = () => {
    const next = isAr ? "en" : "ar"
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
      className={`${dim} flex items-center justify-center rounded-xl border font-bold transition-all duration-200 cursor-pointer ${className}`}
      style={{
        borderColor: "var(--bd,#e5e7eb)",
        background:  "var(--white,#fff)",
        color:       "var(--t2,#6b7280)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--p3,#c4b8fd)"
        e.currentTarget.style.color       = "var(--p,#8e78fb)"
        e.currentTarget.style.background  = "var(--p2,#ede9ff)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--bd,#e5e7eb)"
        e.currentTarget.style.color       = "var(--t2,#6b7280)"
        e.currentTarget.style.background  = "var(--white,#fff)"
      }}
    >
      {isAr ? "EN" : "ع"}
    </button>
  )
}
