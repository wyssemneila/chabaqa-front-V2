"use client"

import { UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolveImageUrl } from "@/lib/resolve-image-url"
import { cn } from "@/lib/utils"

interface ExploreCreatorAvatarProps {
  src?: string | null
  name?: string
  className?: string
  imageClassName?: string
}

/** Facebook-style neutral silhouette for creators who have no usable photo. */
export function ExploreCreatorAvatar({
  src,
  name = "Creator",
  className,
  imageClassName,
}: ExploreCreatorAvatarProps) {
  const resolved = resolveImageUrl(src || "") || ""
  const hasRealPhoto = Boolean(resolved && !/\/(?:placeholder|placeholder-logo)(?:[.-]|$)/i.test(resolved))

  return (
    <Avatar className={cn("h-full w-full bg-[#e4e6eb]", className)}>
      {hasRealPhoto ? (
        <AvatarImage
          src={resolved}
          alt={name}
          className={cn("object-cover", imageClassName)}
        />
      ) : null}
      <AvatarFallback
        aria-label={`${name} has no profile picture`}
        className="bg-[#e4e6eb] text-[#8a8d91]"
      >
        <UserRound className="h-[72%] w-[72%] fill-current stroke-[1.5]" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}
