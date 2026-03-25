import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogList } from "../components/blog-list"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chabaqa Blog - Community Building, Online Courses & Creator Monetization Tips",
  description: "Expert insights on building engaged communities, creating online courses, monetization strategies, and growing your creator business. Learn from successful creators on Chabaqa.",
  keywords: [
    "community building",
    "online courses",
    "creator monetization",
    "community platform",
    "course creation",
    "challenges",
    "coaching platform",
    "creator economy",
    "membership site",
    "digital products",
    "community engagement",
    "online learning",
    "creator tools"
  ],
  authors: [{ name: "Chabaqa Team" }],
  openGraph: {
    title: "Chabaqa Blog - Community Building & Creator Success",
    description: "Expert insights on building engaged communities, creating online courses, and monetization strategies for creators.",
    url: "https://chabaqa.io/blogs",
    siteName: "Chabaqa",
    type: "website",
    images: [
      {
        url: "/og-blog.jpg",
        width: 1200,
        height: 630,
        alt: "Chabaqa Blog"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Chabaqa Blog - Community Building & Creator Success",
    description: "Expert insights on building engaged communities, creating online courses, and monetization strategies.",
    images: ["/og-blog.jpg"]
  },
  alternates: {
    canonical: "https://chabaqa.io/blogs"
  }
}

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <BlogList />
      <Footer />
      
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Chabaqa Blog",
            "description": "Expert insights on community building, online courses, and creator monetization",
            "url": "https://chabaqa.io/blogs",
            "publisher": {
              "@type": "Organization",
              "name": "Chabaqa",
              "logo": {
                "@type": "ImageObject",
                "url": "https://chabaqa.io/logo.png"
              }
            },
            "blogPost": [
              {
                "@type": "BlogPosting",
                "headline": "Building Engaged Communities: Best Practices for Creators",
                "url": "https://chabaqa.io/blogs/1",
                "datePublished": "2024-02-15",
                "author": {
                  "@type": "Person",
                  "name": "Sarah Johnson"
                }
              }
            ]
          })
        }}
      />
    </main>
  )
}
