"use client"

import { PageShell } from "@/components/creator-dashboard"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  Search,
  Check,
  Trash2,
  CheckCheck,
  Clock,
  Users,
  BookOpen,
  Trophy,
  Calendar,
  ShoppingBag,
  Zap,
  Coins,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  Settings
} from "lucide-react"
import { notificationsApi, Notification } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"
import { PushSettings } from "@/components/notifications/push-settings"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"
import { MutesList } from "@/components/notifications/mute-actions"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'user_joined':
    case 'member_joined':
    case 'new_community_member':
      return Users
    case 'course_created':
    case 'course_enrolled':
      return BookOpen
    case 'challenge_created':
    case 'challenge_completed':
      return Trophy
    case 'session_created':
    case 'event_created':
      return Calendar
    case 'product_purchased':
      return ShoppingBag
    case 'payment_received':
      return Coins
    case 'analytics_update':
      return TrendingUp
    case 'system_error':
      return XCircle
    case 'success':
      return CheckCircle
    case 'warning':
      return AlertCircle
    default:
      return Bell
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'user_joined':
    case 'member_joined':
    case 'new_community_member':
      return 'bg-blue-500'
    case 'course_created':
    case 'course_enrolled':
      return 'bg-green-500'
    case 'challenge_created':
    case 'challenge_completed':
      return 'bg-yellow-500'
    case 'session_created':
    case 'event_created':
      return 'bg-purple-500'
    case 'product_purchased':
    case 'payment_received':
      return 'bg-pink-500'
    case 'analytics_update':
      return 'bg-indigo-500'
    case 'system_error':
      return 'bg-red-500'
    case 'success':
      return 'bg-emerald-500'
    case 'warning':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "read" | "unread">("all")
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNotifications, setTotalNotifications] = useState(0)

  const fetchNotifications = async (page: number = 1) => {
    if (!isAuthenticated || !user) return

    try {
      setLoading(true)
      setError(null)
      const response = await notificationsApi.getAll({
        page,
        limit: 20
      })

      setNotifications(response.items || [])
      setCurrentPage(response.page || page)
      setTotalPages(Math.ceil((response.total || 0) / 20))
      setTotalNotifications(response.total || 0)
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err)
      setError(err?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    // Debounced search
    const timeout = setTimeout(() => {
      fetchNotifications(1)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId)
      await notificationsApi.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (err: any) {
      console.error('Failed to mark as read:', err)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      )
    } catch (err: any) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.delete(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setTotalNotifications(prev => prev - 1)
    } catch (err: any) {
      console.error('Failed to delete notification:', err)
    }
  }

  const filteredNotifications = (notifications || []).filter(notification => {
    const matchesSearch = !searchQuery ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterType === "all" ||
      (filterType === "read" && notification.isRead) ||
      (filterType === "unread" && !notification.isRead)

    return matchesSearch && matchesFilter
  })

  const unreadCount = (notifications || []).filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => fetchNotifications()}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageShell className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500">Stay updated with your community activities</p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Notifications</p>
              <p className="text-2xl font-bold">{totalNotifications}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unread</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold">
                {notifications.filter(n => {
                  const notificationDate = new Date(n.createdAt)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return notificationDate >= weekAgo
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All ({(notifications || []).length})
            </Button>
            <Button
              variant={filterType === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("unread")}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filterType === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("read")}
            >
              Read ({(notifications || []).length - unreadCount})
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterType !== "all" ? "No notifications found" : "No notifications yet"}
              </h3>
              <p className="text-gray-500">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "You'll see notifications here when there are updates in your community"
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type)
            const colorClass = getNotificationColor(notification.type)

            return (
              <Card
                key={notification.id}
                className={`p-4 hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            New
                          </Badge>
                        )}
                      </div>

                      <p className={`text-sm mb-2 ${!notification.isRead ? 'text-gray-700' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {notification.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markingAsRead === notification.id}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        {markingAsRead === notification.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <PushSettings userId={user?._id} />
          <NotificationPreferences />
          <MutesList />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
