"use client"

import type { AiCreateWithMeResponse } from "@/lib/api/ai.api"

/**
 * Stores the latest "Create with AI" draft in sessionStorage so the matching
 * creator form can pre-fill from it via ?aiDraft=1. Mirrors the existing
 * localStorage draft pattern in useCreatorCreateDraftStorage, but uses
 * sessionStorage so the draft is session-scoped and doesn't pile up across
 * communities/tabs.
 */
export const AI_CREATE_DRAFT_KEY = "chabaqa:ai-create-draft"

export function saveAiCreateDraft(
  response: AiCreateWithMeResponse,
  meta: { createdAt: string },
) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(
      AI_CREATE_DRAFT_KEY,
      JSON.stringify({ response, meta }),
    )
  } catch {
    // ignore quota errors
  }
}

export function readAiCreateDraft():
  | { response: AiCreateWithMeResponse; meta: { createdAt: string } }
  | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(AI_CREATE_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearAiCreateDraft() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(AI_CREATE_DRAFT_KEY)
  } catch {
    // ignore
  }
}

/**
 * Maps a Create-with-AI draft type to the creator form route where it can be
 * reviewed and published.
 */
export const AI_DRAFT_FORM_ROUTE: Record<AiCreateWithMeResponse["type"], string> = {
  course: "/creator/courses/new",
  challenge: "/creator/challenges/new",
  event: "/creator/events/new",
  product: "/creator/products/new",
  session: "/creator/sessions/new",
}
