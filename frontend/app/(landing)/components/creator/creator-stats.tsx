// CreatorStats.tsx (Optional - if you want to use it)
interface CreatorStatsProps {
  communities: number
  courses: number
  challenges: number
  sessions: number
  events: number
}

export function CreatorStats({ communities, courses, challenges, sessions, events }: CreatorStatsProps) {
  const stats = [
    {
      label: "Communities",
      value: communities,
      icon: (
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "text-[#8e78fb]",
      bg: "bg-[#8e78fb]/10",
    },
    {
      label: "Courses",
      value: courses,
      icon: (
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      color: "text-[#47c7ea]",
      bg: "bg-[#47c7ea]/10",
    },
    {
      label: "Challenges",
      value: challenges,
      icon: (
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "text-[#ff9b28]",
      bg: "bg-[#ff9b28]/10",
    },
    {
      label: "Events",
      value: events,
      icon: (
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "1-on-1 Sessions",
      value: sessions,
      icon: (
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      color: "text-[#f65887]",
      bg: "bg-[#f65887]/10",
    },
  ]

  return (
    <div className="mb-8 sm:mb-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className={`${stat.bg} p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-gray-600">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}