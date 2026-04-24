"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Eye } from "lucide-react"

export function FeaturedCommunityCardClient() {
  const handleJoin = () => {
    console.log("Joining featured community...")
  }

  const handlePreview = () => {
    console.log("Previewing featured community...")
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleJoin}
        size="sm"
        className="bg-white/90 hover:bg-white text-gray-900 font-bold px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-300 group border-0 flex-1 backdrop-blur-sm"
      >
        Join Now
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
      <Button
        onClick={handlePreview}
        size="sm"
        variant="outline"
        className="border-2 border-white/60 text-white hover:bg-white hover:text-gray-900 font-semibold px-3 py-2 text-sm bg-white/10 backdrop-blur-sm transition-all duration-300"
      >
        <Eye className="w-4 h-4" />
      </Button>
    </div>
  )
}
