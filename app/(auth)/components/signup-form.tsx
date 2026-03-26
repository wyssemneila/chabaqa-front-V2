"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { signupAction } from "../signup/actions"
import {
  signUpSchema,
  validatePasswordStrength,
  getPasswordStrengthLabel,
} from "@/lib/validation/auth.validation"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import { ChabaSpinner } from "@/components/ui/ChabaSpinner"

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function Err({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-[12px] flex items-center gap-1" style={{ color: "#dc2626" }}>
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </p>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

const STRENGTH_COLORS = ["#e5e7eb","#f87171","#fb923c","#fbbf24","#34d399","#10b981","#059669"]

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignUpForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [name, setName]                           = useState("")
  const [email, setEmail]                         = useState("")
  const [password, setPassword]                   = useState("")
  const [confirmPassword, setConfirmPassword]     = useState("")
  const [numtel, setNumtel]                       = useState("")
  const [dateNaissance, setDateNaissance]         = useState("")
  const [dobDay, setDobDay]                       = useState("")
  const [dobMonth, setDobMonth]                   = useState("")
  const [dobYear, setDobYear]                     = useState("")
  const [agreeToTerms, setAgreeToTerms]           = useState(false)
  const [showPw, setShowPw]                       = useState(false)
  const [showCpw, setShowCpw]                     = useState(false)
  const [loading, setLoading]                     = useState(false)
  const [error, setError]                         = useState("")
  const [fe, setFe]                               = useState<Record<string, string>>({})
  const [strength, setStrength]                   = useState({ score: 0, feedback: [] as string[] })

  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const t            = useTranslations("auth.signupForm")

  useEffect(() => {
    const inv = searchParams.get("email")
    if (inv && !email) setEmail(inv)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setStrength(password ? validatePasswordStrength(password) : { score: 0, feedback: [] })
  }, [password])

  const validate = () => {
    setFe({})
    try { signUpSchema.parse({ name, email, password, confirmPassword, numtel, dateNaissance, agreeToTerms }); return true }
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
      const res = await signupAction({ name, email, password, numtel, date_naissance: dateNaissance })
      if (res.success) {
        if (onSuccess) { onSuccess(); return }
        const enc   = encodeURIComponent(res.email || email)
        const tok   = searchParams.get("inviteToken")
        const extra = tok ? `&inviteToken=${encodeURIComponent(tok)}` : ""
        router.push(`${localizeHref(pathname, "/verify-email")}?email=${enc}${extra}`)
      } else {
        setError(res.error || t("unknownError"))
      }
    } catch { setError(t("connectionError")) }
    finally { setLoading(false) }
  }

  const pct   = Math.min(100, (strength.score / 6) * 100)
  const color = STRENGTH_COLORS[strength.score] ?? STRENGTH_COLORS[0]

  return (
    <div
      className="rounded-2xl border p-8 space-y-5"
      style={{ background: "var(--white,#fff)", borderColor: "var(--bd,#e5e7eb)", boxShadow: "0 4px 24px rgba(142,120,251,.1), 0 1px 4px rgba(0,0,0,.05)" }}
    >
      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-[13px] flex gap-2" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          <svg className="h-4 w-4 shrink-0 mt-px" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Full name */}
        <div className="space-y-1.5">
          <label htmlFor="su-name" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>{t("fullName")}</label>
          <input id="su-name" type="text" value={name} autoComplete="name" disabled={loading} required
            onChange={e => { setName(e.target.value); if (fe.name) setFe({ ...fe, name: "" }) }}
            placeholder={t("fullNamePlaceholder")} className={inp(!!fe.name)} />
          <Err msg={fe.name} />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="su-email" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>{t("email")}</label>
          <input id="su-email" type="email" value={email} autoComplete="email" disabled={loading} required
            onChange={e => { setEmail(e.target.value); if (fe.email) setFe({ ...fe, email: "" }) }}
            placeholder={t("emailPlaceholder")} className={inp(!!fe.email)} />
          <Err msg={fe.email} />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="su-phone" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>{t("phoneOptional")}</label>
          <input id="su-phone" type="tel" value={numtel} autoComplete="tel" disabled={loading}
            onChange={e => { setNumtel(e.target.value); if (fe.numtel) setFe({ ...fe, numtel: "" }) }}
            placeholder={t("phonePlaceholder")} className={inp(!!fe.numtel)} />
          <Err msg={fe.numtel} />
        </div>

        {/* Date of birth — 3-select picker */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>{t("birthDateOptional")}</label>
          <div className="grid grid-cols-3 gap-2">
            {(["day", "month", "year"] as const).map(part => {
              const selCls = [
                "w-full h-12 px-3 rounded-xl border text-[14px] outline-none appearance-none cursor-pointer",
                "bg-[var(--white)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                fe.dateNaissance
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-[var(--bd)] focus:border-[#8e78fb] focus:ring-2 focus:ring-[#8e78fb]/15",
              ].join(" ")

              const update = (d: string, m: string, y: string) => {
                setDateNaissance(d && m && y ? `${y}-${m}-${d}` : "")
                if (fe.dateNaissance) setFe(prev => ({ ...prev, dateNaissance: "" }))
              }

              if (part === "day") return (
                <select key="day" value={dobDay} disabled={loading} onChange={e => { setDobDay(e.target.value); update(e.target.value, dobMonth, dobYear) }} className={selCls} style={{ color: dobDay ? "var(--t1,#111827)" : "var(--t3,#9ca3af)" }}>
                  <option value="" disabled>{t("dobDay")}</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
                </select>
              )
              if (part === "month") return (
                <select key="month" value={dobMonth} disabled={loading} onChange={e => { setDobMonth(e.target.value); update(dobDay, e.target.value, dobYear) }} className={selCls} style={{ color: dobMonth ? "var(--t1,#111827)" : "var(--t3,#9ca3af)" }}>
                  <option value="" disabled>{t("dobMonth")}</option>
                  {[["01","monthJan"],["02","monthFeb"],["03","monthMar"],["04","monthApr"],["05","monthMay"],["06","monthJun"],["07","monthJul"],["08","monthAug"],["09","monthSep"],["10","monthOct"],["11","monthNov"],["12","monthDec"]].map(([v, k]) => <option key={v} value={v}>{t(k as any)}</option>)}
                </select>
              )
              return (
                <select key="year" value={dobYear} disabled={loading} onChange={e => { setDobYear(e.target.value); update(dobDay, dobMonth, e.target.value) }} className={selCls} style={{ color: dobYear ? "var(--t1,#111827)" : "var(--t3,#9ca3af)" }}>
                  <option value="" disabled>{t("dobYear")}</option>
                  {Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - 13 - i)).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )
            })}
          </div>
          <Err msg={fe.dateNaissance} />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="su-pw" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>{t("password")}</label>
          <div className="relative">
            <input id="su-pw" type={showPw ? "text" : "password"} value={password}
              autoComplete="new-password" disabled={loading} required
              onChange={e => { setPassword(e.target.value); if (fe.password) setFe({ ...fe, password: "" }) }}
              placeholder={t("passwordPlaceholder")} className={`${inp(!!fe.password)} pe-12`} />
            <button type="button" onClick={() => setShowPw(v => !v)} disabled={loading}
              aria-label={showPw ? "Hide" : "Show"}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--t3,#9ca3af)" }}
              onMouseEnter={e => { e.currentTarget.style.color="#8e78fb"; e.currentTarget.style.background="var(--p2,#ede9ff)" }}
              onMouseLeave={e => { e.currentTarget.style.color="var(--t3,#9ca3af)"; e.currentTarget.style.background="transparent" }}>
              <EyeIcon open={showPw} />
            </button>
          </div>

          {/* Strength bar */}
          {password && (
            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px]" style={{ color: "var(--t3,#9ca3af)" }}>{t("passwordStrength")}</span>
                <span className="text-[11px] font-semibold" style={{ color }}>{getPasswordStrengthLabel(strength.score)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bd,#f3f4f6)" }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
              </div>
              {strength.feedback.length > 0 && (
                <ul className="text-[11px] space-y-0.5" style={{ color: "var(--t3,#9ca3af)" }}>
                  {strength.feedback.map((f, i) => <li key={i}>· {f}</li>)}
                </ul>
              )}
            </div>
          )}
          <Err msg={fe.password} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="su-cpw" className="text-[13px] font-semibold" style={{ color: "var(--t1,#111827)" }}>{t("confirmPassword")}</label>
          <div className="relative">
            <input id="su-cpw" type={showCpw ? "text" : "password"} value={confirmPassword}
              autoComplete="new-password" disabled={loading} required
              onChange={e => { setConfirmPassword(e.target.value); if (fe.confirmPassword) setFe({ ...fe, confirmPassword: "" }) }}
              placeholder={t("confirmPasswordPlaceholder")} className={`${inp(!!fe.confirmPassword)} pe-12`} />
            <button type="button" onClick={() => setShowCpw(v => !v)} disabled={loading}
              aria-label={showCpw ? "Hide" : "Show"}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--t3,#9ca3af)" }}
              onMouseEnter={e => { e.currentTarget.style.color="#8e78fb"; e.currentTarget.style.background="var(--p2,#ede9ff)" }}
              onMouseLeave={e => { e.currentTarget.style.color="var(--t3,#9ca3af)"; e.currentTarget.style.background="transparent" }}>
              <EyeIcon open={showCpw} />
            </button>
          </div>
          <Err msg={fe.confirmPassword} />
        </div>

        {/* Terms */}
        <div className="space-y-1">
          <div className="flex items-start gap-2.5">
            <input type="checkbox" id="su-terms" checked={agreeToTerms} disabled={loading}
              onChange={e => { setAgreeToTerms(e.target.checked); if (fe.agreeToTerms) setFe({ ...fe, agreeToTerms: "" }) }}
              className="w-4 h-4 mt-0.5 shrink-0 rounded cursor-pointer accent-[#8e78fb]" />
            <div className="text-[13px] leading-relaxed" style={{ color: "var(--t2,#6b7280)" }}>
              <label htmlFor="su-terms" className="cursor-pointer">{t("agreePrefix")} </label>
              <Link href={localizeHref(pathname, "/terms-of-service")} target="_blank" rel="noopener noreferrer"
                className="font-semibold underline" style={{ color: "#8e78fb" }}>{t("terms")}</Link>
              {" "}{t("and")}{" "}
              <Link href={localizeHref(pathname, "/privacy-policy")} target="_blank" rel="noopener noreferrer"
                className="font-semibold underline" style={{ color: "#8e78fb" }}>{t("privacy")}</Link>.
            </div>
          </div>
          <Err msg={fe.agreeToTerms} />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[.98] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)", boxShadow: "0 4px 14px rgba(142,120,251,.4)" }}>
          {loading ? (
            <>
              <ChabaSpinner size={18} />
              {t("creatingAccount")}
            </>
          ) : t("createAccount")}
        </button>
      </form>

      {/* Sign-in link */}
      <p className="text-center text-[13px]" style={{ color: "var(--t2,#6b7280)" }}>
        {t("alreadyHaveAccount")}{" "}
        <Link href={localizeHref(pathname, "/signin")} className="font-semibold hover:underline" style={{ color: "#8e78fb" }}>
          {t("signIn")}
        </Link>
      </p>
    </div>
  )
}
