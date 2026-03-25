"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { coursesApi } from "@/lib/api/courses.api"
import { Course } from "@/lib/models"
import { toast } from "sonner"
import { CourseHeader } from "./course-header"
import { CourseTabs } from "./course-tabs"
import { DetailsTab } from "./tabs/details-tab"
import { ContentTab } from "./tabs/content-tab"
import { PricingTab } from "./tabs/pricing-tab"
import { ResourcesTab } from "./tabs/resources-tab"
import { ReviewsTab } from "./tabs/reviews-tab"
import { AnalyticsTab } from "./tabs/analytics-tab"
import { SettingsTab } from "./tabs/settings-tab"
import { getCreatorVideoUrlError, normalizeVideoUrl } from "@/lib/utils/video-source"

export function CourseManager({ courseId }: { courseId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("details")
  const [highlightChapterId, setHighlightChapterId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCourse = async () => {
    try {
      const rawResponse = await coursesApi.getCoursById(courseId)
      // Handle potentially wrapped response or direct response
      const response = rawResponse.data || rawResponse

      console.log("Fetched course data:", response)

      const transformedCourse: Course = {
        mongoId: response.mongoId || response._id || response.id,
        id: response.id || response._id,
        titre: response.titre || response.title || "",
        title: response.titre || response.title || "",
        description: response.description || "",
        thumbnail: response.thumbnail || "",
        prix: response.prix ?? response.price ?? 0,
        price: response.prix ?? response.price ?? 0,
        devise: response.devise || response.currency || "TND",
        currency: response.devise || response.currency || "TND",
        category: response.category || "",
        niveau: response.niveau || response.level || "",
        level: response.niveau || response.level || "",
        duree: response.duree || response.duration || "",
        duration: response.duree || response.duration || "",
        isPublished: Boolean(response.isPublished),
        learningObjectives: response.learningObjectives || [],
        requirements: response.requirements || [],
        notes: response.notes || "",
        sections: (response.sections || []).map((section: any) => ({
          id: section.id || section._id,
          title: section.titre || section.title || "",
          description: section.description || "",
          courseId: section.courseId,
          order: section.ordre ?? section.order ?? 0,
          chapters: (section.chapitres || section.chapters || []).map((chapitre: any) => ({
            id: chapitre.id || chapitre._id,
            title: chapitre.titre || chapitre.title || "",
            content: chapitre.description || chapitre.content || "",
            videoUrl: chapitre.videoUrl || chapitre.video_url || "",
            duration: Number(chapitre.duree ?? chapitre.duration ?? 0) || 0,
            sectionId: chapitre.sectionId || section.id,
            order: chapitre.ordre ?? chapitre.order ?? 0,
            isPreview: !Boolean(chapitre.isPaidChapter ?? chapitre.isPaid ?? true),
            price: chapitre.prix ?? chapitre.price ?? 0,
            notes: chapitre.notes || "",
            resources: Array.isArray(chapitre.ressources || chapitre.resources) 
              ? (chapitre.ressources || chapitre.resources).map((r: any) => ({
                  id: r.id || r._id || '',
                  title: r.titre || r.title || '',
                  titre: r.titre || r.title || '',
                  type: r.type || 'link',
                  url: r.url || '',
                  description: r.description || '',
                  order: r.ordre || r.order || 0,
                }))
              : [],
            createdAt: chapitre.createdAt ? new Date(chapitre.createdAt) : new Date(),
          })),
          createdAt: section.createdAt ? new Date(section.createdAt) : new Date(),
        })),
        enrollments: [],
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        communityId: response.communityId,
        creatorId: response.creatorId,
        creator: response.creator,
      }

      setCourse(transformedCourse)
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error("Failed to load course details")
      // Only redirect on actual error, not just empty data
      if ((error as any)?.response?.status === 404) {
         router.push('/creator/courses')
      }
    }
  }

  useEffect(() => {
    const run = async () => {
      try {
        await fetchCourse()
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [courseId, router])

  useEffect(() => {
    const tab = (searchParams.get("tab") || "").trim()
    const chapterId = (searchParams.get("chapterId") || "").trim()

    if (chapterId && chapterId !== highlightChapterId) {
      setHighlightChapterId(chapterId)
    }

    const allowedTabs = new Set([
      "details",
      "content",
      "pricing",
      "resources",
      "reviews",
      "analytics",
      "settings",
    ])

    if (tab && allowedTabs.has(tab) && tab !== activeTab) {
      setActiveTab(tab)
      return
    }

    if (!tab && chapterId && activeTab !== "content") {
      setActiveTab("content")
    }
  }, [activeTab, highlightChapterId, searchParams])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longDescription: "",
    thumbnail: "",
    price: "",
    currency: "TND",
    category: "",
    level: "",
    duration: "",
    isPublished: false,
    learningObjectives: [""],
    requirements: [""],
    notes: "",
  })

  // Update formData when course loads
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || course.titre || "",
        description: course.description || "",
        longDescription: course.description || "",
        thumbnail: course.thumbnail || "",
        price: String(course.price ?? course.prix ?? ""),
        currency: course.currency || course.devise || "TND",
        category: course.category || "",
        level: course.level || course.niveau || "",
        duration: course.duration || course.duree || "",
        isPublished: course.isPublished || false,
        learningObjectives: course.learningObjectives || [""],
        requirements: course.requirements || [""],
        notes: course.notes || "",
      })
    }
  }, [course])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Keep local course preview in sync for fields that affect it (e.g. thumbnail)
    if (field === "thumbnail") {
      setCourse((prev) => (prev ? { ...prev, thumbnail: value } : prev))
    }
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
            i === index ? value : item)
        : prev[field as keyof typeof prev],
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).filter((_: string, i: number) => i !== index)
        : prev[field as keyof typeof prev],
    }))
  }

  const handleSave = async () => {
    if (!course) return
    const targetId = course.mongoId || course.id
    setIsLoading(true)
    try {
      await coursesApi.update(targetId, {
        titre: formData.title,
        description: formData.description,
        prix: formData.price === "" ? 0 : Number(formData.price),
        devise: formData.currency,
        category: formData.category,
        niveau: formData.level,
        duree: formData.duration,
        learningObjectives: (formData.learningObjectives || []).filter(Boolean),
        requirements: (formData.requirements || []).filter(Boolean),
        notes: formData.notes,
        isPublished: Boolean(formData.isPublished),
        thumbnail: formData.thumbnail || course.thumbnail,
      })

      await fetchCourse()
      toast.success("Course updated successfully")
    } catch (error) {
      console.error('Failed to update course:', error)
      toast.error("Failed to update course")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSection = async (payload: { titre: string; description?: string }) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    const nextOrder = (course.sections?.length || 0) + 1
    
    try {
      await coursesApi.createSection(targetId, {
        title: payload.titre,
        description: payload.description || "",
        order: nextOrder,
      })
      await fetchCourse()
      toast.success("Section created successfully")
    } catch (error) {
      console.error('Failed to create section:', error)
      toast.error("Failed to create section")
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    try {
      await coursesApi.deleteSection(targetId, sectionId)
      await fetchCourse()
      toast.success("Section deleted successfully")
    } catch (error) {
      console.error('Failed to delete section:', error)
      toast.error("Failed to delete section")
    }
  }

  const handleDeleteChapter = async (sectionId: string, chapterId: string) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    try {
      await coursesApi.deleteChapter(targetId, sectionId, chapterId)
      await fetchCourse()
      toast.success("Chapter deleted successfully")
    } catch (error) {
      console.error('Failed to delete chapter:', error)
      toast.error("Failed to delete chapter")
    }
  }

  const handleUpdateSection = async (sectionId: string, payload: { title: string; description: string }) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    try {
      await coursesApi.updateSection(targetId, sectionId, {
        title: payload.title,
        description: payload.description,
      })
      await fetchCourse()
      toast.success("Section updated successfully")
    } catch (error) {
      console.error('Failed to update section:', error)
      toast.error("Failed to update section")
    }
  }

  const handleUpdateChapter = async (
    sectionId: string,
    chapterId: string,
    payload: {
      title: string
      content: string
      videoUrl: string
      duration: string
      isPreview: boolean
      price: string
      notes: string
    },
  ) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    const normalizedVideoUrl = normalizeVideoUrl(payload.videoUrl)
    const chapterTitle = payload.title?.trim() || ""
    const chapterContent = payload.content?.trim() || ""
    const videoUrlError = getCreatorVideoUrlError(normalizedVideoUrl)

    if (!chapterTitle) {
      toast.error("Chapter title is required")
      return
    }

    if (!chapterContent && !normalizedVideoUrl) {
      toast.error("Add chapter content or a video URL")
      return
    }

    if (videoUrlError) {
      toast.error(videoUrlError)
      return
    }

    try {
      await coursesApi.updateChapter(targetId, sectionId, chapterId, {
        titre: chapterTitle,
        description: chapterContent,
        videoUrl: normalizedVideoUrl || undefined,
        duree: payload.duration ? toHHMM(Number(payload.duration)) : undefined,
        isPaid: !Boolean(payload.isPreview),
        prix: payload.isPreview ? 0 : payload.price === "" ? 0 : Number(payload.price),
        notes: payload.notes || undefined,
      })
      await fetchCourse()
      toast.success("Chapter updated successfully")
    } catch (error) {
      console.error('Failed to update chapter:', error)
      toast.error("Failed to update chapter")
    }
  }

  const toHHMM = (minutesValue: number): string => {
    const safe = Number.isFinite(minutesValue) ? minutesValue : 0
    const hours = Math.floor(safe / 60)
    const minutes = safe % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  }

  const handleAddChapter = async (sectionId: string, payload: any) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    const section = course.sections?.find((s) => s.id === sectionId)
    const nextOrder = (section?.chapters?.length || 0) + 1
    const chapterTitle = String(payload.title || "").trim()
    const chapterContent = String(payload.content || "").trim()
    const normalizedVideoUrl = normalizeVideoUrl(payload.videoUrl)
    const videoUrlError = getCreatorVideoUrlError(normalizedVideoUrl)

    if (!chapterTitle) {
      toast.error("Chapter title is required")
      return
    }

    if (!chapterContent && !normalizedVideoUrl) {
      toast.error("Add chapter content or a video URL")
      return
    }

    if (videoUrlError) {
      toast.error(videoUrlError)
      return
    }
    
    try {
      await coursesApi.createChapter(targetId, sectionId, {
        title: chapterTitle,
        content: chapterContent,
        videoUrl: normalizedVideoUrl || undefined,
        isPaid: !Boolean(payload.isPreview),
        price: payload.isPreview ? 0 : Number(payload.price || 0),
        order: nextOrder,
        duration: payload.duration ? Number(payload.duration) : 0,
        notes: payload.notes || undefined,
      })
      await fetchCourse()
      toast.success("Chapter created successfully")
    } catch (error) {
      console.error('Failed to create chapter:', error)
      toast.error("Failed to create chapter")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!course) {
    return <div>Course not found</div>
  }

  const totalChapters = course.sections?.reduce((acc, s) => acc + s.chapters.length, 0) || 0
  const previewChapters = course.sections?.reduce((acc, s) => acc + s.chapters.filter((c) => c.isPreview).length, 0) || 0
  const totalRevenue = (course.enrollments?.length || 0) * (course.price || 0)

  return (
    <div className="space-y-8 p-5">
      <CourseHeader 
        course={course} 
        onSave={handleSave} 
        isLoading={isLoading} 
      />

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "details" && (
          <DetailsTab
            formData={formData}
            course={course}
            onInputChange={handleInputChange}
            onArrayChange={handleArrayChange}
            onAddArrayItem={addArrayItem}
            onRemoveArrayItem={removeArrayItem}
            totalChapters={totalChapters}
            previewChapters={previewChapters}
            totalRevenue={totalRevenue}
          />
        )}

        {activeTab === "content" && (
          <ContentTab
            course={course}
            courseId={String(course.mongoId || course.id)}
            highlightChapterId={highlightChapterId}
            onRefreshCourse={fetchCourse}
            onAddSection={handleAddSection}
            onAddChapter={handleAddChapter}
            onDeleteSection={handleDeleteSection}
            onDeleteChapter={handleDeleteChapter}
            onUpdateSection={handleUpdateSection}
            onUpdateChapter={handleUpdateChapter}
          />
        )}

        {activeTab === "pricing" && (
          <PricingTab 
            formData={formData} 
            course={course} 
            onInputChange={handleInputChange} 
          />
        )}

        {activeTab === "resources" && (
          <ResourcesTab course={course} onRefresh={fetchCourse} />
        )}

        {activeTab === "reviews" && (
          <ReviewsTab course={course} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab 
            course={course} 
            totalRevenue={totalRevenue} 
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab courseId={String(course.mongoId || course.id)} />
        )}
      </CourseTabs>
    </div>
  )
}
