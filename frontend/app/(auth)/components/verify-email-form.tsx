"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader2 } from "lucide-react"
import { verifyEmailOtpAction, resendEmailOtpAction } from "../verify-email/actions"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"

interface VerifyEmailFormProps {
  email: string
  inviteToken?: string
}

export default function VerifyEmailForm({ email, inviteToken }: VerifyEmailFormProps) {
  const t = useTranslations("auth.verifyEmailForm")
  const [verificationDigits, setVerificationDigits] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const verificationCode = verificationDigits.join("")

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (!email) {
      setError(t("errors.missingEmail"))
    }
  }, [email, t])

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setInfo("")

    if (!email) {
      setError(t("errors.missingEmail"))
      return
    }

    if (verificationCode.length !== 6) {
      setError(t("errors.codeLength"))
      return
    }

    setIsLoading(true)
    try {
      const result = await verifyEmailOtpAction({ email, verificationCode })
      if (!result.success) {
        setError(result.error || t("errors.invalidCode"))
        return
      }

      setIsSuccess(true)
      setInfo(result.message || t("successTitle"))
      setTimeout(() => {
        if (inviteToken) {
          // After verification, redirect to sign-in with invite redirect
          const redirect = `${localizeHref(pathname, "/signin")}?message=${encodeURIComponent(t("signInNotice"))}&redirect=${encodeURIComponent(`/invitation/${inviteToken}`)}`
          router.push(redirect)
        } else {
          const redirect = `${localizeHref(pathname, "/signin")}?message=${encodeURIComponent(t("signInNotice"))}`
          router.push(redirect)
        }
      }, 1400)
    } catch {
      setError(t("errors.verifyFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    const nextDigits = [...verificationDigits]
    nextDigits[index] = value
    setVerificationDigits(nextDigits)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !verificationDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleDigitPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("")
    if (digits.length === 0) return
    const nextDigits = ["", "", "", "", "", ""]
    digits.forEach((digit, index) => {
      nextDigits[index] = digit
    })
    setVerificationDigits(nextDigits)
    inputRefs.current[Math.min(digits.length, 5)]?.focus()
  }

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || isResending) return

    setIsResending(true)
    setError("")
    setInfo("")

    try {
      const result = await resendEmailOtpAction(email)
      if (!result.success) {
        setError(result.error || t("errors.resendFailed"))
        return
      }

      setInfo(result.message || t("resendSent"))
      setResendCooldown(60)
    } catch {
      setError(t("errors.resendFailed"))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <div className="text-center mb-8 animate-fade-in-delay-400">
        {!isSuccess ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">{t("title")}</h2>
            <p className="text-gray-700 drop-shadow-sm">
              {t("introPrefix")} <strong>{email || t("yourEmailFallback")}</strong>.
            </p>
            <p className="text-sm text-gray-600 mt-2 drop-shadow-sm">{t("codeExpires")}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">{t("successTitle")}</h2>
            <p className="text-gray-700 drop-shadow-sm">{t("successBody")}</p>
          </>
        )}
      </div>

      <div className="backdrop-blur-xl bg-white/25 border border-white/40 p-8 rounded-3xl shadow-2xl animate-fade-in-delay-600">
        {!isSuccess ? (
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100/80 backdrop-blur-sm border border-red-200 rounded-2xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {info && (
              <div className="p-4 bg-emerald-100/80 backdrop-blur-sm border border-emerald-200 rounded-2xl">
                <p className="text-emerald-700 text-sm">{info}</p>
              </div>
            )}

            <div className="space-y-3 animate-fade-in-delay-800">
              <Label htmlFor="verificationCode-0" className="text-sm font-medium text-gray-800 block">
                {t("verificationCodeLabel")}
              </Label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {verificationDigits.map((digit, index) => (
                  <Input
                    key={index}
                    id={`verificationCode-${index}`}
                    ref={(element) => {
                      inputRefs.current[index] = element
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(event) => handleDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleDigitKeyDown(index, event)}
                    onPaste={index === 0 ? handleDigitPaste : undefined}
                    required
                    disabled={isLoading}
                    className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-white/60 text-center text-xl font-semibold shadow-sm transition-all duration-300 focus:border-[#8e78fb] focus:ring-4 focus:ring-[#8e78fb]/20 bg-white/90"
                    maxLength={1}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-gray-600">{t("pasteHint")}</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>{t("verifying")}</span>
                </>
              ) : (
                <span className="relative z-10">{t("verifyAndCreate")}</span>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0 || !email}
              className="w-full py-4 px-6 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-white/60 text-gray-700 font-semibold text-base shadow-lg hover:shadow-xl hover:border-[#8e78fb] transition-all duration-300 relative overflow-hidden group hover:bg-white disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>{t("resending")}</span>
                </>
              ) : resendCooldown > 0 ? (
                <span>{t("resendIn", { seconds: resendCooldown })}</span>
              ) : (
                <span>{t("resendCode")}</span>
              )}
            </Button>
          </form>
        ) : (
          <Link href={localizeHref(pathname, "/signin")}>
            <Button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105">
              <span className="relative z-10">{t("goToSignIn")}</span>
            </Button>
          </Link>
        )}

        <div className="mt-8 text-center animate-fade-in-delay-1200">
          <div className="text-sm text-gray-700 drop-shadow-sm">
            {t("wrongEmail")}{" "}
            <Link
              href={localizeHref(pathname, "/signup")}
              className="text-[#47c7ea] hover:text-[#3bb5d6] font-medium transition-all duration-200 hover:underline"
            >
              {t("backToSignup")}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
