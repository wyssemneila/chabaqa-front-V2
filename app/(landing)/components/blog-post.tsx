"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, ArrowLeft, Share2, Tag } from "lucide-react"
import type { BlogPost as BlogPostType } from "@/lib/blog-content"
import "../blogs/blog-styles.css"

interface BlogPostProps {
  post: BlogPostType
}

export function BlogPost({ post }: BlogPostProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <article className="py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Back Button */}
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-chabaqa-primary hover:text-chabaqa-primary/80 font-semibold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Category Badge & Tags */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-chabaqa-primary text-sm font-semibold rounded-full">
            {post.category}
          </span>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Featured Image */}
        <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden mb-8 shadow-md">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{post.readTime}</span>
          </div>
          <button
            onClick={handleShare}
            className="ml-auto flex items-center gap-2 text-chabaqa-primary hover:text-chabaqa-primary/80 transition-colors"
            aria-label="Share this post"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Share</span>
          </button>
        </div>


        {/* Content */}
        <div 
          className="blog-content mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Divider */}
        <div className="border-t border-gray-200 my-12"></div>

        {/* Author Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4">About the Author</h3>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chabaqa-primary to-indigo-300 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {post.author.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-lg mb-1">
                {post.author.name}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {post.author.bio}. Passionate about helping creators build thriving communities and achieve their goals.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-chabaqa-primary to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            Ready to Build Your Community?
          </h3>
          <p className="text-base mb-6 opacity-90">
            Join thousands of creators who are already using Chabaqa to grow their communities and monetize their passion.
          </p>
          <Link
            href="/dashboard/create-community"
            className="inline-block px-8 py-3 bg-white text-chabaqa-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Get Started Free
          </Link>
        </div>

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-chabaqa-primary hover:text-chabaqa-primary/80 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Posts
          </Link>
        </div>
      </div>
    </article>
  )
}
