"use client"

import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Lock, Users, Coins } from "lucide-react"

interface StepCommunitySettingsProps {
  formData: {
    status: string
    joinFee: string
    feeAmount: string
    currency: string
  }
  updateFormData: (field: string, value: any) => void
}

export function StepCommunitySettings({ formData, updateFormData }: StepCommunitySettingsProps) {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Community Settings</h2>
        <p className="text-gray-600">Configure access control and pricing options.</p>
      </div>

      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-8">
        <label className="block text-lg font-bold text-gray-900 mb-6">Community Status</label>
        <RadioGroup
          value={formData.status}
          onValueChange={(value) => updateFormData("status", value)}
          className="space-y-4"
        >
          <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.status === "public" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
            <RadioGroupItem value="public" id="public" className="w-5 h-5 text-[#8e78fb]" />
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="public" className="text-base font-semibold cursor-pointer text-gray-900">Public</Label>
                <p className="text-sm text-gray-600 mt-1">Anyone can discover and join your community</p>
              </div>
            </div>
          </div>

          <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.status === "private" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
            <RadioGroupItem value="private" id="private" className="w-5 h-5 text-[#8e78fb]" />
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="private" className="text-base font-semibold cursor-pointer text-gray-900">Private</Label>
                <p className="text-sm text-gray-600 mt-1">Only members you invite can access</p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-8">
        <label className="block text-lg font-bold text-gray-900 mb-6">Membership Fee</label>
        <RadioGroup
          value={formData.joinFee}
          onValueChange={(value) => updateFormData("joinFee", value)}
          className="space-y-4"
        >
          <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.joinFee === "free" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
            <RadioGroupItem value="free" id="free" className="w-5 h-5 text-[#8e78fb]" />
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="free" className="text-base font-semibold cursor-pointer text-gray-900">Free Community</Label>
                <p className="text-sm text-gray-600 mt-1">Everyone can join without paying</p>
              </div>
            </div>
          </div>

          <div className={`flex flex-col space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${formData.joinFee === "paid" ? "border-[#8e78fb] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
            <div className="flex items-center space-x-4">
              <RadioGroupItem value="paid" id="paid" className="w-5 h-5 text-[#8e78fb]" />
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="paid" className="text-base font-semibold cursor-pointer text-gray-900">Paid Community</Label>
                  <p className="text-sm text-gray-600 mt-1">Members pay a fee to join</p>
                </div>
              </div>
            </div>
            {formData.joinFee === "paid" && (
              <div className="mt-6 ml-14 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Currency</label>
                  <Select value={formData.currency} onValueChange={(value) => updateFormData("currency", value)}>
                    <SelectTrigger className="border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-0">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TND">🇹🇳 TND - Tunisian Dinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Entry Fee Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25.50"
                    value={formData.feeAmount}
                    onChange={(e) => updateFormData("feeAmount", e.target.value)}
                    className="border-2 border-gray-200 rounded-xl focus:border-[#8e78fb] focus:ring-0"
                  />
                  <p className="text-xs text-gray-500 mt-2">Members must pay this amount to join your community</p>
                </div>
              </div>
            )}
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
