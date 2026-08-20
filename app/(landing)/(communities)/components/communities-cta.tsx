import { Card, CardContent } from "@/components/ui/card"
import { LayoutGrid, Zap, BadgeDollarSign } from "lucide-react"
import { CommunitiesCTAClient } from "./communities-cta-client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"

export function CommunitiesCTA() {
  const t = useTranslations("landing.explore.ctaCard")
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl mx-auto rounded-3xl bg-white p-6 sm:p-10 shadow-2xl shadow-purple-200/40 border border-gray-100">
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{t("title")}</h2>
            <p className="max-w-2xl text-base sm:text-lg text-gray-600 mb-8">
              {t("subtitle")}
            </p>

            <div className="w-full grid grid-cols-3 gap-3 sm:gap-6 mb-10">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-purple-100 mb-2 sm:mb-3 text-purple-600">
                  <LayoutGrid className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-sm sm:text-xl font-semibold text-gray-800">{t("pillars.build.title")}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{t("pillars.build.subtitle")}</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-pink-100 mb-2 sm:mb-3 text-pink-600">
                  <Zap className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-sm sm:text-xl font-semibold text-gray-800">{t("pillars.engage.title")}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{t("pillars.engage.subtitle")}</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-100 mb-2 sm:mb-3 text-indigo-600">
                  <BadgeDollarSign className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-sm sm:text-xl font-semibold text-gray-800">{t("pillars.monetize.title")}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{t("pillars.monetize.subtitle")}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button className="w-full sm:w-auto bg-gradient-to-br from-purple-600 to-pink-500 text-white font-semibold px-7 py-2.5 rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5">
                <Link href={withLocale("/dashboard/create-community")}>
                  {t("createCommunity")}
                </Link>
              </button>
              <button className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 font-semibold px-7 py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 ease-in-out">
                {t("learnMore")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
