"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { adminApi, BulkMessageDto } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const bulkMessageSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  recipientIds: z.string().min(1, "At least one recipient ID is required"),
  priority: z.enum(['low', 'normal', 'high']).optional()
})

type BulkMessageFormData = z.infer<typeof bulkMessageSchema>

interface BulkMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BulkMessageDialog({ open, onOpenChange, onSuccess }: BulkMessageDialogProps) {
  const [sending, setSending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<BulkMessageFormData>({
    resolver: zodResolver(bulkMessageSchema),
    defaultValues: {
      priority: 'normal'
    }
  })

  const priority = watch('priority')

  const onSubmit = async (data: BulkMessageFormData) => {
    setSending(true)
    try {
      // Parse recipient IDs
      const recipientIds = data.recipientIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)

      if (recipientIds.length === 0) {
        toast.error('Please provide at least one valid recipient ID')
        setSending(false)
        return
      }

      const messageData: BulkMessageDto = {
        title: data.subject,
        content: data.message,
        channel: 'both',
        audienceTarget: 'specific_users',
        specificUserIds: recipientIds,
        metadata: data.priority ? { priority: data.priority } : undefined
      }

      await adminApi.communication.sendBulkMessage(messageData)
      
      toast.success(`Bulk message sent to ${recipientIds.length} recipients`)
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('[Bulk Message] Error:', error)
      toast.error(error?.response?.data?.message || 'Failed to send bulk message')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (!sending) {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Bulk Message</DialogTitle>
          <DialogDescription>
            Send a direct message to multiple users at once
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="e.g., Important Platform Update"
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              rows={8}
              {...register('message')}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientIds">Recipient IDs *</Label>
            <Textarea
              id="recipientIds"
              placeholder="Enter user IDs separated by commas (e.g., 123abc, 456def, 789ghi)"
              rows={4}
              {...register('recipientIds')}
            />
            {errors.recipientIds && (
              <p className="text-sm text-destructive">{errors.recipientIds.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Enter user IDs separated by commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setValue('priority', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
