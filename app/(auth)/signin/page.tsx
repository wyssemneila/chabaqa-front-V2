"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import SignInForm from "../components/signin-form"
import { useAuthContext } from "@/app/providers/auth-provider"
import { localizeHref } from "@/lib/i18n/client"
import { useTranslations } from "next-intl"
import { ThemeToggle } from "@/components/theme-toggle"
import { LangToggle } from "@/components/lang-toggle"

export default function SignInPage() {
  const { user, isAuthenticated } = useAuthContext()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const pathname     = usePathname()
  const t            = useTranslations("auth.signinPage")

  useEffect(() => {
    if (!isAuthenticated || !user) return
    const requested = searchParams.get("redirect") || searchParams.get("returnUrl")
    const safe =
      requested && requested.startsWith("/") && !requested.startsWith("//")
        ? requested
        : null
    if (safe && safe !== localizeHref(pathname, "/signin")) {
      router.push(safe)
      return
    }
    const role = user.role?.toLowerCase()
    router.push(
      localizeHref(
        pathname,
        role === "creator" ? "/creator/dashboard" : role === "admin" ? "/admin" : "/explore"
      )
    )
  }, [isAuthenticated, user, router, searchParams, pathname])

  return (
    <>
      <style>{`
        @keyframes breathe {
          0%,100% { transform:scale(1);    filter:drop-shadow(0 0   0px rgba(142,120,251,0));   }
          50%      { transform:scale(1.06); filter:drop-shadow(0 6px 24px rgba(142,120,251,.55)); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @media (prefers-reduced-motion:no-preference) {
          .logo-breathe { animation: breathe 3s ease-in-out infinite; }
        }
        .fade-up-1 { animation: fadeUp .5s ease-out .05s both; }
        .fade-up-2 { animation: fadeUp .5s ease-out .15s both; }
        .fade-up-3 { animation: fadeUp .5s ease-out .25s both; }
      `}</style>

      {/* ── Top-right toggles ── */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>

      {/* ── Page ── */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8 fade-up-1">
            <Link href={localizeHref(pathname, "/")} className="logo-breathe">
              <Image src="/logo_chabaqa.png" alt="Chabaqa" width={190} height={76} priority />
            </Link>
            <div
              className="w-10 h-[3px] rounded-full mt-4"
              style={{ background: "linear-gradient(90deg,#8e78fb,#c4b8fd)" }}
            />
          </div>

          {/* Headline */}
          <div className="text-center mb-7 fade-up-2">
            <h1 className="text-[22px] font-black mb-1" style={{ color: "var(--t1,#111827)" }}>
              {t("headline")}
            </h1>
            <p className="text-[14px]" style={{ color: "var(--t2,#6b7280)" }}>{t("subheadline")}</p>
          </div>

          {/* Form card */}
          <div className="fade-up-3">
            <SignInForm />
          </div>

          <p className="text-center text-[12px] mt-5" style={{ color: "#9ca3af" }}>{t("footer")}</p>
        </div>
      </div>
    </>
  )
}
