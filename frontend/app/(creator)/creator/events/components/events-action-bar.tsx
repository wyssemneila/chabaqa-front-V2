"use client"

import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface EventsActionBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  totalUpcoming: number
  totalPast: number
}

export function EventsActionBar({
  activeTab,
  setActiveTab,
  totalUpcoming,
  totalPast
}: EventsActionBarProps) {
  const router = useRouter()

  const handleCreateEvent = () => {
    router.push("/creator/events/new")
  }

  return (
    <div className="flex items-center justify-between">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({totalUpcoming})</TabsTrigger>
          <TabsTrigger value="past">Past ({totalPast})</TabsTrigger>
        </TabsList>
      </Tabs>
      <Button onClick={handleCreateEvent} className="bg-events-500 hover:bg-events-600">
        <Plus className="h-4 w-4 mr-2" />
        Create Event
      </Button>
    </div>
  )
}