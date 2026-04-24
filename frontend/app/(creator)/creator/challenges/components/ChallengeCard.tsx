"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Calendar, Clock, Users, Coins, MoreHorizontal,
  Eye, Trash2, Trophy, TrendingUp,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface ChallengeCardProps {
  challenge: any
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  // Ensure dates are Date objects
  const startDate = challenge.startDate instanceof Date ? challenge.startDate : new Date(challenge.startDate)
  const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)

  const getChallengeStatus = () => {
    const now = new Date()
    if (startDate > now) return "upcoming"
    if (endDate < now) return "completed"
    return "active"
  }

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const status = getChallengeStatus()
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  )

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      await api.challenges.delete(challenge.id)
      toast({
        title: "Challenge deleted",
        description: "The challenge has been successfully deleted.",
      })
      router.refresh()
    } catch (error: any) {
      console.error("Failed to delete challenge:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete challenge. Please try again.",
        variant: "destructive" as any,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <EnhancedCard hover className="overflow-hidden">
      <div className="relative">
        <div className="bg-gradient-to-r from-challenges-500 to-orange-500 p-6 text-white">
          <div className="absolute top-3 left-3">
            <StatusBadge
              status={status}
              className={
                status === "active"
                  ? "bg-green-500"
                  : status === "upcoming"
                    ? "bg-blue-500"
                    : "bg-purple-500"
              }
            />
          </div>
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white/20 hover:bg-white/30 border-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/creator/challenges/${challenge.id}/manage`}>
                    <Eye className="mr-2 h-4 w-4" /> View Challenge
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete Challenge"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-8 h-[120px]">
            <h3 className="text-xl font-bold mb-2 line-clamp-2">{challenge.title}</h3>
            <p className="text-challenges-100 text-sm line-clamp-3">{challenge.description}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{formatDate(startDate)}</div>
              <div>Start Date</div>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">
                {status === "active" ? `${daysRemaining} days left` : formatDate(endDate)}
              </div>
              <div>{status === "active" ? "Remaining" : "End Date"}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{challenge.participants.length}</div>
              <div>Participants</div>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Coins className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{challenge.depositAmount || 50} TND</div>
              <div>Dépôt</div>
            </div>
          </div>
        </div>

        <div className="min-h-[60px]">
          {status === "active" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span>{Math.round(challenge.participants[0]?.progress || 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-challenges-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round(challenge.participants[0]?.progress || 0)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{challenge.completionReward || 5000} TND pool</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/creator/challenges/${challenge.id}/manage?tab=analytics`}>
                <TrendingUp className="h-4 w-4 mr-1" /> Analytics
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/creator/challenges/${challenge.id}/manage`}>
                <Edit className="h-4 w-4 mr-1" /> Manage
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
