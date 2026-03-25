"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, CommunityModerationDto } from "@/lib/api/admin-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

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

export default function CommunityDetailsPage({ params }: { params: { id: string } }) {
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
        const response = await adminApi.communities.getCommunityDetails(params.id)
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
  }, [isAuthenticated, authLoading, params.id])

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
      const response = await adminApi.communities.getCommunityDetails(params.id)
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
          <Card>
            <CardHeader>
              <CardTitle>Community Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground mt-1">{community.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Creator</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {community.creator?.username} ({community.creator?.email})
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={community.status} />
                </div>
              </div>

              {community.approvalNotes && (
                <div>
                  <Label className="text-sm font-medium">Approval Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{community.approvalNotes}</p>
                </div>
              )}

              {community.rejectionReason && (
                <div>
                  <Label className="text-sm font-medium">Rejection Reason</Label>
                  <p className="text-sm text-red-600 mt-1">{community.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members Section */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {community.membersCount || 0} total members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {community.members && community.members.length > 0 ? (
                <div className="space-y-2">
                  {community.members.slice(0, 10).map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{member.username || member.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  ))}
                  {community.members.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {community.members.length - 10} more...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No member data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                {community.contentCount || 0} total content items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {community.content && community.content.length > 0 ? (
                <div className="space-y-2">
                  {community.content.slice(0, 10).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">{item.title || item.name || 'Untitled'}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.type || 'Unknown type'})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
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
                      </div>
                    </div>
                  ))}
                  {community.content.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {community.content.length - 10} more...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No content data available
                </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ${community.analytics?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Active Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {community.analytics?.activeMembers || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Content Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {community.analytics?.contentPublished || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {community.analytics?.engagementRate?.toFixed(1) || '0.0'}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Detailed analytics charts coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
