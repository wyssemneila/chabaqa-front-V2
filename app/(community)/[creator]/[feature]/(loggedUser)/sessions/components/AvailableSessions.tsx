"use client"

import { useState } from "react"
import SessionCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/SessionCard"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"

interface AvailableSessionsProps {
  sessions: any[]
}

export default function AvailableSessions({ sessions }: AvailableSessionsProps) {
  const [selectedSession, setSelectedSession] = useState("")

  // Filter only active sessions
  const availableSessions = sessions?.filter(s => s.isActive) || []

  if (availableSessions.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="text-center py-12">
          <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Sessions Available</h3>
          <p className="text-muted-foreground">
            Check back later for new 1-on-1 mentorship sessions
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {availableSessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
        />
      ))}
    </div>
  )
}