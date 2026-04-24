"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { siteData } from "@/lib/data"

export function CreatorTools() {
  return (
    <section
      id="creator-tools"
      className="py-20 bg-gradient-to-br from-chabaqa-secondary2/5 via-white to-chabaqa-accent/5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful Tools for Every Creator</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to create, manage, and monetize your community in one comprehensive platform.
          </p>
        </div>

        <div className="space-y-16">
          {siteData.creatorTools.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="text-center mb-8">
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-lg border-chabaqa-primary text-chabaqa-primary bg-chabaqa-primary/5"
                >
                  {category.category}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {category.tools.map((tool, toolIndex) => (
                  <Card
                    key={toolIndex}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm"
                  >
                    <CardHeader>
                      <CardTitle className="text-2xl text-gray-900 flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            categoryIndex === 0
                              ? "bg-chabaqa-primary"
                              : categoryIndex === 1
                                ? "bg-chabaqa-secondary1"
                                : "bg-chabaqa-accent"
                          }`}
                        ></div>
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-base">{tool.description}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Key Features:</h4>
                        <ul className="space-y-2">
                          {tool.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center">
                              <Check className="w-5 h-5 text-chabaqa-primary mr-3 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
