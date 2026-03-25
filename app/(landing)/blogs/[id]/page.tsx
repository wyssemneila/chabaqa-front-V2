import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogPost } from "../../components/blog-post"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getBlogPostById, getAllBlogPosts } from "@/lib/blog-content"

interface BlogPostPageProps {
  params: {
    id: string
  }
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = getAllBlogPosts()
  return posts.map((post) => ({
    id: post.id,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogPostById(params.id)
  
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
      url: `https://chabaqa.io/blogs/${post.id}`,
      siteName: "Chabaqa",
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.lastModified || post.date,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.seo.ogImage || post.image,
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
      images: [post.seo.ogImage || post.image],
      creator: post.author.social?.twitter
    },
    alternates: {
      canonical: `https://chabaqa.io/blogs/${post.id}`
    }
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostById(params.id)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <BlogPost post={post} />
      <Footer />
      
      {/* JSON-LD Structured Data for Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.seo.ogImage || post.image,
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
                "url": "https://chabaqa.io/logo.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://chabaqa.io/blogs/${post.id}`
            },
            "articleSection": post.category,
            "keywords": post.tags.join(", "),
            "wordCount": post.content.split(/\s+/).length,
            "timeRequired": post.readTime
          })
        }}
      />
      
      {/* Breadcrumb Schema */}
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
                "name": "Blog",
                "item": "https://chabaqa.io/blogs"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": `https://chabaqa.io/blogs/${post.slug}`
              }
            ]
          })
        }}
      />
    </main>
  )
}
