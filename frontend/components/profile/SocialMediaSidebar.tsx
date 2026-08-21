"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, Link2 } from "lucide-react"
import { SocialBrandIcon } from "@/components/profile/SocialBrandIcon"
import type { SocialPlatform } from "@/lib/social-links"

interface SocialEntry {
  platform: SocialPlatform
  label: string
  href: string
}

interface SocialMediaSidebarProps {
  entries: SocialEntry[]
  isOwnProfile: boolean
  editHref: string
}

function prettyUrl(value: string): string {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "")
    const path = url.pathname === "/" ? "" : url.pathname
    return `${host}${path}`.slice(0, 36)
  } catch {
    return value
  }
}

export function SocialMediaSidebar({ entries, isOwnProfile, editHref }: SocialMediaSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="w-full lg:w-[320px] xl:w-[340px] lg:sticky lg:top-24 self-start"
    >
      <div className="border border-border-color rounded-xl bg-white shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-border-color bg-gradient-to-r from-[#f65887]/10 via-[#8e78fb]/10 to-[#47c7ea]/10">
          <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Social Media
          </p>
          <p className="text-xs text-text-secondary mt-1">Open the creator profiles directly.</p>
        </div>

        <div className="p-3">
          {entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <motion.a
                  key={entry.platform}
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.04 }}
                  className="group flex items-center gap-3 rounded-lg border border-border-color/80 px-3 py-2.5 bg-white hover:bg-gray-50 hover:border-border-color transition-all duration-200 hover:-translate-y-[1px]"
                >
                  <div className="shrink-0 rounded-md bg-gray-50 p-1.5 border border-border-color/70">
                    <SocialBrandIcon platform={entry.platform} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{entry.label}</p>
                    <p className="text-xs text-text-secondary truncate">{prettyUrl(entry.href)}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
                </motion.a>
              ))}
            </div>
          ) : (
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-text-secondary">No social media links yet.</p>
              {isOwnProfile && (
                <Link
                  href={editHref}
                  className="mt-3 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
                >
                  Add Social Links
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
