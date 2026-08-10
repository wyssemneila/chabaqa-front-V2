"use client"


import { Button } from "@/components/ui/button"
import {
  Calendar,
  Trophy,
  Users,
  BookOpen,
  Target,
  Star,
  TrendingUp,
  Award,
  Zap,
  Flame,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Pencil,
  ShoppingBag,
  Mail,
  MapPin,
  Lock,
  Check,
  Flag,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getProfile } from "@/lib/auth"
import { tokenManager } from "@/lib/token-manager"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/login-form"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatCard } from "@/components/profile/StatCard"
import { ProfileDetails } from "@/components/profile/ProfileDetails"
import { getUserProfileHandle } from "@/lib/profile-handle"
import { SOCIAL_PLATFORMS, cleanSocialLinks, type SocialPlatform, type UserSocialLinks } from "@/lib/social-links"
import { SocialMediaSidebar } from "@/components/profile/SocialMediaSidebar"
import { LearnerProfileCard } from "@/components/ai/learner-profile-card"

const resolveCommunityId = (community: any): string => {
  return String(
    community?._id ||
      community?.id ||
      community?.communityId ||
      community?.community?._id ||
      community?.community?.id ||
      "",
  )
}

const resolveCommunitySlug = (community: any): string => {
  return String(
    community?.slug ||
      community?.communitySlug ||
      community?.featureSlug ||
      community?.community?.slug ||
      "",
  )
}

const getCommunityKeys = (community: any): string[] => {
  const keys = [resolveCommunityId(community), resolveCommunitySlug(community)]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set(keys))
}

const resolveCommunityBasePath = (community: any): string | null => {
  const link = typeof community?.link === "string" ? community.link : ""
  if (link) {
    const clean = link.split("?")[0].split("#")[0]
    const parts = clean.split("/").filter(Boolean)
    if (parts.length >= 2 && parts[0] !== "community") {
      return `/${parts[0]}/${parts[1]}`
    }
  }

  const creatorSlug = String(
    community?.creatorSlug ||
      community?.creator?.slug ||
      community?.creator?.username ||
      community?.creator?.handle ||
      community?.creator?.name ||
      community?.creator ||
      "",
  ).trim()
  const featureSlug = resolveCommunitySlug(community).trim()
  if (creatorSlug && featureSlug) {
    return `/${creatorSlug}/${featureSlug}`
  }

  return null
}

// Types for user data
interface UserAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  dateEarned: string;
}

interface UserStats {
  totalPosts?: number;
  totalMembers?: number;
  coursesCreated?: number;
  successRate?: number;
  totalRevenue?: number;
  courseRating?: number;
  coursesCompleted?: number;
  activeStreak?: number;
  achievements?: number;
  communitiesJoined?: number;
  engagementRate?: number;
  trustScore?: number;
}

interface UserAnalytics {
  courseCompletionRate: number;
  studentSatisfaction: number;
  communityEngagement: number;
}

interface Community {
  id: string;
  name: string;
  banner?: string;
  memberCount: number;
  courseCount: number;
}

interface ActivityData {
  date: string;
  posts: number;
  engagement: number;
  impact: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  stats?: UserStats;
  achievements?: UserAchievement[];
  communities?: Community[];
  analytics?: UserAnalytics;
  activityData?: ActivityData[];
  socialLinks?: UserSocialLinks;
  lien_instagram?: string;
}

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  github: "GitHub",
  website: "Website",
}

interface DisplayAchievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  iconComponent?: any;
  earnedAt?: string;
}

interface DisplayActivity {
  id: string;
  actionType: string;
  contentTitle?: string;
  title?: string;
  timestamp: string;
  icon?: any;
  color?: string;
}

// Utility function to deduplicate array by id or _id
const deduplicateById = <T extends { id?: string; _id?: string }>(items: T[]): T[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const id = item.id || item._id
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

// Utility functions for formatting
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

const activityActionMap: Record<string, { label: string; icon: any; color: string }> = {
  view: { label: 'Viewed', icon: Users, color: '#47c7ea' },
  start: { label: 'Started', icon: Flag, color: '#ff9b28' },
  complete: { label: 'Completed', icon: Check, color: '#10b981' },
  like: { label: 'Liked', icon: Star, color: '#f65887' },
  share: { label: 'Shared', icon: MessageSquare, color: '#8e78fb' },
  download: { label: 'Downloaded', icon: Trophy, color: '#6366f1' },
  bookmark: { label: 'Bookmarked', icon: Lock, color: '#f59e0b' },
  comment: { label: 'Commented on', icon: MessageSquare, color: '#ec4899' },
  rate: { label: 'Rated', icon: Star, color: '#eab308' },
  join: { label: 'Joined', icon: Users, color: '#b07df8' },
  create: { label: 'Created', icon: Sparkles, color: '#8e78fb' },
  enroll: { label: 'Enrolled in', icon: GraduationCap, color: '#47c7ea' },
  publish: { label: 'Published', icon: Award, color: '#10b981' },
  manage: { label: 'Managing', icon: ShieldCheck, color: '#6366f1' },
  book: { label: 'Booked', icon: Calendar, color: '#f65887' },
}

const extractArrayPayload = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.actions)) return payload.actions
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.actions)) return payload.data.actions
  return []
}

