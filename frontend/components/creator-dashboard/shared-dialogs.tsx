"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "default", onConfirm, loading = false }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading} className={cn(variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}>
            {loading ? "Processing\u2026" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const TOAST_MESSAGES = {
  created: (item: string) => ({ title: `${item} created`, description: `Your ${item.toLowerCase()} has been created successfully.` }),
  updated: (item: string) => ({ title: `${item} updated`, description: `Your changes have been saved.` }),
  deleted: (item: string) => ({ title: `${item} deleted`, description: `The ${item.toLowerCase()} has been permanently removed.` }),
  published: (item: string) => ({ title: `${item} published`, description: `Your ${item.toLowerCase()} is now live and visible to members.` }),
  unpublished: (item: string) => ({ title: `${item} unpublished`, description: `Your ${item.toLowerCase()} has been taken offline.` }),
  duplicated: (item: string) => ({ title: `${item} duplicated`, description: `A copy of your ${item.toLowerCase()} has been created as a draft.` }),
  archived: (item: string) => ({ title: `${item} archived`, description: `The ${item.toLowerCase()} has been moved to your archive.` }),
  error: (action: string) => ({ title: "Something went wrong", description: `Failed to ${action.toLowerCase()}. Please try again.`, variant: "destructive" as const }),
  permissionDenied: { title: "Access restricted", description: "You don't have permission to perform this action.", variant: "destructive" as const },
  noCommunity: { title: "No community selected", description: "Please select a community first.", variant: "destructive" as const },
} as const
