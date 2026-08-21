"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Event } from "@/lib/models"
import { EventStatusToggle } from "@/app/(creator)/creator/events/components/event-status-toggle"
import { useToast } from "@/hooks/use-toast"

interface EventSettingsTabProps {
  event: Event
  onSetActive: (isActive: boolean) => Promise<void>
  onTogglePublished: () => Promise<boolean>
  isUpdatingStatus?: boolean
}

export default function EventSettingsTab({
  event,
  onSetActive,
  onTogglePublished,
  isUpdatingStatus = false,
}: EventSettingsTabProps) {
  const { toast } = useToast()
  const eventAny = event as any
  const isPublished = Boolean(eventAny.isPublished)
  const isVisibleToCommunity = event.isActive && isPublished

  const setLiveForCommunity = async () => {
    try {
      if (!event.isActive) {
        await onSetActive(true)
      }
      if (!isPublished) {
        await onTogglePublished()
      }
    } catch (error: any) {
      toast({
        title: "Failed to make event live",
        description: error?.message || "Please try again.",
        variant: "destructive" as any,
      })
    }
  }

  return (
    <div className="space-y-6">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Visibility & Publishing</CardTitle>
          <CardDescription>
            To show this event to community users, set both <strong>Active</strong> and <strong>Published</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventStatusToggle
            isActive={event.isActive}
            isPublished={isPublished}
            onSetActive={onSetActive}
            onTogglePublished={onTogglePublished}
            isUpdating={isUpdatingStatus}
          />
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div>
              <h4 className="font-medium">Community Visibility</h4>
              <p className="text-sm text-muted-foreground">
                {isVisibleToCommunity
                  ? "Visible to all community users."
                  : "Not visible yet. Enable both Active and Published."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                void setLiveForCommunity()
              }}
              disabled={isVisibleToCommunity || isUpdatingStatus}
              className="bg-green-600 hover:bg-green-700"
            >
              {isVisibleToCommunity ? "Live" : "Make Live"}
            </Button>
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Other Settings</CardTitle>
          <CardDescription>
            Additional settings will appear here once backend actions are available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Only visibility controls are active for now.
          </p>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Destructive event actions are currently disabled in this interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Cancel/Delete actions are hidden until those APIs are implemented.
            </p>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}
