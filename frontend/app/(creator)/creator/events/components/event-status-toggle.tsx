"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Power, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EventStatusToggleProps {
  isActive: boolean
  isPublished: boolean
  onSetActive: (isActive: boolean) => Promise<void>
  onTogglePublished: () => Promise<boolean>
  isUpdating?: boolean
}

export function EventStatusToggle({
  isActive: initialIsActive,
  isPublished: initialIsPublished,
  onSetActive,
  onTogglePublished,
  isUpdating = false,
}: EventStatusToggleProps) {
  const { toast } = useToast()
  const [isActive, setIsActive] = useState(initialIsActive)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsActive(initialIsActive)
  }, [initialIsActive])

  useEffect(() => {
    setIsPublished(initialIsPublished)
  }, [initialIsPublished])

  const handleToggleActive = async () => {
    const newIsActive = !isActive
    setIsActive(newIsActive)
    setLoading(true)
    try {
      await onSetActive(newIsActive)
      toast({
        title: newIsActive ? "Event Activated" : "Event Deactivated",
        description: newIsActive 
          ? "Event is now active and accepting registrations"
          : "Event is now inactive and not accepting registrations",
      })
    } catch (error: any) {
      setIsActive(!newIsActive)
      toast({
        title: "Failed to update status",
        description: error?.message || "Please try again",
        variant: "destructive" as any
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublished = async () => {
    setLoading(true)
    try {
      const newIsPublished = await onTogglePublished()
      setIsPublished(newIsPublished)
      toast({
        title: newIsPublished ? "Event Published" : "Event Unpublished",
        description: (newIsPublished 
          ? "Event is now visible to users"
          : "Event is now hidden from users"),
      })
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || "Please try again"
      toast({
        title: "Failed to update status",
        description: errorMessage,
        variant: "destructive" as any
      })
    } finally {
      setLoading(false)
    }
  }

  const isVisibleToUsers = isActive && isPublished

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Power className="h-5 w-5" />
          Event Status
        </CardTitle>
        <CardDescription>
          Control event visibility and availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {isVisibleToUsers ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Visible to Users</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Not Visible</span>
              </>
            )}
          </div>
          <Badge variant={isVisibleToUsers ? "default" : "secondary"}>
            {isVisibleToUsers ? "Live" : "Hidden"}
          </Badge>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4" />
              <span className="font-medium">Active</span>
              <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                {isActive ? "On" : "Off"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isActive 
                ? "Event is active and accepting registrations"
                : "Event is inactive and not accepting registrations"}
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggleActive}
            disabled={loading || isUpdating}
          />
        </div>

        {/* Published Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isPublished ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              <span className="font-medium">Published</span>
              <Badge variant={isPublished ? "default" : "secondary"} className="text-xs">
                {isPublished ? "Yes" : "No"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPublished 
                ? "Event is visible to all users"
                : "Event is hidden from users (draft mode)"}
            </p>
          </div>
          <Switch
            checked={isPublished}
            onCheckedChange={handleTogglePublished}
            disabled={loading || isUpdating}
          />
        </div>

        {/* Info Alert */}
        {!isVisibleToUsers && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {!isActive && !isPublished && (
                "Event is in draft mode. Enable both Active and Published to make it visible to users."
              )}
              {isActive && !isPublished && (
                "Event is active but not published. Enable Published to make it visible to users."
              )}
              {!isActive && isPublished && (
                "Event is published but not active. Enable Active to accept registrations."
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {isVisibleToUsers && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Event is live! Users can now view and register for this event.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
