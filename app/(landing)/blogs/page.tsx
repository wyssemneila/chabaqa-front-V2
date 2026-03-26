import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogList } from "../components/blog-list"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { generateAlternateLanguages } from "@/lib/seo-config"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.blogs")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: generateAlternateLanguages("/blogs"),
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
