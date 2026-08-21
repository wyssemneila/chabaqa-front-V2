"use client"

import { useMemo, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Mic } from "lucide-react"
import Image from "next/image"
import { Event } from "@/lib/models"
import { useToast } from "@/hooks/use-toast"
import { eventsApi } from "@/lib/api/events.api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface EventSpeakersTabProps {
  event: Event
  onUpdateEvent: (updates: Partial<Event>) => void
}

interface SpeakerFormState {
  id?: string
  name: string
  title: string
  bio: string
  photo: string
}

const emptySpeaker = (): SpeakerFormState => ({
  name: "",
  title: "",
  bio: "",
  photo: "",
})

const toSpeakerForm = (speaker: any): SpeakerFormState => ({
  id: speaker.id,
  name: speaker.name || "",
  title: speaker.title || "",
  bio: speaker.bio || "",
  photo: speaker.photo || "",
})

const isValidUrl = (value?: string) => {
  const raw = value?.trim()
  if (!raw) return true
  if (resolveImageUrl(raw)) return true
  if (raw.startsWith("/uploads/") || raw.startsWith("/storage/") || raw.startsWith("/images/")) return true
  try {
    new URL(raw)
    return true
  } catch {
    return false
  }
}

const normalizeSpeakerPhoto = (value?: string) => {
  const raw = value?.trim() || ""
  return resolveImageUrl(raw) || raw
}

const normalizeSpeakerResponse = (response: any): any => {
  if (!response) return response
  if (response?.speaker) return response.speaker
  if (response?.data?.speaker) return response.data.speaker
  if (response?.data?.data?.speaker) return response.data.data.speaker
  if (response?.data?.data) return response.data.data
  if (response?.data) return response.data
  return response
}

const getErrorMessage = (error: any) => error?.message || error?.error || "Try again."

