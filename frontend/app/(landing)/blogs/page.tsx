import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogList } from "../components/blog-list"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getLocale } from "next-intl/server"
import { generateAlternateLanguages } from "@/lib/seo-config"
import { getAllBlogPosts } from "@/lib/blog-content"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.blogs")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: generateAlternateLanguages("/blogs"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDesc"),
      url: "https://chabaqa.io/blogs",
      siteName: "Chabaqa",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  }
}

export default async function BlogsPage() {
  const posts = getAllBlogPosts()
  const locale = await getLocale()
  const baseUrl = "https://chabaqa.io"

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <BlogList />
      <Footer />

      {/* JSON-LD Blog */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Chabaqa Blog",
            "description": "Expert insights on community building, online courses, and creator monetization",
            "url": `${baseUrl}${locale === "ar" ? "/ar" : ""}/blogs`,
            "publisher": {
              "@type": "Organization",
              "name": "Chabaqa",
              "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo.png` }
            },
            "blogPost": posts.map((post) => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "url": `${baseUrl}/blogs/${post.id}`,
              "datePublished": post.date,
              "author": { "@type": "Person", "name": post.author.name }
            }))
          })
        }}
      />

      {/* BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
              { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${baseUrl}/blogs` },
            ]
          })
        }}
      />
    </main>
  )
}
