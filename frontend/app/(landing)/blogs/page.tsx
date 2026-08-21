import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogList } from "../components/blog-list"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getLocale } from "next-intl/server"
import { absoluteUrl, generateAlternateLanguages, generateBreadcrumbSchema, generateOGMetadata, generateTwitterMetadata } from "@/lib/seo-config"
import { getAllBlogPosts } from "@/lib/blog-content"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.blogs")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: generateAlternateLanguages("/blogs"),
    openGraph: generateOGMetadata(t("metaTitle"), t("metaDesc"), "/blogs"),
    twitter: generateTwitterMetadata(t("metaTitle"), t("metaDesc")),
  }
}

export default async function BlogsPage() {
  const posts = getAllBlogPosts()
  const locale = await getLocale()

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
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
            "url": absoluteUrl(`${locale === "ar" ? "/ar" : ""}/blogs`),
            "publisher": {
              "@type": "Organization",
              "name": "Chabaqa",
              "logo": { "@type": "ImageObject", "url": absoluteUrl("/logo_chabaqa.png") }
            },
            "blogPost": posts.map((post) => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "url": absoluteUrl(`/blogs/${post.id}`),
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
          __html: JSON.stringify(
            generateBreadcrumbSchema([
              { name: "Home", url: absoluteUrl("/") },
              { name: "Blog", url: absoluteUrl("/blogs") },
            ]),
          )
        }}
      />
    </main>
  )
}
