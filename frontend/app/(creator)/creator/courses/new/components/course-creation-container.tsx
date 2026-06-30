"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CourseCreationProgress } from "./course-creation-progress"
import { BasicInfoStep } from "./basic-info-step"
import { PricingDetailsStep } from "./pricing-details-step"
import { CourseContentStep } from "./course-content-step"
import { ReviewPublishStep } from "./review-publish-step"
import { NavigationButtons } from "./navigation-buttons"
import { coursesApi, normalizeCourseResponse } from "@/lib/api/courses.api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { getCreatorVideoUrlError, normalizeVideoUrl } from "@/lib/utils/video-source"
import {
  CreatorCreateShell,
  CreatorDraftRestoreBanner,
  CreatorPublishChecklist,
  CreatorValidationSummary,
  useCreatorCreateDraftStorage,
} from "@/components/creator-dashboard/create-flow"
import {
  type CourseCreateValues,
  getCoursePublishChecklist,
  validateCourseDraft,
  validateCoursePublish,
  getCreatorCreateTemplate,
} from "@/lib/creator-content"

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
  const searchParams = useSearchParams()
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
    price: "0",
    currency: "TND",
    category: "General",
    level: "Beginner",
    duration: "",
    isPublished: false,
    tags: [] as string[],
    learningObjectives: [""],
    requirements: [""],
    sections: [
      {
        id: "section-initial",
        title: "Start here",
        description: "",
        order: 1,
        chapters: [
          {
            id: "chapter-initial",
            title: "Introduction",
            content: "",
            videoUrl: "",
            duration: 0,
            order: 1,
            isPreview: true,
            price: "",
            notes: "",
          },
        ],
      },
    ] as CourseSectionForm[],
    communitySlug: "",
  })

  const steps = [
    { id: 1, title: "Start", description: "Course title, description, and cover" },
    { id: 2, title: "Lessons", description: "Add the first lesson and course structure" },
    { id: 3, title: "Details", description: "Pricing, category, level, and outcomes" },
    { id: 4, title: "Publish checks", description: "Review blockers before going live" },
  ]

  const courseCreateValues = useMemo<CourseCreateValues>(() => ({
    title: formData.title,
    description: formData.description,
    thumbnail: formData.thumbnail,
    price: formData.price || 0,
    currency: (formData.currency || "TND") as CourseCreateValues["currency"],
    category: formData.category || "General",
    level: (formData.level || "Beginner") as CourseCreateValues["level"],
    duration: formData.duration,
    learningObjectives: formData.learningObjectives,
    requirements: formData.requirements,
    communitySlug: formData.communitySlug || selectedCommunity?.slug || "",
    isPublished: formData.isPublished,
    sections: formData.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      chapters: section.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        content: chapter.content,
        videoUrl: chapter.videoUrl,
        duration: chapter.duration,
        isPreview: chapter.isPreview,
        price: chapter.price,
        notes: chapter.notes,
      })),
    })),
  }), [formData, selectedCommunity?.slug])

  const draftValidation = useMemo(() => validateCourseDraft(courseCreateValues), [courseCreateValues])
  const publishValidation = useMemo(() => validateCoursePublish(courseCreateValues), [courseCreateValues])
  const publishChecklist = useMemo(() => getCoursePublishChecklist(courseCreateValues), [courseCreateValues])
  const draftStorage = useCreatorCreateDraftStorage({
    contentType: "course",
    communityId: selectedCommunityId || selectedCommunity?.slug || "unknown",
    values: courseCreateValues,
    enabled: !isSubmitting,
  })
  const appliedTemplateRef = useRef(false)

  useEffect(() => {
    if (appliedTemplateRef.current) return
    const template = getCreatorCreateTemplate("course", searchParams.get("template"))
    if (!template) return
    appliedTemplateRef.current = true
    setFormData((prev) => ({
      ...prev,
      ...template.data,
      price: template.data.price === undefined ? prev.price : String(template.data.price),
      currency: template.data.currency || prev.currency,
      category: template.data.category || prev.category,
      level: template.data.level || prev.level,
      learningObjectives: Array.isArray(template.data.learningObjectives) ? template.data.learningObjectives : prev.learningObjectives,
      requirements: Array.isArray(template.data.requirements) ? template.data.requirements : prev.requirements,
      sections: Array.isArray(template.data.sections) && template.data.sections.length ? template.data.sections : prev.sections,
    }))
  }, [searchParams])

  const restoreDraft = () => {
    const values = draftStorage.storedValues
    if (!values) return
    setFormData({
      title: values.title || "",
      description: values.description || "",
      thumbnail: values.thumbnail || "",
      price: values.price === undefined || values.price === null ? "" : String(values.price),
      currency: values.currency || "TND",
      category: values.category || "",
      level: values.level || "",
      duration: values.duration || "",
      isPublished: Boolean(values.isPublished),
      tags: [],
      learningObjectives: values.learningObjectives?.length ? values.learningObjectives : [""],
      requirements: values.requirements?.length ? values.requirements : [""],
      communitySlug: values.communitySlug || selectedCommunity?.slug || "",
      sections: (values.sections?.length ? values.sections : [
        {
          title: "Start here",
          chapters: [{ title: "Introduction", content: "", videoUrl: "", isPreview: true }],
        },
      ]).map((section, sectionIndex) => ({
        id: section.id || `restored-section-${sectionIndex}-${Date.now()}`,
        title: section.title || "",
        description: section.description || "",
        order: sectionIndex + 1,
        chapters: (section.chapters || []).map((chapter, chapterIndex) => ({
          id: chapter.id || `restored-chapter-${sectionIndex}-${chapterIndex}-${Date.now()}`,
          title: chapter.title || "",
          content: chapter.content || "",
          videoUrl: chapter.videoUrl || "",
          duration: typeof chapter.duration === "number" ? chapter.duration : Number(chapter.duration || 0),
          order: chapterIndex + 1,
          isPreview: Boolean(chapter.isPreview),
          price: chapter.price === undefined || chapter.price === null ? "" : String(chapter.price),
          notes: chapter.notes || "",
        })),
      })),
    })
    draftStorage.clearDraft()
  }

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
        if (!formData.title || formData.title.trim().length < 2) {
          errors.title = true
          isValid = false
        }
        if (!formData.description || formData.description.trim().length < 1) {
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
            nextChapterValidationErrors = {}
            for (const section of formData.sections) {
              for (const chapter of section.chapters || []) {
                if (!chapter.title?.trim()) {
                  nextChapterValidationErrors[`chapter:${chapter.id}:title`] = "Lesson title is required."
                }
              }
            }
            if (Object.keys(nextChapterValidationErrors).length > 0) {
              errors.courseContent = true
              toast({
                title: "Validation Error",
                description: "Add a title for each lesson before continuing.",
                variant: "destructive",
              })
              isValid = false
            }
          }
        }
        break

      case 3:
        if (Number(formData.price || 0) < 0) {
          errors.price = true
          isValid = false
        }

        if (!isValid) {
          toast({
            title: 'Validation Error',
            description: 'Please enter a valid price.',
            variant: 'destructive'
          })
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

  const handleSubmit = async (options?: { publish?: boolean }) => {
    if (isSubmitting) return

    // Basic client-side validation before hitting the API
    const errors: string[] = []
    if (!selectedCommunityId || !formData.communitySlug) {
      errors.push("Please select a community before creating a course.")
    }
    if (formData.title.trim().length < 2) {
      errors.push("Course title must be at least 2 characters.")
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
        const titleErrors: Record<string, string> = {}
        for (const section of formData.sections) {
          for (const chapter of section.chapters || []) {
            if (!chapter.title?.trim()) {
              titleErrors[`chapter:${chapter.id}:title`] = "Lesson title is required."
            }
          }
        }
        const publishChapterValidationErrors = options?.publish ? validateChapterContent(formData.sections) : {}
        const nextChapterValidationErrors = { ...titleErrors, ...publishChapterValidationErrors }
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
        setCurrentStep(2)
      } else if (errors.some((error) => error.toLowerCase().includes("chapter") || error.toLowerCase().includes("lesson"))) {
        setCurrentStep(2)
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
      let chapterSequenceIndex = 0
      const sections = (formData.sections || []).map((s, idx) => {
        console.log(`   📂 Section ${idx + 1}: "${s.title}" with ${s.chapters.length} chapters`)

        return {
          titre: s.title || `Section ${idx + 1}`,
          description: s.description || "",
          ordre: s.order || (idx + 1),
          chapitres: (s.chapters || []).map((c, jdx) => {
            const normalizedChapterTitle = c.title?.trim() || `Chapitre ${jdx + 1}`
            const normalizedChapterContent = c.content?.trim() || (!options?.publish ? formData.description.trim() : "")
            const normalizedChapterVideoUrl = normalizeVideoUrl(c.videoUrl)
            const chapterPrice = c.price !== undefined && c.price !== "" ? Number(c.price) : prixNum
            const isPaidChapter = !c.isPreview && chapterPrice > 0
            console.log(`      📄 Chapter ${jdx + 1}: "${c.title}"`)
            console.log(`         🎬 Video URL: "${c.videoUrl || '(empty)'}"`)

            return {
              titre: normalizedChapterTitle,
              description: normalizedChapterContent,
              videoUrl: normalizedChapterVideoUrl || undefined,
              isPaid: isPaidChapter,
              prix: isPaidChapter ? chapterPrice : 0,
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
        isPublished: Boolean(options?.publish ?? formData.isPublished),
        category: formData.category || "General",
        niveau: mappedLevel,
        duree: formData.duration || undefined,
        learningObjectives: (formData.learningObjectives || []).filter(Boolean),
        requirements: (formData.requirements || []).filter(Boolean),
        sections,
      }

      console.log('📤 [COURSE SUBMIT] Final payload:', JSON.stringify(payload, null, 2))

      const res = await coursesApi.create(payload)
      const created = normalizeCourseResponse(res)
      toast({ title: 'Course created', description: payload.titre })
      draftStorage.clearDraft()
      const id = created?.mongoId || created?._id || created?.id
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

  const handleSaveDraft = () => {
    void handleSubmit({ publish: false })
  }

  const handlePublish = () => {
    if (!publishValidation.ok) {
      toast({
        title: "Publish checks need attention",
        description: publishValidation.publishBlockers[0] || Object.values(publishValidation.fieldErrors)[0],
        variant: "destructive",
      })
      if (publishValidation.publishBlockers.some((blocker) => blocker.toLowerCase().includes("lesson"))) {
        setCurrentStep(2)
      }
      return
    }
    void handleSubmit({ publish: true })
  }

  return (
    <CreatorCreateShell
      title="Create New Course"
      description="Build educational content for your community"
      backHref="/creator/courses"
      backLabel="Back to courses"
      communityName={selectedCommunity?.name}
      communityMeta={communityLoading ? "Loading community" : selectedCommunity?.slug}
      autosaveStatus={draftStorage.status}
      publishBlocked={!publishValidation.ok}
      previewAction={{ label: "Preview", onClick: () => setCurrentStep(4), disabled: isSubmitting }}
      mobileMode="limited"
      actions={[
        {
          label: "Save Draft",
          icon: "save",
          variant: "outline",
          onClick: handleSaveDraft,
          disabled: isSubmitting || !draftValidation.ok,
          loading: isSubmitting,
        },
        {
          label: "Publish",
          icon: "publish",
          onClick: handlePublish,
          disabled: isSubmitting,
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
        label="A locally saved course draft was found for this community."
        onRestore={restoreDraft}
        onDismiss={draftStorage.clearDraft}
      />
      <CourseCreationProgress currentStep={currentStep} setCurrentStep={setCurrentStep} />

      {currentStep === 1 && (
        <BasicInfoStep
          formData={formData}
          handleInputChange={handleInputChange}
          validationErrors={validationErrors}
        />
      )}

      {currentStep === 2 && (
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

      {currentStep === 3 && (
        <PricingDetailsStep
          formData={formData}
          handleInputChange={handleInputChange}
          handleArrayChange={handleArrayChange}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
          validationErrors={validationErrors}
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
        hideSubmitAction
      />
    </CreatorCreateShell>
  )
}
