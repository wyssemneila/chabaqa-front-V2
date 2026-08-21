"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { communitiesApi } from "@/lib/api/communities.api"
import { AlertTriangle, ArrowRight, Loader2, Lock, Users } from "lucide-react"
import type { InvitePreview } from "@/lib/api/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

function extractMessage(payload: any): string {
  if (!payload) return ""
  if (typeof payload === "string") return payload
  if (Array.isArray(payload)) {
    return payload.map((entry) => extractMessage(entry)).filter(Boolean).join(", ")
  }
  if (typeof payload === "object") {
    return (
      extractMessage(payload.message) ||
      extractMessage(payload.error?.message) ||
      extractMessage(payload.error) ||
      ""
    )
  }
  return ""
}

function getAuthHeader(): string | null {
  if (typeof window === "undefined") return null
  const raw =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token")

  if (!raw) return null
  return raw.toLowerCase().startsWith("bearer ") ? raw : `Bearer ${raw}`
}

function formatCurrency(amount: number, currency?: string): string {
  const normalizedCurrency = currency || "TND"
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`
  }
}

export default function InvitePage() {
  const params = useParams<{ inviteCode: string }>()
  const router = useRouter()
  const inviteCode = useMemo(() => {
    const raw = Array.isArray(params?.inviteCode) ? params?.inviteCode[0] : params?.inviteCode
    return typeof raw === "string" ? raw.trim() : ""
  }, [params])

  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(Boolean(getAuthHeader()))
  }, [])

  useEffect(() => {
    const loadPreview = async () => {
      if (!inviteCode) {
        setError("Invalid invitation code.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `${API_BASE}/community-aff-crea-join/validate-invite/${encodeURIComponent(inviteCode)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        )

        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(extractMessage(payload) || "This invitation link is invalid or expired.")
        }

        const invitePreview = payload?.data || payload
        setPreview(invitePreview)
      } catch (fetchError: any) {
        setError(fetchError?.message || "Unable to validate this invitation link.")
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [inviteCode])

  const handleSignIn = () => {
    const redirectPath = `/invite/${inviteCode}`
    const encoded = encodeURIComponent(redirectPath)
    router.push(`/signin?redirect=${encoded}&returnUrl=${encoded}`)
  }

  const handleContinue = async () => {
    if (!preview || submitting) return

    const authHeader = getAuthHeader()
    if (!authHeader) {
      handleSignIn()
      return
    }

    if ((preview.price || 0) > 0) {
      const slug = preview.slug || ""
      if (!slug) {
        setError("Unable to continue checkout for this invite.")
        return
      }
      router.push(
        `/community/${encodeURIComponent(slug)}/checkout?inviteCode=${encodeURIComponent(inviteCode)}`,
      )
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await communitiesApi.join({ inviteCode })

      if (preview.slug) {
        router.push(`/community/${encodeURIComponent(preview.slug)}/home?joined=1`)
      } else {
        router.push("/explore")
      }
    } catch (joinError: any) {
      setError(joinError?.message || "Failed to join community")
    } finally {
      setSubmitting(false)
    }
  }

  const price = Number(preview?.price || 0)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-chabaqa-primary" />
              <p className="mt-4 text-gray-600">Validating invitation...</p>
            </div>
          ) : error || !preview ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
              <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
              <h1 className="mt-4 text-2xl font-bold text-gray-900">Invitation unavailable</h1>
              <p className="mt-2 text-red-700">{error || "This invitation link is invalid or expired."}</p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/explore">Back to Explore</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                  <Image
                    src={preview.logo || preview.coverImage || "/placeholder.svg"}
                    alt={preview.name || "Community"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{preview.name}</h1>
                    <Badge className="bg-gray-100 text-gray-800 border border-gray-200">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  </div>
                  <p className="mt-2 text-gray-600">
                    {preview.description || "You were invited to join this private community."}
                  </p>
                  <div className="mt-3 flex gap-3 flex-wrap text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {preview.membersCount || 0} members
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(price, preview.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-700">
                  {isAuthenticated
                    ? price > 0
                      ? "Continue to checkout to complete your private community access."
                      : "You can join this private community now with this invitation."
                    : "Sign in to continue using this invitation link."}
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleContinue}
                  disabled={submitting}
                  className="sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : !isAuthenticated ? (
                    "Sign in to continue"
                  ) : price > 0 ? (
                    "Continue to checkout"
                  ) : (
                    "Join private community"
                  )}
                  {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/explore">Back to Explore</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
