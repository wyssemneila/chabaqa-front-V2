"use client"

import { siteData } from "@/lib/data"
import { useTranslations } from "next-intl"

export function HowItWorks() {
  const t = useTranslations("landing.howItWorks")

  return (
    <section id="how-it-works" className="py-20 bg-white ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t("title")}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {siteData.howItWorks.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-chabaqa-primary to-chabaqa-secondary1 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                {index < siteData.howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-chabaqa-primary/30 to-chabaqa-secondary1/30 transform -translate-y-1/2"></div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t.has(`steps.${index}.title`) ? t(`steps.${index}.title`) : step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{t.has(`steps.${index}.description`) ? t(`steps.${index}.description`) : step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
