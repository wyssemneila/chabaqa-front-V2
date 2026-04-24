"use client"

import { useEffect, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { Event } from "@/lib/models"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface EventDetailsTabProps {
  event: Event
  onUpdateEvent: (updates: Partial<Event>) => void
}

export default function EventDetailsTab({ event, onUpdateEvent }: EventDetailsTabProps) {
  const [imageLoadError, setImageLoadError] = useState(false)
  const eventImageSrc = resolveImageUrl(event.image) || event.image

  useEffect(() => {
    setImageLoadError(false)
  }, [eventImageSrc])

  const handleInputChange = (field: string, value: any) => {
    onUpdateEvent({ [field]: value })
  }

  const formatDateInputValue = (value?: Date) => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return ""
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, "0")
    const day = String(value.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const parseDateInputValue = (value: string) => {
    if (!value) return undefined
    return new Date(`${value}T12:00:00`)
  }

  const totalAttendees = event.attendees?.length || 0
  const totalRevenue = (event.tickets || []).reduce((acc, ticket) => acc + ((ticket.price || 0) * (ticket.sold || 0)), 0)
  const averageAttendance = (event.sessions || []).reduce((acc, s) => acc + (s.attendance || 0), 0) / (event.sessions?.length || 1) || 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your event basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={event.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={event.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={event.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={event.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-person">In-person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={event.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">EST</SelectItem>
                    <SelectItem value="PST">PST</SelectItem>
                    <SelectItem value="CET">CET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formatDateInputValue(event.startDate)}
                  onChange={(e) => handleInputChange("startDate", parseDateInputValue(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formatDateInputValue(event.endDate)}
                  onChange={(e) => handleInputChange("endDate", parseDateInputValue(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={event.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={event.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                />
              </div>
            </div>

            {event.type !== "Online" && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Venue address"
                  value={event.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>
            )}

            {event.type !== "In-person" && (
              <div className="space-y-2">
                <Label htmlFor="onlineUrl">Online URL</Label>
                <Input
                  id="onlineUrl"
                  placeholder="https://example.com/event"
                  value={event.onlineUrl}
                  onChange={(e) => handleInputChange("onlineUrl", e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Event Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Add any notes or instructions for attendees..."
                value={event.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Event Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                {eventImageSrc && !imageLoadError ? (
                  <img
                    src={eventImageSrc}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Upload image</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Event image is read-only here. Update the image URL in your event details to change it.
              </p>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attendees</span>
              <span className="font-semibold">{totalAttendees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sessions</span>
              <span className="font-semibold">{event.sessions?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Attendance</span>
              <span className="font-semibold">{Math.round(averageAttendance)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-semibold text-green-600">${totalRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  )
}
