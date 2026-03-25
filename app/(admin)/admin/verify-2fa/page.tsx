"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { CheckCircle2, Shield, AlertCircle, Copy } from "lucide-react"

const twoFASchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
})

type TwoFAFormData = z.infer<typeof twoFASchema>

export default function AdminVerify2FAPage() {
  const router = useRouter()
  const { verify2FA, loading: authLoading, isAuthenticated } = useAdminAuth()
  const [email, setEmail] = useState<string>("")
  const [twoFACode, setTwoFACode] = useState<string | null>(null)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const twoFAForm = useForm<TwoFAFormData>({
    resolver: zodResolver(twoFASchema),
    defaultValues: { code: "" },
  })

  useEffect(() => {
    setIsDevelopment(
      process.env.NODE_ENV === "development" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
    )
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/admin/dashboard")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedEmail = sessionStorage.getItem("admin_2fa_email") || ""
    const storedCode = sessionStorage.getItem("admin_2fa_code")
    setEmail(storedEmail)
    setTwoFACode(storedCode)
  }, [])

  const handleCopyCode = () => {
    if (!twoFACode) return
    navigator.clipboard.writeText(twoFACode)
    toast.success("Code Copied", {
      description: "Paste it in the verification field",
    })
  }

  const handleUseDevelopmentCode = () => {
    if (!twoFACode) return
    twoFAForm.setValue("code", twoFACode)
    toast.success("Code Auto-filled", {
      description: "Click Verify & Login to continue",
    })
  }

  const on2FASubmit = async (data: TwoFAFormData) => {
    try {
      setIsSubmitting(true)
      if (!email) {
        toast.error("Missing email", {
          description: "Please sign in again to receive a verification code.",
        })
        router.push("/admin/login")
        return
      }
      await verify2FA(email, data.code)
      toast.success("Verification Successful", {
        description: "Redirecting to dashboard...",
      })
      router.push("/admin/dashboard")
    } catch (error: any) {
      toast.error("Verification Failed", {
        description: error.message || "Invalid verification code. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
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
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center text-base text-[hsl(var(--admin-muted))]">
            Enter the 6-digit verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && twoFACode && (
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

          {!email && (
            <Alert className="border-[hsl(var(--admin-warning)/0.22)] bg-[hsl(var(--admin-warning)/0.08)]">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
              <AlertDescription className="ml-2 text-xs text-foreground">
                Please sign in again to receive a verification code.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={twoFAForm.handleSubmit(on2FASubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                className="admin-input h-14 rounded-2xl text-center font-mono text-3xl tracking-widest"
                {...twoFAForm.register("code")}
                disabled={isSubmitting}
                autoFocus
              />
              {twoFAForm.formState.errors.code && (
                <p className="text-sm text-red-600 text-center">
                  {twoFAForm.formState.errors.code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center pt-1">
                {isDevelopment ? "Use the code above" : "Check your email for the verification code"}
              </p>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl bg-gradient-to-r from-primary to-[hsl(var(--admin-pink))] text-white shadow-lg shadow-[rgba(95,74,180,0.22)] hover:opacity-95"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify & Login
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/admin/login")}
              disabled={isSubmitting}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
