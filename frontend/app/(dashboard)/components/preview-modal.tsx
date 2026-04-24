"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ExternalLink } from "lucide-react"
import Link from "next/link"

interface PreviewModalProps {
  community: any
  onClose: () => void
}

export function PreviewModal({ community, onClose }: PreviewModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Preview: {community.name}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Link href={`/${community.slug}`} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <iframe src={`/${community.slug}`} className="w-full h-full border-0" title="Community Preview" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
