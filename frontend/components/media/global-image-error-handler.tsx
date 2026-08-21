"use client"

import { useEffect } from "react"

const FALLBACKS = {
  logo: "/logo_chabaqa.png",
  avatar: "/placeholder-user.jpg",
  content: "/community-discussion-interface-with-posts-and-comm.jpg",
}

function chooseFallback(img: HTMLImageElement): string {
  const source = `${img.currentSrc || img.src || ""} ${img.alt || ""}`.toLowerCase()
  const explicitFallback = img.dataset.fallbackSrc

  if (explicitFallback) return explicitFallback
  if (/(avatar|profile|photo|user|creator|author)/.test(source)) return FALLBACKS.avatar
  if (/(logo|brandmark|chabaqa)/.test(source)) return FALLBACKS.logo
  return FALLBACKS.content
}

export function GlobalImageErrorHandler() {
  useEffect(() => {
    const onImageError = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLImageElement)) return
      if (target.dataset.fallbackApplied === "true") return

      const fallback = chooseFallback(target)
      if (!fallback || target.src.endsWith(fallback)) return

      target.dataset.fallbackApplied = "true"
      target.removeAttribute("srcset")
      target.removeAttribute("sizes")
      target.src = fallback
    }

    window.addEventListener("error", onImageError, true)
    return () => window.removeEventListener("error", onImageError, true)
  }, [])

  return null
}
