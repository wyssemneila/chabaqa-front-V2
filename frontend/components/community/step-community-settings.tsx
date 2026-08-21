"use client"

import { Coins, Globe, Lock, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface StepCommunitySettingsProps {
  formData: {
    status: string
    joinFee: string
    feeAmount: string
    currency: string
  }
  updateFormData: (field: string, value: any) => void
}

const optionClass = (active: boolean) =>
  cn(
    "flex items-start gap-3 rounded-lg border p-4 transition-colors",
    active ? "border-chabaqa-primary bg-chabaqa-primary/5" : "border-gray-200 bg-white hover:bg-gray-50",
  )

export function StepCommunitySettings({ formData, updateFormData }: StepCommunitySettingsProps) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-semibold text-gray-950">Access and payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose who can join and whether the community starts free or paid.</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900">Access</Label>
        <RadioGroup value={formData.status} onValueChange={(value) => updateFormData("status", value)} className="grid gap-3 md:grid-cols-2">
          <label className={optionClass(formData.status === "public")} htmlFor="public">
            <RadioGroupItem value="public" id="public" />
            <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span>
              <span className="block text-sm font-semibold text-gray-950">Public</span>
              <span className="mt-1 block text-xs text-muted-foreground">People can discover and request/join from public surfaces.</span>
            </span>
          </label>

          <label className={optionClass(formData.status === "private")} htmlFor="private">
            <RadioGroupItem value="private" id="private" />
            <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span>
              <span className="block text-sm font-semibold text-gray-950">Private</span>
              <span className="mt-1 block text-xs text-muted-foreground">Only invited members can access this community.</span>
            </span>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900">Membership</Label>
        <RadioGroup value={formData.joinFee} onValueChange={(value) => updateFormData("joinFee", value)} className="grid gap-3 md:grid-cols-2">
          <label className={optionClass(formData.joinFee === "free")} htmlFor="free">
            <RadioGroupItem value="free" id="free" />
            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span>
              <span className="block text-sm font-semibold text-gray-950">Free</span>
              <span className="mt-1 block text-xs text-muted-foreground">Start simple and add monetization later.</span>
            </span>
          </label>

          <label className={optionClass(formData.joinFee === "paid")} htmlFor="paid">
            <RadioGroupItem value="paid" id="paid" />
            <Coins className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span>
              <span className="block text-sm font-semibold text-gray-950">Paid</span>
              <span className="mt-1 block text-xs text-muted-foreground">Members pay before joining.</span>
            </span>
          </label>
        </RadioGroup>
      </div>

      {formData.joinFee === "paid" && (
        <div className="grid gap-4 rounded-lg border bg-gray-50 p-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label>Select Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => updateFormData("currency", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TND">TND</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Entry Fee Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="25.50"
              value={formData.feeAmount}
              onChange={(event) => updateFormData("feeAmount", event.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
