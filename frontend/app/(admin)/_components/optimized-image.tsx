/**
 * Optimized Image Component
 * 
 * Wrapper around Next.js Image component with common defaults
 * and error handling for admin dashboard
 */

"use client"

import { useState } from "react"
import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string | null | undefined
  alt: string
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setImgSrc(fallbackSrc)}
      {...props}
    />
  )
}

/**
 * Optimized Card Image Component
 * 
 * Responsive image for card components with aspect ratio
 */
interface OptimizedCardImageProps {
  src: string | null | undefined
  alt: string
  aspectRatio?: 'video' | 'square' | 'portrait'
  className?: string
  fallbackSrc?: string
}

export function OptimizedCardImage({
  src,
  alt,
  aspectRatio = 'video',
  className,
  fallbackSrc = '/placeholder.svg'
}: OptimizedCardImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]'
  }

  return (
    <div className={cn("relative w-full overflow-hidden", aspectClasses[aspectRatio], className)}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={() => setImgSrc(fallbackSrc)}
      />
    </div>
  )
}

/**
 * Optimized Logo Component
 * 
 * Fixed size logo with fallback
 */
interface OptimizedLogoProps {
  src: string | null | undefined
  alt: string
  size?: number
  className?: string
  fallbackSrc?: string
}

export function OptimizedLogo({
  src,
  alt,
  size = 60,
  className,
  fallbackSrc = '/placeholder-logo.png'
}: OptimizedLogoProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-lg object-contain", className)}
      onError={() => setImgSrc(fallbackSrc)}
    />
  )
}
