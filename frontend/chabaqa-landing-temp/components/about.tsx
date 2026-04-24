"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Users, Zap } from "lucide-react"
import { siteData } from "@/lib/data"

const iconMap = {
  Heart,
  Users,
  Zap,
}

export function About() {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-chabaqa-accent/5 via-white to-chabaqa-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{siteData.about.title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">{siteData.about.subtitle}</p>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">{siteData.about.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {siteData.about.values.map((value, index) => {
            const Icon = iconMap[value.icon as keyof typeof iconMap]
            return (
              <Card
                key={index}
                className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-chabaqa-primary to-chabaqa-secondary1 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{siteData.about.team.title}</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{siteData.about.team.description}</p>
        </div>
      </div>
    </section>
  )
}
