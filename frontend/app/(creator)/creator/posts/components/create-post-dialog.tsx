"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import { storageApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/app/providers/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Image as ImageIcon, Video, Link as LinkIcon, Smile, Loader2, X } from "lucide-react"
import type { Post } from "@/lib/api/types"
import { CreatorWritingAssist } from '@/components/creator-dashboard/creator-writing-assist'

// Common emojis for quick access
const COMMON_EMOJIS = ["😀", "😂", "😍", "🎉", "🔥", "👍", "❤️", "🚀", "✨", "💯"]
const MAX_IMAGES = 6
const MAX_VIDEOS = 1
const MAX_LINKS = 3
const MAX_ATTACHMENTS = 10

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  onPostSaved: () => void
  mode?: "create" | "edit"
  postToEdit?: Post | null
  showTrigger?: boolean
}

export function CreatePostDialog({
  open,
  onOpenChange,
  communityId,
  onPostSaved,
  mode = "create",
  postToEdit = null,
  showTrigger = true,
}: CreatePostDialogProps) {
  const { toast } = useToast()
  const { user: authUser } = useAuthContext()
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const isEditing = mode === "edit" && !!postToEdit
  const attachmentCounts = {
    photo: uploadedFiles.filter((file) => file.type === "photo").length,
    video: uploadedFiles.filter((file) => file.type === "video").length,
    link: uploadedFiles.filter((file) => file.type === "link").length,
    total: uploadedFiles.length,
  }

  const getAttachmentLimitError = (type: "photo" | "video" | "link", incomingCount = 1) => {
    if (attachmentCounts.total + incomingCount > MAX_ATTACHMENTS) {
      return `Posts can have up to ${MAX_ATTACHMENTS} attachments.`
    }
    if (type === "photo" && attachmentCounts.photo + incomingCount > MAX_IMAGES) {
      return `Posts can have up to ${MAX_IMAGES} photos.`
    }
    if (type === "video" && attachmentCounts.video + incomingCount > MAX_VIDEOS) {
      return `Posts can have up to ${MAX_VIDEOS} video.`
    }
    if (type === "link" && attachmentCounts.link + incomingCount > MAX_LINKS) {
      return `Posts can have up to ${MAX_LINKS} links.`
    }
    return null
  }

  const normalizeHttpUrl = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      const parsed = new URL(trimmed)
      if (!["http:", "https:"].includes(parsed.protocol)) return null
      return parsed.toString()
    } catch {
      return null
    }
  }

  const resetForm = () => {
    setContent("")
    setTitle("")
    setTags([])
    setTagInput("")
    setShowEmojiPicker(false)
    setUploadedFiles([])
    setLinkUrl("")
    setLinkTitle("")
  }

  useEffect(() => {
    if (!open) return
    if (isEditing && postToEdit) {
      setContent(postToEdit.content || "")
      setTitle(postToEdit.title || "")
      setTags(Array.isArray(postToEdit.tags) ? postToEdit.tags : [])
      setTagInput("")
      setShowEmojiPicker(false)
      setLinkUrl("")
      setLinkTitle("")
      const initialFiles = [
        ...(postToEdit.images || []).map((url) => ({ type: "photo", url, originalName: url })),
        ...(postToEdit.videos || []).map((url) => ({ type: "video", url, originalName: url })),
        ...(postToEdit.links || []).map((link) => ({
          type: "link",
          url: link.url,
          title: link.title || link.url,
          originalName: link.title || link.url,
        })),
      ]
      setUploadedFiles(initialFiles)
      return
    }
    resetForm()
  }, [open, isEditing, postToEdit])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleEmojiClick = (emoji: string) => {
    const el = contentTextareaRef.current
    if (!el) {
      setContent((prev) => prev + emoji)
      return
    }

    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? content.length
    const next = content.slice(0, start) + emoji + content.slice(end)
    setContent(next)

    // restore cursor position after state update
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || files.length === 0) {
      return
    }

    const selectedFiles = Array.from(files)
    const limitError = getAttachmentLimitError("photo", selectedFiles.length)
    if (limitError) {
      toast({ title: "Attachment limit reached", description: limitError, variant: "destructive" })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setIsLoading(true)
    try {
      for (const file of selectedFiles) {
        
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          })
          continue
        }

        const uploadedFile = await storageApi.upload(file)
        setUploadedFiles((prev) => [...prev, { ...uploadedFile, type: "photo" }])
        
        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        })
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || files.length === 0) {
      return
    }

    const selectedFiles = Array.from(files)
    const limitError = getAttachmentLimitError("video", selectedFiles.length)
    if (limitError) {
      toast({ title: "Attachment limit reached", description: limitError, variant: "destructive" })
      if (videoInputRef.current) videoInputRef.current.value = ""
      return
    }

    setIsLoading(true)
    try {
      for (const file of selectedFiles) {
        
        if (!file.type.startsWith("video/")) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not a video file`,
            variant: "destructive",
          })
          continue
        }

        const uploadedFile = await storageApi.upload(file)
        setUploadedFiles((prev) => [...prev, { ...uploadedFile, type: "video" }])
        
        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        })
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  const handleAddLink = () => {
    const normalizedUrl = normalizeHttpUrl(linkUrl)
    if (!normalizedUrl) {
      toast({
        title: "Invalid link",
        description: "Enter a valid http or https URL before adding it.",
        variant: "destructive",
      })
      return
    }
    const limitError = getAttachmentLimitError("link")
    if (limitError) {
      toast({ title: "Attachment limit reached", description: limitError, variant: "destructive" })
      return
    }
    setUploadedFiles((prev) => [
      ...prev,
      {
        url: normalizedUrl,
        type: "link",
        title: linkTitle.trim() || normalizedUrl,
        filename: normalizedUrl,
      },
    ])
    toast({
      title: "Success",
      description: "Link added successfully",
    })
    setLinkUrl("")
    setLinkTitle("")
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const images = uploadedFiles
        .filter((f) => f.type === "photo" && f.url)
        .map((f) => f.url)

      const videos = uploadedFiles
        .filter((f) => f.type === "video" && f.url)
        .map((f) => f.url)

      const links = uploadedFiles
        .filter((f) => f.type === "link" && f.url)
        .map((f) => ({
          url: f.url,
          title: f.title || undefined,
        }))
      const payload = {
        title: title || undefined,
        content,
        communityId,
        tags,
        thumbnail: images[0],
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
        links: links.length > 0 ? links : undefined,
      }

      if (isEditing && postToEdit) {
        await api.posts.update(postToEdit.id, payload)
      } else {
        await api.posts.create(payload)
      }

      toast({
        title: "Success",
        description: isEditing ? "Post updated successfully" : "Post created successfully",
      })

      resetForm()
      onOpenChange(false)
      onPostSaved()
    } catch (error: any) {
      console.error("Post save error:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || (isEditing ? "Failed to update post" : "Failed to create post"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            {isEditing ? "Edit Post" : "Create Post"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Post" : "Create New Post"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your post content and attachments" : "Share your thoughts with your community"}
          </DialogDescription>
        </DialogHeader>

        {/* User Avatar Section */}
        {authUser && (
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={authUser.avatar || "/placeholder.svg?height=48&width=48"} />
              <AvatarFallback>
                {authUser.name
                  ? authUser.name.split(" ").map((n: string) => n[0]).join("")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{authUser.name || "You"}</p>
              <p className="text-sm text-gray-600">Creating a post</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Content */}
          <div>
            <div className="flex items-center justify-between"><label className="text-sm font-medium">Content *</label><CreatorWritingAssist value={content} onApply={setContent} surface="post" field="content" context={`Post title: ${title || 'community update'}; tags: ${tags.join(', ')}`} maxCharacters={3000}/></div>
            <Textarea
              placeholder="Share your progress, ask questions, or celebrate wins..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              ref={contentTextareaRef}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Media Controls */}
          <div className="flex gap-2 flex-wrap bg-gray-50 p-3 rounded-lg">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || attachmentCounts.photo >= MAX_IMAGES || attachmentCounts.total >= MAX_ATTACHMENTS}
              className="hover:bg-blue-50 hover:text-blue-600"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => videoInputRef.current?.click()}
              disabled={isLoading || attachmentCounts.video >= MAX_VIDEOS || attachmentCounts.total >= MAX_ATTACHMENTS}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <Video className="h-4 w-4 mr-2" />
              Video
            </Button>
            <input
              ref={videoInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`hover:bg-yellow-50 hover:text-yellow-600 ${showEmojiPicker ? 'bg-yellow-100' : ''}`}
            >
              <Smile className="h-4 w-4 mr-2" />
              Emoji
            </Button>

            <div className="flex-1" />
            <p className="w-full text-xs text-muted-foreground">
              Attachments: {attachmentCounts.total}/{MAX_ATTACHMENTS} · Photos {attachmentCounts.photo}/{MAX_IMAGES} · Videos {attachmentCounts.video}/{MAX_VIDEOS} · Links {attachmentCounts.link}/{MAX_LINKS}
            </p>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium mb-3">Quick Emojis</p>
              <div className="grid grid-cols-10 gap-2">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:bg-white p-2 rounded transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Link Section */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Add Link</span>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                type="url"
              />
              <Input
                placeholder="Link title (optional)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddLink}
                disabled={!linkUrl.trim() || attachmentCounts.link >= MAX_LINKS || attachmentCounts.total >= MAX_ATTACHMENTS}
              >
                Add Link
              </Button>
            </div>
          </div>

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Attached Media</p>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.type === "photo" && (
                        <ImageIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                      {file.type === "video" && (
                        <Video className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      {file.type === "link" && (
                        <LinkIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate">
                        {file.originalName || file.title || file.url}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Accordion type="single" collapsible className="rounded-lg border px-3">
            <AccordionItem value="more" className="border-0">
              <AccordionTrigger>More options</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Give your post a title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !content.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Saving..." : "Publishing..."}
              </>
            ) : (
              isEditing ? "Save Changes" : "Publish Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
