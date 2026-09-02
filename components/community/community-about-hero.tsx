"use client"

import { useState } from "react"
import { Play, ImageIcon, Lock, Users, Star, Check } from "lucide-react"

interface MediaItem {
  id: string
  type: "image" | "video"
  /** image src or, for video, an uploaded/sample video file src */
  src: string
  /** optional thumbnail for a video tile */
  thumb?: string
}

interface Props {
  name: string
  tagline?: string
  description?: string
  banner?: string | null
  /** optional intro video (uploaded file src or sample) */
  videoSrc?: string
  avatarInitials: string
  avatarColor: string
  creatorName: string
  membersCount: number
  rating: number
  ratingCount: number
  access?: string // e.g. "Public"
  price?: string // e.g. "Free" or "19 TND/month"
}

/**
 * Skool-style community hero (ported from the creator branding hero):
 * centered title + tagline, a 16:9 media gallery (banner + intro video with a
 * thumbnail strip), an overlapping avatar, "By {creator}", info chips, and the
 * description underneath.
 */
export default function CommunityAboutHero({
  name, tagline, description, banner, videoSrc,
  avatarInitials, avatarColor, creatorName, membersCount, rating, ratingCount,
  access = "Public", price = "Free",
}: Props) {
  const grad = `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}cc 100%)`
  const bannerSrc = banner || "/images/community/banner.png"

  const media: MediaItem[] = [
    { id: "m-banner", type: "image", src: bannerSrc },
    ...(videoSrc ? [{ id: "m-video", type: "video" as const, src: videoSrc, thumb: bannerSrc }] : []),
  ]
  const [active, setActive] = useState(0)
  const current = media[Math.min(active, media.length - 1)]

  const chips = [
    { icon: <Lock className="w-3 h-3" />, text: access },
    { icon: <Users className="w-3 h-3" />, text: `${membersCount} members` },
    { icon: <Star className="w-3 h-3 fill-amber-400 text-amber-400" />, text: `${(rating || 0).toFixed(1)} (${ratingCount || 0})` },
    ...(price ? [{ icon: <span className="text-[11px] font-bold leading-none">$</span>, text: price }] : []),
  ]

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "#ececf2" }}>
      {/* Title + tagline */}
      <div className="px-6 pt-7 pb-3 text-center">
        <h1 className="font-extrabold tracking-tight mx-auto" style={{ color: "#1a1730", fontSize: 26, lineHeight: 1.12, letterSpacing: "-0.02em", maxWidth: 560 }}>
          {name}
        </h1>
        {tagline && <p className="mt-2 mx-auto leading-relaxed" style={{ color: "#57536b", fontSize: 14, maxWidth: 460 }}>{tagline}</p>}
      </div>

      {/* Media gallery (16:9) + thumbnail strip */}
      <div className="mx-auto px-5" style={{ maxWidth: 620 }}>
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#000" }}>
          {current?.type === "video" ? (
            <video src={current.src} controls playsInline preload="metadata" poster={current.thumb} className="w-full h-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current?.src} alt="" className="w-full h-full object-cover" />
          )}
          {media.length > 1 && (
            <span className="absolute text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ bottom: 8, right: 8, background: "rgba(0,0,0,.5)", color: "#fff" }}>
              {Math.min(active + 1, media.length)}/{media.length}
            </span>
          )}
        </div>
        {media.length > 1 && (
          <div className="flex gap-1.5 mt-1.5">
            {media.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActive(i)}
                className="flex-1 relative overflow-hidden rounded-md transition-all"
                style={{
                  aspectRatio: "16/9",
                  background: (m.thumb || (m.type === "image" ? m.src : "")) ? `#000 center/cover no-repeat url(${m.thumb || m.src})` : grad,
                  opacity: i === active ? 1 : 0.5,
                  outline: i === active ? `2px solid ${avatarColor}` : "none",
                  outlineOffset: 1,
                }}
              >
                {m.type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                  </span>
                )}
                {m.type === "image" && !m.src && (
                  <span className="absolute inset-0 flex items-center justify-center"><ImageIcon className="w-3 h-3 text-white" /></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlapping avatar + creator + chips */}
      <div className="flex flex-col items-center" style={{ marginTop: -22 }}>
        <div className="relative">
          <div className="rounded-2xl flex items-center justify-center text-lg font-extrabold text-white" style={{ background: grad, width: 56, height: 56, border: "4px solid #fff", boxShadow: "0 4px 16px rgba(26,23,48,.18)" }}>
            {avatarInitials || name.charAt(0)}
          </div>
          <span className="absolute flex items-center justify-center rounded-full" style={{ width: 18, height: 18, bottom: -2, right: -2, background: "#22b8f0", border: "2px solid #fff" }}>
            <Check className="w-2 h-2 text-white" strokeWidth={4} />
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: grad }}>
            {creatorName.charAt(0)}
          </span>
          <span className="text-[12.5px] font-medium" style={{ color: "#57536b" }}>By {creatorName}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center mt-2.5 px-5">
          {chips.map((chip, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: "#fff", color: "#57536b", border: "1px solid #ececf2" }}>
              <span style={{ color: "#9590b8" }}>{chip.icon}</span>{chip.text}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="px-6 pt-5 pb-6 mt-4 border-t" style={{ borderColor: "#f2f0fa" }}>
          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "#46426a" }}>{description}</p>
        </div>
      )}
    </div>
  )
}
