import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ChallengeRewardsTab({
  formData,
  onInputChange,
  totalParticipants,
}: {
  formData: any
  onInputChange: (field: string, value: any) => void
  totalParticipants: number
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Pricing & Rewards</CardTitle>
          <CardDescription>Configure challenge financial incentives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="participationFee">Participation Fee</Label>
              <Input
                id="participationFee"
                type="number"
                placeholder="0"
                value={formData.participationFee}
                onChange={(e) => onInputChange("participationFee", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Non-refundable fee</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => onInputChange("currency", value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND (DT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount</Label>
            <Input
              id="depositAmount"
              type="number"
              placeholder="50"
              value={formData.depositAmount}
              onChange={(e) => onInputChange("depositAmount", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Refundable amount participants pay to join</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completionReward">Completion Reward</Label>
            <Input
              id="completionReward"
              type="number"
              placeholder="25"
              value={formData.completionReward}
              onChange={(e) => onInputChange("completionReward", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Reward for completing the challenge</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topPerformerBonus">Top Performer Bonus</Label>
            <Input
              id="topPerformerBonus"
              type="number"
              placeholder="100"
              value={formData.topPerformerBonus}
              onChange={(e) => onInputChange("topPerformerBonus", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Additional bonus for the top performer</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streakBonus">Daily Streak Bonus</Label>
            <Input
              id="streakBonus"
              type="number"
              placeholder="10"
              value={formData.streakBonus}
              onChange={(e) => onInputChange("streakBonus", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Bonus for maintaining daily streaks</p>
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Overview of challenge economics per participant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Participation Fees</span>
            <span className="font-semibold">{formData.currency} {(Number(formData.participationFee) || 0) * (totalParticipants || 1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Deposits</span>
            <span className="font-semibold">{formData.currency} {(Number(formData.depositAmount) || 0) * (totalParticipants || 1)}</span>
          </div>
          <div className="border-t my-2"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completion Rewards (Max)</span>
            <span className="font-semibold text-red-500">-{formData.currency} {(Number(formData.completionReward) || 0) * (totalParticipants || 1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Top Performer Bonus (Max)</span>
            <span className="font-semibold text-red-500">-{formData.currency} {Number(formData.topPerformerBonus) || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Streak Bonuses (Est. 10 days)</span>
            <span className="font-semibold text-red-500">-{formData.currency} {(Number(formData.streakBonus) || 0) * 10 * (totalParticipants || 1)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Potential Net Revenue</span>
              <span className="font-bold text-green-600">
                {formData.currency}
                {(Number(formData.participationFee) || 0) * (totalParticipants || 1) +
                  (Number(formData.depositAmount) || 0) * (totalParticipants || 1) -
                  (Number(formData.completionReward) || 0) * (totalParticipants || 1) -
                  (Number(formData.topPerformerBonus) || 0) -
                  (Number(formData.streakBonus) || 0) * 10 * (totalParticipants || 1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Calculations based on {totalParticipants || 1} participant(s). Revenue depends on completion rates.
            </p>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}