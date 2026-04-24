"use client"

import { useMemo, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { Event, EventSession } from "@/lib/models"
import { useToast } from "@/hooks/use-toast"

interface EventSessionsTabProps {
  event: Event
  onUpdateEvent: (updates: Partial<Event>) => void
}

interface SessionFormState {
  id?: string
  title: string
  description: string
  startTime: string
  endTime: string
  speaker: string
  notes: string
  isActive: boolean
  attendance: number
}

const createEmptySession = (): SessionFormState => ({
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  speaker: "",
  notes: "",
  isActive: true,
  attendance: 0,
})

const toSessionForm = (session: EventSession): SessionFormState => ({
  id: session.id,
  title: session.title || "",
  description: session.description || "",
  startTime: session.startTime || "",
  endTime: session.endTime || "",
  speaker: session.speaker || "",
  notes: session.notes || "",
  isActive: session.isActive !== false,
  attendance: Number(session.attendance ?? 0),
})

const isValidTimeRange = (start: string, end: string) => Boolean(start && end && start < end)

const nextId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export default function EventSessionsTab({ event, onUpdateEvent }: EventSessionsTabProps) {
  const { toast } = useToast()

  const sessions = useMemo(() => event.sessions || [], [event.sessions])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newSession, setNewSession] = useState<SessionFormState>(createEmptySession())
  const [editingSession, setEditingSession] = useState<SessionFormState | null>(null)

  const validateSession = (session: SessionFormState): string | null => {
    if (!session.title.trim()) return "Session title is required"
    if (!session.description.trim()) return "Session description is required"
    if (!session.speaker.trim()) return "Speaker is required"
    if (!isValidTimeRange(session.startTime, session.endTime)) {
      return "Session end time must be after start time"
    }
    return null
  }

  const applySessionList = (nextSessions: EventSession[]) => {
    onUpdateEvent({ sessions: nextSessions })
  }

  const handleAddSession = () => {
    const error = validateSession(newSession)
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" as any })
      return
    }

    const created: EventSession = {
      id: nextId(),
      title: newSession.title.trim(),
      description: newSession.description.trim(),
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      speaker: newSession.speaker.trim(),
      notes: newSession.notes.trim() || undefined,
      isActive: newSession.isActive,
      attendance: Number(newSession.attendance ?? 0),
    }

    applySessionList([...sessions, created])
    setNewSession(createEmptySession())
    setIsAddDialogOpen(false)
    toast({ title: "Session added", description: "Session added. Click Save Changes to persist." })
  }

  const startEdit = (session: EventSession) => {
    setEditingSession(toSessionForm(session))
    setIsEditDialogOpen(true)
  }

  const handleUpdateSession = () => {
    if (!editingSession) return
    const error = validateSession(editingSession)
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" as any })
      return
    }

    const nextSessions = sessions.map((session) =>
      session.id === editingSession.id
        ? {
            ...session,
            title: editingSession.title.trim(),
            description: editingSession.description.trim(),
            startTime: editingSession.startTime,
            endTime: editingSession.endTime,
            speaker: editingSession.speaker.trim(),
            notes: editingSession.notes.trim() || undefined,
            isActive: editingSession.isActive,
            attendance: Number(editingSession.attendance ?? 0),
          }
        : session,
    )

    applySessionList(nextSessions)
    setEditingSession(null)
    setIsEditDialogOpen(false)
    toast({ title: "Session updated", description: "Session updated. Click Save Changes to persist." })
  }

  const handleDeleteSession = (sessionId: string) => {
    applySessionList(sessions.filter((session) => session.id !== sessionId))
    toast({ title: "Session removed", description: "Session removed. Click Save Changes to persist." })
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Sessions</CardTitle>
            <CardDescription>Manage the sessions for your event</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Session</DialogTitle>
                <DialogDescription>Create a new session for the event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTitle">Session Title</Label>
                  <Input
                    id="sessionTitle"
                    placeholder="e.g., Keynote Speech"
                    value={newSession.title}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionDescription">Description</Label>
                  <Textarea
                    id="sessionDescription"
                    rows={3}
                    placeholder="Brief description of the session..."
                    value={newSession.description}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionStartTime">Start Time</Label>
                    <Input
                      id="sessionStartTime"
                      type="time"
                      value={newSession.startTime}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionEndTime">End Time</Label>
                    <Input
                      id="sessionEndTime"
                      type="time"
                      value={newSession.endTime}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionSpeaker">Speaker</Label>
                  <Input
                    id="sessionSpeaker"
                    placeholder="Speaker name"
                    value={newSession.speaker}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, speaker: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionNotes">Notes</Label>
                  <Textarea
                    id="sessionNotes"
                    rows={2}
                    placeholder="Additional notes or resources..."
                    value={newSession.notes}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSession}>Add Session</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold">{session.title}</h3>
                  <Badge variant="secondary">
                    {session.startTime} - {session.endTime}
                  </Badge>
                  {session.isActive && <Badge className="bg-green-500">Active</Badge>}
                  {session.attendance !== undefined && <Badge variant="outline">Attendance: {session.attendance}</Badge>}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(session)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 bg-transparent"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-2">{session.description}</p>
              {session.speaker && (
                <div className="text-sm">
                  <strong>Speaker:</strong> {session.speaker}
                </div>
              )}
              {session.notes && (
                <div className="text-sm mt-2 p-2 bg-blue-50 rounded">
                  <strong>Notes:</strong> {session.notes}
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sessions added yet</p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update session details</DialogDescription>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editSessionTitle">Session Title</Label>
                <Input
                  id="editSessionTitle"
                  value={editingSession.title}
                  onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSessionDescription">Description</Label>
                <Textarea
                  id="editSessionDescription"
                  rows={3}
                  value={editingSession.description}
                  onChange={(e) =>
                    setEditingSession((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editSessionStartTime">Start Time</Label>
                  <Input
                    id="editSessionStartTime"
                    type="time"
                    value={editingSession.startTime}
                    onChange={(e) =>
                      setEditingSession((prev) => (prev ? { ...prev, startTime: e.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSessionEndTime">End Time</Label>
                  <Input
                    id="editSessionEndTime"
                    type="time"
                    value={editingSession.endTime}
                    onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, endTime: e.target.value } : prev))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSessionSpeaker">Speaker</Label>
                <Input
                  id="editSessionSpeaker"
                  value={editingSession.speaker}
                  onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, speaker: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSessionNotes">Notes</Label>
                <Textarea
                  id="editSessionNotes"
                  rows={2}
                  value={editingSession.notes}
                  onChange={(e) => setEditingSession((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateSession}>Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EnhancedCard>
  )
}
