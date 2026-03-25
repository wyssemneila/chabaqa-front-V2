"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, UserDetails } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { 
  ArrowLeft, 
  Ban, 
  CheckCircle, 
  Key, 
  Mail, 
  Calendar,
  Coins,
  Users,
  BookOpen,
  Edit
} from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

interface UserDetailsPageProps {
  params: {
    id: string
  }
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [notes, setNotes] = useState("")
  const [editingNotes, setEditingNotes] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  
  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  
  // Action loading states
  const [suspending, setSuspending] = useState(false)
  const [activating, setActivating] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  
  // Input values for dialogs
  const [suspendReason, setSuspendReason] = useState("")
  const [activateReason, setActivateReason] = useState("")

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch user details
  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      const response = await adminApi.users.getUserDetails(params.id)
      const data = response.data as UserDetails
      setUserDetails(data)
      setNotes(data.user?.notes || "")
    } catch (error) {
      console.error('[UserDetails] Fetch error:', error)
      toast.error('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    fetchUserDetails()
  }, [isAuthenticated, authLoading, params.id])

  // Handle suspend user
  const handleSuspendUser = async () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a suspension reason')
      return
    }
    
    setSuspending(true)
    try {
      await adminApi.users.suspendUser(params.id, {
        reason: suspendReason,
        notifyUser: true,
      })
      toast.success('User suspended successfully')
      setSuspendDialogOpen(false)
      setSuspendReason("")
      await fetchUserDetails()
    } catch (error) {
      console.error('[UserDetails] Suspend error:', error)
      toast.error('Failed to suspend user')
    } finally {
      setSuspending(false)
    }
  }

  // Handle activate user
  const handleActivateUser = async () => {
    if (!activateReason.trim()) {
      toast.error('Please provide an activation reason')
      return
    }
    
    setActivating(true)
    try {
      await adminApi.users.activateUser(params.id, {
        reason: activateReason,
        notifyUser: true,
      })
      toast.success('User activated successfully')
      setActivateDialogOpen(false)
      setActivateReason("")
      await fetchUserDetails()
    } catch (error) {
      console.error('[UserDetails] Activate error:', error)
      toast.error('Failed to activate user')
    } finally {
      setActivating(false)
    }
  }

  // Handle reset password
  const handleResetPassword = async () => {
    setResettingPassword(true)
    try {
      await adminApi.users.resetPassword(params.id, {
        sendEmail: true,
      })
      toast.success('Password reset email sent successfully')
      setResetPasswordDialogOpen(false)
    } catch (error) {
      console.error('[UserDetails] Reset password error:', error)
      toast.error('Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  // Handle save notes
  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await adminApi.users.updateNotes(params.id, notes)
      toast.success('Notes saved successfully')
      setEditingNotes(false)
    } catch (error) {
      console.error('[UserDetails] Save notes error:', error)
      toast.error('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-muted-foreground">User not found</p>
          <Button onClick={() => router.push('/admin/users')} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  const { user, activityHistory, subscriptions, communities, statistics } = userDetails

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <StatusBadge 
            status={user.status}
            variant={
              user.status === 'active' ? 'success' :
              user.status === 'suspended' ? 'danger' :
              'default'
            }
          />
        </div>
        <div className="flex gap-2">
          {user.status === 'active' && (
            <Button
              variant="destructive"
              onClick={() => setSuspendDialogOpen(true)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend User
            </Button>
          )}
          {user.status === 'suspended' && (
            <Button
              variant="default"
              onClick={() => setActivateDialogOpen(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate User
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setResetPasswordDialogOpen(true)}
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {statistics?.totalSpent?.toFixed(2) || '0.00'} TND
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Communities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {statistics?.totalCommunities || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {statistics?.totalCourses || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {statistics?.accountAge || 0} days
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic user account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-sm">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="text-sm capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge 
                    status={user.status}
                    variant={
                      user.status === 'active' ? 'success' :
                      user.status === 'suspended' ? 'danger' :
                      'default'
                    }
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registered</p>
                  <p className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                  <p className="text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent user activities</CardDescription>
            </CardHeader>
            <CardContent>
              {activityHistory && activityHistory.length > 0 ? (
                <div className="space-y-4">
                  {activityHistory.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Active and past subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {subscriptions.map((subscription: any, index: number) => (
                    <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{subscription.planName}</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.community?.name || 'Unknown Community'}
                        </p>
                      </div>
                      <StatusBadge 
                        status={subscription.status}
                        variant={
                          subscription.status === 'active' ? 'success' :
                          subscription.status === 'cancelled' ? 'danger' :
                          'default'
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subscriptions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communities</CardTitle>
              <CardDescription>Communities the user is a member of</CardDescription>
            </CardHeader>
            <CardContent>
              {communities && communities.length > 0 ? (
                <div className="space-y-4">
                  {communities.map((community: any, index: number) => (
                    <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{community.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(community.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/communities/${community._id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not a member of any communities</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>Internal notes about this user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingNotes ? (
                <>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this user..."
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingNotes(false)
                        setNotes(user.notes || "")
                      }}
                      disabled={savingNotes}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">
                    {notes || 'No notes added yet'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setEditingNotes(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Notes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-red-200 dark:border-red-800">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-red-900 dark:text-red-100">
                Suspend User
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Please provide a reason for suspending this user. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter suspension reason..."
              rows={4}
              disabled={suspending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false)
                setSuspendReason("")
              }}
              disabled={suspending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendUser}
              disabled={suspending || !suspendReason.trim()}
            >
              {suspending ? 'Suspending...' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle>
                Activate User
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Please provide a reason for activating this user. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={activateReason}
              onChange={(e) => setActivateReason(e.target.value)}
              placeholder="Enter activation reason..."
              rows={4}
              disabled={activating}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActivateDialogOpen(false)
                setActivateReason("")
              }}
              disabled={activating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivateUser}
              disabled={activating || !activateReason.trim()}
            >
              {activating ? 'Activating...' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
        title="Reset Password"
        description="A password reset email will be sent to the user. Are you sure you want to proceed?"
        confirmLabel="Send Reset Email"
        onConfirm={handleResetPassword}
      />
    </div>
  )
}
