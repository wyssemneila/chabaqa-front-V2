"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FeaturedCommunitiesClient() {
  return (
    <Button
      size="lg"
      variant="outline"
      className="border-chabaqa-accent text-chabaqa-accent hover:bg-chabaqa-accent hover:text-white bg-transparent group"
      onClick={() => document.getElementById("communities-search")?.scrollIntoView({ behavior: "smooth" })}
    >
      View All Communities
      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
    </Button>
  )
}
