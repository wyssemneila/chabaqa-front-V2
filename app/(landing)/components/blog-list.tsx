"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react"
import { getAllBlogPosts, getAllCategories } from "@/lib/blog-content"

const POSTS_PER_PAGE = 6

export function BlogList() {
  const allBlogPosts = getAllBlogPosts()
  const allCategories = ["All", ...getAllCategories()]
  
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [displayCount, setDisplayCount] = useState(POSTS_PER_PAGE)

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") {
      return allBlogPosts
    }
    return allBlogPosts.filter(post => post.category === selectedCategory)
  }, [selectedCategory])

  // Get posts to display (with pagination)
  const displayedPosts = filteredPosts.slice(0, displayCount)
  const hasMorePosts = displayCount < filteredPosts.length

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + POSTS_PER_PAGE)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setDisplayCount(POSTS_PER_PAGE) // Reset to initial count when changing category
  }

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Chabaqa Blog
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, tips, and stories to help you build and grow your community
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-chabaqa-primary text-white border-chabaqa-primary"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-chabaqa-primary hover:text-white hover:border-chabaqa-primary"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {displayedPosts.length > 0 && (
          <div className="mb-16">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative w-full aspect-video">
                  <Image
                    src={displayedPosts[0].image}
                    alt={displayedPosts[0].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-chabaqa-primary text-white text-xs font-semibold rounded-full">
                      <Tag className="w-3 h-3" />
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-chabaqa-primary text-xs font-semibold rounded-full">
                      {displayedPosts[0].category}
                    </span>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(displayedPosts[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {displayedPosts[0].readTime}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                    {displayedPosts[0].title}
                  </h2>
                  <p className=" text-sm text-gray-600 mb-6 leading-relaxed">
                    {displayedPosts[0].excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chabaqa-primary to-indigo-300 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {displayedPosts[0].author.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {displayedPosts[0].author.name}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/blogs/${displayedPosts[0].id}`}
                      className="inline-flex items-center gap-2 text-chabaqa-primary font-semibold hover:gap-3 transition-all duration-200"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Grid */}
        {displayedPosts.length > 1 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedPosts.slice(1).map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              <div className="relative w-full aspect-video overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-chabaqa-primary text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-chabaqa-primary transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chabaqa-primary to-indigo-300 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        {post.author.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {post.author.name}
                    </span>
                  </div>
                  
                  <Link
                    href={`/blogs/${post.id}`}
                    className="text-chabaqa-primary font-semibold text-sm hover:underline"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </article>
          ))}
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No posts found in this category.</p>
            <button
              onClick={() => handleCategoryChange("All")}
              className="mt-4 text-chabaqa-primary font-semibold hover:underline"
            >
              View all posts
            </button>
          </div>
        ) : null}

        {/* Load More */}
        {hasMorePosts && (
          <div className="mt-12 text-center">
            <button 
              onClick={handleLoadMore}
              className="px-8 py-3 bg-chabaqa-primary text-white font-semibold rounded-lg hover:bg-chabaqa-primary/90 transition-colors duration-200"
            >
              Load More Posts
            </button>
            <p className="mt-3 text-sm text-gray-600">
              Showing {displayedPosts.length} of {filteredPosts.length} posts
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
