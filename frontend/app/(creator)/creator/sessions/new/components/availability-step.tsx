"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Clock, Plus, Trash2, AlertCircle } from "lucide-react"

interface RecurringAvailability {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

interface AvailabilityStepProps {
  formData: {
    duration: string
    recurringAvailability?: RecurringAvailability[]
    autoGenerateSlots?: boolean
    advanceBookingDays?: number
  }
  handleInputChange: (field: string, value: any) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function AvailabilityStep({ formData, handleInputChange }: AvailabilityStepProps) {
  const recurringAvailability = formData.recurringAvailability || []
  const autoGenerateSlots = formData.autoGenerateSlots ?? true
  const advanceBookingDays = formData.advanceBookingDays ?? 30
  const duration = parseInt(formData.duration) || 60
  const [validationError, setValidationError] = useState<string>("")

  const addAvailabilitySlot = () => {
    const newSlot: RecurringAvailability = {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
    }
    handleInputChange('recurringAvailability', [...recurringAvailability, newSlot])
  }

  const updateAvailabilitySlot = (index: number, field: string, value: any) => {
    const updated = recurringAvailability.map((slot, i) => {
      if (i === index) {
        let updatedSlot = { ...slot, [field]: value }
        
        // Auto-calculate end time when start time changes
        if (field === 'startTime' && value) {
          const [hours, minutes] = value.split(':').map(Number)
          const totalMinutes = hours * 60 + minutes + duration
          const endHours = Math.floor(totalMinutes / 60) % 24
          const endMinutes = totalMinutes % 60
          const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
          updatedSlot = { ...updatedSlot, endTime }
        }
        
        // Validation: Ensure end time is after start time
        if (field === 'startTime' || field === 'endTime') {
          const startTime = updatedSlot.startTime
          const endTime = updatedSlot.endTime
          
          if (startTime && endTime) {
            const [startHour, startMin] = startTime.split(':').map(Number)
            const [endHour, endMin] = endTime.split(':').map(Number)
            const startMinutes = startHour * 60 + startMin
            const endMinutes = endHour * 60 + endMin
            
            if (endMinutes <= startMinutes) {
              // Show validation error
              setValidationError("End time must be after start time")
              setTimeout(() => setValidationError(""), 3000)
              return slot
            }
          }
        }
        
        // Clear validation error
        setValidationError("")
        return updatedSlot
      }
      return slot
    })
    handleInputChange('recurringAvailability', updated)
  }

  const removeAvailabilitySlot = (index: number) => {
    handleInputChange('recurringAvailability', recurringAvailability.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Availability
              </CardTitle>
              <CardDescription>
                Set when you're available for this {duration}-minute session
              </CardDescription>
            </div>
            <Button onClick={addAvailabilitySlot} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{validationError}</span>
            </div>
          )}
          {recurringAvailability.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No availability configured yet</p>
              <p className="text-sm mt-1">Add time slots to let users book sessions with you.</p>
              <Button onClick={addAvailabilitySlot} size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Time Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recurringAvailability.map((slot, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateAvailabilitySlot(index, 'dayOfWeek', parseInt(e.target.value))}
                    className="px-3 py-2 border rounded-md bg-white text-sm"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      readOnly
                      className="w-32 bg-muted cursor-not-allowed"
                    />
                  </div>

                  <Switch
                    checked={slot.isActive}
                    onCheckedChange={(checked) => updateAvailabilitySlot(index, 'isActive', checked)}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAvailabilitySlot(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Settings */}
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-generate slots</Label>
                <p className="text-xs text-muted-foreground">Automatically create bookable slots from your availability</p>
              </div>
              <Switch
                checked={autoGenerateSlots}
                onCheckedChange={(checked) => handleInputChange('autoGenerateSlots', checked)}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium">Advance booking days</Label>
                <p className="text-xs text-muted-foreground">How far in advance can users book</p>
              </div>
              <Input
                type="number"
                min="7"
                max="90"
                value={advanceBookingDays}
                onChange={(e) => handleInputChange('advanceBookingDays', parseInt(e.target.value) || 30)}
                className="w-24"
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium">💡 Tip</p>
            <p className="mt-1">
              After creating the session, you can generate specific time slots from the edit page. 
              The availability you set here will be used as a template.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
