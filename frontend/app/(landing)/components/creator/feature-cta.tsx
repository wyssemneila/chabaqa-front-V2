import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface FeatureCTAProps {
  feature: {
    name: string
    price: number
    priceType: string
    type: "community" | "course" | "challenge" | "event" | "oneToOne"
  }
}

export function FeatureCTA({ feature }: FeatureCTAProps) {
  const getTypeConfig = (type: string) => {
    const configs = {
      community: {
        color: "from-blue-500 to-blue-600",
        ctaText: "Join Community Now",
      },
      course: {
        color: "from-[#47c7ea] to-[#86e4fd]",
        ctaText: "Start Learning Today",
      },
      challenge: {
        color: "from-[#ff9b28] to-[#fdb863]",
        ctaText: "Join the Challenge",
      },
      event: {
        color: "from-indigo-500 to-indigo-600",
        ctaText: "Register for Event",
      },
      oneToOne: {
        color: "from-[#f65887] to-[#fb8ba8]",
        ctaText: "Book Your Session",
      },
    }
    return configs[type as keyof typeof configs] || configs.community
  }

  const typeConfig = getTypeConfig(feature.type)

  const formatPrice = (price: number, type: string) => {
    if (type === "free") return "Free"
    if (type === "per session") return `${price} TND/session`
    if (type === "one-time") return `${price} TND`
    return `${price} TND/${type === "monthly" ? "mo" : type}`
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 py-8 sm:py-10 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">
          Ready to Get Started?
        </h2>
        <p className="text-xs sm:text-sm text-purple-100 mb-4 sm:mb-6">
          Join now and start your journey to success with {feature.name}
        </p>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex-1 text-left w-full md:w-auto">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Starting at</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                {formatPrice(feature.price, feature.priceType)}
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Instant access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700">30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Cancel anytime</span>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className={`w-full md:w-auto text-sm font-semibold px-6 sm:px-8 py-5 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 bg-gradient-to-r ${typeConfig.color} text-white border-0 h-11`}
            >
              {typeConfig.ctaText}
            </Button>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-purple-200 mt-3 sm:mt-4">
          Join creators and members who are already seeing results
        </p>
      </div>
    </div>
  )
}
