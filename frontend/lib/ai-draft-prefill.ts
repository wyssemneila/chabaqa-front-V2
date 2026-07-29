"use client"

import * as React from "react"
import type { AiCreateWithMeResponse } from "@/lib/api/ai.api"
import {
  readAiCreateDraft,
  clearAiCreateDraft,
} from "@/lib/ai-create-draft-store"

/**
 * Reads a pending "Create with AI" draft (stored in sessionStorage) when
 * `aiDraft=1` is present in the URL. Returns the draft and a cleanup fn so the
 * consumer form can map it into its own state shape, then clears the draft so
 * it isn't reapplied on refresh.
 *
 * Usage:
 *   const aiDraft = useAiDraftPrefill("course")
 *   useEffect(() => {
 *     if (aiDraft) setFormData(mapDraftToForm(aiDraft.response.draft))
 *   }, [aiDraft])
 */
export function useAiDraftPrefill(
  expectedType: AiCreateWithMeResponse["type"],
): { response: AiCreateWithMeResponse; meta: { createdAt: string } } | null {
  const [draft, setDraft] = React.useState<
    | { response: AiCreateWithMeResponse; meta: { createdAt: string } }
    | null
  >(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("aiDraft") !== "1") return
    const stored = readAiCreateDraft()
    if (!stored) return
    if (stored.response.type !== expectedType) return
    setDraft(stored)
    clearAiCreateDraft()
  }, [expectedType])

  return draft
}

/**
 * Maps an AI-generated course draft (the shape produced by AiCreateService:
 * titre, description, prix, devise, category, niveau, duree,
 * learningObjectives, requirements, sections[{titre,description,ordre,
 * chapitres[{titre,description,isPaid,prix,ordre,duree,notes}]}]) into a flat
 * form state. The creator can still edit everything before publishing.
 */
export function mapAiDraftToCourseForm(draft: Record<string, any>) {
  const sections = Array.isArray(draft.sections)
    ? draft.sections.map((section: any, sIdx: number) => ({
        id: `ai-section-${sIdx}-${Date.now()}`,
        title: String(section.titre || section.title || `Module ${sIdx + 1}`),
        description: String(section.description || ""),
        order: Number(section.ordre ?? sIdx + 1),
        chapters: Array.isArray(section.chapitres)
          ? section.chapitres.map((ch: any, cIdx: number) => ({
              id: `ai-chapter-${sIdx}-${cIdx}-${Date.now()}`,
              title: String(ch.titre || ch.title || `Lesson ${sIdx + 1}.${cIdx + 1}`),
              content: String(ch.description || ch.contenu || ""),
              videoUrl: "",
              duration: 0,
              order: Number(ch.ordre ?? cIdx + 1),
              isPreview: !Boolean(ch.isPaid),
              price: ch.prix === undefined || ch.prix === null ? "" : String(ch.prix),
              notes: String(ch.notes || ""),
            }))
          : [],
      }))
    : []

  return {
    title: String(draft.titre || draft.title || ""),
    description: String(draft.description || ""),
    thumbnail: "",
    price: String(draft.prix ?? draft.price ?? 0),
    currency: String(draft.devise || draft.currency || "TND"),
    category: String(draft.category || "General"),
    level: String(draft.niveau || draft.level || "Beginner"),
    duration: String(draft.duree || draft.duration || ""),
    isPublished: false,
    tags: [] as string[],
    learningObjectives: Array.isArray(draft.learningObjectives)
      ? draft.learningObjectives
      : [""],
    requirements: Array.isArray(draft.requirements) ? draft.requirements : [""],
    sections,
  }
}

/**
 * Generic flat-string mapping for the simpler content types
 * (challenge/event/product/session). Returns only top-level fields the forms
 * typically read; unknown fields are ignored.
 */
export function mapAiDraftToFlatForm(draft: Record<string, any>) {
  return {
    title: String(draft.titre || draft.title || ""),
    description: String(draft.description || ""),
    price: String(draft.prix ?? draft.price ?? draft.participationFee ?? ""),
    currency: String(draft.devise || draft.currency || "TND"),
    category: String(draft.category || ""),
    difficulty: String(draft.difficulty || draft.niveau || "beginner"),
    duration: String(draft.duree || draft.duration || ""),
  }
}
