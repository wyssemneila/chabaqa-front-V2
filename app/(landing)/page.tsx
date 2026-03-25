import { About } from "@/app/(landing)/components/about"
import { AppInstallCTA } from "@/app/(landing)/components/app-install-cta"
import { FAQ } from "@/app/(landing)/components/faq"
import { Features } from "@/app/(landing)/components/features"
import { Hero } from "@/app/(landing)/components/hero"
import { HowItWorks } from "@/app/(landing)/components/how-it-works"
import { Pricing } from "@/app/(landing)/components/pricing"
import { RevealProvider } from "@/app/(landing)/components/reveal-provider"
import { YouTubeVideos } from "@/app/(landing)/components/youtube-videos"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chabaqa Official Site | All-in-One Community Platform for Creators",
  description:
    "Official Chabaqa platform for creators to build and monetize communities with courses, challenges, coaching sessions, events, and digital products.",
  keywords: [
    // Primary English keywords
    "community platform",
    "creator platform",
    "online courses",
    "community building",
    "creator monetization",
    "coaching platform",
    "membership site",
    "course creation",
    "challenges platform",
    "virtual events",
    "creator economy",
    "digital products",
    "community management",
    "online learning platform",
    "creator tools",
    // Arabic transliterations for SEO
    "chabaqa",
    "shabqa",
    "chabka",
    "shabka",
    "chabqa",
    "شبقة",
    "shabqa platform",
    "chabka community",
    "shabka online courses",
    "chabaqa tunisia",
    "shabqa tunisie",
    // Location-based keywords
    "community platform tunisia",
    "online courses tunisia",
    "creator platform mena",
    "arabic community platform",
    "tunisian startup",
    // Long-tail keywords
    "all in one community platform",
    "best platform for online courses",
    "how to monetize community",
    "create online community",
    "sell courses online",
    "coaching platform with calendar",
    "challenge platform creators",
    "membership site builder",
    "community engagement tools",
    "creator business platform"
  ],
  authors: [{ name: "Chabaqa" }],
  openGraph: {
    title: "Chabaqa Official Site | All-in-One Community Platform for Creators",
    description:
      "Official Chabaqa platform for creators to build and monetize communities with courses, challenges, coaching sessions, events, and digital products.",
    url: "https://chabaqa.io",
    siteName: "Chabaqa",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_TN"],
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Chabaqa Community Platform - Build, Engage & Monetize"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Chabaqa Official Site | All-in-One Community Platform for Creators",
    description:
      "Official Chabaqa platform for creators to build and monetize communities with courses, challenges, coaching sessions, events, and digital products.",
    images: ["/og-image.jpg"],
    creator: "@chabaqa",
    site: "@chabaqa"
  },
  alternates: {
    canonical: "https://chabaqa.io",
    languages: {
      'en': 'https://chabaqa.io',
      'ar': 'https://chabaqa.io/ar'
    }
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
  },
  other: {
    'revisit-after': '3 days',
    'distribution': 'global',
    'rating': 'general',
    'geo.region': 'TN',
    'geo.placename': 'Tunisia',
    'geo.position': '36.8065;10.1815',
    'ICBM': '36.8065, 10.1815'
  }
}

export default function Home() {
  return (
    <>
      <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <RevealProvider />
        <Hero />
        <About />
        <Features />
        <HowItWorks />
        <YouTubeVideos />
        <Pricing />
        <FAQ />
        <AppInstallCTA />
        <Footer />
      </main>
      
      {/* Enhanced JSON-LD Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Chabaqa",
            "alternateName": ["Shabqa", "Chabka", "Shabka", "شبقة"],
            "url": "https://chabaqa.io",
            "logo": {
              "@type": "ImageObject",
              "url": "https://chabaqa.io/logo.png",
              "width": 250,
              "height": 60
            },
            "description": "All-in-one community platform for creators to build, engage, and monetize their communities with online courses, challenges, coaching, and events",
            "foundingDate": "2023",
            "foundingLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "TN",
                "addressLocality": "Tunisia"
              }
            },
            "sameAs": [
              "https://twitter.com/chabaqa",
              "https://facebook.com/chabaqa",
              "https://linkedin.com/company/chabaqa",
              "https://instagram.com/chabaqa"
            ],
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "contactType": "Customer Support",
                "email": "contactchabaqa@gmail.com",
                "availableLanguage": ["English", "Arabic", "French"]
              },
              {
                "@type": "ContactPoint",
                "contactType": "Sales",
                "email": "contactchabaqa@gmail.com",
                "availableLanguage": ["English", "Arabic", "French"]
              }
            ],
            "areaServed": {
              "@type": "GeoCircle",
              "geoMidpoint": {
                "@type": "GeoCoordinates",
                "latitude": "36.8065",
                "longitude": "10.1815"
              },
              "geoRadius": "Global"
            },
            "knowsAbout": [
              "Community Building",
              "Online Courses",
              "Creator Economy",
              "Coaching Platform",
              "Membership Sites",
              "Digital Products",
              "Virtual Events"
            ]
          })
        }}
      />
      
      {/* Enhanced JSON-LD for SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chabaqa",
            "alternateName": ["Shabqa", "Chabka", "Shabka"],
            "applicationCategory": "BusinessApplication",
            "applicationSubCategory": "Community Management Software",
            "operatingSystem": "Web, iOS, Android",
            "offers": {
              "@type": "AggregateOffer",
              "price": "0",
              "priceCurrency": "TND",
              "priceValidUntil": "2026-12-31",
              "availability": "https://schema.org/InStock",
              "offerCount": "3",
              "lowPrice": "0",
              "highPrice": "299"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250",
              "bestRating": "5",
              "worstRating": "1"
            },
            "description": "Community platform for creators to build, manage, and monetize their communities with courses, challenges, coaching, and events",
            "featureList": [
              "Online Course Creation",
              "Community Challenges",
              "1:1 Coaching Sessions",
              "Virtual Events",
              "Digital Products",
              "Membership Management",
              "Payment Processing",
              "Analytics Dashboard",
              "Email & WhatsApp Integration",
              "Custom Branding"
            ],
            "screenshot": "https://chabaqa.io/screenshot.jpg",
            "softwareVersion": "2.0",
            "datePublished": "2023-01-01",
            "author": {
              "@type": "Organization",
              "name": "Chabaqa"
            }
          })
        }}
      />
      
      {/* WebSite Schema with Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Chabaqa",
            "alternateName": ["Shabqa", "Chabka", "Shabka", "شبقة"],
            "url": "https://chabaqa.io",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://chabaqa.io/search?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            },
            "inLanguage": ["en", "ar"]
          })
        }}
      />
      
      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Community Platform",
            "provider": {
              "@type": "Organization",
              "name": "Chabaqa"
            },
            "areaServed": {
              "@type": "Country",
              "name": "Global"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Community Platform Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Online Course Creation",
                    "description": "Create and sell online courses with quizzes, certificates, and progress tracking"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Community Challenges",
                    "description": "Run time-limited challenges with leaderboards and rewards"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "1:1 Coaching",
                    "description": "Offer personalized coaching sessions with integrated calendar booking"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Virtual Events",
                    "description": "Host online and offline events with ticketing and attendance tracking"
                  }
                }
              ]
            }
          })
        }}
      />
    </>
  )
}
