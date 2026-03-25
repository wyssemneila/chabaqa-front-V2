"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Users as UsersIcon, MessageSquare, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { communitiesApi } from '@/lib/api/communities.api'
import { useAuthContext } from '@/app/providers/auth-provider'
import type { CommunityMember } from '@/lib/api/types'
import { getUserProfileHref } from '@/lib/profile-handle'
import { ROLE_LABELS, ROLE_COLORS, type CommunityRole } from '@/lib/permissions'

interface Community {
  id: string
  _id?: string
  name: string
  creatorId?: string
}

const resolveEntityId = (value: any): string => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)

  const nested = value._id ?? value.id ?? value.userId ?? value.creatorId ?? value.createurId
  if (nested && nested !== value) {
    return resolveEntityId(nested)
  }

  if (typeof value.toString === 'function') {
    const text = value.toString().trim()
    return text === '[object Object]' ? '' : text
  }

  return ''
}

const resolveMemberUserId = (member: CommunityMember): string => {
  const user = member.user as any
  return resolveEntityId(user) || resolveEntityId(member.userId)
}

export default function CommunityMembersPage({ params }: { params: Promise<{ creator?: string; feature: string }> }) {
  const resolvedParams = React.use(params)
  const { feature } = resolvedParams
  const creatorSlug = resolvedParams.creator || ""
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [search, setSearch] = useState('')
  const { user: currentUser } = useAuthContext()
  const myId = resolveEntityId(currentUser)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)
        setError(null)

        const communityRes = await communitiesApi.getBySlug(feature)
        const c = communityRes.data as any
        const creatorId = resolveEntityId(c?.createur || c?.creator || c?.creatorId || c?.createurId)

        setCommunity({
          id: resolveEntityId(c?.id) || resolveEntityId(c?._id),
          _id: c._id,
          name: c.name,
          creatorId,
        })

        const communityId = resolveEntityId(c?._id) || resolveEntityId(c?.id)
        if (!communityId) {
          throw new Error('Community identifier is missing')
        }
        const membersRes: any = await communitiesApi.getMembers(communityId, { page: 1, limit: 200 })

        const items = Array.isArray(membersRes?.data)
          ? membersRes.data
          : Array.isArray(membersRes?.data?.data)
            ? membersRes.data.data
            : []

        setMembers(items)
      } catch (err: any) {
        console.error('Error loading community members:', err)
        setError(err?.message || err?.error || 'Failed to load members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [feature])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const source = !q
      ? members
      : members.filter((m) => {
        const name = `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim().toLowerCase()
        const username = (m.user?.username || '').toLowerCase()
        const email = (m.user?.email || '').toLowerCase()
        const role = (m.role || '').toLowerCase()
        return name.includes(q) || username.includes(q) || email.includes(q) || role.includes(q)
      })

    return [...source].sort((a, b) => {
      const aIsSelf = resolveMemberUserId(a) === myId
      const bIsSelf = resolveMemberUserId(b) === myId
      if (aIsSelf === bIsSelf) return 0
      return aIsSelf ? -1 : 1
    })
  }, [members, search, myId])

  const membersStats = useMemo(() => {
    const total = members.length
    const owners = members.filter((m) => m.role === 'owner').length
    const admins = members.filter((m) => m.role === 'admin').length
    const moderators = members.filter((m) => m.role === 'moderator').length
    const support = members.filter((m) => m.role === 'support').length
    return { total, owners, admins, moderators, support }
  }, [members])

  const myMembership = useMemo(
    () => members.find((member) => resolveMemberUserId(member) === myId) || null,
    [members, myId],
  )

  const isCommunityCreator = useMemo(() => {
    if (!community?.creatorId || !myId) return false
    return String(community.creatorId) === String(myId)
  }, [community?.creatorId, myId])

  const handleLeaveCommunity = async () => {
    if (!community?.id || isLeaving) return

    if (isCommunityCreator) {
      setActionError('Community owner cannot quit their own community.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to quit "${community.name}"? You will lose access to this community content.`,
    )
    if (!confirmed) return

    try {
      setActionError(null)
      setIsLeaving(true)
      await communitiesApi.leaveCommunity(community.id || community._id || '')
      router.push('/explore')
      router.refresh()
    } catch (err: any) {
      console.error('Error leaving community:', err)
      setActionError(err?.message || err?.error || 'Failed to leave community')
    } finally {
      setIsLeaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <div className="text-center max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold mb-2">Failed to load members</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-sky-600 to-cyan-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Members</h1>
              </div>
              <div className="text-cyan-100 text-sm">
                {community?.name ? `${community.name} community` : 'Community members'}
              </div>
            </div>

            <p className="text-cyan-100 text-sm md:ml-4 mt-2 md:mt-0">
              Connect and message people in the community
            </p>

            <div className="flex flex-wrap gap-6 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-xl font-bold">{membersStats.total}</div>
                <div className="text-cyan-100 text-xs">Members</div>
              </div>
              {membersStats.owners > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold">{membersStats.owners}</div>
                  <div className="text-cyan-100 text-xs">Owner</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-xl font-bold">{membersStats.admins}</div>
                <div className="text-cyan-100 text-xs">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{membersStats.moderators}</div>
                <div className="text-cyan-100 text-xs">Moderators</div>
              </div>
              {membersStats.support > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold">{membersStats.support}</div>
                  <div className="text-cyan-100 text-xs">Support</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredMembers.length} of {membersStats.total} members
          </div>
          <div className="w-full sm:w-80">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members by name, username, email, role..."
            />
          </div>
        </div>

        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const user = member.user as any
            const fullName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Member'
            const initials = fullName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p: string) => p[0])
              .join('')
              .toUpperCase()

            const memberId = resolveMemberUserId(member)
            const isSelf = memberId === myId
            const memberProfileHref = getUserProfileHref({
              username: user?.username,
              name: fullName,
            })
            const communityId = community?.id || community?._id || ""
            const communityPath = creatorSlug ? `/${creatorSlug}/${feature}` : ""
            const profileQuery = new URLSearchParams()
            if (communityId) profileQuery.set("communityId", String(communityId))
            if (communityPath) profileQuery.set("communityPath", communityPath)
            const profileHrefWithContext = profileQuery.toString()
              ? `${memberProfileHref}?${profileQuery.toString()}`
              : memberProfileHref

            return (
              <Card key={member.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={profileHrefWithContext} className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.avatar || (user as any)?.profile_picture || (user as any)?.photo_profil || (user as any)?.photo || '/placeholder.svg'} />
                        <AvatarFallback>{initials || 'U'}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{fullName}</div>
                        {user?.email && (
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                        )}
                        {user?.username && (
                          <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      {isSelf && (
                        <Badge variant="secondary">You</Badge>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[(member.role as CommunityRole) || 'member']}`}>
                        {ROLE_LABELS[(member.role as CommunityRole) || 'member']}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    {isSelf ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={isLeaving || isCommunityCreator || !myMembership}
                        onClick={handleLeaveCommunity}
                        title={isCommunityCreator ? 'Community owner cannot quit the community' : 'Quit community'}
                      >
                        {isLeaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        {isCommunityCreator ? 'Owner' : isLeaving ? 'Leaving...' : 'Quit'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const targetUserId = resolveMemberUserId(member)
                          const communityId = community?.id || community?._id
                          const basePath = creatorSlug ? `/${creatorSlug}/${feature}` : `/${feature}`
                          const query = new URLSearchParams()
                          if (communityId) query.set("communityId", String(communityId))
                          if (targetUserId) query.set("targetUserId", String(targetUserId))
                          router.push(`${basePath}/messages?${query.toString()}`)
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        DM
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center text-muted-foreground py-10">No members found.</div>
        )}
      </div>
    </div>
  )
}
