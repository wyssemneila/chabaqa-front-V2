import { useEffect, useState } from "react"
import { format } from "date-fns"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar as CalendarIcon, MapPin, Mic, Eye } from "lucide-react"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface ReviewPublishStepProps {
  formData: any
  handleInputChange: (field: string, value: any) => void
  startDate: Date | undefined
  endDate: Date | undefined
}

export function ReviewPublishStep({
  formData,
  handleInputChange,
  startDate,
  endDate
}: ReviewPublishStepProps) {
  const [imageLoadError, setImageLoadError] = useState(false)
  const previewImageSrc = resolveImageUrl(formData.image) || formData.image

  useEffect(() => {
    setImageLoadError(false)
  }, [previewImageSrc])

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2 text-events-500" />
          Review & Publish
        </CardTitle>
        <CardDescription>Review your event details before publishing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Event Overview</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong> {formData.title || "Not set"}
                </div>
                <div>
                  <strong>Category:</strong> {formData.category || "Not set"}
                </div>
                <div>
                  <strong>Type:</strong> {formData.type || "Not set"}
                </div>
                <div>
                  <strong>Description:</strong>{" "}
                  {formData.description ? (
                    <span className="line-clamp-1">{formData.description}</span>
                  ) : (
                    "Not set"
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Date & Time</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Date:</strong>{" "}
                  {startDate && endDate
                    ? `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`
                    : "Not set"}
                </div>
                <div>
                  <strong>Time:</strong>{" "}
                  {formData.schedule.startTime && formData.schedule.endTime
                    ? `${formData.schedule.startTime} - ${formData.schedule.endTime} (${formData.schedule.timezone})`
                    : "Not set"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Location</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Venue:</strong> {formData.location || "Not set"}
                </div>
                {formData.onlineUrl && (
                  <div className="break-all">
                    <strong>Online URL:</strong>{" "}
                    <span className="text-blue-600 hover:underline">{formData.onlineUrl}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Event Preview</h3>
              <div className="border rounded-lg p-4 bg-gradient-to-r from-events-50 to-blue-50">
                {previewImageSrc && !imageLoadError ? (
                  <div className="w-full h-32 rounded mb-3 overflow-hidden bg-gray-100">
                    <img
                      src={previewImageSrc}
                      alt={formData.title || "Event preview"}
                      className="w-full h-full object-cover"
                      onError={() => setImageLoadError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center">
                    <span className="text-gray-500">Event Image</span>
                  </div>
                )}
                <h4 className="font-semibold text-lg">{formData.title || "Event Title"}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {formData.description || "Event description will appear here..."}
                </p>
                <div className="flex items-center space-x-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {startDate ? format(startDate, "PPP") : "Date not set"}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {formData.location || "Location not set"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Speakers ({formData.speakers.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {formData.speakers.map((speaker: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Mic className="h-3 w-3 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{speaker.name || `Speaker ${index + 1}`}</div>
                      <div className="text-xs text-muted-foreground truncate">{speaker.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Tickets ({formData.tickets.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {formData.tickets.map((ticket: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <div className="font-medium">{ticket.name || `Ticket ${index + 1}`}</div>
                      <div className="text-xs text-muted-foreground capitalize">{ticket.type}</div>
                    </div>
                    <div className="font-semibold text-events-600">
                      {ticket.price || "0"} TND
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="publish"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
              />
              <Label htmlFor="publish">Publish event immediately</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
