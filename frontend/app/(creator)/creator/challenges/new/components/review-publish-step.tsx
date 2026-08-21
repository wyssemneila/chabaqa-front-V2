import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Eye, Users, Clock } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface ReviewPublishStepProps {
  formData: {
    title: string
    description: string
    category: string
    difficulty: string
    duration: string
    currency?: string
    participationFee?: string
    depositAmount: string
    maxParticipants: string
    thumbnail: string
    rewards: {
      completionReward: string
      topPerformerBonus: string
      streakBonus: string
    }
    isPublished: boolean
    steps: Array<{
      day: number
      title: string
      points: number
    }>
  }
  setFormData: (data: any) => void
  startDate?: Date
  endDate?: Date
}

export function ReviewPublishStep({ formData, setFormData, startDate, endDate }: ReviewPublishStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2 text-challenges-500" />
          Review & Publish
        </CardTitle>
        <CardDescription>Review your challenge details before publishing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Challenge Overview</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong> {formData.title || "Not set"}
                </div>
                <div>
                  <strong>Category:</strong> {formData.category || "Not set"}
                </div>
                <div>
                  <strong>Difficulty:</strong> {formData.difficulty || "Not set"}
                </div>
                <div>
                  <strong>Duration:</strong> {formData.duration || "Not set"}
                </div>
                <div>
                  <strong>Currency:</strong> {formData.currency || "TND"}
                </div>
                <div>
                  <strong>Participation Fee:</strong> {formData.participationFee || "0"} {formData.currency || "TND"}
                </div>
                <div>
                  <strong>Deposit:</strong> {formData.depositAmount || "0"} {formData.currency || "TND"}
                </div>
                <div>
                  <strong>Max Participants:</strong> {formData.maxParticipants || "Unlimited"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Start Date:</strong> {startDate ? format(startDate, "PPP") : "Not set"}
                </div>
                <div>
                  <strong>End Date:</strong> {endDate ? format(endDate, "PPP") : "Not set"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Rewards</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Completion:</strong> {formData.rewards.completionReward || "0"} {formData.currency || "TND"}
                </div>
                <div>
                  <strong>Top Performer:</strong> {formData.rewards.topPerformerBonus || "0"} {formData.currency || "TND"}
                </div>
                <div>
                  <strong>Streak Bonus:</strong> {formData.rewards.streakBonus || "0"} {formData.currency || "TND"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Challenge Preview</h3>
              <div className="border rounded-lg p-4 bg-gradient-to-r from-challenges-50 to-orange-50">
                {formData.thumbnail ? (
                  <div className="w-full h-40 rounded mb-3 overflow-hidden relative group">
                    <img
                      src={formData.thumbnail}
                      alt="Challenge Cover"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center">
                    <span className="text-gray-500">No Thumbnail</span>
                  </div>
                )}
                <h4 className="font-semibold text-lg">{formData.title || "Challenge Title"}</h4>
                {formData.category && (
                  <Badge variant="secondary" className="mt-1 bg-challenges-100 text-challenges-700">
                    {formData.category}
                  </Badge>
                )}
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {formData.description || "Challenge description will appear here..."}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />0 joined
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formData.duration || "Duration"}
                    </span>
                  </div>
                  <div className="font-semibold text-challenges-600">
                    ${formData.depositAmount || "0"} deposit
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Challenge Steps ({formData.steps.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded text-sm">
                    <Badge variant="secondary" className="w-8 h-6 flex items-center justify-center">
                      {step.day}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{step.title || `Day ${step.day}`}</div>
                      <div className="text-xs text-muted-foreground">{step.points} points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="publish"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="publish">Publish challenge immediately</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}