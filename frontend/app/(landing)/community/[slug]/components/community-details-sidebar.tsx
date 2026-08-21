"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  UserPlus, 
  Lock, 
  Users, 
  TrendingUp,
  CheckCircle,
  Crown,
  Star
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface CommunityDetailsSidebarProps {
  community: any
}

export function CommunityDetailsSidebar({ community }: CommunityDetailsSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const joinedParam = searchParams?.get('joined')
  const [clientIsMember, setClientIsMember] = useState(false)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? (
        localStorage.getItem('accessToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('access_token')
      ) : null
      if (!raw) return
      const jwt = raw.toLowerCase().startsWith('bearer ') ? raw.slice(7) : raw
      const parts = jwt.split('.')
      if (parts.length < 2) return
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      const userId = String(payload?.sub || payload?._id || payload?.id || '')
      if (!userId) return
      const members = (community as any)?.members
      if (Array.isArray(members)) {
        const found = members.some((m: any) => {
          if (typeof m === 'string') return m === userId
          const mid = String(m?._id || m?.id || '')
          return mid === userId
        })
        if (found) setClientIsMember(true)
      }
    } catch {}
  }, [community])

  const isMember = (community as any)?.isMember === true || joinedParam === '1' || clientIsMember
  const isFree = community.priceType === 'free' || community.price === 0
  const isPrivate =
    typeof (community as any)?.isPrivate === 'boolean'
      ? Boolean((community as any).isPrivate)
      : Boolean(
          community.settings &&
          typeof community.settings === 'object' &&
          community.settings.visibility === 'private',
        )

  const handleJoin = async () => {
    // Check if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    
    if (!token) {
      toast.error("Please sign in to join this community")
      router.push(`/signin`)
      return
    }

    if (isPrivate) {
      toast.info("This is a private community. Use an invitation link to join.")
      return
    }

    // If it's a paid community, redirect to checkout
    if (community.price > 0) {
      router.push(`/community/${community.slug}/checkout`)
      return
    }

    // For free communities, use the embedded join section on the details page
    router.push(`/community/${community.slug}#join-section`)
  }

  return (
    <div className="space-y-6 sticky top-24">
      {/* Join Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Membership</h3>
            {isMember ? (
              <Badge variant="outline" className="border-chabaqa-primary text-chabaqa-primary">
                <CheckCircle className="w-3 h-3 mr-1" /> Member
              </Badge>
            ) : isFree ? (
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                Free
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="text-center py-4">
            {isMember ? (
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">Official Community Member</p>
                <p className="text-sm text-gray-600">You have full access to this community</p>
              </div>
            ) : (
              isFree ? (
                <div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">Free</p>
                  <p className="text-sm text-gray-600">No payment required</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {community.price} TND
                  </p>
                  <p className="text-sm text-gray-600">
                    {community.priceType === 'monthly' ? 'Per month' : 
                     community.priceType === 'yearly' ? 'Per year' : 
                     'One-time payment'}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Join Button (hidden if already member) */}
          {!isMember && (
            <Button
              onClick={handleJoin}
              disabled={isPrivate}
              className="w-full h-14 text-lg font-semibold bg-chabaqa-primary hover:bg-chabaqa-primary/90 text-white transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrivate ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Invitation required
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  {isFree ? "Join for Free" : "Join Now"}
                </>
              )}
            </Button>
          )}

          {isPrivate && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <Lock className="w-3 h-3" />
              <span>Private community - Invitation required</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">
          Community Stats
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chabaqa-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-chabaqa-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700">Members</span>
            </div>
            <span className="font-bold text-lg text-gray-900">{Array.isArray(community.members) ? community.members.length : (community.members || 0)}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chabaqa-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-chabaqa-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700">Rank</span>
            </div>
            <Badge variant="outline" className="border-chabaqa-primary text-chabaqa-primary capitalize">
              {community.featured ? "Featured" : "Standard"}
            </Badge>
          </div>

          {community.rating > 0 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chabaqa-primary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-chabaqa-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Rating</span>
              </div>
              <span className="font-bold text-lg text-gray-900">{community.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* What's Included Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">
          What's Included
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-chabaqa-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">Access to all community content</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-chabaqa-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">Participate in discussions</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-chabaqa-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">Join challenges and events</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-chabaqa-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">Connect with other members</span>
          </li>
          {!isFree && (
            <li className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-chabaqa-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 font-semibold">Premium content and resources</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
