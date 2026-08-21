"use client"

import React, { useMemo } from "react"
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
  const isGenericPlaceholder = /\/(?:placeholder|placeholder-logo)(?:[.-]|$)/i.test(resolvedSource) || !resolvedSource
  const initialSource = resolvedSource && !isGenericPlaceholder ? resolvedSource : resolvedFallback

  return (
    <SafeImage
      {...props}
      src={initialSource}
      fallbackSrc={resolvedFallback}
      alt={alt}
    />
  )
}
