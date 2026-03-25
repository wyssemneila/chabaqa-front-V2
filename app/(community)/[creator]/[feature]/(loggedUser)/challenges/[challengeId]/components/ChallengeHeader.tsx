import { Badge } from "@/components/ui/badge"
import { Zap, Users } from "lucide-react"

interface ChallengeHeaderProps {
  challenge: any
  challengeTasks: any[]
}

export default function ChallengeHeader({ challenge, challengeTasks }: ChallengeHeaderProps) {
  const completedTasks = challengeTasks.filter((t) => t.isCompleted).length
  const totalPoints = challengeTasks.filter((t) => t.isCompleted).reduce((acc, task) => acc + (task.points || 0), 0)
  const participantCount = challenge.participantCount || challenge.participants?.length || 0

  // Ensure dates are Date objects
  const startDate = challenge.startDate instanceof Date ? challenge.startDate : new Date(challenge.startDate)
  const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)

  const getChallengeStatus = () => {
    const now = new Date()
    if (startDate > now) return "upcoming"
    if (endDate < now) return "completed"
    return "active"
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  )

  const status = getChallengeStatus()

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-challenges-500 to-orange-500 rounded-xl p-4 md:p-6 text-white relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        <div className="relative z-10">
          {/* Title & Badge */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{challenge.title}</h1>
                <p className="text-challenges-100 text-sm mt-1 line-clamp-2 md:line-clamp-1 max-w-2xl">
                  {challenge.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3 md:mt-0">
              <Badge
                className={
                  status === "active"
                    ? "bg-green-500"
                    : status === "upcoming"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                }
              >
                {status}
              </Badge>
              <Badge className="bg-white/20">
                <Users className="h-3 w-3 mr-1" />
                {participantCount} participants
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{challengeTasks.length}</div>
              <div className="text-challenges-100 text-xs">Total Tasks</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{completedTasks}</div>
              <div className="text-challenges-100 text-xs">Completed</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{daysRemaining}</div>
              <div className="text-challenges-100 text-xs">Days Left</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-challenges-100 text-xs">Points Earned</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
