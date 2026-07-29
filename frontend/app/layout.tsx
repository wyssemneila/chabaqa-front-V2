import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Tajawal } from "next/font/google"
import Script from "next/script"
import { cookies, headers } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import "./globals.css"
import "./styles/animations.css"
import { ReactQueryProvider } from "@/app/providers/react-query-provider"
import { ExtensionErrorGuard } from "@/app/(auth)/components/extension-error-guard"
import { Ga4ScriptGate } from "@/components/ga4-script-gate"
import { CookieConsentProvider } from "@/components/cookie-consent-provider"
import { ArabicAutoTranslate } from "@/components/arabic-auto-translate"
import { PwaServiceWorker } from "@/components/pwa-service-worker"
import { GlobalImageErrorHandler } from "@/components/media/global-image-error-handler"
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
  getSiteUrl,
  seoConfig,
} from "@/lib/seo-config"

const inter = Inter({ subsets: ["latin"], variable: "--font-latin" })
const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "700", "800"],
})
const appBaseUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: "%s | Chabaqa"
  },
  description: seoConfig.defaultDescription,
  keywords: generateKeywords(),
  authors: [{ name: "Chabaqa", url: appBaseUrl }],
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
  const headersList = await headers()
  const cookieStore = await cookies()
  const localeHeader = headersList.get("x-app-locale")
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value
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
        {/* Language alternates */}
        <link rel="alternate" hrefLang="x-default" href={appBaseUrl} />
        
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          <LoadingScreen />
          <NextIntlClientProvider locale={locale} messages={messages}>
          <ReactQueryProvider>
            <ExtensionErrorGuard />
            <GlobalImageErrorHandler />
            <div id="main-content" tabIndex={-1} className="outline-none">{children}</div>
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
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
