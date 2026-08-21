import { TrendingUp } from "lucide-react"

interface ProgressHeaderProps {
  summary: {
    totalItems: number
    completed: number
    inProgress: number
    notStarted: number
  }
  communityName?: string
}

export default function ProgressHeader({ summary, communityName }: ProgressHeaderProps) {
  const completionRate =
    summary.totalItems > 0
      ? Math.round((summary.completed / summary.totalItems) * 100)
      : 0

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-rose-600 to-fuchsia-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />

        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <h1 className="text-2xl font-bold">My Progress</h1>
          </div>
          <p className="text-fuchsia-100 text-sm">
            {communityName ? `Your journey in ${communityName}` : "Tracking your learning journey"}
          </p>
        </div>

        <p className="text-white/70 text-sm md:ml-4 mt-2 md:mt-0 hidden md:block">
          Stay on top of completed and in-progress content
        </p>

        <div className="flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-xl font-bold">{completionRate}%</div>
            <div className="text-white/70 text-xs">Completion</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{summary.completed}</div>
            <div className="text-white/70 text-xs">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{summary.inProgress}</div>
            <div className="text-white/70 text-xs">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{summary.notStarted}</div>
            <div className="text-white/70 text-xs">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  )
}