export default function EventSpeakersTab({ event, onUpdateEvent }: EventSpeakersTabProps) {
  const { toast } = useToast()

  const eventId = event.mongoId || event.id
  const speakers = useMemo(() => event.speakers || [], [event.speakers])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newSpeaker, setNewSpeaker] = useState<SpeakerFormState>(emptySpeaker())
  const [editingSpeaker, setEditingSpeaker] = useState<SpeakerFormState | null>(null)
  const [savingSpeaker, setSavingSpeaker] = useState(false)
  const [deletingSpeakerId, setDeletingSpeakerId] = useState<string | null>(null)

  const validateSpeaker = (speaker: SpeakerFormState): string | null => {
    if (!speaker.name.trim()) return "Speaker name is required"
    if (!speaker.title.trim()) return "Speaker title is required"
    if (!speaker.bio.trim()) return "Speaker bio is required"
    if (!isValidUrl(speaker.photo)) return "Speaker photo URL is invalid"
    return null
  }

  const applySpeakers = (nextSpeakers: any[]) => {
    onUpdateEvent({ speakers: nextSpeakers as any })
  }

  const handleAddSpeaker = async () => {
    const error = validateSpeaker(newSpeaker)
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" as any })
      return
    }

    if (!eventId) {
      toast({ title: "Unable to add speaker", description: "Missing event id.", variant: "destructive" as any })
      return
    }

    setSavingSpeaker(true)
    try {
      const response = await eventsApi.addSpeaker(eventId, {
        name: newSpeaker.name.trim(),
        title: newSpeaker.title.trim(),
        bio: newSpeaker.bio.trim(),
        photo: normalizeSpeakerPhoto(newSpeaker.photo) || undefined,
      })
      const created = normalizeSpeakerResponse(response)
      applySpeakers([
        ...speakers,
        {
          id: created?.id || created?._id,
          name: created?.name || newSpeaker.name.trim(),
          title: created?.title || newSpeaker.title.trim(),
          bio: created?.bio || newSpeaker.bio.trim(),
          photo: normalizeSpeakerPhoto(created?.photo || newSpeaker.photo),
        },
      ])
      setNewSpeaker(emptySpeaker())
      setIsAddDialogOpen(false)
      toast({ title: "Speaker added", description: "The event speaker was saved." })
    } catch (err: any) {
      toast({ title: "Failed to add speaker", description: getErrorMessage(err), variant: "destructive" as any })
    } finally {
      setSavingSpeaker(false)
    }
  }

  const startEdit = (speaker: any) => {
    toast({
      title: "Speaker editing unavailable",
      description: "Speaker editing requires a backend update-speaker endpoint.",
      variant: "destructive" as any,
    })
  }

  const handleUpdateSpeaker = () => {
    if (!editingSpeaker) return

    const error = validateSpeaker(editingSpeaker)
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" as any })
      return
    }

    const nextSpeakers = speakers.map((speaker) =>
      speaker.id === editingSpeaker.id
        ? {
            ...speaker,
            name: editingSpeaker.name.trim(),
            title: editingSpeaker.title.trim(),
            bio: editingSpeaker.bio.trim(),
            photo: normalizeSpeakerPhoto(editingSpeaker.photo),
          }
        : speaker,
    )

    applySpeakers(nextSpeakers)
    setEditingSpeaker(null)
    setIsEditDialogOpen(false)
    toast({ title: "Speaker updated", description: "The event speaker was saved." })
  }

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!eventId) {
      toast({ title: "Unable to remove speaker", description: "Missing event id.", variant: "destructive" as any })
      return
    }

    setDeletingSpeakerId(speakerId)
    try {
      await eventsApi.removeSpeaker(eventId, speakerId)
      applySpeakers(speakers.filter((speaker) => speaker.id !== speakerId))
      toast({ title: "Speaker removed", description: "The event speaker was removed." })
    } catch (err: any) {
      toast({ title: "Failed to remove speaker", description: getErrorMessage(err), variant: "destructive" as any })
    } finally {
      setDeletingSpeakerId(null)
    }
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Speakers</CardTitle>
            <CardDescription>Manage event speakers and presenters</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={savingSpeaker}>
                <Plus className="h-4 w-4 mr-2" />
                Add Speaker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Speaker</DialogTitle>
                <DialogDescription>Add a speaker to your event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="speakerName">Name *</Label>
                  <Input
                    id="speakerName"
                    placeholder="Speaker name"
                    value={newSpeaker.name}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerTitle">Title *</Label>
                  <Input
                    id="speakerTitle"
                    placeholder="Speaker title/position"
                    value={newSpeaker.title}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerBio">Bio *</Label>
                  <Textarea
                    id="speakerBio"
                    placeholder="Speaker bio and background..."
                    rows={3}
                    value={newSpeaker.bio}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerPhoto">Photo URL</Label>
                  <Input
                    id="speakerPhoto"
                    placeholder="https://example.com/photo.jpg"
                    value={newSpeaker.photo}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, photo: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSpeaker} disabled={savingSpeaker}>{savingSpeaker ? "Saving..." : "Add Speaker"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {speakers.map((speaker) => (
            <div key={speaker.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {normalizeSpeakerPhoto(speaker.photo) ? (
                  <Image src={normalizeSpeakerPhoto(speaker.photo)} alt={speaker.name} width={64} height={64} className="rounded-full" />
                ) : (
                  <Mic className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{speaker.name}</h4>
                <p className="text-sm text-muted-foreground">{speaker.title}</p>
                <p className="text-sm mt-1">{speaker.bio}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(speaker)}
                  disabled={savingSpeaker || deletingSpeakerId === speaker.id}
                  title="Speaker editing requires a backend update-speaker endpoint"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  disabled={savingSpeaker || deletingSpeakerId === speaker.id}
                  onClick={() => handleDeleteSpeaker(speaker.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {speakers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No speakers added yet</p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Speaker</DialogTitle>
            <DialogDescription>Update speaker information</DialogDescription>
          </DialogHeader>
          {editingSpeaker && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editSpeakerName">Name *</Label>
                <Input
                  id="editSpeakerName"
                  value={editingSpeaker.name}
                  onChange={(e) => setEditingSpeaker((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSpeakerTitle">Title *</Label>
                <Input
                  id="editSpeakerTitle"
                  value={editingSpeaker.title}
                  onChange={(e) => setEditingSpeaker((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSpeakerBio">Bio *</Label>
                <Textarea
                  id="editSpeakerBio"
                  rows={3}
                  value={editingSpeaker.bio}
                  onChange={(e) => setEditingSpeaker((prev) => (prev ? { ...prev, bio: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSpeakerPhoto">Photo URL</Label>
                <Input
                  id="editSpeakerPhoto"
                  value={editingSpeaker.photo}
                  onChange={(e) => setEditingSpeaker((prev) => (prev ? { ...prev, photo: e.target.value } : prev))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateSpeaker}>Save Speaker</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EnhancedCard>
  )
}
