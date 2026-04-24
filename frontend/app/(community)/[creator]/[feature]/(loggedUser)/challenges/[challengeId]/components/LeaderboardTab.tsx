"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Flame, Users } from "lucide-react"
import Link from "next/link"
import { tokenStorage } from "@/lib/token-storage"
import { useEffect, useState } from "react"
import { resolveImageUrl } from "@/lib/hooks/useUser"
import { getUserProfileHref } from "@/lib/profile-handle"

interface LeaderboardTabProps {
  challenge: any
}

export default function LeaderboardTab({ challenge }: LeaderboardTabProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const userInfo = tokenStorage.getUserInfo()
    if (userInfo?.id) {
      setCurrentUserId(userInfo.id)
    }
  }, [])

  // Sort participants by score (descending)
  const sortedParticipants = [...(challenge.participants || [])]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((p, index) => ({
      ...p,
      rank: index + 1,
      resolvedAvatar: resolveImageUrl(p.avatar),
      resolvedProfileHref: getUserProfileHref({
        username: p.username,
        name: p.name || "Anonymous",
      }),
      isCurrentUser: currentUserId && (
        String(p.userId) === String(currentUserId) ||
        String(p.userId?._id) === String(currentUserId)
      ),
    }))

  // Get top 10 and current user if not in top 10
  const topParticipants = sortedParticipants.slice(0, 10)
  const currentUserParticipant = sortedParticipants.find(p => p.isCurrentUser)
  
  // If current user is not in top 10, add them at the end
  const displayParticipants = currentUserParticipant && currentUserParticipant.rank > 10
    ? [...topParticipants, currentUserParticipant]
    : topParticipants

  if (sortedParticipants.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Challenge Leaderboard
          </CardTitle>
          <CardDescription>See how you rank against other participants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No participants yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to join this challenge!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Challenge Leaderboard
        </CardTitle>
        <CardDescription>
          {sortedParticipants.length} participant{sortedParticipants.length !== 1 ? 's' : ''} competing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayParticipants.map((participant) => (
            <div
              key={participant.id || participant.rank}
              className={`flex items-center space-x-4 p-4 rounded-lg ${
                participant.isCurrentUser ? "bg-primary-50 border border-primary-200" : "bg-gray-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  participant.rank === 1
                    ? "bg-yellow-500 text-white"
                    : participant.rank === 2
                      ? "bg-gray-400 text-white"
                      : participant.rank === 3
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-700"
                }`}
              >
                {participant.rank}
              </div>
              <Link href={participant.resolvedProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={participant.resolvedAvatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {(participant.name || 'U')
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="font-semibold flex items-center">
                  <Link href={participant.resolvedProfileHref} className="hover:underline">
                    {participant.name || 'Anonymous'}
                  </Link>
                  {participant.isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {participant.score || 0} points • {participant.completedTasks?.length || 0} tasks completed
                </div>
              </div>
              <div className="text-right">
                {participant.streak > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Flame className="h-4 w-4 mr-1 text-orange-500" />
                    {participant.streak}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
