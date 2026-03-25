import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FAQ } from "../components/faq"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | Chabaqa Community Platform",
  description: "Find answers to common questions about Chabaqa , the all-in-one community platform. Learn about creating communities, online courses, challenges, coaching sessions, events, and monetization strategies.",
  keywords: [
    // English keywords
    "chabaqa faq",
    "community platform questions",
    "online course platform faq",
    "creator platform help",
    "community building questions",
    "course creation help",
    "coaching platform faq",
    "membership site questions",
    "creator monetization faq",
    // Arabic transliterations for SEO
    "shabqa",
    "chabka",
    "shabka",
    "chabqa",
    "chabaqa",
    "shabqa platform",
    "chabka community",
    "shabka online",
    "شبقة",
    // Long-tail keywords
    "how to create community chabaqa",
    "chabaqa pricing questions",
    "online course platform comparison",
    "best community platform for creators",
    "how to monetize community",
    "chabaqa vs other platforms",
    "community engagement tools",
    "creator economy platform"
  ],
  authors: [{ name: "Chabaqa" }],
  openGraph: {
    title: "FAQ - Frequently Asked Questions | Chabaqa Community Platform",
    description: "Get answers to all your questions about Chabaqa, the all-in-one platform for creators to build, engage, and monetize their communities.",
    url: "https://chabaqa.io/faq",
    siteName: "Chabaqa",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_TN"],
    images: [
      {
        url: "/og-faq.jpg",
        width: 1200,
        height: 630,
        alt: "Chabaqa FAQ - Community Platform Questions"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ - Frequently Asked Questions | Chabaqa",
    description: "Get answers to all your questions about Chabaqa community platform.",
    images: ["/og-faq.jpg"],
    creator: "@chabaqa"
  },
  alternates: {
    canonical: "https://chabaqa.io/faq",
    languages: {
      'en': 'https://chabaqa.io/faq',
      'ar': 'https://chabaqa.io/ar/faq'
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
  other: {
    'revisit-after': '7 days',
    'distribution': 'global',
    'rating': 'general',
    'geo.region': 'TN',
    'geo.placename': 'Tunisia',
  }
}

export default function FAQPage() {
  return (
    <>
      <main className="min-h-screen bg-white">
        <Header />
        <FAQ />
        <Footer />
      </main>
      
      {/* Enhanced JSON-LD Structured Data for FAQ Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "name": "Chabaqa Frequently Asked Questions",
            "description": "Comprehensive FAQ about Chabaqa community platform, online courses, challenges, coaching, and monetization",
            "url": "https://chabaqa.io/faq",
            "inLanguage": "en",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What makes Chabaqa different from other community platforms?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Chabaqa is an all-in-one community platform built for creators, coaches, and educators who want to grow and monetize their audience in one place. It gives you the tools to create and sell online courses, run interactive challenges, offer one-on-one coaching, host virtual events, and deliver digital products — all from a single, integrated system. Unlike fragmented solutions, Chabaqa removes the need for multiple subscriptions or complicated integrations."
                }
              },
              {
                "@type": "Question",
                "name": "How do I create a community on Chabaqa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "After signing up at chabaqa.io, click the 'Create New Community' button, add your community name and description, customize colors, banners, and logo, and select features for your landing page. Generate an 'Invite Link' to share anywhere; anyone who clicks can join instantly. It's simple, fast, and fully branded from day one."
                }
              },
              {
                "@type": "Question",
                "name": "Is Chabaqa only for creating online courses?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, Chabaqa is a complete all-in-one community platform. Beyond courses with quizzes, certificates, and progress tracking, you can run paid challenges with leaderboards, sell digital products like templates and ebooks, offer 1:1 coaching sessions with calendar booking, and host live events with ticketing—all within the same community dashboard."
                }
              },
              {
                "@type": "Question",
                "name": "How can users book a 1:1 coaching session on Chabaqa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Users navigate to the '1:1 Sessions' section in your community, see your pre-set availability calendar, select a date and time, complete booking with any custom questions, and make secure payment if priced. The slot auto-blocks on your calendar, and users receive confirmation plus a direct meeting link via DM or email."
                }
              },
              {
                "@type": "Question",
                "name": "What is the difference between Courses and Challenges on Chabaqa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Courses are long-term learning resources that remain permanently available for all members, designed for flexible, self-paced learning. Challenges are intensive, highly-structured learning experiences built to maximize engagement within a specific timeframe, with daily checkpoints, time-limited enrollment, leaderboards, and rewards."
                }
              }
            ],
            "publisher": {
              "@type": "Organization",
              "name": "Chabaqa",
              "url": "https://chabaqa.io",
              "logo": {
                "@type": "ImageObject",
                "url": "https://chabaqa.io/logo.png"
              },
              "sameAs": [
                "https://twitter.com/chabaqa",
                "https://facebook.com/chabaqa",
                "https://linkedin.com/company/chabaqa"
              ]
            }
          })
        }}
      />
      
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://chabaqa.io"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "FAQ",
                "item": "https://chabaqa.io/faq"
              }
            ]
          })
        }}
      />
      
      {/* WebSite Schema with Search Action */}
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
            }
          })
        }}
      />
    </>
  )
}
