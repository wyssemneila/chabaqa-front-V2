"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CommunitiesCTAClient() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        size="lg"
        className="bg-chabaqa-accent hover:bg-chabaqa-accent/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
        onClick={() => window.open("#", "_blank")}
      >
        Create Your Community
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-2 border-white text-white hover:bg-white hover:text-chabaqa-primary px-8 py-4 text-lg font-semibold bg-transparent  transition-all duration-300"
        onClick={() => window.open("#", "_blank")}
      >
        Learn More
      </Button>
    </div>
  )
}
