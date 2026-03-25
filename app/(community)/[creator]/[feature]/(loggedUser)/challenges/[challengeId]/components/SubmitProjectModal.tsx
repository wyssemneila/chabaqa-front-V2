"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Link as LinkIcon, FileText, X, Image as ImageIcon, Upload, Camera } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { mediaApi } from "@/lib/api/media.api"
import { apiClient } from "@/lib/api/client"

const submissionSchema = z.object({
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  links: z.array(z.string().url({ message: "Please enter a valid URL." })).optional(),
  images: z.array(z.string()).optional(),
})

interface SubmitProjectModalProps {
  isOpen: boolean
  onClose: () => void
  challengeId: string
  taskId: string
  taskTitle: string
  onSubmitSuccess?: () => void
}

export default function SubmitProjectModal({
  isOpen,
  onClose,
  challengeId,
  taskId,
  taskTitle,
  onSubmitSuccess,
}: SubmitProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [links, setLinks] = useState<string[]>([""])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof submissionSchema>>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      content: "",
      links: [],
      images: [],
    },
  })

  const addLink = () => {
    setLinks([...links, ""])
  }

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index)
    setLinks(newLinks.length > 0 ? newLinks : [""])
  }

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links]
    newLinks[index] = value
    setLinks(newLinks)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const data = await mediaApi.upload(file, {
        purpose: "generic",
        entityType: "challenge_task",
        entityId: taskId,
        visibility: "public",
      })
      const url = data?.url
      if (!url) {
        console.error("No URL found in upload response:", data);
        throw new Error("Upload response missing URL");
      }
      
      return url;
    })

    try {
      const urls = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...urls])
      toast.success(`${files.length} photo(s) uploaded`)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload one or more photos")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: z.infer<typeof submissionSchema>) {
    setIsSubmitting(true)
    try {
      const filteredLinks = links.filter(link => link.trim() !== "")

      await apiClient.post(`/challenges/project-submissions`, {
        challengeId,
        taskId,
        content: values.content,
        links: filteredLinks,
        files: uploadedImages, // Backend stores photo URLs in 'files' field
      })

      console.log('Submission success')
      toast.success("Project submitted successfully!")
      onSubmitSuccess?.()
      onClose()
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("An error occurred while submitting your project.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Project</DialogTitle>
          <DialogDescription>
            Share your work for <strong>{taskTitle}</strong>. You can submit photos, links, and text.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your work, what you achieved, and any notes for the reviewer..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload Section */}
            <div className="space-y-4">
              <FormLabel className="flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Photos of your work
              </FormLabel>
              
              <div className="grid grid-cols-3 gap-4">
                {uploadedImages.map((url, index) => {
                  if (!url) return null;
                  return (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                      <Image
                        src={url}
                        alt={`Upload ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={url.startsWith('blob:')}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground font-medium">Add Photo</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Upload one or more photos of your completed task.
              </p>
            </div>

            <div className="space-y-3">
              <FormLabel className="flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                Project Links (Optional)
              </FormLabel>
              {links.map((link, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://github.com/..."
                      className="pl-9"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                    />
                  </div>
                  {links.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addLink}
              >
                + Add Another Link
              </Button>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading} className="bg-challenges-600 hover:bg-challenges-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Complete Submission"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
