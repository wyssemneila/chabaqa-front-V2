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

export function ExtensionErrorGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isKnownExtensionNoise(event.message || "", event.filename || "")) {
        event.preventDefault()
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

