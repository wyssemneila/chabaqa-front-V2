"use client"

import React, { useMemo } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, CommunityModerationDto } from "@/lib/api/admin-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Building2, 
  Users, 
  FileText, 
  ArrowLeft, 
  Save,
  TrendingUp,
  Calendar,
  Star,
  CheckCircle,
  ExternalLink,
  Globe,
  Hash,
  Mail,
  ShieldCheck,
  UserCircle
} from "lucide-react"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface CommunityDetails {
  _id: string
  name: string
  slug: string
  description: string
  creator: {
    _id: string
    username: string
    email: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
  featured: boolean
  verified: boolean
  isVerified?: boolean
  isActive?: boolean
  membersCount: number
  contentCount: number
  createdAt: string
  approvalNotes?: string
  adminNotes?: string
  rejectionReason?: string
  members?: any[]
  content?: any[]
  analytics?: {
    totalRevenue: number
    activeMembers: number
    contentPublished: number
    engagementRate: number
  }
}

export default function CommunityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [community, setCommunity] = useState<CommunityDetails | null>(null)
  
  // Moderation settings state
  const [featured, setFeatured] = useState(false)
  const [verified, setVerified] = useState(false)
  const [active, setActive] = useState(true)
  const [moderationNotes, setModerationNotes] = useState('')

  const resolveVerified = (data: Partial<CommunityDetails> | null | undefined) =>
    Boolean(data?.verified ?? data?.isVerified ?? false)

  const resolveActive = (data: Partial<CommunityDetails> | null | undefined) => {
    if (typeof data?.isActive === 'boolean') return data.isActive
    return data?.status === 'active' || data?.status === 'approved'
  }

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch community details
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchCommunityDetails = async () => {
      setLoading(true)
      try {
        const response = await adminApi.communities.getCommunityDetails(id)
        const data = response.data as CommunityDetails
        
        setCommunity(data)
        setFeatured(data.featured || false)
        setVerified(resolveVerified(data))
        setActive(resolveActive(data))
        setModerationNotes(data.adminNotes || '')
      } catch (error) {
        console.error('[Community Details] Fetch error:', error)
        toast.error('Failed to load community details')
      } finally {
        setLoading(false)
      }
    }

    fetchCommunityDetails()
  }, [isAuthenticated, authLoading, id])

  // Handle save moderation settings
  const handleSaveSettings = async () => {
    if (!community) return

    setSaving(true)
    try {
      const data: CommunityModerationDto = {
        featured,
        verified,
        isActive: active,
        adminNotes: moderationNotes || undefined,
      }

      await adminApi.communities.moderateCommunity(community._id, data)
      toast.success('Community settings updated successfully')
      
      // Refresh data
      const response = await adminApi.communities.getCommunityDetails(id)
      const updatedData = response.data as CommunityDetails
      setCommunity(updatedData)
      setFeatured(Boolean(updatedData.featured))
      setVerified(resolveVerified(updatedData))
      setActive(resolveActive(updatedData))
      setModerationNotes(updatedData.adminNotes || '')
    } catch (error) {
      console.error('[Save Settings] Error:', error)
      toast.error('Failed to update community settings')
    } finally {
      setSaving(false)
    }
  }

  // Helper to generate content URL
  const getContentUrl = (type: string, id: string) => {
    // Fallback to home if slug is missing
    const slug = community?.slug || 'community';
    
    switch (type) {
      case 'course':
        return `/${slug}/courses/${id}`
      case 'event':
        return `/${slug}/events/${id}`
      case 'product':
        return `/${slug}/products/${id}`
      case 'post':
        return `/${slug}/home` // Posts are usually on the feed
      default:
        return `/${slug}`
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString()
  }

  const getMemberName = (member: any) =>
    member?.username || member?.name || member?.user?.username || member?.user?.name || 'Unknown member'

  const getMemberEmail = (member: any) =>
    member?.email || member?.user?.email || member?.profile?.email || ''

  const getMemberAvatar = (member: any) =>
    member?.avatar || member?.image || member?.user?.avatar || member?.user?.profilePicture || ''

  const getInitials = (value: string) =>
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'M'

  const members = Array.isArray(community?.members) ? community.members : []
  const contentItems = Array.isArray(community?.content) ? community.content : []
  const visibleMembersCount = Math.max(community?.membersCount || 0, members.length)
  const visibleContentCount = Math.max(community?.contentCount || 0, contentItems.length)
  const activeMembersCount = community?.analytics?.activeMembers || 0
  const inactiveMembersCount = Math.max(visibleMembersCount - activeMembersCount, 0)
  const engagementRate = community?.analytics?.engagementRate || 0
  const totalRevenue = community?.analytics?.totalRevenue || 0
  const contentPublished = community?.analytics?.contentPublished || visibleContentCount

  const memberGrowthData = useMemo(() => {
    const counts = new Map<string, number>()

    members.forEach((member: any) => {
      const dateValue = member?.joinedAt || member?.createdAt || member?.membership?.joinedAt
      const parsed = dateValue ? new Date(dateValue) : null
      const label = parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'Unknown'
      counts.set(label, (counts.get(label) || 0) + 1)
    })

    let runningTotal = 0
    return Array.from(counts.entries()).map(([date, joined]) => {
      runningTotal += joined
      return { date, joined, total: runningTotal }
    })
  }, [members])

  const contentMixData = useMemo(() => {
    const counts = new Map<string, number>()

    contentItems.forEach((item: any) => {
      const type = item?.type || 'unknown'
      counts.set(type, (counts.get(type) || 0) + 1)
    })

    return Array.from(counts.entries()).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
    }))
  }, [contentItems])

  const performanceData = [
    { metric: 'Members', value: visibleMembersCount },
    { metric: 'Active', value: activeMembersCount },
    { metric: 'Content', value: contentPublished },
    { metric: 'Engagement', value: Math.round(engagementRate) },
  ]

  const memberStatusData = [
    { name: 'Active', value: activeMembersCount },
    { name: 'Inactive', value: inactiveMembersCount },
  ].filter((item) => item.value > 0)

  const revenuePerMember = visibleMembersCount > 0 ? totalRevenue / visibleMembersCount : 0
  const contentPerMember = visibleMembersCount > 0 ? contentPublished / visibleMembersCount : 0
  const chartColors = ['#2563eb', '#16a34a', '#f59e0b', '#db2777', '#7c3aed', '#0891b2']

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Community not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/communities')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {community.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Community Details & Management
            </p>
          </div>
        </div>
        <StatusBadge status={community.status} size="lg" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {community.membersCount || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Content Items</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {community.contentCount || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Created</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {new Date(community.createdAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Status Badges</CardDescription>
            <div className="flex gap-2 mt-2">
              {community.featured && (
                <StatusBadge status="Featured" variant="info" size="sm" />
              )}
              {resolveVerified(community) && (
                <StatusBadge status="Verified" variant="success" size="sm" />
              )}
              {!community.featured && !resolveVerified(community) && (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="information" className="space-y-6">
        <TabsList>
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="moderation">Moderation Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="information" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Community Information</CardTitle>
                    <CardDescription>Core profile, creator ownership, and publishing state.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={community.status} />
                    {community.featured && <Badge variant="secondary">Featured</Badge>}
                    {resolveVerified(community) && <Badge variant="secondary">Verified</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span className="truncate">{community.slug || community._id}</span>
                      </div>
                      <h2 className="text-2xl font-semibold tracking-normal">{community.name}</h2>
                      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                        {community.description || 'No description provided.'}
                      </p>
                    </div>
                    {community.slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/${community.slug}`, '_blank')}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        View public page
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <UserCircle className="h-4 w-4 text-primary" />
                      Creator
                    </div>
                    <p className="font-medium">{community.creator?.username || 'Unknown creator'}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{community.creator?.email || 'No email available'}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Governance
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="mt-1 font-medium capitalize">{community.status}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Featured</p>
                        <p className="mt-1 font-medium">{community.featured ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Verified</p>
                        <p className="mt-1 font-medium">{resolveVerified(community) ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {(community.approvalNotes || community.rejectionReason) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {community.approvalNotes && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                        <Label className="text-sm font-medium text-emerald-950">Approval Notes</Label>
                        <p className="mt-2 text-sm leading-6">{community.approvalNotes}</p>
                      </div>
                    )}

                    {community.rejectionReason && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-950">
                        <Label className="text-sm font-medium text-red-950">Rejection Reason</Label>
                        <p className="mt-2 text-sm leading-6">{community.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
                <CardDescription>Current community scale and activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="mt-2 text-2xl font-semibold">{visibleMembersCount}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Content</p>
                    <p className="mt-2 text-2xl font-semibold">{visibleContentCount}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="mt-2 text-2xl font-semibold">{community.analytics?.activeMembers || 0}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {community.analytics?.totalRevenue?.toFixed(0) || '0'} DT
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="mt-2 font-medium">{formatDate(community.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members Section */}
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  Showing all {visibleMembersCount} members returned by the admin API.
                </CardDescription>
              </div>
              <Badge variant="outline">{members.length} loaded</Badge>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member: any, index: number) => {
                        const name = getMemberName(member)
                        const email = getMemberEmail(member)
                        const avatar = getMemberAvatar(member)
                        return (
                          <TableRow key={member?._id || member?.id || member?.user?._id || index}>
                            <TableCell>
                              <div className="flex min-w-0 items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={avatar} alt={name} />
                                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {member?._id || member?.id || member?.user?._id || 'No id'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {email || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {member?.role || member?.membershipRole || 'member'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatDate(member?.joinedAt || member?.createdAt || member?.membership?.joinedAt)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">No member records returned</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The community count may exist, but the details response did not include member rows.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Showing all {visibleContentCount} content items returned by the admin API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentItems.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentItems.map((item: any, index: number) => (
                        <TableRow key={item?._id || item?.id || index}>
                          <TableCell>
                            <p className="font-medium">{item.title || item.name || 'Untitled'}</p>
                            <p className="text-xs text-muted-foreground">{item._id || item.id || 'No id'}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {item.type || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => window.open(getContentUrl(item.type, item._id), '_blank')}
                              title="View Content"
                              disabled={!community.slug}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-10 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">No content records returned</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Published content will appear here when the details endpoint includes it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Settings Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
              <CardDescription>
                Configure community visibility and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Featured Community
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display this community in featured sections
                  </p>
                </div>
                <Switch
                  checked={featured}
                  onCheckedChange={setFeatured}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Verified Community
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show verification badge on community profile
                  </p>
                </div>
                <Switch
                  checked={verified}
                  onCheckedChange={setVerified}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Active Status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Community is active and accessible to members
                  </p>
                </div>
                <Switch
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moderation-notes">Moderation Notes</Label>
                <Textarea
                  id="moderation-notes"
                  placeholder="Add internal notes about this community..."
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  These notes are internal and not visible to the community creator
                </p>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  {totalRevenue.toLocaleString()} DT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {revenuePerMember.toFixed(1)} DT per member
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Members</CardDescription>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <Users className="h-6 w-6 text-primary" />
                  {activeMembersCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {visibleMembersCount > 0 ? ((activeMembersCount / visibleMembersCount) * 100).toFixed(1) : '0.0'}% of {visibleMembersCount} members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Content Published</CardDescription>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <FileText className="h-6 w-6 text-primary" />
                  {contentPublished}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {contentPerMember.toFixed(2)} items per member
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Engagement Rate</CardDescription>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  {engagementRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(Math.max(engagementRate, 0), 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
                <CardDescription>Cumulative member count based on returned join dates.</CardDescription>
              </CardHeader>
              <CardContent>
                {memberGrowthData.length > 0 ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={memberGrowthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="Total members"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="joined"
                          name="Joined"
                          stroke="#16a34a"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    No member join dates returned
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Member Status</CardTitle>
                <CardDescription>Active versus inactive member split from analytics.</CardDescription>
              </CardHeader>
              <CardContent>
                {memberStatusData.length > 0 ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={memberStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={105}
                          paddingAngle={4}
                        >
                          {memberStatusData.map((entry, index) => (
                            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    No member status data returned
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground">Active</p>
                    <p className="mt-1 text-lg font-semibold">{activeMembersCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground">Inactive</p>
                    <p className="mt-1 text-lg font-semibold">{inactiveMembersCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Mix</CardTitle>
                <CardDescription>Distribution of content items returned for this community.</CardDescription>
              </CardHeader>
              <CardContent>
                {contentMixData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contentMixData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="type" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="count" name="Items" radius={[6, 6, 0, 0]}>
                          {contentMixData.map((entry, index) => (
                            <Cell key={entry.type} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    No content rows returned
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Profile</CardTitle>
                <CardDescription>Comparable scale metrics from the community response.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="metric"
                        width={90}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" name="Value" radius={[0, 6, 6, 0]} fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
