"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Event } from "@/lib/models"

interface EventHeaderProps {
  event: Event
  onSave: () => Promise<void>
  isSaving: boolean
  hasChanges: boolean
}

export default function EventHeader({ event, onSave, isSaving, hasChanges }: EventHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/creator/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text-events">Manage Event</h1>
              <div className="flex items-center gap-2">
                <Badge variant={event.isActive ? "default" : "secondary"}>
                  {event.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={event.isPublished ? "default" : "secondary"}>
                  {event.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground mt-1">{event.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            onClick={onSave} 
            disabled={isSaving || !hasChanges}
            className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
          </Button>
        </div>
      </div>
      
      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            You have unsaved local changes. Click Save Changes to persist them.
          </p>
        </div>
      )}
    </div>
  )
}
