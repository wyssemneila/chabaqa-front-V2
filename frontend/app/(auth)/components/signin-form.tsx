"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Shield, AlertCircle } from "lucide-react"
import { signInSchema } from "@/lib/validation/auth.validation"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"

interface SignInFormProps {
  onSuccess?: () => void
}

function isSafeRedirect(path: string | null): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//")
}

export default function SignInForm({ onSuccess }: SignInFormProps = {}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { login } = useAuthContext()
  const t = useTranslations("auth.signinForm")

  useEffect(() => {
    const message = searchParams.get("message")
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  const validateForm = (): boolean => {
    setFieldErrors({})
    try {
      signInSchema.parse({ email, password, rememberMe })
      return true
    } catch (err: any) {
      const errors: Record<string, string> = {}
      if (err.errors) {
        err.errors.forEach((error: any) => {
          const path = error.path[0]
          errors[path] = error.message
        })
      }
      setFieldErrors(errors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await login({ email, password, rememberMe })
      if (onSuccess) onSuccess()
      // Redirect is handled in AuthProvider
    } catch (err: any) {
      const errorMessage = err.message || t("loginFailed")
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: t("connectionError"),
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" ? `${window.location.origin}/api` : "/api")
    const requestedRedirect = searchParams.get("redirect")
    const safeRedirect = isSafeRedirect(requestedRedirect)
      ? localizeHref(pathname, requestedRedirect)
      : localizeHref(pathname, "/explore")
    const url = `${apiBase}/auth/google?redirect=${encodeURIComponent(safeRedirect)}`
    window.location.href = url
  }

  return (
    <>
      {/* Login Card */}
      <div className="backdrop-blur-xl bg-white/25 border border-white/40 p-8 rounded-3xl shadow-2xl animate-fade-in-delay-600">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-100/80 backdrop-blur-sm border border-green-200 rounded-2xl">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100/80 backdrop-blur-sm border border-red-200 rounded-2xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2 animate-fade-in-delay-800">
            <Label htmlFor="email" className="text-sm font-medium text-gray-800 block">
              {t("email")}
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                data-gramm="false"
                data-ms-editor="false"
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
                }}
                placeholder={t("emailPlaceholder")}
                required
                disabled={isLoading}
                className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${fieldErrors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
                  }`}
              />
              {fieldErrors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.email}
                </div>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2 animate-fade-in-delay-900">
            <Label htmlFor="password" className="text-sm font-medium text-gray-800 block">
              {t("password")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                data-gramm="false"
                data-ms-editor="false"
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                }}
                placeholder={t("passwordPlaceholder")}
                required
                disabled={isLoading}
                className={`w-full px-4 py-4 pr-12 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${fieldErrors.password
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#86e4fd] transition-colors duration-200 disabled:opacity-50"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {fieldErrors.password && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.password}
                </div>
              )}
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center space-x-2 animate-fade-in-delay-950">
            <input
              type="checkbox"
              id="rememberMe"
              aria-label={t("rememberMe")}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300 text-[#86e4fd] focus:ring-[#86e4fd]"
            />
            <Label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
              {t("rememberMe")}
            </Label>
          </div>

          {/* Sign In Button */}
          <div className="animate-fade-in-delay-1000">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>{t("signingIn")}</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="relative z-10">{t("signIn")}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7c66e9] to-[#3bb5d6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-gray-600">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <div className="animate-fade-in-delay-1100">
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-white/50 text-gray-700 font-semibold text-lg shadow-lg hover:shadow-xl hover:border-[#86e4fd] transition-all duration-300 relative overflow-hidden group hover:bg-white/95 disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{t("continueWithGoogle")}</span>
              </div>
            </Button>
          </div>
        </form>

        {/* Additional Links */}
        <div className="mt-8 text-center space-y-4 animate-fade-in-delay-1200">
          <Link
            href={localizeHref(pathname, "/forgot-password")}
            className="text-sm text-[#86e4fd] hover:text-[#74d4f0] font-medium transition-all duration-200 hover:underline block drop-shadow-sm"
          >
            {t("forgotPassword")}
          </Link>
          <div className="text-sm text-gray-700 drop-shadow-sm">
            {t("newToChabaqa")}{" "}
            <Link
              href={localizeHref(pathname, "/signup")}
              className="text-[#86e4fd] hover:text-[#74d4f0] font-medium transition-all duration-200 hover:underline"
            >
              {t("createAccount")}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
