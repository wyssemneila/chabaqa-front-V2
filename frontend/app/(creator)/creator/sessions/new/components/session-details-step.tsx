
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings, Award, X } from "lucide-react"

const sessionFormats = [
  "Video Call (Google Meet)",
  "Video Call (Zoom)",
  "Screen Sharing Session",
  "Code Review Session",
  "Whiteboard Session",
  "Q&A Session",
]

interface SessionDetailsStepProps {
  formData: {
    sessionFormat: string
    whatYoullGet: string[]
    preparationMaterials: string
  }
  handleInputChange: (field: string, value: any) => void
  handleArrayChange: (field: string, index: number, value: string) => void
  addArrayItem: (field: string) => void
  removeArrayItem: (field: string, index: number) => void
}

export function SessionDetailsStep({
  formData,
  handleInputChange,
  handleArrayChange,
  addArrayItem,
  removeArrayItem,
}: SessionDetailsStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2 text-sessions-500" />
          Session Details
        </CardTitle>
        <CardDescription>Define the format and what participants will receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="sessionFormat">Session Format *</Label>
          <Select
            value={formData.sessionFormat}
            onValueChange={(value) => handleInputChange("sessionFormat", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select session format" />
            </SelectTrigger>
            <SelectContent>
              {sessionFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>What participants will get</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("whatYoullGet")}>
              <Award className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
          {formData.whatYoullGet.map((item, index) => (
            <div key={index} className="flex space-x-2">
              <Input
                placeholder="e.g., Detailed code review with actionable feedback"
                value={item}
                onChange={(e) => handleArrayChange("whatYoullGet", index, e.target.value)}
              />
              {formData.whatYoullGet.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("whatYoullGet", index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="preparationMaterials">Preparation Materials</Label>
          <Textarea
            id="preparationMaterials"
            placeholder="What should participants bring or prepare? (code, portfolio, questions, etc.)"
            rows={3}
            value={formData.preparationMaterials}
            onChange={(e) => handleInputChange("preparationMaterials", e.target.value)}
          />
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <strong>Note:</strong> Sessions are created as drafts. You can publish them from the sessions page once you have an active subscription.
        </div>
      </CardContent>
    </EnhancedCard>
  )
}