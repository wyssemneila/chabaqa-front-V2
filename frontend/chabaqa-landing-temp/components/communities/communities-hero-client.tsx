"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CommunitiesHeroClient() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button
        size="lg"
        className="bg-chabaqa-accent hover:bg-chabaqa-accent/90 text-white px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
        onClick={() => document.getElementById("communities-search")?.scrollIntoView({ behavior: "smooth" })}
      >
        Explore Communities
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-3 font-semibold bg-transparent backdrop-blur-sm transition-all duration-300"
        onClick={() => window.open("#", "_blank")}
      >
        Create Community
      </Button>
    </div>
  )
}
