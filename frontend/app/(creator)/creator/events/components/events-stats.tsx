import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CalendarIcon, Users, Coins, TrendingUp } from "lucide-react"

interface EventsStatsProps {
  totalEvents: number
  totalAttendees: number
  totalRevenue: number | null
  totalUpcoming: number
}

export function EventsStats({
  totalEvents,
  totalAttendees,
  totalRevenue,
  totalUpcoming
}: EventsStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <EnhancedCard className="p-4">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{totalEvents}</p>
            <p className="text-sm text-muted-foreground">Total Events</p>
          </div>
        </div>
      </EnhancedCard>
      <EnhancedCard className="p-4">
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{totalAttendees}</p>
            <p className="text-sm text-muted-foreground">Total Attendees</p>
          </div>
        </div>
      </EnhancedCard>
      <EnhancedCard className="p-4">
        <div className="flex items-center space-x-3">
          <Coins className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-2xl font-bold">
              {typeof totalRevenue === "number" && Number.isFinite(totalRevenue)
                ? `${Number(totalRevenue).toLocaleString()} TND`
                : "N/A"}
            </p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
        </div>
      </EnhancedCard>
      <EnhancedCard className="p-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold">{totalUpcoming}</p>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </div>
        </div>
      </EnhancedCard>
    </div>
  )
}
