"use client"

import { CommunityCard } from "@/app/(landing)/(communities)/components/community-card"

interface CreatorOfferingsProps {
  communities: any[]
  courses: any[]
  challenges: any[]
  sessions: any[]
  events: any[]
  activeTab: string
}

export function CreatorOfferings({
  communities,
  courses,
  challenges,
  sessions,
  events,
  activeTab,
}: CreatorOfferingsProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "communities" && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 font-sans text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Communities
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
                Join vibrant communities and connect with like-minded learners. Build relationships, share knowledge,
                and grow together.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <CommunityCard key={community.id} community={community} viewMode="grid" />
              ))}
            </div>
          </section>
        )}

        {activeTab === "courses" && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 font-sans text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Courses
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
                Comprehensive courses designed to help you master new skills. Learn at your own pace with structured
                content and hands-on projects.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CommunityCard key={course.id} community={course} viewMode="grid" />
              ))}
            </div>
          </section>
        )}

        {activeTab === "challenges" && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 font-sans text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Challenges
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
                Push your limits with structured challenges. Stay accountable, build habits, and achieve your goals with
                our community-driven approach.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <CommunityCard key={challenge.id} community={challenge} viewMode="grid" />
              ))}
            </div>
          </section>
        )}

        {activeTab === "events" && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 font-sans text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Events
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
                Attend live events and workshops. Network with peers, learn from experts, and stay updated with the
                latest trends.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <CommunityCard key={event.id} community={event} viewMode="grid" />
              ))}
            </div>
          </section>
        )}

        {activeTab === "sessions" && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 font-sans text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                One-on-One Sessions
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
                Get personalized guidance and mentorship. Book individual sessions tailored to your specific needs and
                goals.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <CommunityCard key={session.id} community={session} viewMode="grid" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
