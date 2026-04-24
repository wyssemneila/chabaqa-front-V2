import { CalendarIcon } from "lucide-react"

interface HeaderSectionProps {
  sessions: any[]
  userBookings: any[]
}

export default function HeaderSection({ sessions, userBookings }: HeaderSectionProps) {
  // Calculate stats
  const bookedCount = userBookings?.filter(b => 
    b.status === 'confirmed' || b.status === 'pending'
  ).length || 0
  
  const availableTypes = new Set(sessions?.map(s => s.category).filter(Boolean)).size || 0
  
  // Calculate weighted average rating from real session data
  const totalRatings = (sessions || []).reduce((sum, session) => {
    const count = Number(session?.ratingCount || 0)
    return sum + (Number.isFinite(count) ? count : 0)
  }, 0)

  const weightedRatingSum = (sessions || []).reduce((sum, session) => {
    const count = Number(session?.ratingCount || 0)
    const rating = Number(session?.averageRating || 0)
    if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(rating)) {
      return sum
    }
    return sum + rating * count
  }, 0)

  const avgRating = totalRatings > 0 ? weightedRatingSum / totalRatings : 0

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-sessions-500 to-pink-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-6 w-6" />
            <h1 className="text-2xl font-bold">1-on-1 Sessions</h1>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sessions-100 text-sm md:ml-4 mt-2 md:mt-0">
          Get personalized mentorship and guidance from expert developers
        </p>

        {/* Stats horizontal */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-xl font-bold">{bookedCount}</div>
            <div className="text-sessions-100 text-xs">Sessions Booked</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{availableTypes || sessions?.length || 0}</div>
            <div className="text-sessions-100 text-xs">Available Types</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{avgRating.toFixed(1)}</div>
            <div className="text-sessions-100 text-xs">Avg Rating</div>
          </div>
        </div>
      </div>
    </div>
  )
}