const safeToDate = (value?: any): Date | null => {
  if (!value) return null
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const formatTimeAgo = (dateValue?: string) => {
  const date = safeToDate(dateValue)
  if (!date) return "Recently"
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const clampedSeconds = Math.max(seconds, 1)
  let interval = clampedSeconds / 31536000
  if (interval >= 1) return `${Math.floor(interval)} year${Math.floor(interval) === 1 ? "" : "s"} ago`
  interval = clampedSeconds / 2592000
  if (interval >= 1) return `${Math.floor(interval)} month${Math.floor(interval) === 1 ? "" : "s"} ago`
  interval = clampedSeconds / 86400
  if (interval >= 1) return `${Math.floor(interval)} day${Math.floor(interval) === 1 ? "" : "s"} ago`
  interval = clampedSeconds / 3600
  if (interval >= 1) return `${Math.floor(interval)} hour${Math.floor(interval) === 1 ? "" : "s"} ago`
  interval = clampedSeconds / 60
  if (interval >= 1) return `${Math.floor(interval)} minute${Math.floor(interval) === 1 ? "" : "s"} ago`
  return `${Math.floor(clampedSeconds)} second${Math.floor(clampedSeconds) === 1 ? "" : "s"} ago`
}

// Dynamic stats based on user role (null-safe)
const getStatsForUser = (user: any, isCreator: boolean) => {
  if (isCreator) {
    return [
      {
        label: "Total Posts",
        value: user?.stats?.totalPosts?.toString() || "0",
        icon: MessageSquare,
        description: "Content pieces shared with your community"
      },
      {
        label: "Community Size",
        value: formatNumber(user?.stats?.totalMembers || 0),
        icon: Users,
        description: "Active members across all communities"
      },
      {
        label: "Courses Created",
        value: user?.stats?.coursesCreated?.toString() || "0",
        icon: GraduationCap,
        description: "Educational courses published"
      },
      {
        label: "Success Rate",
        value: `${user?.stats?.successRate || 0}%`,
        icon: Trophy,
        description: "Average course completion rate"
      },
      {
        label: "Total Revenue",
        value: formatCurrency(user?.stats?.totalRevenue || 0),
        icon: Sparkles,
        description: "Earnings from courses and products"
      },
      {
        label: "Course Rating",
        value: (user?.stats?.courseRating || 0).toFixed(1),
        icon: Star,
        description: "Average rating from students"
      },
    ]
  }

  return [
    {
      label: "Courses Completed",
      value: user?.stats?.coursesCompleted?.toString() || "0",
      icon: GraduationCap,
      description: "Finished learning journeys"
    },
    {
      label: "Active Streak",
      value: user?.stats?.activeStreak?.toString() || "0",
      icon: Flame,
      description: "Days of continuous learning"
    },
    {
      label: "Achievements",
      value: user?.stats?.achievements?.toString() || "0",
      icon: Trophy,
      description: "Badges and certifications earned"
    },
    {
      label: "Communities",
      value: user?.stats?.communitiesJoined?.toString() || "0",
      icon: Users,
      description: "Active community memberships"
    },
    {
      label: "Engagement",
      value: `${user?.stats?.engagementRate || 0}%`,
      icon: Target,
      description: "Participation and interaction rate"
    },
    {
      label: "Trust Score",
      value: user?.stats?.trustScore?.toString() || "0",
      icon: ShieldCheck,
      description: "Community reputation score"
    },
  ]
}

// Dynamic activity data (null-safe)
const getActivityData = (user: any) => {
  const activityData = user?.activityData || []

  // If no activity data, return empty data for the last 6 months
  if (activityData.length === 0) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map(month => ({
      month,
      posts: 0,
      engagement: 0,
      impact: 0,
    }))
  }

  // Return the last 6 months of activity data
  return activityData.slice(-6).map((data: any) => ({
    month: new Date(data.date).toLocaleString('default', { month: 'short' }),
    posts: data.posts || 0,
    engagement: data.engagement || 0,
    impact: data.impact || 0,
  }))
}

const chartConfig = {
  posts: {
    label: "Content Interaction",
    theme: {
      light: "#2563eb",
      dark: "#60a5fa",
    },
  },
  engagement: {
    label: "Community Activity",
    theme: {
      light: "#16a34a",
      dark: "#4ade80",
    },
  },
  impact: {
    label: "Learning Progress",
    theme: {
      light: "#dc2626",
      dark: "#f87171",
    },
  },
}

// Dynamic achievements based on user activity (null-safe)
const getAchievements = (user: any) => {
  // Get user achievements or return empty array
  const userAchievements = user?.achievements || []

  // Map achievement types to icons
  const achievementIcons: { [key: string]: any } = {
    'early_adopter': Star,
    'top_educator': GraduationCap,
    'community_leader': Users,
    'content_master': Trophy,
    'quick_learner': Zap,
    'active_participant': MessageSquare,
    'team_player': Users,
    'expert_creator': Award,
    'mentor': GraduationCap,
    'innovator': Sparkles,
    'community_builder': Users,
    'top_contributor': Star,
    // Add more achievement types and icons as needed
  }

  return userAchievements.map((achievement: any) => ({
    title: achievement.title,
    description: achievement.description,
    icon: achievementIcons[achievement.type] || Star,
    date: new Date(achievement.dateEarned).toLocaleDateString('default', {
      month: 'short',
      year: 'numeric'
    })
  }))
}

const normalizeFetchedAchievements = (items: any[]): DisplayAchievement[] => {
  return items
    .map((achievement: any, index: number) => {
      const source = achievement?.achievement || achievement
      const id = String(source?.id || source?._id || achievement?.id || achievement?._id || `achievement-${index}`)
      const name = source?.name || source?.title || achievement?.name || achievement?.title
      if (!name) return null

      return {
        id,
        name,
        description: source?.description || achievement?.description,
        icon: source?.icon || achievement?.icon,
        earnedAt: achievement?.earnedAt || achievement?.dateEarned || achievement?.createdAt,
      }
    })
    .filter(Boolean) as DisplayAchievement[]
}

const normalizeFetchedActivity = (items: any[]): DisplayActivity[] => {
  return items
    .map((activity: any, index: number) => {
      const timestampRaw = activity?.timestamp || activity?.createdAt || activity?.updatedAt
      const fallbackTime = new Date().toISOString()
      const timestamp = safeToDate(timestampRaw)?.toISOString() || fallbackTime

      const actionType = String(
        activity?.actionType ||
        activity?.action ||
        activity?.type ||
        "view",
      ).toLowerCase()

      const contentTitle =
        activity?.contentDetails?.title ||
        activity?.content?.title ||
        activity?.title ||
        activity?.name ||
        "an item"

      return {
        id: String(activity?.id || activity?._id || `activity-${index}`),
        actionType,
        contentTitle,
        timestamp,
      }
    })
    .filter(Boolean) as DisplayActivity[]
}

