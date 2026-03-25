"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Share2 } from "lucide-react"

export type ProfileHeaderProps = {
  user: {
    name: string
    email: string
    role?: string
    avatar?: string
  }
  onEdit?: () => void
  onShare?: () => void
}

export function ProfileHeader({ user, onEdit, onShare }: ProfileHeaderProps) {
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("") : "U"
  return (
    <div className="relative overflow-hidden rounded-xl border border-transparent bg-white/70 backdrop-blur-md shadow-sm">
      <div className="h-48 md:h-56 bg-gradient-to-r from-white/70 via-white/40 to-transparent" />
      <div className="px-4 sm:px-6 md:px-8 -mt-16 relative z-10 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
          <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-background shadow-xl">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{user?.name}</h1>
              {user?.role && (
                <Badge className="bg-primary/90">{user.role}</Badge>
              )}
            </div>
            <p className="text-muted-foreground font-medium">{user?.email}</p>
          </div>
          <div className="w-full sm:w-auto flex gap-2">
            <Button variant="default" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
            <Button variant="outline" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" /> Share Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
