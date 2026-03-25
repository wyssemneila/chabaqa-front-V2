"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("admin.login")
  const { loading: authLoading, login, isAuthenticated } = useAdminAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [twoFACode, setTwoFACode] = useState<string | null>(null)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const show2FAForm = requires2FA || (!!twoFACode && isDevelopment)
  const requestedRedirect = searchParams.get("redirect")
  const safeRedirect = requestedRedirect && requestedRedirect.startsWith("/admin")
    ? localizeHref(pathname, requestedRedirect)
    : localizeHref(pathname, "/admin/dashboard")

  // Check if we're in development mode
  useEffect(() => {
    setIsDevelopment(
      process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(safeRedirect)
    }
  }, [authLoading, isAuthenticated, router, safeRedirect])

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      
      const result = await login(data.email, data.password)
      
      if (result.requires2FA) {
        setRequires2FA(true)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("admin_2fa_email", data.email)
        }
        
        // Extract 2FA code from message if in development
        const message = result.message || ''
        const codeMatch = message.match(/Code de vérification: (\d{6})/)
        if (codeMatch && isDevelopment) {
          setTwoFACode(codeMatch[1])
          setRequires2FA(true)
          if (typeof window !== "undefined") {
            sessionStorage.setItem("admin_2fa_code", codeMatch[1])
          }
          toast.success("2FA Code Generated", {
            description: `Development Mode: Code is ${codeMatch[1]}`,
            duration: 10000,
          })
        } else {
          toast.info("2FA Required", {
            description: "Please check your email or backend console for the verification code",
            duration: 5000,
          })
        }

        router.push(localizeHref(pathname, "/admin/verify-2fa"))
      } else {
        toast.success(t("loginSuccess"), {
          description: "Redirecting to dashboard...",
        })
        router.replace(safeRedirect)
      }
    } catch (error: any) {
      console.error('[AdminLogin] Login error:', error)
      toast.error(t("loginFailed"), {
        description: error.message || t("invalidCredentials"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-fill 2FA code in development
  const handleUseDevelopmentCode = () => {
    if (twoFACode) {
      navigator.clipboard.writeText(twoFACode)
      toast.success("Code Auto-filled", {
        description: "Code copied. Continue in the verification screen.",
      })
    }
  }

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (twoFACode) {
      navigator.clipboard.writeText(twoFACode)
      toast.success("Code Copied", {
        description: "Paste it in the verification field",
      })
    }
  }

  if (authLoading) {
    return (
      <div className="admin-auth-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t("signingIn")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-auth-shell flex min-h-screen items-center justify-center p-4">
      <Card className="admin-auth-panel w-full max-w-md rounded-[2rem] border-0 shadow-none">
        <CardHeader className="space-y-3 pb-6">
          <div className="mb-2 flex items-center justify-center">
            <div className="admin-icon-chip h-20 w-20 rounded-[1.75rem] bg-white/90 p-4">
              <Image src="/Logos/PNG/brandmark.png" alt="Chabaqa" width={48} height={48} className="h-12 w-12 object-contain" />
            </div>
          </div>
          <div className="flex justify-center">
            <Image src="/logo_chabaqa.png" alt="Chabaqa" width={136} height={32} className="h-8 w-auto object-contain" />
          </div>
          <CardTitle className="text-center text-3xl font-bold tracking-tight text-foreground">
            {show2FAForm ? t("twoFactorTitle") : t("title")}
          </CardTitle>
          <CardDescription className="text-center text-base text-[hsl(var(--admin-muted))]">
            {show2FAForm
              ? t("twoFactorSubtitle")
              : t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Development Mode Alert */}
          {isDevelopment && !requires2FA && (
            <Alert className="border-[hsl(var(--admin-cyan)/0.22)] bg-[hsl(var(--admin-cyan)/0.08)]">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--admin-cyan))]" />
              <AlertDescription className="ml-2 text-sm text-foreground">
                <strong>Development Mode:</strong> 2FA code will be displayed after login
              </AlertDescription>
            </Alert>
          )}

          {/* 2FA Code Display in Development */}
          {isDevelopment && requires2FA && twoFACode && (
            <Alert className="border-[hsl(var(--admin-success)/0.22)] bg-[hsl(var(--admin-success)/0.08)]">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--admin-success))]" />
              <AlertDescription className="ml-2">
                <div className="flex flex-col gap-3">
                  <strong className="text-sm text-foreground">Development 2FA Code</strong>
                  <div className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--admin-success)/0.18)] bg-white p-3">
                    <code className="flex-1 text-center font-mono text-3xl font-bold tracking-wider text-[hsl(var(--admin-success))]">
                      {twoFACode}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleUseDevelopmentCode}
                    className="bg-[hsl(var(--admin-success))] text-white hover:bg-[hsl(var(--admin-success)/0.92)]"
                  >
                    Auto-fill Code
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form 
            onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
            className="space-y-4"
          >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className="admin-input h-11 rounded-2xl pl-10"
                    {...loginForm.register("email")}
                    disabled={isSubmitting}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t("password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    className="admin-input h-11 rounded-2xl pl-10 pr-10"
                    {...loginForm.register("password")}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {isDevelopment && (
                <Alert className="border-[hsl(var(--admin-warning)/0.22)] bg-[hsl(var(--admin-warning)/0.08)]">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                  <AlertDescription className="ml-2 text-xs text-foreground">
                    <strong>Test Credentials:</strong><br />
                    <span className="font-mono">admin@local.com</span> / <span className="font-mono">Admin@123456</span>
                  </AlertDescription>
                </Alert>
              )}

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl bg-gradient-to-r from-primary to-[hsl(var(--admin-pink))] text-white shadow-lg shadow-[rgba(95,74,180,0.22)] hover:opacity-95"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("signingIn")}
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {t("signIn")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
