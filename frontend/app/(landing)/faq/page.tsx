import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FAQ } from "../components/faq"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { generateAlternateLanguages } from "@/lib/seo-config"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.faq")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: generateAlternateLanguages("/faq"),
    robots: { index: true, follow: true },
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
