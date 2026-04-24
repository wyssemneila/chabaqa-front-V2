"use client"

import React from "react"
import { useEffect, useMemo, useState } from "react"
import { Copy, Facebook, Linkedin, Link2, Loader2, Mail, MessageCircle, Send, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { postsApi } from "@/lib/api/posts.api"
import type { PostShareMeta, PostShareMethod, PostStats } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"

interface PostShareDialogProps {
  postId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onShareTracked?: (stats: PostStats) => void
}

type ActionState = PostShareMethod | "loading_meta" | null

export function PostShareDialog({ postId, open, onOpenChange, onShareTracked }: PostShareDialogProps) {
  const { toast } = useToast()
  const [shareMeta, setShareMeta] = useState<PostShareMeta | null>(null)
  const [actionState, setActionState] = useState<ActionState>(null)

  const nativeShareSupported = typeof navigator !== "undefined" && typeof navigator.share === "function"
  const isLoadingMeta = actionState === "loading_meta"

  useEffect(() => {
    if (!open) {
      setShareMeta(null)
      setActionState(null)
      return
    }

    const fetchShareMeta = async () => {
      setShareMeta(null)
      setActionState("loading_meta")
      try {
        const response = await postsApi.getShareMeta(postId)
        setShareMeta(response.data)
      } catch (error: any) {
        setShareMeta(null)
        toast({
          title: "Share unavailable",
          description: error?.message || "Could not prepare share options.",
          variant: "destructive",
        })
      } finally {
        setActionState(null)
      }
    }

    void fetchShareMeta()
  }, [open, postId, toast])

  const trackShareAction = async (method: PostShareMethod, targetUrl?: string) => {
    try {
      const response = await postsApi.share(postId, { method, targetUrl })
      onShareTracked?.(response.data)
    } catch {
      // keep share actions usable even when tracking fails
    }
  }

  const handleCopyLink = async () => {
    if (!shareMeta?.shareUrl || actionState) return
    setActionState("copy_link")

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareMeta.shareUrl)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = shareMeta.shareUrl
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }

      await trackShareAction("copy_link", shareMeta.shareUrl)
      toast({ title: "Link copied" })
    } catch (error: any) {
      toast({
        title: "Copy failed",
        description: error?.message || "Could not copy the share link.",
        variant: "destructive",
      })
    } finally {
      setActionState(null)
    }
  }

  const handleNativeShare = async () => {
    if (!shareMeta || !nativeShareSupported || actionState) return
    setActionState("native")

    try {
      await navigator.share({
        title: shareMeta.title,
        text: shareMeta.text,
        url: shareMeta.shareUrl,
      })
      await trackShareAction("native", shareMeta.shareUrl)
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast({
          title: "Share failed",
          description: error?.message || "Could not complete native sharing.",
          variant: "destructive",
        })
      }
    } finally {
      setActionState(null)
    }
  }

  const handlePlatformShare = async (method: PostShareMethod, url: string) => {
    if (!url || actionState) return
    setActionState(method)

    try {
      window.open(url, "_blank", "noopener,noreferrer")
      await trackShareAction(method, url)
    } catch (error: any) {
      toast({
        title: "Share failed",
        description: error?.message || "Could not open the selected platform.",
        variant: "destructive",
      })
    } finally {
      setActionState(null)
    }
  }

  const shareButtons = useMemo(
    () => [
      { method: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, url: shareMeta?.platformUrls?.whatsapp },
      { method: "x" as const, label: "X", icon: Share2, url: shareMeta?.platformUrls?.x },
      { method: "facebook" as const, label: "Facebook", icon: Facebook, url: shareMeta?.platformUrls?.facebook },
      { method: "linkedin" as const, label: "LinkedIn", icon: Linkedin, url: shareMeta?.platformUrls?.linkedin },
      { method: "telegram" as const, label: "Telegram", icon: Send, url: shareMeta?.platformUrls?.telegram },
      { method: "email" as const, label: "Email", icon: Mail, url: shareMeta?.platformUrls?.email },
    ],
    [shareMeta],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
          <DialogDescription>Copy the link or share directly to your social platform.</DialogDescription>
        </DialogHeader>

        {isLoadingMeta ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing share options...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={shareMeta?.shareUrl || ""} readOnly aria-label="Share URL" />
              <Button type="button" variant="outline" onClick={handleCopyLink} disabled={!shareMeta?.shareUrl || Boolean(actionState)}>
                {actionState === "copy_link" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Copy link</span>
              </Button>
            </div>

            {nativeShareSupported && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleNativeShare}
                disabled={!shareMeta || Boolean(actionState)}
              >
                {actionState === "native" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                <span className="ml-2">Native Share</span>
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {shareButtons.map(({ method, label, icon: Icon, url }) => (
                <Button
                  key={method}
                  type="button"
                  variant="outline"
                  onClick={() => void handlePlatformShare(method, url || "")}
                  disabled={!url || Boolean(actionState)}
                  className="justify-start"
                >
                  {actionState === method ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  <span className="ml-2">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
