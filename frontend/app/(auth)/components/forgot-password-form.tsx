"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Loader2 } from "lucide-react"
import { forgotPasswordAction } from "../forgot-password/actions"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import { usePathname } from "next/navigation"

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
    <>
      {/* Header Message */}
      <div className="text-center mb-8 animate-fade-in-delay-400">
        {!isSubmitted ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">{t("title")}</h2>
            <p className="text-gray-700 drop-shadow-sm">
              {t("intro")}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">{t("checkEmailTitle")}</h2>
            <p className="text-gray-700 drop-shadow-sm">
              {t("checkEmailBody")} <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-2 drop-shadow-sm">{t("codeExpires")}</p>
          </>
        )}
      </div>

      {/* Reset Card */}
      <div className="backdrop-blur-xl bg-white/25 border border-white/40 p-8 rounded-3xl shadow-2xl animate-fade-in-delay-600">
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100/80 backdrop-blur-sm border border-red-200 rounded-2xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2 animate-fade-in-delay-800">
              <Label htmlFor="email" className="text-sm font-medium text-gray-800 block">
                {t("emailLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-4 rounded-2xl border-2 border-white/60 focus:border-[#8e78fb] focus:ring-4 focus:ring-[#8e78fb]/20 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/80 backdrop-blur-sm disabled:opacity-50 shadow-sm"
                />
              </div>
            </div>

            {/* Reset Button */}
            <div className="animate-fade-in-delay-1000">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>{t("sending")}</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">{t("sendCode")}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7c66e9] to-[#3bb5d6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center space-y-4">
              <p className="text-gray-700 drop-shadow-sm">
                {t("missingCodeHint")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href={`${localizeHref(pathname, "/reset-password")}?email=${encodeURIComponent(email)}`}>
                <Button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105">
                  <span className="relative z-10">{t("enterCode")}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7c66e9] to-[#3bb5d6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>

              <Button
                onClick={() => setIsSubmitted(false)}
                className="w-full py-4 px-6 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-white/60 text-gray-700 font-semibold text-lg shadow-lg hover:shadow-xl hover:border-[#8e78fb] transition-all duration-300 relative overflow-hidden group hover:bg-white"
              >
                <span className="relative z-10">{t("tryDifferentEmail")}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 text-center animate-fade-in-delay-1200">
          <div className="text-sm text-gray-700 drop-shadow-sm">
            {t("rememberPassword")}{" "}
            <Link
              href={localizeHref(pathname, "/signin")}
              className="text-[#47c7ea] hover:text-[#3bb5d6] font-medium transition-all duration-200 hover:underline"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
