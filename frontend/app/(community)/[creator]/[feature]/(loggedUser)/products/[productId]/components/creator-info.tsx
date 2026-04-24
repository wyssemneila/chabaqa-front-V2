"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Calendar, Loader2 } from "lucide-react"
import { usersApi, CreatorProfile, CreatorStats } from "@/lib/api/users.api"
import { getUserProfileHref } from "@/lib/profile-handle"

interface CreatorInfoProps {
  product: any
}

function normalizeCreatorId(value: any): string {
  if (!value) return ""

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed || trimmed === "[object Object]") {
      return ""
    }
    const objectIdMatch = trimmed.match(/[a-fA-F0-9]{24}/)
    return objectIdMatch ? objectIdMatch[0] : trimmed
  }

  if (typeof value === "object") {
    const nestedCandidates = [value._id, value.id, value.creatorId, value.userId]
    for (const candidate of nestedCandidates) {
      const normalized = normalizeCreatorId(candidate)
      if (normalized) return normalized
    }
  }

  return ""
}

export default function CreatorInfo({ product }: CreatorInfoProps) {
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null)
  const [loading, setLoading] = useState(true)

  const creatorId = useMemo(() => {
    return normalizeCreatorId(
      product?.creator?.id ??
      product?.creator?._id ??
      product?.creatorId ??
      product?.creator,
    )
  }, [product])

  useEffect(() => {
    if (!creatorId) {
      setLoading(false)
      return
    }

    const loadCreatorData = async () => {
      setLoading(true)
      try {
        const [profile, stats] = await Promise.all([
          usersApi.getProfile(creatorId),
          usersApi.getCreatorStats(creatorId),
        ])
        setCreatorProfile(profile)
        setCreatorStats(stats)
      } catch (error) {
        console.error('Failed to load creator data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCreatorData()
  }, [creatorId])

  // Display values with fallbacks
  const displayName = creatorProfile?.name || product?.creator?.name || "Unknown Creator"
  const displayAvatar = creatorProfile?.profile_picture || creatorProfile?.photo_profil || creatorProfile?.avatar || product?.creator?.avatar
  const displayBio = creatorProfile?.bio || product?.creator?.bio
  const displayJoinDate = creatorProfile?.createdAt || product?.creator?.joinDate || product?.creator?.createdAt
  const creatorProfileHref = getUserProfileHref({
    username: (creatorProfile as any)?.username || (product?.creator as any)?.username,
    name: displayName,
  })
  
  // Stats - use fetched stats, fallback to product.creator stats
  const totalProducts = Number(creatorStats?.totalProducts ?? product?.creator?.totalProducts ?? 0)
  const totalSales = Number(
    creatorStats?.totalSales ?? product?.creator?.totalSales ?? product?.sales ?? 0
  )
  const joinYear = displayJoinDate ? new Date(displayJoinDate).getFullYear() : new Date().getFullYear()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-5">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg">Creator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 pb-5 sm:space-y-6 sm:pb-6">
        {/* Creator Profile */}
        <Link href={creatorProfileHref} className="flex items-start gap-3 sm:gap-4 hover:opacity-90 transition-opacity">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0">
            <AvatarImage 
              src={displayAvatar || "/placeholder.svg"} 
              className="object-cover"
            />
            <AvatarFallback className="text-sm sm:text-base font-medium">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            <div>
              <h3 className="font-semibold text-sm sm:text-base truncate hover:underline">
                {displayName}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {product?.category || "Digital"} Specialist
              </p>
            </div>
          </div>
        </Link>

        {/* Creator Stats */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:gap-4 sm:p-4">
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">
              {totalProducts}
            </div>
            <div className="text-xs text-muted-foreground">Products</div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">
              {totalSales.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Sales</div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">
              {joinYear}
            </div>
            <div className="text-xs text-muted-foreground">Joined</div>
          </div>
        </div>

        {/* Creator Description */}
        {displayBio && (
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {displayBio}
            </p>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 pt-2 text-center">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Verified Creator</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Active seller</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
