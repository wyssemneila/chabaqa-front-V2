import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react"
import type { SocialPlatform } from "@/lib/social-links"

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.674a2.896 2.896 0 1 1-5.214-1.744 2.896 2.896 0 0 1 2.31-4.636 2.93 2.93 0 0 1 .88.134V9.404a6.83 6.83 0 0 0-1-.05 6.33 6.33 0 1 0 6.353 6.326v-7.018a8.16 8.16 0 0 0 4.77 1.517v-3.404a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const ICON_COMPONENTS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: XIcon,
  youtube: Youtube,
  tiktok: TikTokIcon,
  github: Github,
  website: Globe,
}

interface SocialBrandIconProps {
  platform: SocialPlatform
  className?: string
}

export function SocialBrandIcon({ platform, className = "w-4 h-4" }: SocialBrandIconProps) {
  const Icon = ICON_COMPONENTS[platform] || Globe

  return <Icon className={className} />
}
