"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE } from "@/lib/i18n/config"

interface LangToggleProps {
  className?: string
  size?: "sm" | "md"
}

function stripLocale(pathname: string) {
  const segs = pathname.split("/")
  if (isAppLocale(segs[1])) {
    const stripped = `/${segs.slice(2).join("/")}`.replace(/\/+/g, "/")
    return stripped === "/" ? "/" : stripped.replace(/\/$/, "") || "/"
  }
  return pathname
}

function detectLocale(pathname: string) {
  const segs = pathname.split("/")
  return isAppLocale(segs[1]) ? segs[1] : DEFAULT_LOCALE
}

export function LangToggle({ className = "", size = "md" }: LangToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentLocale = useMemo(() => detectLocale(pathname), [pathname])
  const internalPath = useMemo(() => stripLocale(pathname), [pathname])
  const isAr = currentLocale === "ar"

  const dim = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-[12px]"

  const toggle = () => {
    const next = isAr ? "en" : "ar"
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    const target = internalPath === "/" ? `/${next}` : `/${next}${internalPath}`
    const q = searchParams.toString()
    router.push(q ? `${target}?${q}` : target)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
      className={`${dim} flex items-center justify-center rounded-xl border font-bold transition-colors ${className}`}
      style={{
        borderColor: "var(--bd,#e5e7eb)",
        background: "var(--white,#fff)",
        color: "var(--t2,#6b7280)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--p3,#c4b8fd)"
        e.currentTarget.style.color = "var(--p,#8e78fb)"
        e.currentTarget.style.background = "var(--p2,#ede9ff)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--bd,#e5e7eb)"
        e.currentTarget.style.color = "var(--t2,#6b7280)"
        e.currentTarget.style.background = "var(--white,#fff)"
      }}
    >
      {isAr ? "EN" : "ع"}
    </button>
  )
}
