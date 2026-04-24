"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Video, FileText, Calendar, ArrowRight } from "lucide-react"
import { siteData } from "@/lib/data"

const typeIcons = {
  Guide: BookOpen,
  Article: FileText,
  Video: Video,
  Webinar: Calendar,
}

export function Resources() {
  return (
    <section
      id="resources"
      className="py-20 bg-gradient-to-br from-chabaqa-secondary2/5 via-white to-chabaqa-secondary1/5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Resources for Creator Success</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn from the best with our comprehensive collection of guides, articles, and tutorials designed to help
            you succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteData.resources.map((resource, index) => {
            const Icon = typeIcons[resource.type as keyof typeof typeIcons]
            return (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer bg-white/80 backdrop-blur-sm"
                onClick={() => window.open("#", "_blank")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="border-chabaqa-primary text-chabaqa-primary bg-chabaqa-primary/5"
                    >
                      {resource.type}
                    </Badge>
                    <Icon className="w-5 h-5 text-chabaqa-primary" />
                  </div>
                  <CardTitle className="text-lg text-gray-900 group-hover:text-chabaqa-primary transition-colors">
                    {resource.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-gray-600 leading-relaxed">{resource.description}</CardDescription>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {resource.category}
                    </Badge>
                    <span className="text-sm text-gray-500">{resource.readTime}</span>
                  </div>

                  <div className="flex items-center text-chabaqa-primary font-medium group-hover:translate-x-1 transition-transform">
                    <span className="text-sm">Read More</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-chabaqa-primary text-chabaqa-primary hover:bg-chabaqa-primary hover:text-white px-8 py-3 bg-transparent"
            onClick={() => window.open("#", "_blank")}
          >
            View All Resources
          </Button>
        </div>
      </div>
    </section>
  )
}
