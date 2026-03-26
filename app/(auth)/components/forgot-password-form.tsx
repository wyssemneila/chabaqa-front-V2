"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Mail, Loader2 } from "lucide-react"
import { forgotPasswordAction } from "../forgot-password/actions"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import { usePathname } from "next/navigation"
import { ChabaSpinner } from "@/components/ui/ChabaSpinner"

// ── Shared input class builder ────────────────────────────────────────────────
function inp(err?: boolean) {
  return [
    "w-full h-12 px-4 rounded-xl border text-[14px] outline-none",
    "placeholder-[var(--t3)] text-[var(--t1)] bg-[var(--white)]",
    "transition-all duration-200",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    err
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
      : "border-[var(--bd)] focus:border-[#8e78fb] focus:ring-2 focus:ring-[#8e78fb]/15",
  ].join(" ")
}

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPasswordForm")
  const pathname = usePathname()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await forgotPasswordAction({ email })

      if (result.success) {
        setIsSubmitted(true)
      } else {
        setError(result.error || t("errors.generic"))
      }
    } catch {
      setError(t("errors.connection"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl border p-8 space-y-5"
      style={{
        background: "var(--white,#fff)",
        borderColor: "var(--bd,#e5e7eb)",
        boxShadow: "0 4px 24px rgba(142,120,251,.1), 0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      {!isSubmitted ? (
        <>
          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-[13px] flex gap-2" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
              <svg className="h-4 w-4 shrink-0 mt-px" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="fp-email" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>
                {t("emailLabel")}
              </label>
              <input
                id="fp-email"
                type="email"
                value={email}
                autoComplete="email"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                disabled={isLoading}
                required
                onChange={e => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className={inp()}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[.98] flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)", boxShadow: "0 4px 14px rgba(142,120,251,.4)" }}
            >
              {isLoading ? (
                <>
                  <ChabaSpinner size={18} />
                  {t("sending")}
                </>
              ) : t("sendCode")}
            </button>
          </form>
        </>
      ) : (
        <div className="space-y-5">
          {/* Success icon + message */}
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#8e78fb 0%,#47c7ea 100%)" }}
            >
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--t1,#111827)" }}>{t("checkEmailTitle")}</p>
              <p className="text-[13px]" style={{ color: "var(--t2,#6b7280)" }}>
                {t("checkEmailBody")} <strong style={{ color: "var(--t1,#111827)" }}>{email}</strong>
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--t3,#9ca3af)" }}>{t("codeExpires")}</p>
            </div>
          </div>

          <p className="text-[13px] text-center" style={{ color: "var(--t2,#6b7280)" }}>{t("missingCodeHint")}</p>

          {/* Enter code */}
          <Link href={`${localizeHref(pathname, "/reset-password")}?email=${encodeURIComponent(email)}`}>
            <button
              className="w-full h-12 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[.98] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)", boxShadow: "0 4px 14px rgba(142,120,251,.4)" }}
            >
              {t("enterCode")}
            </button>
          </Link>

          {/* Try different email */}
          <button
            onClick={() => setIsSubmitted(false)}
            className="w-full h-12 rounded-xl border text-[14px] font-semibold transition-all duration-200 hover:opacity-80 active:scale-[.98]"
            style={{ borderColor: "var(--bd,#e5e7eb)", color: "var(--t1,#111827)", background: "var(--white,#fff)" }}
          >
            {t("tryDifferentEmail")}
          </button>
        </div>
      )}

      {/* Back to sign in */}
      <div className="pt-1 text-center text-[13px]">
        <span style={{ color: "var(--t2,#6b7280)" }}>{t("rememberPassword")}{" "}</span>
        <Link
          href={localizeHref(pathname, "/signin")}
          className="font-semibold hover:underline transition-colors"
          style={{ color: "#8e78fb" }}
        >
          {t("signIn")}
        </Link>
      </div>
    </div>
  )
}
