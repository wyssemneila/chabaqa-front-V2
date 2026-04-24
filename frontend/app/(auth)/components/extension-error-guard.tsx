"use client"

import { useEffect } from "react"

function isKnownExtensionNoise(message: string, filename: string): boolean {
  const normalizedMessage = String(message || "")
  const normalizedFile = String(filename || "")

  if (normalizedFile.startsWith("chrome-extension://")) return true
  if (normalizedFile.includes("completion_list.html")) return true

  if (normalizedMessage.includes("Could not establish connection. Receiving end does not exist.")) {
    return true
  }

  if (
    normalizedFile.endsWith("share-modal.js") &&
    normalizedMessage.includes("Cannot read properties of null") &&
    normalizedMessage.includes("addEventListener")
  ) {
    return true
  }

  return false
}

function isChunkLoadFailure(message: string, filename: string): boolean {
  const normalizedMessage = String(message || "")
  const normalizedFile = String(filename || "")

  if (normalizedMessage.includes("ChunkLoadError")) return true
  if (normalizedMessage.includes("Loading chunk") && normalizedMessage.includes("failed")) return true
  if (normalizedMessage.includes("Failed to fetch dynamically imported module")) return true
  if (normalizedFile.includes("/_next/static/chunks/")) return true

  return false
}

function recoverFromChunkLoadFailure(): void {
  if (typeof window === "undefined") return

  // Avoid infinite reload loops; one hard reload is enough to pick fresh assets.
  const key = "chunk-load-recovered"
  if (window.sessionStorage.getItem(key) === "1") return

  window.sessionStorage.setItem(key, "1")
  window.location.reload()
}

export function ExtensionErrorGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isKnownExtensionNoise(event.message || "", event.filename || "")) {
        event.preventDefault()
        return
      }

      if (isChunkLoadFailure(event.message || "", event.filename || "")) {
        event.preventDefault()
        recoverFromChunkLoadFailure()
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message =
        typeof reason === "string"
          ? reason
          : String(reason?.message || reason || "")

      if (isKnownExtensionNoise(message, "")) {
        event.preventDefault()
        return
      }

      if (isChunkLoadFailure(message, "")) {
        event.preventDefault()
        recoverFromChunkLoadFailure()
      }
    }

    window.addEventListener("error", onError, true)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onError, true)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