const buildDerivedAchievements = (
  user: any,
  isCreator: boolean,
  collections: {
    communities: any[];
    courses: any[];
    challenges: any[];
    sessions: any[];
    products: any[];
  },
): DisplayAchievement[] => {
  const userId = String(user?._id || user?.id || "")
  const results: DisplayAchievement[] = []
  const added = new Set<string>()

  const addAchievement = (
    id: string,
    name: string,
    description: string,
    iconComponent: any,
    earnedAt?: string,
  ) => {
    if (added.has(id)) return
    added.add(id)
    results.push({ id, name, description, iconComponent, earnedAt })
  }

  if (user?.createdAt) {
    addAchievement("member-since", "Member Since", "Joined Chabaqa platform", Sparkles, user.createdAt)
  }
  if (user?.avatar || user?.bio || user?.ville || user?.pays) {
    addAchievement("profile-complete", "Profile Complete", "Completed your profile basics", Pencil, user?.updatedAt || user?.createdAt)
  }

  if (collections.communities.length > 0) {
    addAchievement("community-explorer", "Community Explorer", "Joined at least one community", Users, collections.communities[0]?.joinedAt || user?.createdAt)
  }
  if (
    collections.communities.some((community) =>
      ["owner", "admin", "moderator"].includes(String(community?.role || "").toLowerCase()),
    )
  ) {
    addAchievement("community-leader", "Community Leader", "Managing a community role", ShieldCheck, user?.updatedAt || user?.createdAt)
  }

  if (collections.courses.length > 0) {
    addAchievement("lifelong-learner", "Lifelong Learner", "Active in courses", GraduationCap, collections.courses[0]?.updatedAt || collections.courses[0]?.createdAt)
  }
  if (
    collections.courses.some((course) =>
      String(course?.type || "").toLowerCase() === "created" ||
      String(course?.creatorId || "") === userId,
    )
  ) {
    addAchievement("course-creator", "Course Creator", "Published educational content", Award, user?.updatedAt || user?.createdAt)
  }

  if (collections.challenges.length > 0) {
    addAchievement("challenge-taker", "Challenge Taker", "Participated in challenges", Target, collections.challenges[0]?.updatedAt || collections.challenges[0]?.createdAt)
  }
  if (collections.sessions.length > 0) {
    addAchievement("session-active", "Session Active", "Booked or hosted sessions", Calendar, collections.sessions[0]?.startTime || collections.sessions[0]?.createdAt)
  }
  if (collections.products.length > 0) {
    addAchievement("marketplace-active", "Marketplace Active", "Created or purchased products", ShoppingBag, collections.products[0]?.updatedAt || collections.products[0]?.createdAt)
  }
  if (isCreator) {
    addAchievement("creator-badge", "Creator", "Building and sharing with your audience", Trophy, user?.updatedAt || user?.createdAt)
  }

  return results.slice(0, 8)
}

const buildDerivedActivity = (
  user: any,
  collections: {
    communities: any[];
    courses: any[];
    challenges: any[];
    sessions: any[];
    products: any[];
  },
): DisplayActivity[] => {
  const items: DisplayActivity[] = []
  const userCreatedAt = safeToDate(user?.createdAt)?.toISOString() || new Date().toISOString()

  const pushActivity = (
    id: string,
    actionType: string,
    contentTitle: string,
    timestamp?: string,
    title?: string,
  ) => {
    items.push({
      id,
      actionType,
      contentTitle,
      timestamp: safeToDate(timestamp)?.toISOString() || userCreatedAt,
      title,
    })
  }

  collections.communities.slice(0, 3).forEach((community: any, idx: number) => {
    const name = community?.name || "community"
    const role = String(community?.role || "").toLowerCase()
    const isManager = ["owner", "admin", "moderator"].includes(role)
    pushActivity(
      `community-${community?.id || community?._id || idx}`,
      isManager ? "manage" : "join",
      name,
      community?.joinedAt || community?.updatedAt || community?.createdAt,
    )
  })

  collections.courses.slice(0, 2).forEach((course: any, idx: number) => {
    const title = course?.titre || course?.title || "course"
    const isCreated = String(course?.type || "").toLowerCase() === "created"
    pushActivity(
      `course-${course?.id || course?._id || idx}`,
      isCreated ? "publish" : "enroll",
      title,
      course?.updatedAt || course?.createdAt || course?.enrolledAt,
    )
  })

  collections.challenges.slice(0, 2).forEach((challenge: any, idx: number) => {
    const title = challenge?.title || challenge?.name || "challenge"
    const status = String(challenge?.status || "").toLowerCase()
    const actionType = status.includes("complete") ? "complete" : "start"
    pushActivity(
      `challenge-${challenge?.id || challenge?._id || idx}`,
      actionType,
      title,
      challenge?.updatedAt || challenge?.createdAt,
    )
  })

  collections.sessions.slice(0, 2).forEach((session: any, idx: number) => {
    const title = session?.title || session?.name || "session"
    const isCreated = String(session?.type || "").toLowerCase() === "created"
    pushActivity(
      `session-${session?.id || session?._id || idx}`,
      isCreated ? "create" : "book",
      title,
      session?.startTime || session?.updatedAt || session?.createdAt,
    )
  })

  collections.products.slice(0, 2).forEach((product: any, idx: number) => {
    const title = product?.title || product?.name || "product"
    const actionType = String(product?.type || "").toLowerCase() === "created" ? "create" : "view"
    pushActivity(
      `product-${product?.id || product?._id || idx}`,
      actionType,
      title,
      product?.updatedAt || product?.createdAt,
    )
  })

  pushActivity("joined-platform", "join", "Chabaqa", user?.createdAt, "Joined Chabaqa")

  return items
    .sort((a, b) => (safeToDate(b.timestamp)?.getTime() || 0) - (safeToDate(a.timestamp)?.getTime() || 0))
    .slice(0, 5)
}


