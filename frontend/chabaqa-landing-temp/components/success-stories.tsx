"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, ArrowRight } from "lucide-react"
import { siteData } from "@/lib/data"

export function SuccessStories() {
  return (
    <section
      id="success-stories"
      className="py-20 bg-gradient-to-br from-chabaqa-primary/5 via-white to-chabaqa-secondary1/5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Real Creators, Real Success Stories</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how creators like you are building thriving communities and generating life-changing income with
            Chabaqa.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {siteData.successStories.map((story, index) => (
            <Card
              key={index}
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/80 backdrop-blur-sm"
            >
              <div className="relative">
                <img
                  src={story.image || "/placeholder.svg"}
                  alt={`${story.name}'s community`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-chabaqa-primary" />
                    <span className="text-sm font-semibold text-gray-900">{story.members}</span>
                  </div>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900">{story.name}</CardTitle>
                    <CardDescription className="text-chabaqa-primary font-medium">{story.role}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-chabaqa-accent">{story.revenue}</div>
                    <div className="text-xs text-gray-600">monthly revenue</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-800 mt-2">{story.community}</div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-600 leading-relaxed">{story.story}</p>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Key Results:</h4>
                  <ul className="space-y-1">
                    {story.results.map((result, resultIndex) => (
                      <li key={resultIndex} className="flex items-center text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 text-chabaqa-primary mr-2 flex-shrink-0" />
                        {result}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-chabaqa-primary text-chabaqa-primary hover:bg-chabaqa-primary hover:text-white group bg-transparent"
                  onClick={() => window.open("#", "_blank")}
                >
                  Read Full Story
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-white px-8 py-3"
            onClick={() => window.open("#pricing", "_self")}
          >
            Start Your Success Story
          </Button>
        </div>
      </div>
    </section>
  )
}
