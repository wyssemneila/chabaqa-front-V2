"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"
import { COOKIE_OPEN_PREFERENCES_EVENT } from "@/components/cookie-consent-provider"

export function Footer() {
  const t = useTranslations("footer")
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/")

  const openCookiePreferences = () => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(COOKIE_OPEN_PREFERENCES_EVENT))
  }

  const columns = t.raw("columns") as Record<string, string[]>
  const bottomLinks = t.raw("bottomLinks") as string[]

  const FOOTER_HREFS: string[][] = [
    ["/#features", "/#pricing", "/explore", "/#features", "/#features"],
    ["/#about", "/blogs", "#", "#"],
    ["/terms-of-service", "/privacy-policy", "#"],
  ]

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link 
              href={withLocale("/")} 
              aria-label="Chabaqa — go to homepage" 
              className="inline-block mb-4"
            >
              <Image
                src={isArabic ? "/Logos/PNG/arabic.png" : "/Logos/PNG/frensh1.png"}
                alt="Chabaqa"
                width={140}
                height={36}
                sizes="140px"
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-sm">
              {t("tagline")}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                {
                  href: "https://instagram.com/chabaqa",
                  label: "Instagram",
                  icon: (
                    <>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </>
                  ),
                },
                {
                  href: "https://twitter.com/chabaqa",
                  label: "X (Twitter)",
                  icon: (
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  ),
                },
                {
                  href: "https://linkedin.com/company/chabaqa",
                  label: "LinkedIn",
                  icon: (
                    <>
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </>
                  ),
                },
              ].map(({ href, label, icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chabaqa on ${label}`}
                  className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    {icon}
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(columns).map(([heading, links], colIdx) => (
            <div key={heading} className="col-span-1">
              <h4 className="text-gray-900 font-semibold text-sm mb-4">{heading}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link, linkIdx) => (
                  <li key={link}>
                    <Link
                      href={withLocale(FOOTER_HREFS[colIdx]?.[linkIdx] ?? "#")}
                      className="text-gray-600 hover:text-purple-600 text-sm transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-gray-500 text-sm">{t("copyright")}</span>
          
          <div className="flex items-center gap-6">
            {bottomLinks.map((label, idx) => {
              const hrefs = ["/terms-of-service", "/privacy-policy", "#"]
              return (
                <Link
                  key={label}
                  href={idx === 2 ? "#" : withLocale(hrefs[idx])}
                  onClick={idx === 2 ? openCookiePreferences : undefined}
                  className="text-gray-500 hover:text-purple-600 text-sm transition-colors duration-200"
                >
                  {label}
                </Link>
              )
            })}
          </div>
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t("backTop")}
            className="flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm transition-colors duration-200 group"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="16"
              height="16"
              aria-hidden="true"
              className="group-hover:-translate-y-0.5 transition-transform duration-200"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            {t("backTop")}
          </button>
        </div>
      </div>
    </footer>
  )
}
