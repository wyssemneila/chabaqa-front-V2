"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Search,
  Menu,
  Plus,
  MessageSquare,
  Calendar,
  BookOpen,
} from "lucide-react"
import { communitiesApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Community } from "@/lib/api/types"
import { CommunitySelector } from "./community-selector"
import { NotificationPanel } from "./notification-panel"
import { UserMenu } from "./user-menu"


interface AppHeaderProps {
  userType: "creator" | "member"
  currentCommunity?: string
  showCommunitySelector?: boolean
}

export function AppHeader({ userType, currentCommunity, showCommunitySelector = false }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const { user } = useAuth()
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user's communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        let response

        if (userType === "creator") {
          response = await communitiesApi.getMyCreated()
        } else {
          response = await communitiesApi.getMyJoined()
        }

        if (response.success && Array.isArray(response.data)) {
          setUserCommunities(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch communities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunities()
  }, [user, userType])

  const community = currentCommunity
    ? userCommunities.find((c) => c.slug === currentCommunity)
    : null

  const currentUser = user ? {
    name: user.name || user.username || "User",
    email: user.email,
    avatar: user.avatar,
    role: user.role
  } : {
    name: "Guest",
    email: "",
    avatar: null,
    role: "member"
  }

  const quickActions =
    userType === "creator"
      ? [
        {
          label: "Create Course",
          icon: BookOpen,
          href: currentCommunity ? `/creator/${currentCommunity}/courses/new` : "/creator/courses/new",
        },
        {
          label: "Start Challenge",
          icon: Calendar,
          href: currentCommunity ? `/creator/${currentCommunity}/challenges/new` : "/creator/challenges/new",
        },
        {
          label: "Write Post",
          icon: MessageSquare,
          href: currentCommunity ? `/creator/${currentCommunity}/posts/new` : "/creator/posts/new",
        },
      ]
      : [
        { label: "Browse Courses", icon: BookOpen, href: `/community/${currentCommunity}/courses` },
        { label: "Join Challenge", icon: Calendar, href: `/community/${currentCommunity}/challenges` },
        { label: "Book Session", icon: Calendar, href: `/community/${currentCommunity}/sessions` },
      ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Logo and Community Selector */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="hidden sm:block relative h-24 w-[100px]">
              <Image
                src="/Logos/PNG/frensh1.png"
                alt="Chabaqa Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </Link>

          {showCommunitySelector && userCommunities.length > 0 && (
            <CommunitySelector
              userType={userType}
              currentCommunity={currentCommunity}
              community={community}
              userCommunities={userCommunities}
            />
          )}
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses, challenges, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Right side - Actions and User Menu */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {quickActions.map((action) => (
                <DropdownMenuItem key={action.label} asChild>
                  <Link href={action.href} className="flex items-center">
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <NotificationPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <Button key={action.label} variant="ghost" className="w-full justify-start" asChild>
                      <Link href={action.href}>
                        <action.icon className="mr-2 h-4 w-4" />
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <UserMenu currentUser={currentUser} userType={userType} />
        </div>
      </div>
    </header>
  )
}
