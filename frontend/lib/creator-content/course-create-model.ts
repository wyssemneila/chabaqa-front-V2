import type { CreatorChecklistItem, CreatorCommunityRef, CreatorValidationResult } from "./types"
import { checklistItem, DEFAULT_CURRENCY, getCommunitySlug, hasText, toNumber, trim } from "./utils"
import { validationResult } from "./types"

export interface CourseChapterDraft {
  id?: string
  title: string
  content?: string
  videoUrl?: string
  duration?: number | string
  isPreview?: boolean
  price?: number | string
  notes?: string
}

export interface CourseSectionDraft {
  id?: string
  title: string
  description?: string
  chapters: CourseChapterDraft[]
}

export interface CourseCreateValues {
  title: string
  description: string
  thumbnail?: string
  price: number | string
  currency: "USD" | "EUR" | "TND"
  category: string
  level?: "Beginner" | "Intermediate" | "Advanced" | "All Levels" | ""
  duration?: string
  learningObjectives: string[]
  requirements: string[]
  sections: CourseSectionDraft[]
  communitySlug: string
  isPublished: boolean
}

export interface CourseCreatePayload {
  titre: string
  description: string
  thumbnail?: string
  prix: number
  isPaid: boolean
  devise: string
  communitySlug: string
  isPublished: boolean
  category?: string
  niveau?: string
  duree?: string
  learningObjectives: string[]
  requirements: string[]
  sections: Array<{
    titre: string
    description: string
    ordre: number
    chapitres: Array<{
      titre: string
      description?: string
      videoUrl?: string
      isPaid: boolean
      prix: number
      ordre: number
      duree?: string
      notes?: string
    }>
  }>
}

export const getInitialCourseValues = (community?: CreatorCommunityRef | null): CourseCreateValues => ({
  title: "",
  description: "",
  thumbnail: "",
  price: 0,
  currency: DEFAULT_CURRENCY,
  category: "General",
  level: "Beginner",
  duration: "",
  learningObjectives: [],
  requirements: [],
  sections: [
    {
      title: "Start here",
      description: "",
      chapters: [{ title: "Introduction", content: "", videoUrl: "", isPreview: true, price: 0 }],
    },
  ],
  communitySlug: getCommunitySlug(community),
  isPublished: false,
})

const firstChapter = (values: CourseCreateValues): CourseChapterDraft | undefined =>
  values.sections.flatMap((section) => section.chapters || [])[0]

export const validateCourseDraft = (values: CourseCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  if (!hasText(values.title, 2)) fieldErrors.title = "Course title must be at least 2 characters."
  if (!hasText(values.description, 1)) fieldErrors.description = "Course description is required."
  if (!hasText(values.communitySlug)) fieldErrors.communitySlug = "Select a community before creating a course."
  if (!hasText(firstChapter(values)?.title, 2)) fieldErrors.firstLesson = "Add a title for the first lesson."
  return validationResult(fieldErrors)
}

export const validateCoursePublish = (values: CourseCreateValues): CreatorValidationResult => {
  const draft = validateCourseDraft(values)
  const publishBlockers = [...draft.publishBlockers]
  const chapter = firstChapter(values)
  const hasLessonBody = hasText(chapter?.content) || hasText(chapter?.videoUrl)
  if (!hasLessonBody) publishBlockers.push("Add lesson content or a video before publishing.")
  if (!hasText(values.category)) publishBlockers.push("Choose a course category before publishing.")
  return validationResult(draft.fieldErrors, draft.globalErrors, publishBlockers)
}

const levelToBackend = (level?: CourseCreateValues["level"]): string | undefined => {
  if (level === "Beginner") return "débutant"
  if (level === "Intermediate") return "intermédiaire"
  if (level === "Advanced") return "avancé"
  return undefined
}

export const buildCourseCreatePayload = (values: CourseCreateValues): CourseCreatePayload => {
  const price = toNumber(values.price, 0)
  let chapterSequenceIndex = 0
  const sections = values.sections.length ? values.sections : getInitialCourseValues({ slug: values.communitySlug }).sections

  return {
    titre: trim(values.title),
    description: trim(values.description),
    thumbnail: trim(values.thumbnail) || undefined,
    prix: price,
    isPaid: price > 0,
    devise: values.currency || DEFAULT_CURRENCY,
    communitySlug: trim(values.communitySlug),
    isPublished: Boolean(values.isPublished),
    category: trim(values.category) || "General",
    niveau: levelToBackend(values.level),
    duree: trim(values.duration) || undefined,
    learningObjectives: values.learningObjectives.map(trim).filter(Boolean),
    requirements: values.requirements.map(trim).filter(Boolean),
    sections: sections.map((section, sectionIndex) => ({
      titre: trim(section.title) || `Section ${sectionIndex + 1}`,
      description: trim(section.description),
      ordre: sectionIndex + 1,
      chapitres: (section.chapters.length ? section.chapters : [{ title: "Introduction" }]).map((chapter, chapterIndex) => {
        const videoUrl = trim(chapter.videoUrl)
        const description = trim(chapter.content) || trim(values.description)
        const chapterIsPreview = chapterSequenceIndex === 0 && Boolean(chapter.isPreview)
        chapterSequenceIndex += 1
        const chapterPrice = chapterIsPreview ? 0 : toNumber(chapter.price, price)
        return {
          titre: trim(chapter.title) || `Lesson ${chapterIndex + 1}`,
          description: videoUrl && !description ? undefined : description,
          videoUrl: videoUrl || undefined,
          isPaid: !chapterIsPreview,
          prix: chapterPrice,
          ordre: chapterIndex + 1,
          duree: chapter.duration ? String(chapter.duration) : undefined,
          notes: trim(chapter.notes) || undefined,
        }
      }),
    })),
  }
}

export const getCoursePublishChecklist = (values: CourseCreateValues): CreatorChecklistItem[] => {
  const chapter = firstChapter(values)
  return [
    checklistItem("title", "Course title", hasText(values.title, 2), "Add a course title."),
    checklistItem("description", "Course description", hasText(values.description), "Add a course description."),
    checklistItem("lesson", "First lesson", hasText(chapter?.content) || hasText(chapter?.videoUrl), "Add lesson content or video."),
    checklistItem("community", "Community", hasText(values.communitySlug), "Select a community."),
  ]
}

