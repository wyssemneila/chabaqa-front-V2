"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Eye } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"


export function CommunityCardClient({ slug }: { slug?: string }) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)

  const handleJoin = () => {
    if (slug) {
      // Navigate to the community page using the slug
      router.push(`/${slug}`)
    }
  }

  const handlePreview = () => {
    console.log("Previewing community...")
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleJoin}
        className="flex-1 bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group border-0 h-11"
      >
        Join Community
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
      <Button
        onClick={handlePreview}
        variant="outline"
        className="border-2 border-chabaqa-primary/30 text-chabaqa-primary hover:bg-chabaqa-primary hover:text-white transition-all duration-300 bg-chabaqa-primary/5  h-11 px-4"
      >
        <Eye className="w-4 h-4" />
      </Button>
    </div>
  )
}
