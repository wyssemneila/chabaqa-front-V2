"use client"

import { useRef, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Package, Upload, FileText, X, AlertCircle } from "lucide-react"
import { useProductForm } from "./product-form-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const ACCEPTED_EXTENSIONS = [
  "pdf", "zip", "mp4", "mp3", "epub", "mobi", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "png", "jpg", "jpeg", "svg", "txt", "md", "json", "xml", "css", "js", "html", "php", "py",
  "java", "cpp", "c", "psd", "ai", "sketch", "xd", "fig", "odt", "rtf", "csv",
]
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024

function normalizeFileType(rawType: string, filename: string): string {
  const value = (rawType || "").toLowerCase().trim()
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  const candidate = value.includes("/") ? value : ext || value
  const map: Record<string, string> = {
    figma: "Figma",
    fig: "Figma",
    pdf: "PDF",
    svg: "SVG",
    png: "PNG",
    jpg: "JPG",
    jpeg: "JPG",
    zip: "ZIP",
    psd: "PSD",
    ai: "AI",
    sketch: "SKETCH",
    xd: "XD",
    mp4: "MP4",
    mp3: "MP3",
    doc: "DOC",
    docx: "DOCX",
    ppt: "PPT",
    pptx: "PPTX",
    xls: "XLS",
    xlsx: "XLSX",
    txt: "TXT",
    md: "MD",
    json: "JSON",
    xml: "XML",
    css: "CSS",
    js: "JS",
    html: "HTML",
    php: "PHP",
    py: "PY",
    java: "JAVA",
    cpp: "CPP",
    c: "C",
    "application/pdf": "PDF",
    "application/zip": "ZIP",
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "image/jpg": "JPG",
    "video/mp4": "MP4",
    "audio/mpeg": "MP3",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    "text/plain": "TXT",
    "text/markdown": "MD",
    "application/json": "JSON",
    "application/xml": "XML",
    "text/xml": "XML",
    "text/css": "CSS",
    "application/javascript": "JS",
    "text/javascript": "JS",
    "text/html": "HTML",
  }
  return map[candidate] || map[ext] || "OTHER"
}

export function DeliveryStep() {
  const { formData, errors, handleInputChange } = useProductForm()
  const { toast } = useToast()
  const [uploadingCount, setUploadingCount] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const onPick = () => inputRef.current?.click()

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const files = Array.from(fileList)
    const currentFiles = Array.isArray(formData.files) ? formData.files : []
    const dedupeKeys = new Set(currentFiles.map((f: any) => `${f.name}::${f.size || ""}`))

    setUploadingCount(files.length)
    let successCount = 0

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        toast({
          title: "Invalid file type",
          description: `${file.name}: unsupported format.`,
          variant: "destructive" as any,
        })
        setUploadingCount((c) => c - 1)
        continue
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: `${file.name}: max 100MB.`,
          variant: "destructive" as any,
        })
        setUploadingCount((c) => c - 1)
        continue
      }

      const fileKey = `${file.name}::${(file.size / 1024 / 1024).toFixed(2)} MB`
      if (dedupeKeys.has(fileKey)) {
        setUploadingCount((c) => c - 1)
        continue
      }

      try {
        const uploaded = await api.storage.upload(file)
        if (!uploaded?.url) throw new Error("Upload failed")

        const newFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          url: uploaded.url,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          type: normalizeFileType(file.type, file.name),
          order: currentFiles.length + successCount,
          isActive: true,
        }

        currentFiles.push(newFile)
        dedupeKeys.add(fileKey)
        successCount += 1
      } catch (e: any) {
        toast({
          title: "Upload failed",
          description: `${file.name}: ${e?.message || "Try again."}`,
          variant: "destructive" as any,
        })
      } finally {
        setUploadingCount((c) => c - 1)
      }
    }

    handleInputChange("files", [...currentFiles])
    if (successCount > 0) {
      toast({
        title: "Files uploaded",
        description: `${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully.`,
      })
    }
  }

  const removeFile = (index: number) => {
    const currentFiles = formData.files || []
    const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index)
    handleInputChange("files", updatedFiles)
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary-500" />
          Delivery & Files
        </CardTitle>
        <CardDescription>Upload the files customers receive after purchase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="licenseTerms">License Terms</Label>
          <Textarea
            id="licenseTerms"
            placeholder="Describe usage rights and restrictions for this product."
            rows={3}
            value={formData.licenseTerms || ""}
            onChange={(e) => handleInputChange("licenseTerms", e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Product Files</Label>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.map((x) => `.${x}`).join(",")}
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={uploadingCount > 0}>
              <Upload className="h-4 w-4 mr-1" />
              {uploadingCount > 0 ? `Uploading ${uploadingCount}...` : "Upload Files"}
            </Button>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              void onFiles(e.dataTransfer.files)
            }}
          >
            <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600">Drag and drop files here, or use Upload Files</p>
            <p className="text-xs text-gray-500 mt-1">Max 100MB per file</p>
          </div>

          {errors.files && (
            <p className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.files}
            </p>
          )}

          {formData.files && formData.files.length > 0 && (
            <div className="space-y-2">
              {formData.files.map((file: any, index: number) => (
                <div
                  key={`${file.id || file.name}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.type || "OTHER").toUpperCase()} • {file.size || "Unknown size"}
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
