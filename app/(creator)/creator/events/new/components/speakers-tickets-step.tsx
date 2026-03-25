"use client"

import { useState, useRef } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, X, Coins, Mic, Ticket, Upload, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { storageApi } from "@/lib/api/storage.api"
import { useToast } from "@/hooks/use-toast"

interface SpeakersTicketsStepProps {
  formData: any
  addEventSpeaker: () => void
  updateEventSpeaker: (index: number, field: string, value: any) => void
  removeEventSpeaker: (index: number) => void
  addEventTicket: () => void
  updateEventTicket: (index: number, field: string, value: any) => void
  removeEventTicket: (index: number) => void
  errors?: Record<string, string | Record<number, Record<string, string>>>
}

export function SpeakersTicketsStep({
  formData,
  addEventSpeaker,
  updateEventSpeaker,
  removeEventSpeaker,
  addEventTicket,
  updateEventTicket,
  removeEventTicket,
  errors = {}
}: SpeakersTicketsStepProps) {
  const { toast } = useToast()
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<number, boolean>>({})
  const photoInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const getTicketError = (index: number, field: string): string | undefined => {
    const ticketErrors = (errors.tickets as Record<number, Record<string, string>>) || {};
    return ticketErrors[index]?.[field];
  };

  const getSpeakerError = (index: number, field: string): string | undefined => {
    const speakerErrors = (errors.speakers as Record<number, Record<string, string>>) || {};
    return speakerErrors[index]?.[field];
  };

  const handleSpeakerPhotoUpload = async (index: number, file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive' as any
      })
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 2MB',
        variant: 'destructive' as any
      })
      return
    }

    setUploadingPhotos(prev => ({ ...prev, [index]: true }))

    try {
      const response = await storageApi.uploadImage(file)
      const imageUrl = response.url || (response as any)?.data?.url
      
      if (imageUrl) {
        updateEventSpeaker(index, "photo", imageUrl)
        toast({ title: 'Success', description: 'Speaker photo uploaded successfully' })
      } else {
        throw new Error('No URL returned from upload')
      }
    } catch (error: any) {
      console.error('Error uploading speaker photo:', error)
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload photo. Please try again.',
        variant: 'destructive' as any
      })
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [index]: false }))
    }
  }
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="h-5 w-5 mr-2 text-events-500" />
            Speakers & Tickets
          </div>
          <div className="flex space-x-2">
            <Button onClick={addEventSpeaker} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Speaker
            </Button>
            <Button onClick={addEventTicket} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Add speakers and ticket options for your event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speakers Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Speakers</Label>
          {formData.speakers.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No speakers added yet</h3>
              <p className="text-muted-foreground mb-4">Add speakers to showcase who will be presenting</p>
              <Button onClick={addEventSpeaker}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Speaker
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.speakers.map((speaker: any, index: number) => (
                <div key={speaker.id} className="border-2 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Speaker #{index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEventSpeaker(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="Speaker name"
                          value={speaker.name}
                          onChange={(e) => updateEventSpeaker(index, "name", e.target.value)}
                          className={getSpeakerError(index, "name") ? "border-red-500" : ""}
                        />
                        {getSpeakerError(index, "name") && (
                          <p className="text-sm text-red-500">{getSpeakerError(index, "name")}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          placeholder="Speaker title/position"
                          value={speaker.title}
                          onChange={(e) => updateEventSpeaker(index, "title", e.target.value)}
                          className={getSpeakerError(index, "title") ? "border-red-500" : ""}
                        />
                        {getSpeakerError(index, "title") && (
                          <p className="text-sm text-red-500">{getSpeakerError(index, "title")}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bio *</Label>
                      <Textarea
                        placeholder="Speaker bio and background..."
                        rows={3}
                        value={speaker.bio}
                        onChange={(e) => updateEventSpeaker(index, "bio", e.target.value)}
                        className={getSpeakerError(index, "bio") ? "border-red-500" : ""}
                      />
                      {getSpeakerError(index, "bio") && (
                        <p className="text-sm text-red-500">{getSpeakerError(index, "bio")}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Photo</Label>
                      <input
                        ref={(el) => { photoInputRefs.current[index] = el }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleSpeakerPhotoUpload(index, file)
                        }}
                        className="hidden"
                      />
                      
                      {speaker.photo ? (
                        <div className="relative group">
                          <div className="relative w-32 h-32 overflow-hidden rounded-lg bg-gray-100 border-2 border-gray-300">
                            <img
                              src={speaker.photo}
                              alt={speaker.name || "Speaker photo"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm h-6 w-6 p-0"
                            onClick={() => updateEventSpeaker(index, "photo", "")}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2"
                            onClick={() => photoInputRefs.current[index]?.click()}
                            disabled={uploadingPhotos[index]}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Replace
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={`
                            border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                            ${uploadingPhotos[index] ? 'opacity-50 pointer-events-none' : 'border-gray-300 hover:border-events-500'}
                          `}
                          onClick={() => photoInputRefs.current[index]?.click()}
                        >
                          {uploadingPhotos[index] ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-events-500 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Click to upload speaker photo</p>
                              <p className="text-xs text-gray-500 mt-1">JPG or PNG up to 2MB</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tickets Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Ticket Options</Label>
          {errors.tickets && typeof errors.tickets === 'string' && (
            <p className="text-sm text-red-500">{errors.tickets}</p>
          )}
          {formData.tickets.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets added yet</h3>
              <p className="text-muted-foreground mb-4">Add ticket options for attendees to purchase</p>
              <Button onClick={addEventTicket}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.tickets.map((ticket: any, index: number) => (
                <div key={ticket.id} className="border-2 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Ticket Option #{index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEventTicket(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ticket Type *</Label>
                        <Select
                          value={ticket.type}
                          onValueChange={(value) => updateEventTicket(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="early-bird">Early Bird</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="e.g., General Admission"
                          value={ticket.name}
                          onChange={(e) => updateEventTicket(index, "name", e.target.value)}
                          className={getTicketError(index, "name") ? "border-red-500" : ""}
                        />
                        {getTicketError(index, "name") && (
                          <p className="text-sm text-red-500">{getTicketError(index, "name")}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price *</Label>
                        <div className="relative">
                          <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className={cn("pl-10", getTicketError(index, "price") && "border-red-500")}
                            value={ticket.price}
                            onChange={(e) => updateEventTicket(index, "price", e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {getTicketError(index, "price") && (
                          <p className="text-sm text-red-500">{getTicketError(index, "price")}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity Available</Label>
                        <Input
                          type="number"
                          placeholder="Leave empty for unlimited"
                          value={ticket.quantity}
                          onChange={(e) => updateEventTicket(index, "quantity", e.target.value)}
                          className={getTicketError(index, "quantity") ? "border-red-500" : ""}
                          min="0"
                        />
                        {getTicketError(index, "quantity") && (
                          <p className="text-sm text-red-500">{getTicketError(index, "quantity")}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="What does this ticket include?"
                        rows={2}
                        value={ticket.description}
                        onChange={(e) => updateEventTicket(index, "description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}