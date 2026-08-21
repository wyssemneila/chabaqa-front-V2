"use client"

import { useEffect, useState } from "react"
import { sessionsApi } from "@/lib/api/sessions.api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Loader2, Plus, Trash2, RefreshCw } from "lucide-react"
import { format, addDays } from "date-fns"

interface RecurringAvailability {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration?: number
  isActive?: boolean
}

interface AvailableSlot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  bookedBy?: string
}

interface SessionAvailabilityProps {
  sessionId: string
  duration: number
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

export function SessionAvailability({ sessionId, duration }: SessionAvailabilityProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [recurringAvailability, setRecurringAvailability] = useState<RecurringAvailability[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [autoGenerateSlots, setAutoGenerateSlots] = useState(false)
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30)

  // Load existing availability
  useEffect(() => {
    loadAvailability()
  }, [sessionId])

  const loadAvailability = async () => {
    setLoading(true)
    try {
      const [hoursResponse, slotsResponse] = await Promise.all([
        sessionsApi.getAvailableHours(sessionId).catch(() => null),
        sessionsApi.getAvailableSlots(sessionId).catch(() => null),
      ])

      if (hoursResponse) {
        const data = hoursResponse?.data || hoursResponse
        setRecurringAvailability(data?.recurringAvailability || [])
        setAutoGenerateSlots(data?.autoGenerateSlots || false)
        setAdvanceBookingDays(data?.advanceBookingDays || 30)
      }

      if (slotsResponse) {
        const data = slotsResponse?.data || slotsResponse
        setAvailableSlots(data?.slots || [])
      }
    } catch (error) {
      console.error('Failed to load availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAvailabilitySlot = () => {
    setRecurringAvailability(prev => [
      ...prev,
      {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: duration,
        isActive: true,
      }
    ])
  }

  const updateAvailabilitySlot = (index: number, field: string, value: any) => {
    setRecurringAvailability(prev => 
      prev.map((slot, i) => i === index ? { ...slot, [field]: value } : slot)
    )
  }

  const removeAvailabilitySlot = (index: number) => {
    setRecurringAvailability(prev => prev.filter((_, i) => i !== index))
  }

  const saveAvailability = async () => {
    setSaving(true)
    try {
      await sessionsApi.setAvailableHours(sessionId, {
        recurringAvailability: recurringAvailability.map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration || duration,
          isActive: slot.isActive !== false,
        })),
        autoGenerateSlots,
        advanceBookingDays,
      })

      toast({
        title: 'Availability saved',
        description: 'Your availability settings have been updated.',
      })

      // Reload to get updated data
      await loadAvailability()
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error?.message || 'Could not save availability settings.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const generateSlots = async () => {
    setGenerating(true)
    try {
      const startDate = new Date()
      const endDate = addDays(startDate, advanceBookingDays)

      await sessionsApi.generateSlots(sessionId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      toast({
        title: 'Slots generated',
        description: `Available slots have been generated for the next ${advanceBookingDays} days.`,
      })

      // Reload slots
      await loadAvailability()
    } catch (error: any) {
      toast({
        title: 'Failed to generate slots',
        description: error?.message || 'Could not generate available slots.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const availableSlotsCount = availableSlots.filter(s => s.isAvailable).length
  const bookedSlotsCount = availableSlots.filter(s => !s.isAvailable).length

  return (
    <div className="space-y-6">
      {/* Recurring Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Availability
              </CardTitle>
              <CardDescription>
                Set your recurring weekly availability for this session
              </CardDescription>
            </div>
            <Button onClick={addAvailabilitySlot} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {recurringAvailability.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No availability configured yet.</p>
              <p className="text-sm">Add time slots to let users book sessions with you.</p>
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
                      onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                      className="w-32"
                    />
                  </div>

                  <Switch
                    checked={slot.isActive !== false}
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
                onCheckedChange={setAutoGenerateSlots}
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
                onChange={(e) => setAdvanceBookingDays(parseInt(e.target.value) || 30)}
                className="w-24"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={saveAvailability} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Availability'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Slots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Available Slots
              </CardTitle>
              <CardDescription>
                Generated time slots that users can book
              </CardDescription>
            </div>
            <Button onClick={generateSlots} disabled={generating || recurringAvailability.length === 0} size="sm">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Slots
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {availableSlotsCount} Available
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {bookedSlotsCount} Booked
              </Badge>
            </div>
          </div>

          {availableSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No slots generated yet.</p>
              <p className="text-sm">Configure your availability above, then click "Generate Slots".</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableSlots.slice(0, 20).map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    slot.isAvailable ? 'bg-green-50' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(slot.startTime), 'EEE, MMM d')}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                    </span>
                  </div>
                  <Badge variant={slot.isAvailable ? 'default' : 'secondary'}>
                    {slot.isAvailable ? 'Available' : 'Booked'}
                  </Badge>
                </div>
              ))}
              {availableSlots.length > 20 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  And {availableSlots.length - 20} more slots...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
