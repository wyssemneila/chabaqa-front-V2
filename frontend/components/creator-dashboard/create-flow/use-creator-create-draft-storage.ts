"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { CreatorContentType } from "@/lib/creator-content"

type AutosaveStatus = "idle" | "saving" | "saved" | "error"

interface UseCreatorCreateDraftStorageArgs<T> {
  contentType: CreatorContentType
  communityId?: string
  values: T
  enabled?: boolean
  debounceMs?: number
}

interface StoredDraft<T> {
  values: T
  savedAt: string
}

export function useCreatorCreateDraftStorage<T>({
  contentType,
  communityId = "unknown",
  values,
  enabled = true,
  debounceMs = 700,
}: UseCreatorCreateDraftStorageArgs<T>) {
  const storageKey = useMemo(
    () => `creator:create:${communityId || "unknown"}:${contentType}`,
    [communityId, contentType],
  )
  const [status, setStatus] = useState<AutosaveStatus>("idle")
  const [storedDraft, setStoredDraft] = useState<StoredDraft<T> | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const lastSerializedRef = useRef("")
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    hasHydratedRef.current = false
    setStoredDraft(null)
    setLastSavedAt(null)
    setIsDismissed(false)
    lastSerializedRef.current = ""

    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredDraft<T>
        if (parsed?.values) {
          setStoredDraft(parsed)
          setLastSavedAt(parsed.savedAt || null)
        }
      }
    } catch {
      setStatus("error")
    } finally {
      hasHydratedRef.current = true
    }
  }, [storageKey])

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !hasHydratedRef.current) return
    if (storedDraft && !isDismissed) return

    const serialized = JSON.stringify(values)
    if (serialized === lastSerializedRef.current) return
    lastSerializedRef.current = serialized

    const timer = window.setTimeout(() => {
      try {
        setStatus("saving")
        const savedAt = new Date().toISOString()
        window.localStorage.setItem(storageKey, JSON.stringify({ values, savedAt }))
        setLastSavedAt(savedAt)
        setStatus("saved")
      } catch {
        setStatus("error")
      }
    }, debounceMs)

    return () => window.clearTimeout(timer)
  }, [debounceMs, enabled, isDismissed, storageKey, storedDraft, values])

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey)
    }
    setStoredDraft(null)
    setIsDismissed(true)
    setLastSavedAt(null)
  }

  const dismissDraft = () => setIsDismissed(true)

  return {
    storageKey,
    status,
    lastSavedAt,
    hasStoredDraft: Boolean(storedDraft && !isDismissed),
    storedValues: storedDraft?.values || null,
    clearDraft,
    dismissDraft,
  }
}
