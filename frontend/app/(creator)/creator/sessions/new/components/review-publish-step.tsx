
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Video, Users, Star, Eye } from "lucide-react"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface ReviewPublishStepProps {
  formData: {
    title: string
    description: string
    thumbnail: string
    duration: string
    price: string
    currency: string
    sessionFormat: string
    availableDays: string[]
    availableHours: {
      start: string
      end: string
    }
    maxBookingsPerWeek: string
    whatYoullGet: string[]
    requirements: string
    preparationMaterials: string
    isPublished?: boolean
  }
  handleInputChange: (field: string, value: any) => void
}

export function ReviewPublishStep({ formData, handleInputChange }: ReviewPublishStepProps) {
  const previewImage = resolveImageUrl(formData.thumbnail) || formData.thumbnail || "/placeholder.svg"

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2 text-sessions-500" />
          Review & Publish
        </CardTitle>
        <CardDescription>Review your session details before publishing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Session Overview</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong> {formData.title || "Not set"}
                </div>
                <div>
                  <strong>Duration:</strong> {formData.duration ? `${formData.duration} minutes` : "Not set"}
                </div>
                <div>
                  <strong>Price:</strong> {formData.price ? `${formData.currency} ${formData.price}` : "Not set"}
                </div>
                <div>
                  <strong>Format:</strong> {formData.sessionFormat || "Not set"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Availability</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Days:</strong>{" "}
                  {formData.availableDays.length > 0 ? formData.availableDays.join(", ") : "Not set"}
                </div>
                <div>
                  <strong>Hours:</strong>{" "}
                  {formData.availableHours.start && formData.availableHours.end
                    ? `${formData.availableHours.start} - ${formData.availableHours.end}`
                    : "Not set"}
                </div>
                <div>
                  <strong>Max bookings/week:</strong> {formData.maxBookingsPerWeek || "Unlimited"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">What Participants Get</h3>
              <ul className="text-sm space-y-1">
                {formData.whatYoullGet
                  .filter((item) => item.trim())
                  .map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-sessions-500 mr-2">•</span>
                      {item}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Session Preview</h3>
              <div className="border rounded-lg p-4 bg-sessions-50">
                <div className="mb-3 overflow-hidden rounded-md border bg-white">
                  <img src={previewImage} alt="Session cover preview" className="h-36 w-full object-cover" />
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{formData.title || "Session Title"}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sessions-600">
                      {formData.price ? `${formData.currency} ${formData.price}` : "Free"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formData.duration ? `${formData.duration} min` : "Duration"}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {formData.description || "Session description will appear here..."}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Video className="h-3 w-3 mr-1" />
                      {formData.sessionFormat || "Format"}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />0 booked
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    New
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Requirements</h3>
              <div className="text-sm text-muted-foreground">
                {formData.requirements || "No specific requirements"}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Preparation Materials</h3>
              <div className="text-sm text-muted-foreground">
                {formData.preparationMaterials || "No preparation materials specified"}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="publish"
                checked={formData.isPublished || false}
                onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
              />
              <Label htmlFor="publish">Publish session immediately</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
