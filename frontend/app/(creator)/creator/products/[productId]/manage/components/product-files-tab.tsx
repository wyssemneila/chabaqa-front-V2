"use client"

import { useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Upload } from "lucide-react"
import { useProductForm } from "./product-form-context"

export function ProductFilesTab() {
  const { 
    formData, 
    isUploadingFile,
    handleUploadFiles,
    handleFileChange, 
    handleRemoveFile 
  } = useProductForm()
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Downloadable Files</CardTitle>
        <CardDescription>Files your customers will receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void handleUploadFiles(e.target.files)}
        />

        {formData.files.map((file: any, index: number) => (
          <div key={file.id} className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>File Name</Label>
                <Input
                  value={file.name}
                  onChange={(e) => handleFileChange(index, "name", e.target.value)}
                  placeholder="e.g., UI_Kit.fig"
                />
              </div>
              <div className="space-y-1">
                <Label>File Type</Label>
                <Input
                  value={file.type}
                  onChange={(e) => handleFileChange(index, "type", e.target.value)}
                  placeholder="e.g., Figma, PDF, ZIP"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Download URL</Label>
              <Input
                value={file.url}
                onChange={(e) => handleFileChange(index, "url", e.target.value)}
                placeholder="https://example.com/download/file"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => handleRemoveFile(index)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove File
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploadingFile}>
          {isUploadingFile ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
