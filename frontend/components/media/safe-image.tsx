"use client"

import { useEffect, useMemo, useState } from "react"
import Image, { type ImageProps } from "next/image"
import { resolveImageUrl } from "@/lib/resolve-image-url"

type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null
  fallbackSrc?: string
}

export function SafeImage({
  src,
  fallbackSrc = "/placeholder.jpg",
  alt,
  ...props
}: SafeImageProps) {
  const resolvedFallback = useMemo(
    () => resolveImageUrl(fallbackSrc) || fallbackSrc,
    [fallbackSrc],
  )
  const resolvedInitial = useMemo(() => {
    const value = typeof src === "string" ? src.trim() : ""
    return resolveImageUrl(value) || resolvedFallback
  }, [resolvedFallback, src])
  const [currentSrc, setCurrentSrc] = useState(resolvedInitial)

  useEffect(() => {
    setCurrentSrc(resolvedInitial)
  }, [resolvedInitial])

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== resolvedFallback) {
          setCurrentSrc(resolvedFallback)
        }
      }}
    />
  )
}
