import type React from "react"
import type { Metadata } from "next"
import {
  absoluteUrl,
  generateAlternateLanguages,
  generateOGMetadata,
  generateRobotsMetadata,
  generateTwitterMetadata,
} from "@/lib/seo-config"

interface ProfileLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

async function fetchPublicProfile(handle: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(`${API_BASE_URL}/user/by-username/${encodeURIComponent(handle)}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    })

    if (!response.ok) return null
    const payload = await response.json().catch(() => null)
    return payload?.user || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function displayNameFor(user: any, fallback: string) {
  return String(user?.name || user?.username || fallback).trim()
}

function profileImageFor(user: any) {
  const image = user?.avatar || user?.photo_profil || user?.profile_picture
  return typeof image === "string" && image.trim() ? absoluteUrl(image.trim()) : undefined
}

export async function generateMetadata({ params }: ProfileLayoutProps): Promise<Metadata> {
  const { slug } = await params
  const handle = decodeURIComponent(slug || "").trim()
  const user = handle ? await fetchPublicProfile(handle) : null
  const name = displayNameFor(user, handle || "Creator")
  const title = `${name}`
  const description =
    typeof user?.bio === "string" && user.bio.trim()
      ? user.bio.trim().slice(0, 155)
      : `View ${name}'s public Chabaqa profile, communities, courses, sessions, products, and creator activity.`
  const path = `/profile/${encodeURIComponent(handle)}`
  const image = profileImageFor(user)

  return {
    title,
    description,
    alternates: generateAlternateLanguages(path),
    openGraph: generateOGMetadata(
      title,
      description,
      path,
      image
        ? {
            url: image,
            width: 1200,
            height: 630,
            alt: `${name} Chabaqa profile`,
          }
        : undefined,
    ),
    twitter: generateTwitterMetadata(title, description, image),
    robots: user ? generateRobotsMetadata(true, true) : generateRobotsMetadata(false, false),
  }
}

export default function ProfileSlugLayout({ children }: ProfileLayoutProps) {
  return children
}
