"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building, ChevronDown, Plus } from "lucide-react"
import { Community } from "@/lib/api/types"

interface CommunitySelectorProps {
  userType: "creator" | "member"
  currentCommunity?: string
  community: Community | null | undefined
  userCommunities: Community[]
}

export function CommunitySelector({
  userType,
  currentCommunity,
  community,
  userCommunities,
}: CommunitySelectorProps) {
  return (
    <>
      <div className="h-6 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 px-3">
            {community ? (
              <>
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: (community as any).settings?.primaryColor || '#7c3aed' }}
                >
                  {community.name.charAt(0)}
                </div>
                <span className="font-medium hidden sm:inline max-w-32 truncate">{community.name}</span>
              </>
            ) : (
              <>
                <Building className="w-6 h-6 text-muted-foreground" />
                <span className="font-medium hidden sm:inline">Select Community</span>
              </>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <div className="px-2 py-1.5 text-sm font-semibold">
            {userType === "creator" ? "Your Communities" : "Switch Community"}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {userCommunities.map((comm) => (
              <DropdownMenuItem key={comm.id} asChild>
                <Link
                  href={
                    userType === "creator"
                      ? `/creator/${comm.slug}/dashboard`
                      : `/community/${comm.slug}/dashboard`
                  }
                  className="flex items-center space-x-3 px-2 py-2"
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: (comm as any).settings?.primaryColor || '#7c3aed' }}
                  >
                    {comm.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{comm.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {comm.members.toLocaleString()} members
                    </div>
                  </div>
                  {comm.slug === currentCommunity && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
          {userType === "creator" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/create-community" className="flex items-center px-2 py-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Community
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
