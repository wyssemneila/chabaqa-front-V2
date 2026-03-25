"use client"

import { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { productsApi } from "@/lib/api/products.api"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type ProductFormContextType = {
  formData: any
  isSaving: boolean
  isUploadingFile: boolean
  handleInputChange: (field: string, value: any) => void
  handleArrayChange: (field: string, index: number, value: string) => void
  addArrayItem: (field: string) => void
  removeArrayItem: (field: string, index: number) => void
  handleUploadFiles: (files: FileList | null) => Promise<void>
  handleFileChange: (index: number, field: string, value: string) => void
  handleRemoveFile: (index: number) => void
  handleSave: () => Promise<void>
}

const ProductFormContext = createContext<ProductFormContextType | undefined>(undefined)

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

export function ProductFormProvider({
  children,
  product,
}: {
  children: React.ReactNode
  product: any
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [formData, setFormData] = useState({
    id: product?.id || product?._id,
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price || 0,
    currency: product?.currency || "TND",
    type: product?.type || "digital",
    isPublished: product?.isPublished || false,
    category: product?.category || "",
    licenseTerms: product?.licenseTerms || "",
    features: product?.features || [""],
    images: Array.isArray(product?.images) && product.images.length > 0
      ? product.images
      : (product?.thumbnail ? [product.thumbnail] : []),
    files: product?.files || [],
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: (prev[field] || []).map((item: string, i: number) => (i === index ? value : item)),
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index),
    }))
  }

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploadingFile(true)
    try {
      const uploaded: any[] = []
      for (const file of Array.from(files)) {
        const res = await api.storage.upload(file)
        if (!res?.url) continue
        uploaded.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          url: res.url,
          type: normalizeFileType(file.type, file.name),
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          isActive: true,
          order: 0,
        })
      }

      if (uploaded.length > 0) {
        setFormData((prev: any) => ({
          ...prev,
          files: [...(prev.files || []), ...uploaded].map((f: any, idx: number) => ({
            ...f,
            order: idx,
          })),
        }))
        toast({
          title: "Files uploaded",
          description: `${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded.`,
        })
      }
    } catch (error: any) {
      toast({
        title: "File upload failed",
        description: error?.message || "Please try again.",
        variant: "destructive" as any,
      })
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleFileChange = (index: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      files: (prev.files || []).map((file: any, i: number) =>
        i === index ? { ...file, [field]: value } : file,
      ),
    }))
  }

  const handleRemoveFile = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      files: (prev.files || []).filter((_: any, i: number) => i !== index).map((f: any, idx: number) => ({
        ...f,
        order: idx,
      })),
    }))
  }

  const handleSave = async () => {
    const productId = String(formData.id || "")
    if (!productId) return
    const price = Number(formData.price || 0)
    const files = Array.isArray(formData.files) ? formData.files : []

    if (formData.type === "digital" && price > 0 && files.length === 0) {
      toast({
        title: "Files required",
        description: "Paid digital products must include at least one downloadable file.",
        variant: "destructive" as any,
      })
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        title: formData.title?.trim(),
        description: formData.description?.trim(),
        price,
        currency: formData.currency || "TND",
        type: formData.type || "digital",
        category: formData.category || "General",
        isPublished: Boolean(formData.isPublished),
        licenseTerms: formData.licenseTerms?.trim() || undefined,
        features: Array.isArray(formData.features)
          ? formData.features.map((f: string) => f?.trim()).filter(Boolean)
          : [],
        images: Array.isArray(formData.images) ? formData.images : [],
        files: Array.isArray(formData.files)
          ? formData.files
              .filter((f: any) => f?.name && f?.url)
              .map((f: any, idx: number) => ({
                id: f.id,
                name: String(f.name).trim(),
                url: String(f.url).trim(),
                type: normalizeFileType(f.type, f.name),
                size: f.size,
                description: f.description,
                isActive: f.isActive !== false,
                order: idx,
              }))
          : [],
      }

      await productsApi.update(productId, payload)
      toast({ title: "Product saved", description: "Changes were saved successfully." })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || "Please review your changes and try again.",
        variant: "destructive" as any,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProductFormContext.Provider
      value={{
        formData,
        isSaving,
        isUploadingFile,
        handleInputChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        handleUploadFiles,
        handleFileChange,
        handleRemoveFile,
        handleSave,
      }}
    >
      {children}
    </ProductFormContext.Provider>
  )
}

export function useProductForm() {
  const context = useContext(ProductFormContext)
  if (!context) {
    throw new Error("useProductForm must be used within a ProductFormProvider")
  }
  return context
}
