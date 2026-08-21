
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Users } from "lucide-react"

const durations = [
  { label: "30 minutes", value: "30" },
  { label: "45 minutes", value: "45" },
  { label: "60 minutes", value: "60" },
  { label: "90 minutes", value: "90" },
  { label: "120 minutes", value: "120" },
]

interface PricingDurationStepProps {
  formData: {
    duration: string
    price: string
    currency: string
    maxBookingsPerWeek: string
    availableDays: string[]
    availableHours: {
      start: string
      end: string
    }
  }
  handleInputChange: (field: string, value: any) => void
  handleDayToggle: (day: string) => void
  validationErrors?: Record<string, string>
}

export function PricingDurationStep({ formData, handleInputChange, validationErrors }: PricingDurationStepProps) {

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Coins className="h-5 w-5 mr-2 text-sessions-500" />
          Pricing & Duration
        </CardTitle>
        <CardDescription>Set your session price, duration, and availability</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="duration">Session Duration *</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger className={validationErrors?.duration ? "border-red-500" : ""}>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors?.duration && (
              <p className="text-sm text-red-500">{validationErrors.duration}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Session Price *</Label>
            <div className="flex">
              <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="price"
                type="number"
                placeholder="150"
                className={`rounded-l-none ${validationErrors?.price ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />
            </div>
            {validationErrors?.price && (
              <p className="text-sm text-red-500">{validationErrors.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxBookingsPerWeek">Max Bookings/Week</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxBookingsPerWeek"
                type="number"
                placeholder="5"
                className="pl-10"
                value={formData.maxBookingsPerWeek}
                onChange={(e) => handleInputChange("maxBookingsPerWeek", e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}