import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Tajawal } from "next/font/google"
import Script from "next/script"
import { cookies, headers } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import "./globals.css"
import { ReactQueryProvider } from "@/app/providers/react-query-provider"
import { Ga4ScriptGate } from "@/components/ga4-script-gate"
import { CookieConsentProvider } from "@/components/cookie-consent-provider"
import { ArabicAutoTranslate } from "@/components/arabic-auto-translate"
import { PwaServiceWorker } from "@/components/pwa-service-worker"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { ThemeProvider } from "@/components/theme-provider"
import { DEFAULT_LOCALE, getLocaleDirection, isAppLocale, LOCALE_COOKIE } from "@/lib/i18n/config"
import { getMessagesForLocale } from "@/lib/i18n/messages"
import {
  generateKeywords,
  generateOGMetadata,
  generateRobotsMetadata,
  generateTwitterMetadata,
  generateWebSiteSchema,
  seoConfig,
} from "@/lib/seo-config"

const inter = Inter({ subsets: ["latin"], variable: "--font-latin" })
const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "700", "800"],
})
const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://chabaqa.io"

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: "%s | Chabaqa"
  },
  description: seoConfig.defaultDescription,
  keywords: generateKeywords(),
  authors: [{ name: "Chabaqa", url: "https://chabaqa.io" }],
  creator: "Chabaqa",
  publisher: "Chabaqa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [
      { url: "/favicon.ico" },
      { url: "/favicon.ico", sizes: "180x180", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: generateOGMetadata(seoConfig.defaultTitle, seoConfig.defaultDescription, appBaseUrl),
  twitter: generateTwitterMetadata(seoConfig.defaultTitle, seoConfig.defaultDescription),
  robots: generateRobotsMetadata(true, true),
  alternates: {
    canonical: appBaseUrl,
    languages: {
      'en': appBaseUrl,
      'ar': `${appBaseUrl}/ar`
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  category: 'technology',
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const localeHeader = (await headers()).get("x-app-locale")
  const localeCookie = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isAppLocale(localeHeader)
    ? localeHeader
    : isAppLocale(localeCookie)
      ? localeCookie
      : DEFAULT_LOCALE
  const dir = getLocaleDirection(locale)
  const messages = getMessagesForLocale(locale)

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Language alternates */}
        <link rel="alternate" hrefLang="x-default" href="https://chabaqa.io" />
        
        {/* Additional meta tags for better SEO */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chabaqa" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Chabaqa" />
      </head>
      <body
        className={`${inter.variable} ${tajawal.variable} ${locale === "ar" ? "font-arabic" : "font-latin"}`}
        suppressHydrationWarning
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--p)] focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
          Skip to main content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ReactQueryProvider>
            <LoadingScreen />
            {children}
            <PwaServiceWorker />
            <ArabicAutoTranslate />
            <Ga4ScriptGate />
            <CookieConsentProvider />
            <Script id="structured-data-org" type="application/ld+json" strategy="afterInteractive">
              {JSON.stringify(seoConfig.organization)}
            </Script>
            <Script id="structured-data-website" type="application/ld+json" strategy="afterInteractive">
              {JSON.stringify(generateWebSiteSchema())}
            </Script>
          </ReactQueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
