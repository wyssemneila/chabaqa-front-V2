"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Flame, Trophy, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveImageUrl } from "@/lib/hooks/useUser"
import { getUserProfileHref } from "@/lib/profile-handle"
import { tokenStorage } from "@/lib/token-storage"

interface LeaderboardTabProps {
  challenge: any
}

type RankedParticipant = {
  id?: string
  userId?: string | { _id?: string }
  username?: string
  name?: string
  avatar?: string
  score?: number
  streak?: number
  completedTasks?: unknown[]
  rank: number
  resolvedAvatar?: string
  resolvedProfileHref: string
  isCurrentUser: boolean
}

const podiumOrder = [
  { rank: 2, place: "2nd", height: "h-28 sm:h-36", column: "from-slate-200 via-white to-slate-400", accent: "text-slate-500", ring: "ring-slate-200", offset: "sm:mt-16" },
  { rank: 1, place: "1st", height: "h-36 sm:h-48", column: "from-amber-200 via-yellow-300 to-amber-500", accent: "text-amber-600", ring: "ring-amber-200", offset: "sm:mt-0" },
  { rank: 3, place: "3rd", height: "h-24 sm:h-32", column: "from-orange-200 via-orange-300 to-orange-600", accent: "text-orange-600", ring: "ring-orange-200", offset: "sm:mt-20" },
]

function getInitials(name?: string) {
  return (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function ParticipantRow({
  participant,
  label,
}: {
  participant: RankedParticipant
  label?: string
}) {
  return (
    <div
      className={`flex items-center space-x-3 rounded-lg p-3 sm:space-x-4 sm:p-4 ${
        participant.isCurrentUser ? "border border-primary-200 bg-primary-50" : "bg-gray-50"
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
        {participant.rank}
      </div>
      <Link href={participant.resolvedProfileHref} className="shrink-0 transition-opacity hover:opacity-90">
        <Avatar className="h-10 w-10">
          <AvatarImage src={participant.resolvedAvatar || "/placeholder.svg"} />
          <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <Link href={participant.resolvedProfileHref} className="truncate hover:underline">
            {participant.name || "Anonymous"}
          </Link>
          {participant.isCurrentUser && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
          {label && (
            <Badge variant="outline" className="text-xs">
              {label}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {participant.score || 0} points &bull; {participant.completedTasks?.length || 0} tasks completed
        </div>
      </div>
      {(participant.streak || 0) > 0 && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Flame className="mr-1 h-4 w-4 text-orange-500" />
          {participant.streak}
        </div>
      )}
    </div>
  )
}

function PodiumSpot({ participant }: { participant: RankedParticipant }) {
  const slot = podiumOrder.find((item) => item.rank === participant.rank) || podiumOrder[0]
  const isWinner = participant.rank === 1

  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center ${slot.offset}`}>
      <div
        className={`relative z-10 w-full max-w-[13rem] rounded-xl border border-white/80 bg-white/95 p-3 text-center shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-sm ${
          isWinner ? "sm:max-w-[14rem]" : ""
        }`}
      >
        <Link href={participant.resolvedProfileHref} className="mx-auto block w-fit transition-opacity hover:opacity-90">
          <Avatar
            className={`mx-auto border-4 border-white shadow-xl ring-4 ${slot.ring} ${
              isWinner ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20"
            }`}
          >
            <AvatarImage src={participant.resolvedAvatar || "/placeholder.svg"} />
            <AvatarFallback className="text-lg font-semibold">{getInitials(participant.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="mt-3 flex min-w-0 items-center justify-center gap-1">
          <Link
            href={participant.resolvedProfileHref}
            className="truncate text-sm font-semibold leading-tight text-gray-950 hover:underline sm:text-base"
          >
            {participant.name || "Anonymous"}
          </Link>
          {participant.isCurrentUser && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              You
            </Badge>
          )}
        </div>
        <div className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
          {participant.score || 0} pts &bull; {participant.completedTasks?.length || 0} tasks
        </div>
        {(participant.streak || 0) > 0 && (
          <div className="mt-2 inline-flex items-center rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
            <Flame className="mr-1 h-3.5 w-3.5" />
            {participant.streak} streak
          </div>
        )}
      </div>

      <div className={`relative -mt-2 flex w-full max-w-[13rem] flex-col items-center justify-end rounded-t-2xl bg-gradient-to-b ${slot.column} ${slot.height} shadow-[0_22px_38px_rgba(15,23,42,0.18)]`}>
        <div className="absolute inset-x-3 top-3 h-5 rounded-full bg-white/45 blur-sm" />
        <div className="absolute inset-x-0 top-0 h-6 rounded-t-2xl border-t border-white/70 bg-white/30" />
        <div className="relative pb-5 text-center">
          <div className="text-5xl font-black leading-none text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.25)] sm:text-6xl">
            {participant.rank}
          </div>
          <div className={`mt-1 text-xs font-bold uppercase tracking-wide ${slot.accent}`}>{slot.place}</div>
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardTab({ challenge }: LeaderboardTabProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const userInfo = tokenStorage.getUserInfo()
    if (userInfo?.id) {
      setCurrentUserId(userInfo.id)
    }
  }, [])

  const sortedParticipants: RankedParticipant[] = [...(challenge.participants || [])]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((p, index) => ({
      ...p,
      rank: index + 1,
      resolvedAvatar: resolveImageUrl(p.avatar),
      resolvedProfileHref: getUserProfileHref({
        username: p.username,
        name: p.name || "Anonymous",
      }),
      isCurrentUser: Boolean(
        currentUserId &&
          (String(p.userId) === String(currentUserId) || String(p.userId?._id) === String(currentUserId)),
      ),
    }))

  const topThree = sortedParticipants.slice(0, 3)
  const remainingTopTen = sortedParticipants.slice(3, 10)
  const currentUserParticipant = sortedParticipants.find((p) => p.isCurrentUser)
  const showCurrentUserPosition = Boolean(currentUserParticipant && currentUserParticipant.rank > 10)

  if (sortedParticipants.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
            Challenge Leaderboard
          </CardTitle>
          <CardDescription>See how you rank against other participants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No participants yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to join this challenge!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Challenge Leaderboard
        </CardTitle>
        <CardDescription>
          {sortedParticipants.length} participant{sortedParticipants.length !== 1 ? "s" : ""} competing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="relative mx-auto overflow-hidden rounded-xl border border-gray-100 bg-white px-3 pb-5 pt-8 shadow-sm sm:max-w-4xl sm:px-8 sm:pb-8 sm:pt-10">
            <div className="relative flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:items-end sm:gap-4">
              {podiumOrder.map((slot) => {
              const participant = topThree.find((item) => item.rank === slot.rank)
              if (!participant) return null

                return <PodiumSpot key={slot.rank} participant={participant} />
              })}
            </div>
          </div>

          {remainingTopTen.length > 0 && (
            <div className="space-y-3">
              {remainingTopTen.map((participant) => (
                <ParticipantRow key={participant.id || participant.rank} participant={participant} />
              ))}
            </div>
          )}

          {showCurrentUserPosition && currentUserParticipant && (
            <div className="border-t pt-4">
              <ParticipantRow participant={currentUserParticipant} label="Your position" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
