"use client"

import { useMemo, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Ticket } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Event } from "@/lib/models"
import { useToast } from "@/hooks/use-toast"

interface EventTicketsTabProps {
  event: Event
  onUpdateEvent: (updates: Partial<Event>) => void
}

interface TicketFormState {
  id?: string
  type: "regular" | "vip" | "early-bird" | "student" | "free"
  name: string
  price: string
  description: string
  quantity: string
  sold: number
}

const createEmptyTicket = (): TicketFormState => ({
  type: "regular",
  name: "",
  price: "",
  description: "",
  quantity: "",
  sold: 0,
})

const toTicketForm = (ticket: any): TicketFormState => ({
  id: ticket.id,
  type: (ticket.type || "regular") as TicketFormState["type"],
  name: ticket.name || "",
  price: String(ticket.price ?? ""),
  description: ticket.description || "",
  quantity: ticket.quantity !== undefined ? String(ticket.quantity) : "",
  sold: Number(ticket.sold ?? 0),
})

const nextId = () => `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export default function EventTicketsTab({ event, onUpdateEvent }: EventTicketsTabProps) {
  const { toast } = useToast()

  const tickets = useMemo(() => event.tickets || [], [event.tickets])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newTicket, setNewTicket] = useState<TicketFormState>(createEmptyTicket())
  const [editingTicket, setEditingTicket] = useState<TicketFormState | null>(null)

  const validateTicket = (ticket: TicketFormState): string | null => {
    if (!ticket.type) return "Ticket type is required"
    if (!ticket.name.trim()) return "Ticket name is required"

    const price = Number(ticket.price)
    if (Number.isNaN(price) || price < 0) return "Ticket price must be 0 or greater"

    if (ticket.quantity.trim()) {
      const quantity = Number(ticket.quantity)
      if (Number.isNaN(quantity) || quantity < 0) return "Ticket quantity must be 0 or greater"
      if (quantity < Number(ticket.sold ?? 0)) {
        return `Quantity cannot be less than sold (${ticket.sold})`
      }
    }

    return null
  }

  const applyTickets = (nextTickets: any[]) => {
    onUpdateEvent({ tickets: nextTickets as any })
  }

  const handleAddTicket = () => {
    const error = validateTicket(newTicket)
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" as any })
      return
    }

    const created = {
      id: nextId(),
      type: newTicket.type,
      name: newTicket.name.trim(),
      price: Number(newTicket.price) || 0,
      description: newTicket.description.trim(),
      quantity: newTicket.quantity.trim() ? Number(newTicket.quantity) : undefined,
      sold: 0,
    }

    applyTickets([...tickets, created])
    setNewTicket(createEmptyTicket())
    setIsAddDialogOpen(false)
    toast({ title: "Ticket added", description: "Ticket added. Click Save Changes to persist." })
  }

  const startEdit = (ticket: any) => {
    setEditingTicket(toTicketForm(ticket))
    setIsEditDialogOpen(true)
  }

  const handleUpdateTicket = () => {
    if (!editingTicket) return
    const error = validateTicket(editingTicket)
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" as any })
      return
    }

    const nextTickets = tickets.map((ticket) =>
      ticket.id === editingTicket.id
        ? {
            ...ticket,
            type: editingTicket.type,
            name: editingTicket.name.trim(),
            price: Number(editingTicket.price) || 0,
            description: editingTicket.description.trim(),
            quantity: editingTicket.quantity.trim() ? Number(editingTicket.quantity) : undefined,
            sold: Number(ticket.sold ?? 0),
          }
        : ticket,
    )

    applyTickets(nextTickets)
    setEditingTicket(null)
    setIsEditDialogOpen(false)
    toast({ title: "Ticket updated", description: "Ticket updated. Click Save Changes to persist." })
  }

  const handleDeleteTicket = (ticketId: string, sold: number) => {
    if (sold > 0) {
      toast({
        title: "Cannot delete ticket",
        description: "This ticket has sales and cannot be deleted.",
        variant: "destructive" as any,
      })
      return
    }

    applyTickets(tickets.filter((ticket) => ticket.id !== ticketId))
    toast({ title: "Ticket removed", description: "Ticket removed. Click Save Changes to persist." })
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ticket Options</CardTitle>
            <CardDescription>Manage ticket types and pricing</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Ticket</DialogTitle>
                <DialogDescription>Create a new ticket option for your event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticketType">Ticket Type</Label>
                  <Select value={newTicket.type} onValueChange={(value) => setNewTicket((prev) => ({ ...prev, type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="early-bird">Early Bird</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketName">Name</Label>
                  <Input
                    id="ticketName"
                    placeholder="e.g., General Admission"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Price ($)</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    placeholder="50"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketQuantity">Quantity</Label>
                  <Input
                    id="ticketQuantity"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={newTicket.quantity}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketDescription">Description</Label>
                  <Textarea
                    id="ticketDescription"
                    placeholder="What does this ticket include?"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTicket}>Add Ticket</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const hasSales = Number(ticket.sold || 0) > 0
            return (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Ticket className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">{ticket.name}</h4>
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="text-xs capitalize">
                    {ticket.type}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">{ticket.price} TND</div>
                    <div className="text-sm text-muted-foreground">
                      {ticket.sold || 0} sold{ticket.quantity ? ` of ${ticket.quantity}` : ""}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(ticket)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={hasSales ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
                    disabled={hasSales}
                    onClick={() => handleDeleteTicket(ticket.id, ticket.sold || 0)}
                    title={hasSales ? "Cannot delete ticket with sales" : "Delete ticket"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
          {tickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets added yet</p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>Update ticket details</DialogDescription>
          </DialogHeader>
          {editingTicket && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editTicketType">Ticket Type</Label>
                <Select
                  value={editingTicket.type}
                  onValueChange={(value) => setEditingTicket((prev) => (prev ? { ...prev, type: value as any } : prev))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="early-bird">Early Bird</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTicketName">Name</Label>
                <Input
                  id="editTicketName"
                  value={editingTicket.name}
                  onChange={(e) => setEditingTicket((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTicketPrice">Price ($)</Label>
                <Input
                  id="editTicketPrice"
                  type="number"
                  value={editingTicket.price}
                  onChange={(e) => setEditingTicket((prev) => (prev ? { ...prev, price: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTicketQuantity">Quantity</Label>
                <Input
                  id="editTicketQuantity"
                  type="number"
                  value={editingTicket.quantity}
                  onChange={(e) => setEditingTicket((prev) => (prev ? { ...prev, quantity: e.target.value } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTicketDescription">Description</Label>
                <Textarea
                  id="editTicketDescription"
                  value={editingTicket.description}
                  onChange={(e) =>
                    setEditingTicket((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateTicket}>Save Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EnhancedCard>
  )
}
