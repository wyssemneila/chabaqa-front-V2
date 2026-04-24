
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, MapPin, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DateLocationStepProps {
  formData: any
  handleInputChange: (field: string, value: any) => void
  startDate: Date | undefined
  setStartDate: (date: Date | undefined) => void
  endDate: Date | undefined
  setEndDate: (date: Date | undefined) => void
  errors?: Record<string, string>
}

const timezones = ["UTC", "EST", "PST", "CET", "IST", "JST"]

export function DateLocationStep({
  formData,
  handleInputChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  errors = {}
}: DateLocationStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-events-500" />
          Date & Location
        </CardTitle>
        <CardDescription>Set your event dates and location details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                    errors.startDate && "border-red-500",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                    errors.endDate && "border-red-500",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="startTime"
                type="time"
                className={cn("pl-10", errors.startTime && "border-red-500")}
                value={formData.schedule.startTime}
                onChange={(e) => handleInputChange("schedule.startTime", e.target.value)}
              />
            </div>
            {errors.startTime && (
              <p className="text-sm text-red-500">{errors.startTime}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="endTime"
                type="time"
                className={cn("pl-10", errors.endTime && "border-red-500")}
                value={formData.schedule.endTime}
                onChange={(e) => handleInputChange("schedule.endTime", e.target.value)}
              />
            </div>
            {errors.endTime && (
              <p className="text-sm text-red-500">{errors.endTime}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone *</Label>
          <Select
            value={formData.schedule.timezone}
            onValueChange={(value) => handleInputChange("schedule.timezone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.type !== "Online" && (
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Venue name and address"
                className={cn("pl-10", errors.location && "border-red-500")}
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>
        )}

        {formData.type !== "In-person" && (
          <div className="space-y-2">
            <Label htmlFor="onlineUrl">Online Event URL *</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="onlineUrl"
                placeholder="https://example.com/event"
                className={cn("pl-10", errors.onlineUrl && "border-red-500")}
                value={formData.onlineUrl}
                onChange={(e) => handleInputChange("onlineUrl", e.target.value)}
              />
            </div>
            {errors.onlineUrl && (
              <p className="text-sm text-red-500">{errors.onlineUrl}</p>
            )}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}