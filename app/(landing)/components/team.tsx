"use client"

import { teamData } from "@/lib/team"
import Image from "next/image"
import { Github, Linkedin, Twitter, Dribbble, Globe } from "lucide-react"

export function Team() {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "github":
        return <Github className="w-4 h-4" />
      case "linkedin":
        return <Linkedin className="w-4 h-4" />
      case "twitter":
        return <Twitter className="w-4 h-4" />
      case "dribbble":
        return <Dribbble className="w-4 h-4" />
      case "behance":
        return <Globe className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  return (
    <section className="relative flex items-center bg-white overflow-hidden py-8 md:py-16">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-4 md:top-20 md:left-10 w-32 h-32 md:w-60 md:h-60 bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/15 rounded-full blur-2xl animate-pulse" />
        <div
          className="absolute bottom-10 right-4 md:bottom-20 md:right-10 w-28 h-28 md:w-52 md:h-52 bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-[#06b6d4]/15 to-[#0284c7]/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-8 md:mb-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 text-balance">
              {teamData.title}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed text-pretty">
              {teamData.description}
            </p>
          </div>

          {/* 5 cards on desktop (xl) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
  {teamData.members.map((member) => (
    <div
      key={member.id}
      className="group relative bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={
            member.image ||
            `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(
              (member.name || "profile") + " professional headshot"
            )}`
          }
          alt={member.name}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Text content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
          <h3 className="text-lg md:text-xl font-bold mb-1 text-balance">
            {member.name}
          </h3>
          <p className="text-sm md:text-base font-medium mb-3 text-blue-200">
            {member.role}
          </p>

          {/* Social links */}
          {member.social && (
            <div className="flex gap-3">
              {Object.entries(member.social).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-200 hover:bg-white/30 hover:scale-110"
                >
                  {getSocialIcon(platform)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ))}
</div>


        </div>
      </div>
    </section>
  )
}
