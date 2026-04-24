"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { siteData } from "@/lib/data"

const colorMap = {
  secondary1: {
    bg: "bg-gradient-to-br from-chabaqa-secondary1/10 to-chabaqa-secondary1/5",
    button: "bg-chabaqa-secondary1 hover:bg-chabaqa-secondary1/90",
    accent: "chabaqa-secondary1",
  },
  secondary2: {
    bg: "bg-gradient-to-br from-chabaqa-secondary2/10 to-chabaqa-secondary2/5",
    button: "bg-chabaqa-secondary2 hover:bg-chabaqa-secondary2/90",
    accent: "chabaqa-secondary2",
  },
  accent: {
    bg: "bg-gradient-to-br from-chabaqa-accent/10 to-chabaqa-accent/5",
    button: "bg-chabaqa-accent hover:bg-chabaqa-accent/90",
    accent: "chabaqa-accent",
  },
}

export function Features() {
  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Engage Your Community
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to help you create meaningful connections and drive engagement.
          </p>
        </div>

        <div className="space-y-32">
          {siteData.features.map((feature, index) => {
            const colors = colorMap[feature.color as keyof typeof colorMap]
            const isLeft = feature.layout === "left"

            return (
              <div key={index} className={`relative overflow-hidden rounded-3xl ${colors.bg} p-8 lg:p-16`}>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Content */}
                  <div className={`space-y-8 ${isLeft ? "lg:order-1" : "lg:order-2"}`}>
                    <div className="space-y-6">
                      <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{feature.title}</h3>
                      <p className="text-lg text-gray-700 leading-relaxed">{feature.description}</p>
                    </div>

                    <Button
                      size="lg"
                      className={`${colors.button} text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group`}
                      onClick={() => window.open("#pricing", "_self")}
                    >
                      {feature.buttonText}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>

                  {/* Image */}
                  <div className={`relative ${isLeft ? "lg:order-2" : "lg:order-1"}`}>
                    <div className="relative">
                      <img
                        src={feature.image || "/placeholder.svg"}
                        alt={feature.title}
                        className="w-full h-auto rounded-2xl shadow-2xl"
                      />
                      {/* Decorative elements */}
                      <div
                        className={`absolute -top-4 -right-4 w-24 h-24 bg-${colors.accent}/20 rounded-full blur-xl`}
                      ></div>
                      <div
                        className={`absolute -bottom-4 -left-4 w-32 h-32 bg-${colors.accent}/15 rounded-full blur-xl`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-${colors.accent}/5 rounded-full blur-3xl`}></div>
                <div className={`absolute bottom-0 left-0 w-48 h-48 bg-${colors.accent}/5 rounded-full blur-3xl`}></div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
