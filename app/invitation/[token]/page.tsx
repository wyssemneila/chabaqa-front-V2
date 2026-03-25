"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Lock, Users, ExternalLink } from "lucide-react"
import { communityInvitationsApi, type TokenValidation } from "@/lib/api/community-invitations.api"

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [validation, setValidation] = useState<TokenValidation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const { tokenStorage } = require("@/lib/token-storage")
        const accessToken = tokenStorage.getAccessToken()
        setIsLoggedIn(!!accessToken)
      } catch {
        setIsLoggedIn(false)
      }
    }
  }, [])

  // Validate token
  useEffect(() => {
    if (!token) return
    setLoading(true)
    communityInvitationsApi
      .validateToken(token)
      .then((data) => {
        setValidation(data)
        if (data.isAccepted) setAccepted(true)
      })
      .catch((err) => {
        setError(err?.message || "Invalid or expired invitation")
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleAccept = useCallback(async () => {
    if (!token) return
    setAccepting(true)
    try {
      const result = await communityInvitationsApi.acceptInvitation(token)
      setAccepted(true)
      // Redirect to community page after short delay
      setTimeout(() => {
        if (result.communitySlug) {
          router.push(`/community/${result.communitySlug}`)
        } else {
          router.push("/dashboard")
        }
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "Failed to accept invitation")
    } finally {
      setAccepting(false)
    }
  }, [token, router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Validating your invitation...</p>
        </Card>
      </div>
    )
  }

  // Error / not found
  if (error && !validation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invitation Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Explore Chabaqa
          </Button>
        </Card>
      </div>
    )
  }

  if (!validation) return null

  // Expired
  if (validation.isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invitation Expired</h1>
          <p className="text-muted-foreground mb-6">
            This invitation to join <strong>{validation.communityName}</strong> has expired.
            Please ask the community creator to send a new one.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Explore Chabaqa
          </Button>
        </Card>
      </div>
    )
  }

  // Revoked
  if (validation.isRevoked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invitation Revoked</h1>
          <p className="text-muted-foreground mb-6">
            This invitation to join <strong>{validation.communityName}</strong> has been revoked
            by the community creator.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Explore Chabaqa
          </Button>
        </Card>
      </div>
    )
  }

  // Already accepted
  if (accepted || validation.isAccepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">You&apos;re In!</h1>
          <p className="text-muted-foreground mb-6">
            You&apos;re now a member of <strong>{validation.communityName}</strong>.
          </p>
          <Button
            onClick={() =>
              router.push(
                validation.communitySlug
                  ? `/community/${validation.communitySlug}`
                  : "/dashboard",
              )
            }
          >
            Go to Community
          </Button>
        </Card>
      </div>
    )
  }

  // Valid invitation — show accept prompt
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />

        <div className="p-8 text-center">
          {/* Community avatar */}
          {validation.communityAvatar ? (
            <img
              src={validation.communityAvatar}
              alt={validation.communityName}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          )}

          <h1 className="text-2xl font-bold mb-1">{validation.communityName}</h1>
          <p className="text-muted-foreground mb-4">
            <strong>{validation.creatorName}</strong> invited you to join
          </p>

          {/* Personal message */}
          {validation.personalMessage && (
            <div className="bg-purple-50 border-l-4 border-purple-400 rounded-r-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 italic">
                &ldquo;{validation.personalMessage}&rdquo;
              </p>
            </div>
          )}

          {/* Actions based on login state */}
          {isLoggedIn ? (
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Join {validation.communityName}
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() =>
                  router.push(
                    `/signup?email=${encodeURIComponent(validation.email)}&inviteToken=${encodeURIComponent(token)}`,
                  )
                }
              >
                Create your free account & join
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  className="text-purple-600 hover:underline font-medium"
                  onClick={() =>
                    router.push(
                      `/signin?redirect=${encodeURIComponent(`/invitation/${token}`)}`,
                    )
                  }
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
