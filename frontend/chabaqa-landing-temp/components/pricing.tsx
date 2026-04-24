"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { siteData } from "@/lib/data"

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-white via-chabaqa-primary/5 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{siteData.pricing.title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{siteData.pricing.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {siteData.pricing.plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-2 bg-white/80 backdrop-blur-sm ${
                plan.popular ? "border-chabaqa-primary shadow-xl scale-105" : "border-gray-200 shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-chabaqa-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">{plan.period}</span>}
                </div>
                <CardDescription className="text-gray-600 mt-2">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-chabaqa-primary mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full py-3 ${
                    plan.popular
                      ? "bg-chabaqa-primary hover:bg-chabaqa-primary/90 text-white"
                      : "bg-chabaqa-accent hover:bg-chabaqa-accent/90 text-white"
                  }`}
                  onClick={() => window.open("#", "_blank")}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
