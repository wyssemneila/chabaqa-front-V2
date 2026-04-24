"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CourseCreationProgress } from "./course-creation-progress"
import { BasicInfoStep } from "./basic-info-step"
import { PricingDetailsStep } from "./pricing-details-step"
import { CourseContentStep } from "./course-content-step"
import { ReviewPublishStep } from "./review-publish-step"
import { NavigationButtons } from "./navigation-buttons"
import { PageHeader } from "./page-header"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { getCreatorVideoUrlError, normalizeVideoUrl } from "@/lib/utils/video-source"

interface CourseChapterForm {
  id: string
  title: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
  isPreview: boolean
  price?: string
  notes?: string
}

interface CourseSectionForm {
  id: string
  title: string
  description?: string
  order: number
  chapters: CourseChapterForm[]
}

export function CourseCreationContainer() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})
  const [chapterValidationErrors, setChapterValidationErrors] = useState<Record<string, string>>({})
  
  // Use the selected community from context
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    price: "",
    currency: "TND",
    category: "",
    level: "",
    duration: "",
    isPublished: false,
    tags: [] as string[],
    learningObjectives: [""],
    requirements: [""],
    sections: [] as CourseSectionForm[],
    communitySlug: "",
  })

  const steps = [
    { id: 1, title: "Basic Info", description: "Course title, description, and thumbnail" },
    { id: 2, title: "Pricing & Details", description: "Set price, category, and level" },
    { id: 3, title: "Course Content", description: "Add sections and chapters" },
    { id: 4, title: "Review & Publish", description: "Review and publish your course" },
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev])
        ? (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) =>
          i === index ? value : item
        )
        : prev[field as keyof typeof prev],
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) ? [...(prev[field as keyof typeof prev] as any[]), ""] : prev[field as keyof typeof prev],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev])
        ? (prev[field as keyof typeof prev] as any[]).filter((_: any, i: number) => i !== index)
        : prev[field as keyof typeof prev],
    }))
  }

  const addSection = () => {
    const newSection: CourseSectionForm = {
      id: `section-${Date.now()}`,
      title: "",
      description: "",
      order: formData.sections.length + 1,
      chapters: [],
    }
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
  }

  const updateSection = (sectionId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)),
    }))
  }

  const removeSection = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }))
  }

  const addChapter = (sectionId: string) => {
    const section = formData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newChapter: CourseChapterForm = {
      id: `chapter-${Date.now()}`,
      title: "",
      content: "",
      videoUrl: "",
      duration: 0,
      order: section.chapters.length + 1,
      isPreview: false,
      price: "",
      notes: "",
    }

    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, chapters: [...s.chapters, newChapter] } : s)),
    }))
  }

  const updateChapter = (sectionId: string, chapterId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            chapters: section.chapters.map((chapter) =>
              chapter.id === chapterId ? { ...chapter, [field]: value } : chapter,
            ),
          }
          : section,
      ),
    }))
  }

  const removeChapter = (sectionId: string, chapterId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? { ...section, chapters: section.chapters.filter((chapter) => chapter.id !== chapterId) }
          : section,
      ),
    }))
  }

  useEffect(() => {
    // Use the selected community from context
    if (selectedCommunity?.slug) {
      setFormData(prev => ({ ...prev, communitySlug: selectedCommunity.slug }))
    }
  }, [selectedCommunity])

  const validateChapterContent = (sections: CourseSectionForm[]): Record<string, string> => {
    const nextErrors: Record<string, string> = {}

    for (const section of sections) {
      for (const chapter of section.chapters || []) {
        const title = chapter.title?.trim() || ""
        const content = chapter.content?.trim() || ""
        const videoUrl = normalizeVideoUrl(chapter.videoUrl)

        if (!title) {
          nextErrors[`chapter:${chapter.id}:title`] = "Chapter title is required."
        }

        if (!content && !videoUrl) {
          nextErrors[`chapter:${chapter.id}:contentVideo`] = "Add chapter content or a video URL."
        }

        const sourceError = getCreatorVideoUrlError(videoUrl)
        if (sourceError) {
          nextErrors[`chapter:${chapter.id}:videoUrl`] = sourceError
        }
      }
    }

    return nextErrors
  }

  const validateCurrentStep = () => {
    const errors: Record<string, boolean> = {}
    let isValid = true
    let nextChapterValidationErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1:
        if (!formData.title || formData.title.trim().length < 3) {
          errors.title = true
          isValid = false
        }
        if (!formData.description || formData.description.trim().length < 10) {
          errors.description = true
          isValid = false
        }
        
        if (!isValid) {
          toast({ 
            title: 'Validation Error', 
            description: 'Please fill in all required fields correctly.', 
            variant: 'destructive' 
          })
        }
        break
        
      case 2:
        if (!formData.price || Number(formData.price) < 0) {
          errors.price = true
          isValid = false
        }
        if (!formData.category) {
          errors.category = true
          isValid = false
        }
        if (!formData.level) {
          errors.level = true
          isValid = false
        }
        if (!formData.learningObjectives.some(obj => obj.trim().length > 0)) {
          errors.learningObjectives = true
          isValid = false
        }
        
        if (!isValid) {
          toast({ 
            title: 'Validation Error', 
            description: 'Please complete all required fields.', 
            variant: 'destructive' 
          })
        }
        break
        
      case 3:
        if (formData.sections.length === 0) {
          errors.courseContent = true
          toast({ 
            title: 'Validation Error', 
            description: 'Please add at least one section with chapters.', 
            variant: 'destructive' 
          })
          isValid = false
        } else {
          const hasChapter = formData.sections.some((s) => s.chapters && s.chapters.length > 0)
          if (!hasChapter) {
            errors.courseContent = true
            toast({ 
              title: 'Validation Error', 
              description: 'Please add at least one chapter to your course.', 
              variant: 'destructive' 
            })
            isValid = false
          } else {
            nextChapterValidationErrors = validateChapterContent(formData.sections)
            if (Object.keys(nextChapterValidationErrors).length > 0) {
              errors.courseContent = true
              toast({
                title: "Validation Error",
                description: "Fix chapter title/content/video URL issues before continuing.",
                variant: "destructive",
              })
              isValid = false
            }
          }
        }
        break
    }
    
    setValidationErrors(errors)
    setChapterValidationErrors(nextChapterValidationErrors)
    return isValid
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    // Basic client-side validation before hitting the API
    const errors: string[] = []
    if (!selectedCommunityId || !formData.communitySlug) {
      errors.push("Please select a community before creating a course.")
    }
    if (!formData.title.trim()) {
      errors.push("Course title is required.")
    }
    if (!formData.description.trim()) {
      errors.push("Course description is required.")
    }
    if (!formData.sections.length) {
      errors.push("Add at least one section with chapters.")
    } else {
      const hasChapter = formData.sections.some((s) => s.chapters && s.chapters.length > 0)
      if (!hasChapter) {
        errors.push("Each course must have at least one chapter.")
      } else {
        const nextChapterValidationErrors = validateChapterContent(formData.sections)
        if (Object.keys(nextChapterValidationErrors).length > 0) {
          errors.push("Fix chapter title/content/video URL issues.")
          setValidationErrors((prev) => ({ ...prev, courseContent: true }))
          setChapterValidationErrors(nextChapterValidationErrors)
        } else {
          setChapterValidationErrors({})
        }
      }
    }

    if (errors.length) {
      toast({
        title: "Please fix the highlighted issues",
        description: errors.join(" "),
        variant: "destructive",
      })
      // Jump to content step if structure is missing
      if (!formData.sections.length) {
        setCurrentStep(3)
      }
      return
    }

    try {
      setIsSubmitting(true)
      console.log('📤 [COURSE SUBMIT] Starting course submission')
      console.log('   📚 Title:', formData.title)
      console.log('   📁 Sections:', formData.sections.length)
      
      // Build DTO mapping English -> French fields
      const prixNum = Number(formData.price || 0)
      const isPaid = prixNum > 0
      const sections = (formData.sections || []).map((s, idx) => {
        console.log(`   📂 Section ${idx + 1}: "${s.title}" with ${s.chapters.length} chapters`)
        
        return {
          titre: s.title || `Section ${idx + 1}`,
          description: s.description || "",
          ordre: s.order || (idx + 1),
          chapitres: (s.chapters || []).map((c, jdx) => {
            const normalizedChapterTitle = c.title?.trim() || `Chapitre ${jdx + 1}`
            const normalizedChapterContent = c.content?.trim() || ""
            const normalizedChapterVideoUrl = normalizeVideoUrl(c.videoUrl)
            console.log(`      📄 Chapter ${jdx + 1}: "${c.title}"`)
            console.log(`         🎬 Video URL: "${c.videoUrl || '(empty)'}"`)
            
            return {
              titre: normalizedChapterTitle,
              description: normalizedChapterContent,
              videoUrl: normalizedChapterVideoUrl || undefined,
              isPaid: !c.isPreview,
              prix: !c.isPreview
                ? (c.price !== undefined && c.price !== "" ? Number(c.price) : (prixNum || 0))
                : 0,
              ordre: c.order || (jdx + 1),
              duree: typeof c.duration === 'number' && c.duration > 0 ? `${c.duration}` : undefined,
              notes: c.notes || undefined,
            }
          })
        }
      })

      // Map English level to French enum values
      const levelMapping: { [key: string]: string | undefined } = {
        'Beginner': 'débutant',
        'Intermediate': 'intermédiaire',
        'Advanced': 'avancé',
        'All Levels': undefined
      }

      const mappedLevel = formData.level ? levelMapping[formData.level] : undefined

      const payload = {
        titre: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail || undefined,
        prix: prixNum,
        isPaid,
        devise: formData.currency || 'TND',
        communitySlug: formData.communitySlug,
        isPublished: Boolean(formData.isPublished),
        category: formData.category || undefined,
        niveau: mappedLevel,
        duree: formData.duration || undefined,
        learningObjectives: (formData.learningObjectives || []).filter(Boolean),
        requirements: (formData.requirements || []).filter(Boolean),
        sections,
      }

      console.log('📤 [COURSE SUBMIT] Final payload:', JSON.stringify(payload, null, 2))

      const res = await apiClient.post<any>(`/cours/create-cours`, payload)
      const created = res?.data?.cours || res?.cours || res?.data || res
      toast({ title: 'Course created', description: payload.titre })
      const id = created?._id || created?.id
      if (id) router.push(`/creator/courses/${id}/manage`)
      else router.push('/creator/courses')
    } catch (e: any) {
      console.error('❌ [COURSE SUBMIT] Failed:', e)
      toast({ title: 'Failed to create course', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalChapters = formData.sections.reduce((acc, section) => acc + section.chapters.length, 0)
  const previewChapters = formData.sections.reduce(
    (acc, section) => acc + section.chapters.filter((c) => c.isPreview).length,
    0,
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-5">
      <PageHeader />
      <CourseCreationProgress currentStep={currentStep} setCurrentStep={setCurrentStep} />

      {currentStep === 1 && (
        <BasicInfoStep 
          formData={formData} 
          handleInputChange={handleInputChange}
          validationErrors={validationErrors}
        />
      )}

      {currentStep === 2 && (
        <PricingDetailsStep
          formData={formData}
          handleInputChange={handleInputChange}
          handleArrayChange={handleArrayChange}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
          validationErrors={validationErrors}
        />
      )}

      {currentStep === 3 && (
        <CourseContentStep
          formData={formData}
          addSection={addSection}
          updateSection={updateSection}
          removeSection={removeSection}
          addChapter={addChapter}
          updateChapter={updateChapter}
          removeChapter={removeChapter}
          validationErrors={validationErrors}
          chapterValidationErrors={chapterValidationErrors}
        />
      )}

      {currentStep === 4 && (
        <ReviewPublishStep
          formData={formData}
          handleInputChange={handleInputChange}
        />
      )}

      <NavigationButtons
        currentStep={currentStep}
        stepsLength={steps.length}
        setCurrentStep={setCurrentStep}
        handleSubmit={handleSubmit}
        formData={formData}
        isSubmitting={isSubmitting}
        handleNextStep={handleNextStep}
        handlePrevStep={handlePrevStep}
      />
    </div>
  )
}
