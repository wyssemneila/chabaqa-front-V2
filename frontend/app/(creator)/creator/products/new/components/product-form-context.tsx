"use client"

import { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { productsApi, type CreateProductData } from "@/lib/api/products.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

interface ProductVariantForm {
  id: string
  name: string
  price: number
  description?: string
}

interface DownloadFileForm {
  id: string
  name: string
  url: string
  type: string
  size?: string
  description?: string
  order?: number
  isActive?: boolean
}

interface ValidationErrors {
  [key: string]: string
}

interface ProductFormContextType {
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: any
  errors: ValidationErrors
  handleInputChange: (field: string, value: any) => void
  handleArrayChange: (field: string, index: number, value: string) => void
  addArrayItem: (field: string) => void
  removeArrayItem: (field: string, index: number) => void
  addVariant: () => void
  updateVariant: (variantId: string, field: string, value: any) => void
  removeVariant: (variantId: string) => void
  addFile: () => void
  updateFile: (fileId: string, field: string, value: any) => void
  removeFile: (fileId: string) => void
  validateStep: (step: number) => boolean
  clearFieldError: (field: string) => void
  handleSubmit: () => void
}

const ProductFormContext = createContext<ProductFormContextType | undefined>(undefined)

export function ProductFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<ValidationErrors>({})
  
  // Use the selected community from context
  const { selectedCommunityId } = useCreatorCommunity()
  const communityId = selectedCommunityId || ""
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    price: 0,
    currency: "TND",
    category: "",
    type: "digital",
    isPublished: false,
    tags: [] as string[],
    features: [""],
    requirements: [""],
    variants: [] as ProductVariantForm[],
    files: [] as DownloadFileForm[],
    licenseTerms: "",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {}

    if (step === 1) {
      // Basic Info validation
      if (!formData.title?.trim()) {
        newErrors.title = "Le nom du produit est requis"
      }
      if (!formData.description?.trim()) {
        newErrors.description = "La description du produit est requise"
      }
      if (!formData.category) {
        newErrors.category = "La catégorie est requise"
      }
      if (!formData.features || formData.features.length === 0 || !formData.features.some((f: string) => f.trim())) {
        newErrors.features = "Au moins une fonctionnalité est requise"
      }
    } else if (step === 2) {
      // Pricing validation
      if (formData.price === undefined || formData.price === null || formData.price < 0) {
        newErrors.price = "Le prix doit être supérieur ou égal à 0"
      }
      
      // Validate variants if they exist
      if (formData.variants && formData.variants.length > 0) {
        formData.variants.forEach((variant: ProductVariantForm, index: number) => {
          if (!variant.name?.trim()) {
            newErrors[`variant_${variant.id}_name`] = "Le nom du variant est requis"
          }
          if (variant.price === undefined || variant.price === null || variant.price < 0) {
            newErrors[`variant_${variant.id}_price`] = "Le prix du variant doit être >= 0"
          }
        })
      }
    } else if (step === 3) {
      // Delivery validation - files are optional but validated if provided
      const requiresFiles = formData.type === "digital" && Number(formData.price || 0) > 0
      if (requiresFiles && (!formData.files || formData.files.length === 0)) {
        newErrors.files = "Au moins un fichier est requis pour un produit digital payant"
      }

      if (formData.files && formData.files.length > 0) {
        formData.files.forEach((file: DownloadFileForm, index: number) => {
          if (!file.name?.trim()) {
            newErrors[`file_${file.id}_name`] = "Le nom du fichier est requis"
          }
          if (!file.url?.trim()) {
            newErrors[`file_${file.id}_url`] = "L'URL du fichier est requise"
          }
        })
      }

    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors)
      toast({
        title: "Erreurs de validation",
        description: errorMessages[0],
        variant: "destructive" as any
      })
      return false
    }

    return true
  }

