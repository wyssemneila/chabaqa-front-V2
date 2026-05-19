"use client"

import { useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ProductFormProvider } from "./components/product-form-context"
import { CreateProductProgress } from "./components/create-product-progress"
import { CreateProductForm } from "./components/create-product-form"
import { CreateProductNavigation } from "./components/create-product-navigation"
import { useProductForm } from "./components/product-form-context"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import {
  CreatorCreateShell,
  CreatorDraftRestoreBanner,
  CreatorPublishChecklist,
  CreatorValidationSummary,
  useCreatorCreateDraftStorage,
} from "@/components/creator-dashboard/create-flow"
import {
  type ProductCreateValues,
  getProductPublishChecklist,
  getCreatorCreateTemplate,
  validateProductDraft,
  validateProductPublish,
} from "@/lib/creator-content"

export default function CreateProductPage() {
  return (
    <ProductFormProvider>
      <CreateProductPageContent />
    </ProductFormProvider>
  )
}

function CreateProductPageContent() {
  const searchParams = useSearchParams()
  const {
    currentStep,
    setCurrentStep,
    formData,
    isSubmitting,
    handleSubmit,
    restoreFormData,
  } = useProductForm()
  const { selectedCommunity, selectedCommunityId, isLoading } = useCreatorCommunity()

  const productCreateValues = useMemo<ProductCreateValues>(() => ({
    title: formData.title,
    description: formData.description,
    price: formData.price,
    currency: (formData.currency || "TND") as ProductCreateValues["currency"],
    communityId: selectedCommunityId || "",
    category: formData.category || "Digital Product",
    type: (formData.type || "digital") as ProductCreateValues["type"],
    isPublished: Boolean(formData.isPublished),
    thumbnail: formData.thumbnail,
    features: Array.isArray(formData.features) ? formData.features : [],
    files: Array.isArray(formData.files) ? formData.files : [],
    variants: Array.isArray(formData.variants) ? formData.variants : [],
    licenseTerms: formData.licenseTerms,
  }), [formData, selectedCommunityId])

  const draftValidation = useMemo(() => validateProductDraft(productCreateValues), [productCreateValues])
  const publishValidation = useMemo(() => validateProductPublish(productCreateValues), [productCreateValues])
  const publishChecklist = useMemo(() => getProductPublishChecklist(productCreateValues), [productCreateValues])
  const draftStorage = useCreatorCreateDraftStorage({
    contentType: "product",
    communityId: selectedCommunityId || selectedCommunity?.slug || "unknown",
    values: formData,
    enabled: !isSubmitting,
  })
  const appliedTemplateRef = useRef(false)

  useEffect(() => {
    if (appliedTemplateRef.current) return
    const template = getCreatorCreateTemplate("product", searchParams.get("template"))
    if (!template) return
    appliedTemplateRef.current = true
    restoreFormData(template.data)
  }, [restoreFormData, searchParams])

  const restoreDraft = () => {
    if (!draftStorage.storedValues) return
    restoreFormData(draftStorage.storedValues)
    draftStorage.clearDraft()
  }

  const handlePublish = () => {
    if (!publishValidation.ok) return
    handleSubmit({ publish: true })
  }

  return (
    <CreatorCreateShell
      title="Create New Product"
      description="Sell digital products to your community"
      backHref="/creator/products"
      backLabel="Back to products"
      communityName={selectedCommunity?.name}
      communityMeta={isLoading ? "Loading community" : selectedCommunity?.slug}
      autosaveStatus={draftStorage.status}
      publishBlocked={!publishValidation.ok}
      previewAction={{ label: "Preview", onClick: () => setCurrentStep(4), disabled: isSubmitting }}
      mobileMode="limited"
      actions={[
        {
          label: "Save Draft",
          icon: "save",
          variant: "outline",
          onClick: () => handleSubmit({ publish: false }),
          disabled: isSubmitting || !draftValidation.ok,
          loading: isSubmitting,
        },
        {
          label: "Publish",
          icon: "publish",
          onClick: handlePublish,
          disabled: isSubmitting || !publishValidation.ok,
          loading: isSubmitting,
        },
      ]}
      sidebar={
        <>
          <CreatorValidationSummary result={currentStep === 4 ? publishValidation : draftValidation} />
          <CreatorPublishChecklist items={publishChecklist} />
        </>
      }
    >
      <CreatorDraftRestoreBanner
        visible={draftStorage.hasStoredDraft}
        label="A locally saved product draft was found for this community."
        onRestore={restoreDraft}
        onDismiss={draftStorage.clearDraft}
      />
      <CreateProductProgress />
      <CreateProductForm />
      <CreateProductNavigation hideSubmitAction />
    </CreatorCreateShell>
  )
}
