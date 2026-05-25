"use client"

import React, { useEffect, useMemo, useState } from "react"
import { SafeImage } from "@/components/media/safe-image"
import { type ImageProps } from "next/image"
import { resolveImageUrl } from "@/lib/resolve-image-url"

type ExploreSafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null
  fallbackSrc: string
}

export function ExploreSafeImage({ src, fallbackSrc, alt, ...props }: ExploreSafeImageProps) {
  const resolvedFallback = useMemo(
    () => resolveImageUrl(fallbackSrc) || fallbackSrc,
    [fallbackSrc],
  )
  const resolvedSource = useMemo(
    () => resolveImageUrl(typeof src === "string" ? src : "") || "",
    [src],
  )
  const [safeSrc, setSafeSrc] = useState(resolvedFallback)

  useEffect(() => {
    const isGenericPlaceholder = /\/(?:placeholder|placeholder-logo)(?:[.-]|$)/i.test(resolvedSource)
    if (!resolvedSource || resolvedSource === resolvedFallback || isGenericPlaceholder) {
      setSafeSrc(resolvedFallback)
      return
    }

    let cancelled = false
    setSafeSrc(resolvedFallback)

    const probe = new window.Image()
    probe.onload = () => {
      if (!cancelled) setSafeSrc(resolvedSource)
    }
    probe.onerror = () => {
      if (!cancelled) setSafeSrc(resolvedFallback)
    }
    probe.src = resolvedSource

    return () => {
      cancelled = true
    }
  }, [resolvedFallback, resolvedSource])

  return (
    <SafeImage
      {...props}
      src={safeSrc}
      fallbackSrc={resolvedFallback}
      alt={alt}
    />
  )
}
