"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Coins, Trophy, Flame, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import { getChallengeStatus } from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenge-status"

interface ChallengeCardProps {
  creatorSlug: string
  slug: string
  challenge: any
}

export default function ChallengeCard({ creatorSlug, slug, challenge }: ChallengeCardProps) {
  const status = getChallengeStatus(challenge)
  const isParticipating = challenge.isParticipating || false
  const daysRemaining = getDaysRemaining(new Date(challenge.endDate))
  const challengeId = String(challenge.id || challenge._id || "")
  const promoHref = `/challenge-promo/${encodeURIComponent(challengeId)}?creator=${encodeURIComponent(creatorSlug)}&feature=${encodeURIComponent(slug)}`
  const promoDetailsHref = `${promoHref}&mode=details`

  return (
    <Card
      key={challenge.id}
      className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
    >
      <div className="relative w-full aspect-video overflow-hidden">
        {challenge.thumbnail ? (
          <>
            <Image
              src={challenge.thumbnail}
              alt={challenge.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-challenges-500 to-orange-500" />
        )}
      </div>

      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{formatDate(new Date(challenge.startDate))}</div>
              <div>Start Date</div>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">
                {status === "active" ? `${daysRemaining} days left` : challenge.duration}
              </div>
              <div>{status === "active" ? "Remaining" : "Duration"}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{challenge.participants?.length || challenge.participantCount || 0}</div>
              <div>Participants</div>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Coins className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{challenge.depositAmount || 50} TND</div>
              <div>Deposit</div>
            </div>
          </div>
        </div>

        {challenge.difficulty && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {challenge.difficulty}
            </Badge>
            {challenge.category && (
              <Badge variant="outline" className="text-xs">
                {challenge.category}
              </Badge>
            )}
          </div>
        )}

        {isParticipating && challenge.progress !== undefined && (
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Your Progress</span>
              </div>
              <span className="text-sm font-bold text-green-600">{challenge.progress}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">${challenge.completionReward || 25} reward</span>
          </div>
          <div className="flex items-center space-x-2">
            {isParticipating ? (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={promoDetailsHref}>
                    See Details
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/${creatorSlug}/${slug}/challenges/${encodeURIComponent(challengeId)}`}>
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="sm" className="bg-challenges-500 hover:bg-challenges-600" asChild>
                <Link href={promoHref}>
                  {status === "completed" ? "View Recap" : "Join Challenge"} <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getDaysRemaining(endDate: Date | string) {
  const now = new Date()
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}
