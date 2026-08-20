"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Users, Star, Calendar, Clock, Award } from "lucide-react"
import Link from "next/link"

interface FeatureHeroProps {
  feature: {
    id: string
    slug: string
    name: string
    creator: string
    creatorId: string
    creatorAvatar: string
    description: string
    category: string
    members: number
    rating: number
    price: number
    priceType: string
    image: string
    tags: string[]
    verified: boolean
    featured?: boolean
    type: "community" | "course" | "challenge" | "event" | "oneToOne" | "product"
  }
}

export function FeatureHero({ feature }: FeatureHeroProps) {
  const getTypeConfig = (type: string) => {
    const configs = {
      community: {
        color: "from-blue-500 to-blue-600",
        badgeColor: "border-blue-500/50 text-blue-600 bg-blue-50",
        icon: Users,
        ctaText: "Join Community",
      },
      course: {
        color: "from-[#47c7ea] to-[#86e4fd]",
        badgeColor: "border-[#47c7ea]/50 text-[#47c7ea] bg-[#47c7ea]/10",
        icon: Award,
        ctaText: "Start Learning",
      },
      challenge: {
        color: "from-[#ff9b28] to-[#fdb863]",
        badgeColor: "border-[#ff9b28]/50 text-[#ff9b28] bg-[#ff9b28]/10",
        icon: Award,
        ctaText: "Join Challenge",
      },
      event: {
        color: "from-indigo-500 to-indigo-600",
        badgeColor: "border-indigo-500/50 text-indigo-600 bg-indigo-50",
        icon: Calendar,
        ctaText: "Register Now",
      },
      oneToOne: {
        color: "from-[#f65887] to-[#fb8ba8]",
        badgeColor: "border-[#f65887]/50 text-[#f65887] bg-[#f65887]/10",
        icon: Clock,
        ctaText: "Book Session",
      },
      product: {
        color: "from-purple-500 to-purple-600",
        badgeColor: "border-purple-500/50 text-purple-600 bg-purple-50",
        icon: Award,
        ctaText: "Get Product",
      },
    }
    return configs[type as keyof typeof configs] || configs.community
  }

  const typeConfig = getTypeConfig(feature.type)
  const IconComponent = typeConfig.icon

  const formatPrice = (price: number, type: string) => {
    if (type === "free") return "Free"
    if (type === "per session") return `${price} TND/session`
    if (type === "one-time") return `${price} TND`
    return `${price} TND/${type === "monthly" ? "mo" : type}`
  }

  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const getPlaceholderImage = (type: string) => {
    const queries = {
      community: "community group discussion networking",
      course: "online learning education course",
      challenge: "fitness challenge goal achievement",
      event: "live event workshop conference",
      oneToOne: "one on one consultation meeting",
      product: "professional product digital",
    }
    return `/placeholder.svg?height=600&width=800&query=${queries[type as keyof typeof queries] || "professional content"}`
  }

  const getAvatarPlaceholder = () => {
    return `/placeholder.svg?height=120&width=120&query=professional avatar portrait`
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-purple-50/30">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br ${typeConfig.color} opacity-5 rounded-full blur-3xl`}
        />
        <div
          className={`absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-tr ${typeConfig.color} opacity-5 rounded-full blur-3xl`}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-3 sm:py-4 lg:py-6">
        {/* Header: Logo + Badges */}
        <div className="flex justify-between items-center mb-1 sm:mb-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-0.5 group transition-transform hover:scale-105"
          >
            <div className="sm:hidden">
              <Image
                src="/Logos/PNG/brandmark.png"
                alt="Chabaqa Logo"
                width={40}
                height={10}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div className="hidden sm:block">
              <Image
                src="/Logos/PNG/frensh1.png"
                alt="Chabaqa Logo"
                width={120}
                height={30}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </Link>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${typeConfig.badgeColor} border text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold capitalize`}
            >
              <IconComponent className="w-3 h-3 me-1" />
              {feature.type}
            </Badge>
            {feature.verified && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold">
                <CheckCircle className="w-3 h-3 me-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="space-y-4 sm:space-y-5">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {feature.name}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {feature.description}
            </p>

            {/* Creator info */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Image
                src={feature.creatorAvatar || getAvatarPlaceholder()}
                alt={feature.creator}
                width={40}
                height={40}
                className="rounded-full ring-2 ring-gray-100"
              />
              <div>
                <p className="text-[11px] text-gray-500">Created by</p>
                <p className="text-sm font-semibold text-gray-900">{feature.creator}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-1">
                <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500">Members</p>
                  <p className="text-sm font-bold text-gray-900">{formatMembers(feature.members)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500">Rating</p>
                  <p className="text-sm font-bold text-gray-900">{feature.rating}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-1">
                <div className="w-4 h-4 flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                  #
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Category</p>
                  <p className="text-sm font-bold text-gray-900">{feature.category}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {feature.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-gray-200 text-gray-700 bg-gray-50 font-medium px-2 py-0.5 text-[11px] hover:bg-gray-100 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatPrice(feature.price, feature.priceType)}
                </span>
                {feature.priceType !== "free" && (
                  <span className="text-xs text-gray-500">{feature.priceType}</span>
                )}
              </div>
              <Button
                size="lg"
                className={`flex-1 text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-300 bg-gradient-to-r ${typeConfig.color} text-white border-0 h-11`}
              >
                {typeConfig.ctaText}
              </Button>
            </div>
          </div>

          {/* Right image */}
          <div className="relative order-first lg:order-last">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
              <Image
                src={feature.image || getPlaceholderImage(feature.type)}
                alt={feature.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Subtle overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}