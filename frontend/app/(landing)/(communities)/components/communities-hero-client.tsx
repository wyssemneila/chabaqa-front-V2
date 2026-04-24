"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"

export function CommunitiesHeroClient() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("landing.explore")
  const withLocale = (href: string) => localizeHref(pathname, href)

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button
        size="lg"
        className="bg-chabaqa-accent hover:bg-chabaqa-accent/90 text-white px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
        onClick={() => document.getElementById("communities-search")?.scrollIntoView({ behavior: "smooth" })}
      >
        {t("hero.exploreCommunities")}
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-3 font-semibold bg-transparent  transition-all duration-300"
        onClick={() => router.push(withLocale("/dashboard/create-community"))}
      >
        {t("hero.createCommunity")}
      </Button>
    </div>
  )
}
