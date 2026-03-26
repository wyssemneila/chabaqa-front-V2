"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Users, Star, Shield, MapPin, Calendar, Lock } from "lucide-react"

interface CommunityDetailsHeroProps {
  community: any
}

export function CommunityDetailsHero({ community }: CommunityDetailsHeroProps) {
  const isPrivate =
    typeof (community as any)?.isPrivate === 'boolean'
      ? Boolean((community as any).isPrivate)
      : Boolean(
          community.settings &&
          typeof community.settings === 'object' &&
          community.settings.visibility === 'private',
        )

  return (
    <div className="relative bg-white">
      {/* Cover Image with Overlay */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        <Image
          src={community.coverImage || community.image || "/placeholder.svg"}
          alt={community.name}
          fill
          className="object-cover"
          priority
        />
        {/* White gradient overlays to blend with page header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 md:h-18 bg-gradient-to-b from-white to-transparent opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 md:h-34 bg-gradient-to-t from-white to-transparent opacity-98" />
        
        {/* Floating Stats on Cover */}
        <div className="absolute bottom-6 right-6 flex gap-3">
          <div className="backdrop-blur-xl bg-white/20 border border-white/40 px-4 py-2 rounded-full">
            <div className="flex items-center gap-2 text-white">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{Array.isArray(community.members) ? community.members.length : (community.members || 0)}</span>
            </div>
          </div>
          {(Number(community.rating) > 0) && (
            <div className="backdrop-blur-xl bg-white/20 border border-white/40 px-4 py-2 rounded-full">
              <div className="flex items-center gap-2 text-white">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{community.rating}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Community Info Card */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-24 pb-8">
          <div className="backdrop-blur-xl bg-white/90 border border-white/40 rounded-3xl shadow-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo */}
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-chabaqa-primary to-chabaqa-secondary1 flex-shrink-0 p-1">
                <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                  <Image
                    src={community.logo || "/placeholder.svg"}
                    alt={`${community.name} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4">
                {/* Title & Badges */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 bg-clip-text text-transparent">
                      {String(community.name || '')}
                    </h1>
                    {community.isVerified && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                        <Shield className="w-3 h-3 me-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className="border-chabaqa-primary/30 text-chabaqa-primary bg-chabaqa-primary/5"
                    >
                      {String(community.category || '')}
                    </Badge>
                    <Badge 
                      variant={isPrivate ? "destructive" : "outline"}
                      className={isPrivate ? "flex items-center gap-1" : "border-chabaqa-primary text-chabaqa-primary bg-chabaqa-primary/5 flex items-center gap-1"}
                    >
                      {isPrivate ? (
                        <>
                          <Lock className="w-3 h-3" />
                          Private
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" />
                          Public
                        </>
                      )}
                    </Badge>
                    {community.featured && (
                      <Badge 
                        variant="outline"
                        className="border-yellow-400 text-yellow-700 bg-yellow-50 flex items-center gap-1"
                      >
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        Featured
                      </Badge>
                    )}
                    {community.verified && (
                      <Badge 
                        variant="outline"
                        className="border-blue-400 text-blue-700 bg-blue-50 flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-gray-700 leading-relaxed max-w-3xl">
                  {community.short_description || community.description || "No description available."}
                </p>

                {/* Creator & Meta Info */}
                <div className="flex items-center gap-6 flex-wrap pt-2">
                  {community.creator && (
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-chabaqa-primary/20">
                        <Image
                          src={community.creator.avatar || "/placeholder.svg"}
                          alt={community.creator.name || "Creator"}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created by</p>
                        <p className="font-semibold text-gray-900">{community.creator.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-chabaqa-primary" />
                    <span>Joined {new Date(community.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