interface ProfilePageProps {
  overrideUser?: any
  isOwnProfile?: boolean
}

function ProfilePageContent({ overrideUser, isOwnProfile = true }: ProfilePageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSignIn, setShowSignIn] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [productsPage, setProductsPage] = useState(1)
  const [productsTotalPages, setProductsTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState<'courses' | 'challenges' | 'sessions' | 'products' | 'communities'>('communities')
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesPage, setCoursesPage] = useState(1)
  const [coursesTotalPages, setCoursesTotalPages] = useState(1)
  const [challenges, setChallenges] = useState<any[]>([])
  const [challengesLoading, setChallengesLoading] = useState(false)
  const [challengesPage, setChallengesPage] = useState(1)
  const [challengesTotalPages, setChallengesTotalPages] = useState(1)
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1)
  const [communities, setCommunities] = useState<any[]>([])
  const [communitiesLoading, setCommunitiesLoading] = useState(false)
  const [communitiesPage, setCommunitiesPage] = useState(1)
  const [communitiesTotalPages, setCommunitiesTotalPages] = useState(1)

  const [fetchedAchievements, setFetchedAchievements] = useState<DisplayAchievement[]>([])
  const [achievementsLoading, setAchievementsLoading] = useState(false)
  const [fetchedActivity, setFetchedActivity] = useState<DisplayActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [viewer, setViewer] = useState<any>(null)
  const [viewerCommunities, setViewerCommunities] = useState<any[]>([])
  const [viewerCommunitiesLoading, setViewerCommunitiesLoading] = useState(false)

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // If overrideUser is provided (from slug page), use it directly
        if (overrideUser) {
          setUser(overrideUser)
          setLoading(false)
          return
        }

        // Otherwise fetch current user profile
        const profile = await getProfile()
        if (profile) {
          setUser(profile)
        } else {
          // If no authenticated user found, show mock data and sign in option
          setShowSignIn(true)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        setShowSignIn(true)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [overrideUser])

  // Redirect to slug /profile/<username> once user is known (only for own profile)
  useEffect(() => {
    if (!user || loading || overrideUser) return // Skip redirect for override users
    // If current path already includes a slug segment, do nothing
    const isSlugPath = /\/profile\/.+/.test(pathname || "")
    const handle = getUserProfileHandle(user)
    if (!isSlugPath) {
      router.replace(`/profile/${handle}`)
    }
  }, [user, loading, pathname, router, overrideUser])

  // Fetch user products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!user?._id && !user?.id) return
        setProductsLoading(true)
        const apiBase = "/api"

        // Fetch products with pagination
        const listUrl = `${apiBase}/products/by-user/${encodeURIComponent(user._id || user.id)}?page=${productsPage}&limit=12&type=all`
        const listRes = await fetch(listUrl, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })

        if (listRes.ok) {
          const data = await listRes.json()
          if (data.success && data.data) {
            setProducts(deduplicateById(data.data.products || []))
            setProductsTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user products:', listRes.status)
          setProducts([])
        }
      } catch (error) {
        console.error('Error fetching user products:', error)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [user, productsPage])

  // Fetch user courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?._id && !user?.id) return

      try {
        setCoursesLoading(true)
        const apiBase = "/api"
        const coursesUrl = `${apiBase}/cours/by-user/${encodeURIComponent(user._id || user.id)}?page=${coursesPage}&limit=12&type=all`
        const response = await fetch(coursesUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            // Map courses to include community name
            // NOTE: Backend issue - community field not populated in response
            // Fix needed: Backend should populate community data in /api/cours/by-user/:userId
            const coursesWithCommunity = (data.data.courses || []).map((course: any) => ({
              ...course,
              communityName: course.communityName || 
                             course.community?.name || 
                             (typeof course.community === 'string' ? course.community : null)
            }))
            setCourses(deduplicateById(coursesWithCommunity))
            setCoursesTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user courses:', response.status)
          setCourses([])
        }
      } catch (error) {
        console.error('Error fetching user courses:', error)
        setCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }

    fetchCourses()
  }, [user, coursesPage])

  // Fetch user challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user?._id && !user?.id) return

      try {
        setChallengesLoading(true)
        const apiBase = "/api"
        const challengesUrl = `${apiBase}/challenges/by-user/${encodeURIComponent(user._id || user.id)}?page=${challengesPage}&limit=12&type=all`
        const response = await fetch(challengesUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setChallenges(deduplicateById(data.data.challenges || []))
            setChallengesTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user challenges:', response.status)
          setChallenges([])
        }
      } catch (error) {
        console.error('Error fetching user challenges:', error)
        setChallenges([])
      } finally {
        setChallengesLoading(false)
      }
    }

    fetchChallenges()
  }, [user, challengesPage])

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?._id && !user?.id) return

      try {
        setSessionsLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const sessionsUrl = `${apiBase}/sessions/by-user/${encodeURIComponent(user._id || user.id)}?page=${sessionsPage}&limit=12&type=all`
        const response = await fetch(sessionsUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            // Map sessions to include community name
            const sessionsWithCommunity = (data.data.sessions || []).map((session: any) => ({
              ...session,
              communityName: session.communityName || 
                             session.community?.name || 
                             (typeof session.community === 'string' ? session.community : null)
            }))
            setSessions(deduplicateById(sessionsWithCommunity))
            setSessionsTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user sessions:', response.status)
          setSessions([])
        }
      } catch (error) {
        console.error('Error fetching user sessions:', error)
        setSessions([])
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchSessions()
  }, [user, sessionsPage])

  // Fetch user communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user?._id && !user?.id) return

      try {
        setCommunitiesLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const communitiesUrl = `${apiBase}/communities/by-user/${encodeURIComponent(user._id || user.id)}?page=${communitiesPage}&limit=12&type=all`
        const response = await fetch(communitiesUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setCommunities(data.data.communities || [])
            setCommunitiesTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user communities:', response.status)
          setCommunities([])
        }
      } catch (error) {
        console.error('Error fetching user communities:', error)
        setCommunities([])
      } finally {
        setCommunitiesLoading(false)
      }
    }

    fetchCommunities()
  }, [user, communitiesPage])

  // Fetch authenticated viewer profile when viewing someone else
  useEffect(() => {
    if (isOwnProfile) {
      setViewer(user)
      setViewerCommunities(communities)
      return
    }

    let isActive = true
    const loadViewer = async () => {
      try {
        const profile = await getProfile()
        if (!isActive) return
        setViewer(profile)
      } catch (error) {
        if (!isActive) return
        setViewer(null)
      }
    }

    loadViewer()
    return () => {
      isActive = false
    }
  }, [isOwnProfile, user, communities])

  // Fetch viewer communities to check shared membership
  useEffect(() => {
    if (isOwnProfile) return
    if (!viewer?._id && !viewer?.id) {
      setViewerCommunities([])
      return
    }

    const fetchViewerCommunities = async () => {
      try {
        setViewerCommunitiesLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const viewerId = viewer?._id || viewer?.id
        const communitiesUrl = `${apiBase}/communities/by-user/${encodeURIComponent(viewerId)}?page=1&limit=100&type=all`
        const token = tokenManager.getAccessToken()
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`
        const response = await fetch(communitiesUrl, { headers, credentials: "include" })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setViewerCommunities(data.data.communities || [])
          } else {
            setViewerCommunities([])
          }
        } else {
          setViewerCommunities([])
        }
      } catch (error) {
        setViewerCommunities([])
      } finally {
        setViewerCommunitiesLoading(false)
      }
    }

    fetchViewerCommunities()
  }, [isOwnProfile, viewer])

  // Fetch user achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!isOwnProfile) {
        setFetchedAchievements([])
        setAchievementsLoading(false)
        return
      }
      if (!user?._id && !user?.id) return
      try {
        setAchievementsLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const token = tokenManager.getAccessToken()
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${apiBase}/achievements/user`, { headers, credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const list = extractArrayPayload(data)
          const unlocked = list.filter((a: any) => a?.isUnlocked === undefined ? true : Boolean(a.isUnlocked))
          setFetchedAchievements(normalizeFetchedAchievements(unlocked))
        } else {
          setFetchedAchievements([])
        }
      } catch (error) {
        console.error("Error fetching achievements:", error)
        setFetchedAchievements([])
      } finally {
        setAchievementsLoading(false)
      }
    }
    fetchAchievements()
  }, [user, isOwnProfile])

  // Fetch user recent activity
  useEffect(() => {
    const fetchActivity = async () => {
      if (!isOwnProfile) {
        setFetchedActivity([])
        setActivityLoading(false)
        return
      }
      if (!user?._id && !user?.id) return
      try {
        setActivityLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const token = tokenManager.getAccessToken()
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${apiBase}/tracking/user/actions/recent?limit=5`, { headers, credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const normalized = normalizeFetchedActivity(extractArrayPayload(data))
          setFetchedActivity(normalized.slice(0, 5))
        } else {
          setFetchedActivity([])
        }
      } catch (error) {
        console.error("Error fetching activity:", error)
        setFetchedActivity([])
      } finally {
        setActivityLoading(false)
      }
    }
    fetchActivity()
  }, [user, isOwnProfile])


  // Current authenticated user only (no mock fallback)
  const currentUser = user
  const isCreator = currentUser?.role === "creator"

  // Get dynamic data based on user role
  // Get dynamic data based on current user
  const stats = getStatsForUser(currentUser, isCreator)
  const displayAchievements = fetchedAchievements.length > 0
    ? fetchedAchievements
    : buildDerivedAchievements(currentUser, isCreator, { communities, courses, challenges, sessions, products })
  const displayActivity = fetchedActivity.length > 0
    ? fetchedActivity
    : buildDerivedActivity(currentUser, { communities, courses, challenges, sessions, products })
  const totalLearningItems = courses.length + challenges.length
  const totalOffers = sessions.length + products.length
  const profileChecklist = [
    Boolean(currentUser?.name),
    ...(isOwnProfile ? [Boolean(currentUser?.email)] : []),
    Boolean(currentUser?.avatar),
    Boolean(currentUser?.bio),
    Boolean(currentUser?.ville || currentUser?.pays),
  ]
  const profileCompleteness = Math.round((profileChecklist.filter(Boolean).length / profileChecklist.length) * 100)
  const profileHighlights = [
    { label: "Achievements", value: displayAchievements.length, icon: Trophy, color: "#8e78fb" },
    { label: "Communities", value: communities.length, icon: Users, color: "#b07df8" },
    { label: "Learning", value: totalLearningItems, icon: GraduationCap, color: "#47c7ea" },
    { label: "Offers", value: totalOffers, icon: ShoppingBag, color: "#f65887" },
  ]
  const profileHandle = getUserProfileHandle(currentUser)
  const profileSocialLinks = cleanSocialLinks({
    ...((currentUser as any)?.socialLinks || {}),
    instagram: (currentUser as any)?.socialLinks?.instagram || (currentUser as any)?.lien_instagram || "",
  })
  const socialEntries = SOCIAL_PLATFORMS
    .filter((platform) => Boolean(profileSocialLinks[platform]))
    .map((platform) => ({
      platform,
      label: SOCIAL_LABELS[platform],
      href: profileSocialLinks[platform] as string,
    }))

  const viewerCommunityKeys = new Set(
    viewerCommunities.flatMap((community) => getCommunityKeys(community)),
  )
  const preferredCommunityId = String(searchParams?.get("communityId") || "").trim()
  const preferredCommunityPath = String(searchParams?.get("communityPath") || "").trim()
  const preferredCommunityKey = preferredCommunityId.toLowerCase()
  const viewerInPreferred = Boolean(preferredCommunityKey && viewerCommunityKeys.has(preferredCommunityKey))
  const preferredBasePath = preferredCommunityPath.startsWith("/") ? preferredCommunityPath : ""

  const commonCommunity = !isOwnProfile
    ? communities.find((community) =>
        getCommunityKeys(community).some((key) => viewerCommunityKeys.has(key)),
      ) || null
    : null

  const dmBasePath = viewerInPreferred
    ? preferredBasePath
    : commonCommunity
      ? resolveCommunityBasePath(commonCommunity)
      : null
  const dmCommunityId = viewerInPreferred
    ? preferredCommunityId
    : commonCommunity
      ? resolveCommunityId(commonCommunity)
      : ""
  const canDm = Boolean(
    !isOwnProfile &&
      viewer &&
      dmCommunityId &&
      dmBasePath &&
      !viewerCommunitiesLoading,
  )

  const handleDmClick = () => {
    if (!dmCommunityId || !dmBasePath) return
    const targetUserId = String(currentUser?._id || currentUser?.id || "")
    if (!targetUserId) return
    const query = new URLSearchParams()
    query.set("communityId", dmCommunityId)
    query.set("targetUserId", targetUserId)
    router.push(`${dmBasePath}/messages?${query.toString()}`)
  }

  if (!loading && !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h2 className="text-2xl font-semibold">Connectez-vous pour voir votre profil</h2>
            <p className="text-muted-foreground">Votre session a expiré ou vous n&apos;êtes pas connecté.</p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/signin">Se connecter</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full px-4 sm:px-8 md:px-12 lg:px-20 xl:px-40 pt-12 md:pt-16 lg:pt-20 pb-24">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-6">
              {/* Header Card */}
              <div className="border border-border-color rounded-xl p-6 bg-white shadow-subtle">
                <div className="flex flex-col gap-6 @[520px]:flex-row @[520px]:justify-between @[520px]:items-center">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0"
                      style={{ backgroundImage: `url(${currentUser?.avatar || '/placeholder.svg'})` }} />
                    <div className="flex flex-col justify-center gap-1">
                      <p className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">{currentUser?.name}</p>
                      <p className="text-text-secondary text-base">@{profileHandle}</p>
                      {isOwnProfile && currentUser?.email && (
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-text-tertiary" />
                          <p className="text-text-secondary text-sm break-all">{currentUser?.email}</p>
                        </div>
                      )}
                      <p className="text-text-secondary text-base flex items-center gap-1.5 mt-1 break-words">
                        <MapPin className="w-4 h-4" /> {[currentUser?.ville, currentUser?.pays].filter(Boolean).join(', ') || '—'}
                      </p>
                      {currentUser?.bio && (
                        <p className="text-text-secondary text-sm mt-3 w-full leading-relaxed break-words whitespace-pre-wrap overflow-hidden">{currentUser.bio}</p>
                      )}
                    </div>
                  </div>
                  {isOwnProfile && (
                    <a href={`/profile/${profileHandle}/edit`} className="flex w-full @[520px]:w-auto min-w-[84px] items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-bold border border-primary-dark">
                      <Pencil className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </a>
                  )}
                  {!isOwnProfile && canDm && (
                    <Button
                      type="button"
                      onClick={handleDmClick}
                      className="flex w-full @[520px]:w-auto min-w-[84px] items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-bold border border-primary-dark"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>DM</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabs + Courses Grid */}
              <div className="border border-border-color rounded-xl bg-white shadow-subtle">
                <div className="pb-3">
                  <div className="flex border-b border-border-color px-6 gap-4 sm:gap-8 overflow-x-auto overscroll-x-contain">
                    {(['communities', 'courses', 'challenges', 'sessions', 'products'] as const).map(tab => (
                      <button
                        key={tab}
                        className={cn(
                          "flex flex-col items-center justify-center pb-[13px] pt-4 text-sm font-bold shrink-0 whitespace-nowrap",
                          activeTab === tab
                            ? (
                              tab === 'courses' ? "border-b-[3px] border-b-[#47c7ea] text-[#47c7ea]" :
                                tab === 'challenges' ? "border-b-[3px] border-b-[#ff9b28] text-[#ff9b28]" :
                                  tab === 'sessions' ? "border-b-[3px] border-b-[#f65887] text-[#f65887]" :
                                    tab === 'products' ? "border-b-[3px] border-b-[#8e78fb] text-[#8e78fb]" :
                                /* communities */ "border-b-[3px] border-b-[#b07df8] text-[#b07df8]"
                            )
                            : "border-b-[3px] border-b-transparent text-text-tertiary hover:text-text-primary"
                        )}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Panels */}
                {activeTab === 'courses' && (
                  <div className="p-6">
                    {coursesLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-2 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : courses.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {courses.map((course) => (
                            <div key={course.id} className="flex flex-col gap-3 group rounded-lg border border-border-color bg-white shadow-subtle overflow-hidden hover:shadow-md transition-shadow">
                              <div className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${course.thumbnail})` }}>
                                <div className="absolute inset-0 bg-black/20" />
                                <BookOpen className="absolute top-3 right-3 w-8 h-8" style={{ color: '#47c7ea' }} />
                                {course.type === 'created' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                    Created
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <p className="text-base font-medium line-clamp-2">{course.titre}</p>
                                  {course.type === 'enrolled' && (
                                    <>
                                      <div className="w-full bg-border-color rounded-full h-2 mt-2">
                                        <div className="h-2 rounded-full" style={{ width: `${course.progress}%`, background: '#47c7ea' }} />
                                      </div>
                                      <p className="text-text-secondary text-sm mt-1">
                                        {course.status === 'completed' ? 'Completed' :
                                          course.status === 'in_progress' ? `${course.progress}% Complete` :
                                            'Not Started'}
                                      </p>
                                    </>
                                  )}
                                  {course.type === 'created' && (
                                    <p className="text-text-secondary text-sm mt-1">
                                      Status: {course.status === 'published' ? 'Published' : 'Draft'}
                                    </p>
                                  )}
                                  {course.communityName && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit mt-2">
                                      <Users className="w-3 h-3" />
                                      <span className="font-medium">{course.communityName}</span>
                                    </div>
                                  )}
                                </div>
                                {course.slug && (
                                  <a
                                    href={`/community/${course.slug}/home`}
                                    className="mt-4 pt-4 border-t border-border-color w-full text-center py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                                  >
                                    View Course
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {coursesTotalPages > 1 && (
                          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setCoursesPage(prev => Math.max(1, prev - 1))}
                              disabled={coursesPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {coursesPage} of {coursesTotalPages}
                            </span>
                            <button
                              onClick={() => setCoursesPage(prev => Math.min(coursesTotalPages, prev + 1))}
                              disabled={coursesPage === coursesTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#47c7ea' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't enrolled in or created any courses yet." : "This user hasn't enrolled in or created any courses yet."}
                        </p>
                        {isOwnProfile && (
                          <Link href="/explore">
                            <button className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#47c7ea' }}>
                              Explore Courses
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'challenges' && (
                  <div className="p-6">
                    {challengesLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-2 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : challenges.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {challenges.map((challenge) => (
                            <div key={challenge.id} className="flex flex-col gap-3 group rounded-lg border border-border-color bg-white shadow-subtle overflow-hidden hover:shadow-md transition-shadow">
                              <div className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${challenge.thumbnail})` }}>
                                <div className="absolute inset-0 bg-black/20" />
                                <Trophy className="absolute top-3 right-3 w-8 h-8" style={{ color: '#ff9b28' }} />
                                {challenge.type === 'created' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                    Created
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <p className="text-base font-medium line-clamp-2">{challenge.title}</p>
                                  {challenge.progress !== undefined && (
                                    <>
                                      <div className="w-full bg-border-color rounded-full h-2 mt-2">
                                        <div className="h-2 rounded-full" style={{ width: `${challenge.progress}%`, background: '#ff9b28' }} />
                                      </div>
                                      <div className="flex justify-between items-center text-text-secondary text-sm mt-1">
                                        <span>{challenge.status}</span>
                                        <span>{challenge.progress}%</span>
                                      </div>
                                    </>
                                  )}
                                  {challenge.difficulty && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{challenge.difficulty}</span>
                                      {challenge.category && (
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{challenge.category}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {challenge.slug && (
                                  <a
                                    href={`/community/${challenge.slug}/challenges`}
                                    className="mt-4 pt-4 border-t border-border-color w-full text-center py-2 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium"
                                  >
                                    View Challenge
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {challengesTotalPages > 1 && (
                          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setChallengesPage(prev => Math.max(1, prev - 1))}
                              disabled={challengesPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {challengesPage} of {challengesTotalPages}
                            </span>
                            <button
                              onClick={() => setChallengesPage(prev => Math.min(challengesTotalPages, prev + 1))}
                              disabled={challengesPage === challengesTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: '#ff9b28' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't participated in or created any challenges yet." : "This user hasn't participated in or created any challenges yet."}
                        </p>
                        {isOwnProfile && (
                          <Link href="/explore">
                            <button className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#ff9b28' }}>
                              Explore Challenges
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div className="p-6">
                    {sessionsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : sessions.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sessions.map((session) => {
                            const statusColors = {
                              'upcoming': '#f65887',
                              'past': '#6b7280',
                              'live': '#10b981'
                            }
                            const color = statusColors[session.status as keyof typeof statusColors] || '#8e78fb'
                            
                            // Handle date safely - check if startTime exists and is valid
                            let timeStr = "Date TBD"
                            if (session.startTime) {
                              const startTime = new Date(session.startTime)
                              if (!isNaN(startTime.getTime())) {
                                const isToday = startTime.toDateString() === new Date().toDateString()
                                timeStr = isToday ?
                                  `Today ${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` :
                                  startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                              }
                            }

                            return (
                              <div key={session.id} className="flex flex-col gap-0 group rounded-xl overflow-hidden shadow-subtle hover:shadow-md transition-all duration-300 bg-white border border-gray-100">
                                {/* Header avec gradient et icône calendrier */}
                                <div className="relative h-32 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center">
                                  <Calendar className="w-16 h-16 text-white opacity-90" />
                                  {session.type === 'created' && (
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                      Created
                                    </div>
                                  )}
                                  {session.status === 'live' && (
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                                      LIVE
                                    </div>
                                  )}
                                </div>
                                
                                {/* Contenu de la carte */}
                                <div className="p-4 flex-1 flex flex-col gap-2">
                                  <h3 className="text-base font-semibold line-clamp-2 min-h-[3rem]">{session.title}</h3>
                                  <p className="text-sm text-gray-600">{timeStr}</p>
                                  
                                  {/* Durée et créateur sur une ligne */}
                                  {session.duration && session.creator?.name && (
                                    <p className="text-xs text-gray-500">
                                      {session.duration} mins • {session.creator.name}
                                    </p>
                                  )}
                                  
                                  {/* Community name */}
                                  {session.communityName && (
                                    <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                                      <Users className="w-3 h-3" />
                                      <span className="font-medium">{session.communityName}</span>
                                    </div>
                                  )}
                                  
                                  {/* Bouton View Session */}
                                  {session.slug && (
                                    <a
                                      href={`/community/${session.slug}/sessions`}
                                      className="mt-auto w-full text-center py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all text-sm font-medium"
                                    >
                                      View Session
                                    </a>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Pagination */}
                        {sessionsTotalPages > 1 && (
                          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setSessionsPage(prev => Math.max(1, prev - 1))}
                              disabled={sessionsPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {sessionsPage} of {sessionsTotalPages}
                            </span>
                            <button
                              onClick={() => setSessionsPage(prev => Math.min(sessionsTotalPages, prev + 1))}
                              disabled={sessionsPage === sessionsTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#f65887' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't booked or created any sessions yet." : "This user hasn't booked or created any sessions yet."}
                        </p>
                        {isOwnProfile && (
                          <Link href="/explore">
                            <button className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#f65887' }}>
                              Browse Sessions
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="p-6">
                    {productsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : products.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {products.map((product) => (
                            <div key={product.id || product._id} className="flex flex-col gap-3 group rounded-lg border border-border-color bg-white shadow-subtle overflow-hidden hover:shadow-md transition-shadow">
                              <div className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${(product.images && product.images[0]) || product.image || product.thumbnail || 'https://images.unsplash.com/photo-1579275542618-a1dfed5f54ba?q=80&w=1200&auto=format&fit=crop'})` }}>
                                <div className="absolute inset-0 bg-black/10" />
                                <ShoppingBag className="absolute top-3 right-3 w-8 h-8" style={{ color: '#8e78fb' }} />
                                {product.type === 'created' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                    Created
                                  </div>
                                )}
                                {product.type === 'purchased' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                    Purchased
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <p className="text-base font-medium line-clamp-2">{product.title || product.name || 'Untitled product'}</p>
                                  {typeof product.price === 'number' && (
                                    <p className="text-sm text-text-secondary">{new Intl.NumberFormat('fr-TN', { style: 'currency', currency: product.currency || 'TND' }).format(product.price)}</p>
                                  )}
                                  {product.status && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {product.status === 'active' ? 'Active' : 'Draft'}
                                      </span>
                                      {product.category && (
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full truncate max-w-[100px]">
                                          {product.category}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {product.slug && (
                                  <a
                                    href={`/community/${product.slug}/home`}
                                    className="mt-4 pt-4 border-t border-border-color w-full text-center py-2 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-sm font-medium"
                                  >
                                    View Product
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {productsTotalPages > 1 && (
                          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setProductsPage(prev => Math.max(1, prev - 1))}
                              disabled={productsPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {productsPage} of {productsTotalPages}
                            </span>
                            <button
                              onClick={() => setProductsPage(prev => Math.min(productsTotalPages, prev + 1))}
                              disabled={productsPage === productsTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: '#8e78fb' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't created or purchased any products yet." : "This user hasn't created any products yet."}
                        </p>
                        {isOwnProfile && (
                          <Link href="/explore">
                            <button className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#8e78fb' }}>
                              Explore Products
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'communities' && (
                  <div className="p-6">
                    {communitiesLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="rounded-xl border border-border-color overflow-hidden bg-white shadow-subtle">
                            <div className="aspect-[16/9] bg-gray-200 animate-pulse" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : communities.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {communities.map((community) => {
                            const roleColors = {
                              'admin': 'bg-red-100 text-red-800 border-red-200',
                              'moderator': 'bg-blue-100 text-blue-800 border-blue-200',
                              'member': 'bg-gray-100 text-gray-800 border-gray-200',
                              'owner': 'bg-purple-100 text-purple-800 border-purple-200'
                            }
                            const roleClass = roleColors[community.role?.toLowerCase() as keyof typeof roleColors] || roleColors.member

                            return (
                              <div key={community.id} className="group rounded-xl border border-border-color overflow-hidden bg-white shadow-subtle hover:shadow-md transition-shadow flex flex-col">
                                <div className="relative aspect-[16/9] bg-center bg-cover" style={{ backgroundImage: `url(${community.coverImage || community.logo})` }}>
                                  <div className="absolute inset-0 bg-black/15" />
                                  {community.type === 'created' && (
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                      Created
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                  <div>
                                    <p className="font-semibold leading-tight truncate">{community.name}</p>
                                    <p className="text-xs text-text-secondary">
                                      {community.membersCount?.toLocaleString() || 0} members
                                    </p>
                                    {community.joinedAt && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        Joined {new Date(community.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border-color">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs px-2 py-1 rounded-full border ${roleClass}`}>
                                        {community.role || 'Member'}
                                      </span>
                                      {community.slug && (
                                        <a
                                          href={`/community/${community.slug}/home`}
                                          className="text-xs px-3 py-1 rounded-md bg-primary hover:bg-primary-dark text-white transition-colors"
                                        >
                                          Visit
                                        </a>
                                      )}
                                    </div>
                                    {isOwnProfile && community.role?.toLowerCase() === 'owner' && (
                                      <Link
                                        href="/creator/dashboard"
                                        className="w-full text-center text-xs px-3 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors font-medium"
                                      >
                                        Manage Dashboard
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Pagination */}
                        {communitiesTotalPages > 1 && (
                          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setCommunitiesPage(prev => Math.max(1, prev - 1))}
                              disabled={communitiesPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {communitiesPage} of {communitiesTotalPages}
                            </span>
                            <button
                              onClick={() => setCommunitiesPage(prev => Math.min(communitiesTotalPages, prev + 1))}
                              disabled={communitiesPage === communitiesTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#b07df8' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No communities yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't joined or created any communities yet." : "This user hasn't joined or created any communities yet."}
                        </p>
                        {isOwnProfile && (
                          <Link href="/explore">
                            <button className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#b07df8' }}>
                              Explore Communities
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {isOwnProfile && <LearnerProfileCard />}
              <SocialMediaSidebar
                entries={socialEntries}
                isOwnProfile={isOwnProfile}
                editHref={`/profile/${profileHandle}/edit`}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  return <ProfilePageContent />
}

// Allow usage with overrideUser from slug page
;(ProfilePage as any).__profileContent = ProfilePageContent
