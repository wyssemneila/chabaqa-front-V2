"use client"

import { useState } from "react"
import { CreatorNav } from "./creator-nav"
import { CreatorOfferings } from "./creator-offerings"
import type { Community, Course, Challenge, Session, Event } from "@/lib/models"

interface CreatorPageContentProps {
  communities: Community[]
  allCourses: Course[]
  allChallenges: Challenge[]
  allSessions: Session[]
  allEvents: Event[]
}

export function CreatorPageContent({
  communities,
  allCourses,
  allChallenges,
  allSessions,
  allEvents,
}: CreatorPageContentProps) {
  const [activeTab, setActiveTab] = useState("communities")

  return (
    <>
      <CreatorNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="container mx-auto px-4 py-4">
        <CreatorOfferings
          communities={communities}
          courses={allCourses}
          challenges={allChallenges}
          sessions={allSessions}
          events={allEvents}
          activeTab={activeTab}
        />
      </div>
    </>
  )
}
