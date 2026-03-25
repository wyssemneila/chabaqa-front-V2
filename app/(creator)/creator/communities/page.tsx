"use client"

import { PageShell } from "@/components/creator-dashboard"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  CheckCircle,
  Trash2,
  Loader2,
  Edit,
  Eye,
  Copy,
  RefreshCcw,
  Lock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { invalidateCommunityCache } from "@/app/(creator)/creator/context/community-switch-cache"

export default function CommunitiesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityStates, setVisibilityStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deleteCommunityId, setDeleteCommunityId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const [regeneratingInviteCommunityId, setRegeneratingInviteCommunityId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Current user
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        const userId = user?._id || user?.id
        if (!userId) { setCommunities([]); return }

        setCurrentUser(user)

        // My created communities
        const myComms = await api.communities.getMyCreated().catch(() => null as any)
        const base = myComms?.data || []

        // Fetch per-community stats (members/engagement)
        const withStats = await Promise.all(base.map(async (c: any) => {
          const derivedPrivate =
            typeof c?.isPrivate === "boolean"
              ? Boolean(c.isPrivate)
              : c?.settings?.visibility === "private"
          try {
            const stats = await api.communities.getStats(c.id || c._id)?.catch(() => null as any)
            const s = stats?.data || {}
            const statsIsPublic =
              typeof s.isPublic === "boolean" ? s.isPublic : undefined
            const isPrivate =
              typeof derivedPrivate === "boolean"
                ? derivedPrivate
                : statsIsPublic === undefined
                  ? false
                  : !statsIsPublic

            return {
              id: c.id || c._id?.toString?.() || c._id,
              slug: c.slug,
              name: c.name,
              description: c.shortDescription || c.short_description || c.longDescription || c.long_description || c.description,
              coverImage: c.coverImage || c.cover || c.image || c.logo,
              verified: Boolean(c.verified),
              members: s.membersCount || s.members || 0,
              stats: {
                engagementRate: Math.round((s.engagementRate || s.avgEngagement || 0)),
                monthlyGrowth: Math.round((s.monthlyGrowth || s.growth || 0)),
              },
              isPublic: !isPrivate,
              isPrivate,
              inviteLink: typeof c?.inviteLink === "string" ? c.inviteLink : "",
              raw: c,
            }
          } catch {
            const isPrivate = Boolean(derivedPrivate)
            return {
              id: c.id || c._id?.toString?.() || c._id,
              slug: c.slug,
              name: c.name,
              description: c.shortDescription || c.short_description || c.longDescription || c.long_description || c.description,
              coverImage: c.coverImage || c.cover || c.image || c.logo,
              verified: Boolean(c.verified),
              members: 0,
              stats: { engagementRate: 0, monthlyGrowth: 0 },
              isPublic: !isPrivate,
              isPrivate,
              inviteLink: typeof c?.inviteLink === "string" ? c.inviteLink : "",
              raw: c,
            }
          }
        }))

        setCommunities(withStats)
        // Seed visibility switches with current state
        setVisibilityStates(Object.fromEntries(withStats.map((c: any) => [c.id, c.isPublic !== false])))
      } catch (e: any) {
        setError(e?.message || 'Failed to load communities')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return communities
    return communities.filter((c) => (c.name || '').toLowerCase().includes(q))
  }, [communities, searchQuery])

  const handleVisibilityChange = async (communityId: string, isPublic: boolean) => {
    setVisibilityStates(prev => ({ ...prev, [communityId]: isPublic }))
    try {
      // Prefer settings endpoint if it supports visibility
      try {
        await (api.communities.updateSettings as any)(communityId, { isPublic })
      } catch {
        await (api.communities.update as any)(communityId, { isPublic })
      }
    } catch {
      // Revert on failure
      setVisibilityStates(prev => ({ ...prev, [communityId]: !isPublic }))
    }
  }

  const getCommunityUrl = (community: any) => {
    const creatorName = currentUser?.name || currentUser?.username || 'creator'
    return `/${encodeURIComponent(creatorName)}/${community.slug}/home`
  }

  const handleDeleteCommunity = async (communityId: string) => {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      const communityToDelete = communities.find((c) => String(c.id) === String(communityId))
      const deleteCandidates = Array.from(
        new Set(
          [
            String(communityId || "").trim(),
            String(communityToDelete?.raw?._id || "").trim(),
            String(communityToDelete?.slug || "").trim(),
          ].filter(Boolean),
        ),
      )

      let deleted = false
      let lastError: any = null
      for (const candidate of deleteCandidates) {
        try {
          await api.communities.delete(candidate as any)
          deleted = true
          break
        } catch (error) {
          lastError = error
        }
      }

      if (!deleted) {
        throw lastError || new Error("Failed to delete community")
      }

      setCommunities((prev) => prev.filter((c) => String(c.id) !== String(communityId)))
      setVisibilityStates((prev) => {
        const next = { ...prev }
        delete next[String(communityId)]
        return next
      })
      invalidateCommunityCache(String(communityId))

      toast({
        title: "Success",
        description: "Community deleted successfully",
      })
      setDeleteCommunityId(null)
      router.refresh()
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || e?.response?.data?.message || "Failed to delete community",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleDescription = (communityId: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [communityId]: !prev[communityId] }))
  }

  const copyInviteLink = async (inviteLink?: string) => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Invite link copied",
        description: "The invitation link is now in your clipboard.",
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy invite link. Please copy it manually.",
        variant: "destructive",
      })
    }
  }

  const regenerateInviteLink = async (communityId: string) => {
    if (!communityId || regeneratingInviteCommunityId) return
    setRegeneratingInviteCommunityId(String(communityId))
    try {
      const response = await (api.communities as any).generateInviteLink(communityId, true)
      const inviteData = response?.data || response
      const nextInviteLink = String(inviteData?.inviteLink || "")

      setCommunities((prev) =>
        prev.map((community) =>
          String(community.id) === String(communityId)
            ? {
                ...community,
                isPrivate: true,
                isPublic: false,
                inviteLink: nextInviteLink,
                raw: {
                  ...(community.raw || {}),
                  isPrivate: true,
                  inviteLink: nextInviteLink,
                },
              }
            : community,
        ),
      )

      toast({
        title: "Invite link regenerated",
        description: "Previous invite links were invalidated immediately.",
      })
    } catch (error: any) {
      toast({
        title: "Regeneration failed",
        description: error?.message || "Unable to regenerate invite link.",
        variant: "destructive",
      })
    } finally {
      setRegeneratingInviteCommunityId(null)
    }
  }

  const shouldShowSeeMore = (description: string) => {
    if (!description) return false
    // Show "Voir plus" if text is longer than ~150 characters (roughly 2 lines)
    return description.length > 150
  }

  return (
    <PageShell className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Communities</h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor all your communities in one place
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild>
            <Link href="/creator/communities/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search communities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-primary/10" : ""}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-primary/10" : ""}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Communities Grid/List */}
      {loading && (
        <div className="text-sm text-muted-foreground">Loading communities...</div>
      )}
      {error && !loading && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <EnhancedCard key={community.id} hover className="overflow-hidden">
              <div className="relative w-full aspect-video overflow-hidden">
                <Image
                  src={community.coverImage || "/placeholder.svg"}
                  alt={community.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute bottom-3 right-3">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-white/90">
                      {community.members} members
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              <CardHeader className="overflow-hidden bg-white" style={{ minHeight: '120px' }}>
                <CardTitle className="flex items-center gap-2 mb-2 text-lg font-bold text-gray-900">
                  <span className="line-clamp-1">{community.name}</span>
                  {community.verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-sm text-gray-600">
                  {community.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{community.stats?.engagementRate ?? 0}% engagement</span>
                      <span className="text-xs text-gray-500">{community.stats?.monthlyGrowth ?? 0}% monthly growth</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline">
                        <Link href={getCommunityUrl(community)}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/creator/community/${community.slug}/customize`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteCommunityId(String(community.id))}
                        className="border-red-200 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-gray-600">Community visibility</span>
                    <Switch
                      checked={visibilityStates[community.id] ?? true}
                      onCheckedChange={(checked) => handleVisibilityChange(community.id, checked)}
                    />
                  </div>
                  {community.isPrivate && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Invite-only access enabled</span>
                      </div>
                      <p className="text-xs text-gray-600 break-all bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5">
                        {community.inviteLink || "No invite link yet. Generate one now."}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(community.inviteLink)}
                          disabled={!community.inviteLink}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateInviteLink(community.id)}
                          disabled={regeneratingInviteCommunityId === String(community.id)}
                        >
                          {regeneratingInviteCommunityId === String(community.id) ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                          )}
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </EnhancedCard>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommunities.map((community) => (
            <EnhancedCard key={community.id} hover>
              <div className="flex items-start gap-4 p-4">
                <div className="relative">
                  <Image
                    src={community.coverImage || "/placeholder.svg"}
                    alt={community.name}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover w-24 h-24"
                  />
                  <Badge variant="secondary" className="absolute bottom-1 right-1 bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold break-words">{community.name}</h3>
                    {community.verified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex-shrink-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-sm text-gray-600 mb-2 break-words overflow-hidden ${expandedDescriptions[community.id] ? "" : "line-clamp-2"}`}>
                      {community.description}
                    </p>
                    {shouldShowSeeMore(community.description) && (
                      <button
                        onClick={() => toggleDescription(community.id)}
                        className="text-xs text-primary hover:underline inline-block"
                      >
                        {expandedDescriptions[community.id] ? "Voir moins" : "Voir plus"}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span>{community.members} members</span>
                    <span>{community.stats?.engagementRate ?? 0}% engagement</span>
                    <span>{community.stats?.monthlyGrowth ?? 0}% monthly growth</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Community visibility</span>
                      <Switch
                        checked={visibilityStates[community.id] ?? true}
                        onCheckedChange={(checked) => handleVisibilityChange(community.id, checked)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline">
                        <Link href={getCommunityUrl(community)}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/creator/community/${community.slug}/customize`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteCommunityId(String(community.id))}
                        className="border-red-200 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  {community.isPrivate && (
                    <div className="mt-3 border-t pt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Invite-only access enabled</span>
                      </div>
                      <p className="text-xs text-gray-600 break-all bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5">
                        {community.inviteLink || "No invite link yet. Generate one now."}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(community.inviteLink)}
                          disabled={!community.inviteLink}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateInviteLink(community.id)}
                          disabled={regeneratingInviteCommunityId === String(community.id)}
                        >
                          {regeneratingInviteCommunityId === String(community.id) ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                          )}
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteCommunityId} onOpenChange={(open) => !open && setDeleteCommunityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete community?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the community.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommunityId && handleDeleteCommunity(deleteCommunityId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <span className="inline-flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty State */}
      {(!loading && filteredCommunities.length === 0) && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No communities found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Start by creating your first community"}
          </p>
          <Button asChild>
            <Link href="/creator/communities/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>
      )}
    </PageShell>
  )
}
