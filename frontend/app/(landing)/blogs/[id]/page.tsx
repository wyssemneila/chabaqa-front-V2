import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogPost } from "../../components/blog-post"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getBlogPostById, getAllBlogPosts } from "@/lib/blog-content"
import { absoluteUrl, generateAlternateLanguages, generateBreadcrumbSchema } from "@/lib/seo-config"

interface BlogPostPageProps {
  params: Promise<{
    id: string
  }>
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = getAllBlogPosts()
  return posts.map((post) => ({
    id: post.id,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params
  const post = getBlogPostById(id)
  
  if (!post) {
    return {
      title: "Post Not Found | Chabaqa Blog"
    }
  }

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blogs/${post.id}`),
      siteName: "Chabaqa",
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.lastModified || post.date,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: absoluteUrl(post.seo.ogImage || post.image),
          width: 1200,
          height: 630,
          alt: post.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [absoluteUrl(post.seo.ogImage || post.image)],
      creator: post.author.social?.twitter
    },
    alternates: generateAlternateLanguages(`/blogs/${post.id}`),
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params
  const post = getBlogPostById(id)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />
      <BlogPost post={post} />
      <Footer />
      
      {/* JSON-LD Structured Data for Article */}
      <script type="application/ld+json">
        {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": absoluteUrl(post.seo.ogImage || post.image),
            "datePublished": post.date,
            "dateModified": post.lastModified || post.date,
            "author": {
              "@type": "Person",
              "name": post.author.name,
              "description": post.author.bio,
              "jobTitle": post.author.role
            },
            "publisher": {
              "@type": "Organization",
              "name": "Chabaqa",
              "logo": {
                "@type": "ImageObject",
                "url": absoluteUrl("/logo_chabaqa.png")
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": absoluteUrl(`/blogs/${post.id}`)
            },
            "articleSection": post.category,
            "keywords": post.tags.join(", "),
            "wordCount": post.content.split(/\s+/).length,
            "timeRequired": post.readTime
          })}
      </script>
      
      {/* Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify(
          generateBreadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Blog", url: absoluteUrl("/blogs") },
            { name: post.title, url: absoluteUrl(`/blogs/${post.id}`) },
          ]),
        )}
      </script>
    </main>
  )
}