const handleArrayChange = (field: string, index: number, value: string) => {
  setFormData((prev) => {
    const fieldValue = prev[field as keyof typeof prev];

    // Only allow array fields
    if (Array.isArray(fieldValue)) {
      return {
        ...prev,
        [field]: (fieldValue as string[]).map((item, i) => (i === index ? value : item)),
      };
    }

    // If it's not an array, return unchanged
    return prev;
  });
};


  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => {
      const arr = prev[field as keyof typeof prev];
      if (Array.isArray(arr)) {
        return {
          ...prev,
          [field]: arr.filter((_: any, i: number) => i !== index),
        };
      }
      return prev;
    });
  }

  const addVariant = () => {
    const newVariant: ProductVariantForm = {
      id: `variant-${Date.now()}`,
      name: "",
      price: 0,
      description: "",
    }
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }))
  }

  const updateVariant = (variantId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      ),
    }))
  }

  const removeVariant = (variantId: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((variant) => variant.id !== variantId),
    }))
  }

  const addFile = () => {
    const newFile: DownloadFileForm = {
      id: `file-${Date.now()}`,
      name: "",
      url: "",
      type: "PDF",
    }
    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }))
  }

  const updateFile = (fileId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.map((file) =>
        file.id === fileId ? { ...file, [field]: value } : file
      ),
    }))
  }

  const removeFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.id !== fileId),
    }))
  }

  const handleSubmit = async () => {
    // Validate all steps before submitting
    const step1Valid = validateStep(1)
    if (!step1Valid) {
      setCurrentStep(1)
      return
    }
    const step2Valid = validateStep(2)
    if (!step2Valid) {
      setCurrentStep(2)
      return
    }
    const step3Valid = validateStep(3)
    if (!step3Valid) {
      setCurrentStep(3)
      return
    }

    try {
      if (!communityId) {
        toast({ title: 'Communauté manquante', description: 'Aucune communauté trouvée pour ce créateur.', variant: 'destructive' as any })
        return
      }

      // Map UI form to CreateProductDto / CreateProductData
      const payload: CreateProductData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price || 0),
        currency: (formData.currency || 'TND') as CreateProductData['currency'],
        communityId,
        category: formData.category || 'General',
        type: formData.type as 'digital' | 'physical',
        isPublished: Boolean(formData.isPublished),
        ...(formData.thumbnail && { images: [formData.thumbnail] }),
        ...(formData.variants && formData.variants.length > 0 && {
          variants: formData.variants.map((v: any) => ({
            name: v.name.trim(),
            price: Number(v.price || 0),
            ...(v.description && { description: v.description.trim() }),
            ...(v.inventory !== undefined && v.inventory !== null && { inventory: Number(v.inventory) }),
          }))
        }),
        ...(formData.files && formData.files.length > 0 && {
          files: formData.files.map((f: any, idx: number) => ({
            name: (f.name || `File ${idx+1}`).trim(),
            url: f.url,
            type: f.type || 'OTHER',
            ...(f.size && { size: f.size }),
            ...(f.description && { description: f.description.trim() }),
            order: idx,
            isActive: true,
          }))
        }),
        ...(formData.licenseTerms && { licenseTerms: formData.licenseTerms.trim() }),
        ...(Array.isArray(formData.features) && formData.features.filter(Boolean).length > 0 && {
          features: formData.features.filter(Boolean).map((f: string) => f.trim())
        }),
      }

      console.log('📦 Creating product with payload:', { ...payload, communityId })
      const res = await productsApi.create(payload)
      const created = (res as any)?.data || res
      console.log('✅ Product created:', created)
      toast({ title: 'Product created', description: payload.title })
      const id = created?.id || created?._id || created?.product?.id || created?.product?._id
      if (id) router.push(`/creator/products/${id}/manage`)
      else router.push('/creator/products')
    } catch (e: any) {
      console.error('❌ Product creation error:', e)
      toast({ title: 'Failed to create product', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    }
  }

  return (
    <ProductFormContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        formData,
        errors,
        handleInputChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        addVariant,
        updateVariant,
        removeVariant,
        addFile,
        updateFile,
        removeFile,
        validateStep,
        clearFieldError,
        handleSubmit,
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
