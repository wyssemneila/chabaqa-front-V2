/**
 * Optimized Avatar Component
 * 
 * Uses Next.js Image component for automatic optimization
 * with fallback to UI Avatars API for missing images
 */

"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedAvatarProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
  fallbackName?: string
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  fallbackName
}: OptimizedAvatarProps) {
  const name = fallbackName || alt
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=random`
  
  const [imgSrc, setImgSrc] = useState(src || fallbackUrl)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      onError={() => setImgSrc(fallbackUrl)}
    />
  )
}
