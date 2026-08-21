"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE, SUPPORTED_LOCALES } from "@/lib/i18n/config"
import { useTranslations } from "next-intl"

function stripLocale(pathname: string) {
  const segments = pathname.split("/")
  if (isAppLocale(segments[1])) {
    const stripped = `/${segments.slice(2).join("/")}`.replace(/\/+/g, "/")
    return stripped === "/" ? "/" : stripped.replace(/\/$/, "") || "/"
  }
  return pathname
}

function detectLocale(pathname: string) {
  const segments = pathname.split("/")
  return isAppLocale(segments[1]) ? segments[1] : DEFAULT_LOCALE
}

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("common")

  const currentLocale = useMemo(() => detectLocale(pathname), [pathname])
  const internalPath = useMemo(() => stripLocale(pathname), [pathname])
  const query = searchParams.toString()

  const switchLocale = (nextLocale: string) => {
    if (!isAppLocale(nextLocale) || nextLocale === currentLocale) return
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    const targetPath = internalPath === "/" ? `/${nextLocale}` : `/${nextLocale}${internalPath}`
    const withQuery = query ? `${targetPath}?${query}` : targetPath
    router.push(withQuery)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language")}>
          <Globe className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            disabled={locale === currentLocale}
            onClick={() => switchLocale(locale)}
          >
            {locale === "en" ? t("english") : t("arabic")}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
