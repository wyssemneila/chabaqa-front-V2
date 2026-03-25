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

  const openCookiePreferences = () => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(COOKIE_OPEN_PREFERENCES_EVENT))
  }

  const columns = t.raw("columns") as Record<string, string[]>
  const bottomLinks = t.raw("bottomLinks") as string[]

  const FOOTER_HREFS: string[][] = [
    ["/#features", "/#pricing", "/#features", "/#features", "/#features"],
    ["/#about", "/blogs", "#", "#"],
    ["/terms-of-service", "/privacy-policy", "#"],
  ]

  return (
    <footer
      className="pt-16 pb-8 px-6 md:px-10"
      style={{
        background: "linear-gradient(135deg, #8e78fb 0%, #5d67ff 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={withLocale("/")} aria-label="Chabaqa — go to homepage" className="flex items-center mb-4">
              <Image
                src="/Logos/PNG/frensh1.png"
                alt="Chabaqa"
                width={120}
                height={32}
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6">{t("tagline")}</p>
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
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    {icon}
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Columns */}
          {Object.entries(columns).map(([heading, links], colIdx) => (
            <div key={heading}>
              <h4 className="text-white font-bold text-sm mb-4">{heading}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link, linkIdx) => (
                  <li key={link}>
                    <Link
                      href={withLocale(FOOTER_HREFS[colIdx]?.[linkIdx] ?? "#")}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-white/50 text-sm">{t("copyright")}</span>
          <div className="flex items-center gap-4">
            {bottomLinks.map((label, idx) => {
              const hrefs = ["/terms-of-service", "/privacy-policy", "#"]
              return (
                <Link
                  key={label}
                  href={idx === 2 ? "#" : withLocale(hrefs[idx])}
                  onClick={idx === 2 ? openCookiePreferences : undefined}
                  className="text-white/50 hover:text-white text-sm transition-colors"
                >
                  {label}
                </Link>
              )
            })}
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t("backTop")}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
              aria-hidden="true"
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
