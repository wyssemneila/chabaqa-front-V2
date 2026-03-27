"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { signInSchema } from "@/lib/validation/auth.validation"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import { ChabaSpinner } from "@/components/ui/ChabaSpinner"
import { inp, Err, EyeIcon } from "./form-helpers"

const DEMO_ACCOUNTS = [
  { label: "Learner", role: "learner", color: "#47c7ea", bg: "#e4f8fd" },
  { label: "Creator", role: "creator", color: "#8e78fb", bg: "#ede9ff" },
  { label: "Admin",   role: "admin",   color: "#f65887", bg: "#ffe4ee" },
]

function isSafeRedirect(p: string | null): p is string {
  return !!p && p.startsWith("/") && !p.startsWith("//")
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignInForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [email, setEmail]           = useState("")
  const [password, setPassword]     = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState("")
  const [success, setSuccess]       = useState("")
  const [fe, setFe]                 = useState<Record<string, string>>({})
  const [showPw, setShowPw]         = useState(false)

  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { toast }    = useToast()
  const { login, updateAuth } = useAuthContext()
  const t            = useTranslations("auth.signinForm")

  useEffect(() => {
    const msg = searchParams.get("message")
    if (msg) setSuccess(msg)
  }, [searchParams])

  const validate = () => {
    setFe({})
    try { signInSchema.parse({ email, password, rememberMe }); return true }
    catch (e: any) {
      const errs: Record<string, string> = {}
      e.errors?.forEach((x: any) => { errs[x.path[0]] = x.message })
      setFe(errs); return false
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("")
    if (!validate()) return
    setLoading(true)
    try {
      await login({ email, password, rememberMe })
      onSuccess?.()
    } catch (err: any) {
      const msg = err.message || t("loginFailed")
      setError(msg)
      toast({ variant: "destructive", title: t("connectionError"), description: msg, duration: 5000 })
    } finally { setLoading(false) }
  }

  const demoLogin = (demo: typeof DEMO_ACCOUNTS[number]) => {
    const fakeToken = `demo-token-${demo.role}-${Date.now()}`
    const demoUser = {
      _id: `demo-${demo.role}`,
      name: `Demo ${demo.label}`,
      username: `demo_${demo.role}`,
      email: `demo-${demo.role}@chabaqa.io`,
      role: demo.role,
    }
    updateAuth(fakeToken, demoUser)
    if (demo.role === "creator") {
      router.push(localizeHref(pathname, "/creator/dashboard"))
    } else if (demo.role === "admin") {
      router.push(localizeHref(pathname, "/admin"))
    } else {
      router.push(localizeHref(pathname, "/explore"))
    }
  }

  const googleLogin = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api`
    const raw  = searchParams.get("redirect")
    const dest = isSafeRedirect(raw) ? localizeHref(pathname, raw) : localizeHref(pathname, "/explore")
    window.location.href = `${base}/auth/google?redirect=${encodeURIComponent(dest)}`
  }

  return (
    <div
      className="rounded-2xl border p-8 space-y-5"
      style={{ background: "var(--white,#fff)", borderColor: "var(--bd,#e5e7eb)", boxShadow: "0 4px 24px rgba(142,120,251,.1), 0 1px 4px rgba(0,0,0,.05)" }}
    >
      {/* Success */}
      {success && (
        <div className="px-4 py-3 rounded-xl text-[13px]" style={{ background: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46" }}>
          {success}
        </div>
      )}
      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-[13px] flex gap-2" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          <svg className="h-4 w-4 shrink-0 mt-px" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Demo accounts ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-dashed p-3 space-y-2" style={{ borderColor: "var(--p3,#c4b8fd)", background: "var(--p2,#ede9ff)08" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-center" style={{ color: "var(--p,#8e78fb)" }}>
          ⚡ Demo accounts
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          {DEMO_ACCOUNTS.map(demo => (
            <button
              key={demo.label}
              type="button"
              onClick={() => demoLogin(demo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
              style={{ background: demo.bg, color: demo.color, border: `1.5px solid ${demo.color}30` }}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: demo.color }}>
                {demo.label[0]}
              </span>
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="si-email" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>
            {t("email")}
          </label>
          <input
            id="si-email" type="email" value={email} autoComplete="email"
            spellCheck={false} autoCorrect="off" autoCapitalize="none"
            disabled={loading} required
            onChange={e => { setEmail(e.target.value); if (fe.email) setFe({ ...fe, email: "" }) }}
            placeholder={t("emailPlaceholder")}
            className={inp(!!fe.email)}
          />
          <Err msg={fe.email} />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="si-password" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="si-password" type={showPw ? "text" : "password"} value={password}
              autoComplete="current-password" spellCheck={false} disabled={loading} required
              onChange={e => { setPassword(e.target.value); if (fe.password) setFe({ ...fe, password: "" }) }}
              placeholder={t("passwordPlaceholder")}
              className={`${inp(!!fe.password)} pe-12`}
            />
            <button
              type="button" onClick={() => setShowPw(v => !v)} disabled={loading}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--t3,#9ca3af)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#8e78fb"; e.currentTarget.style.background = "var(--p2,#ede9ff)" }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--t3,#9ca3af)"; e.currentTarget.style.background = "transparent" }}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
          <Err msg={fe.password} />
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox" id="si-remember" checked={rememberMe} disabled={loading}
            onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-[#8e78fb]"
          />
          <label htmlFor="si-remember" className="text-[13px] cursor-pointer" style={{ color: "var(--t2,#6b7280)" }}>
            {t("rememberMe")}
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full h-12 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[.98] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)", boxShadow: "0 4px 14px rgba(142,120,251,.4)" }}
        >
          {loading ? (
            <>
              <ChabaSpinner size={18} />
              {t("signingIn")}
            </>
          ) : t("signIn")}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" style={{ borderColor: "var(--bd,#e5e7eb)" }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider" style={{ background: "var(--white,#fff)", color: "var(--t3,#9ca3af)" }}>
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        {/* Google */}
        <button
          type="button" onClick={googleLogin} disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl border text-[14px] font-semibold transition-all duration-200 disabled:opacity-50 hover:-translate-y-px"
          style={{ borderColor: "var(--bd,#e5e7eb)", color: "var(--t1,#111827)", background: "var(--white,#fff)" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#c4b8fd"; e.currentTarget.style.background = "#fafafe" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff" }}
        >
          <GoogleIcon />
          {t("continueWithGoogle")}
        </button>
      </form>

      {/* Links */}
      <div className="pt-1 flex flex-col items-center gap-3 text-[13px]">
        <Link
          href={localizeHref(pathname, "/forgot-password")}
          className="font-semibold hover:underline transition-colors"
          style={{ color: "#8e78fb" }}
        >
          {t("forgotPassword")}
        </Link>
        <p style={{ color: "var(--t2,#6b7280)" }}>
          {t("newToChabaqa")}{" "}
          <Link href={localizeHref(pathname, "/signup")} className="font-semibold hover:underline" style={{ color: "#8e78fb" }}>
            {t("createAccount")}
          </Link>
        </p>
      </div>
    </div>
  )
}
