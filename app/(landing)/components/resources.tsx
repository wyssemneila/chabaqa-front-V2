"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Video, FileText, Calendar, ArrowRight } from "lucide-react"
import { siteData } from "@/lib/data"
import clsx from "clsx"

const typeIcons = {
  Guide: BookOpen,
  Article: FileText,
  Video: Video,
  Webinar: Calendar,
}

export function Resources() {
  return (
    <section id="resources" className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Resources for Creator Success
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Learn from the best with our comprehensive collection of guides, articles, and tutorials designed to help you succeed.
          </p>
        </div>

        {/* Grid: always centered */}
        <div className="flex justify-center">
          <div
            className={clsx(
              "grid gap-4 sm:gap-6 lg:gap-8 justify-center",
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}
          >
            {siteData.resources.map((resource, i) => {
              const Icon = typeIcons[resource.type as keyof typeof typeIcons] ?? FileText
              const onOpen = () => window.open(resource.href ?? "#", "_blank", "noopener,noreferrer")

              return (
                <Card
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={onOpen}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
                  className={clsx(
                    "h-full border-0 bg-white/80 cursor-pointer",
                    "shadow-md hover:shadow-xl transition-transform duration-200",
                    "hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-chabaqa-primary/40 rounded-2xl"
                  )}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="border-chabaqa-primary text-chabaqa-primary bg-chabaqa-primary/5"
                      >
                        {resource.type}
                      </Badge>
                      <Icon className="w-5 h-5 text-chabaqa-primary shrink-0" />
                    </div>

                    <CardTitle className="text-base sm:text-lg text-gray-900 transition-colors line-clamp-2">
                      {resource.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="text-gray-600 leading-relaxed line-clamp-3">
                      {resource.description}
                    </CardDescription>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[11px] sm:text-xs">
                        {resource.category}
                      </Badge>
                      <span className="text-xs sm:text-sm text-gray-500">{resource.readTime}</span>
                    </div>

                    <div className="flex items-center text-chabaqa-primary font-medium transition-transform hover:translate-x-0.5">
                      <span className="text-sm">Read More</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10 sm:mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-chabaqa-primary text-chabaqa-primary hover:bg-chabaqa-primary hover:text-white px-6 sm:px-8 py-2.5 sm:py-3 bg-transparent"
            onClick={() => window.open("/resources", "_blank")}
          >
            View All Resources
          </Button>
        </div>
      </div>
    </section>
  )
}
