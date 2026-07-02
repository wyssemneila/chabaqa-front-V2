'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BookOpen, CreditCard, LifeBuoy, Search, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  HELP_STATIC_DISCLAIMER,
  PUBLIC_HELP_ARTICLES,
  PUBLIC_HELP_CATEGORIES,
} from '@/lib/help-content'

const categoryIcons = [Sparkles, Users, CreditCard, ShieldCheck]

export default function HelpCenterPage() {
  const [query, setQuery] = useState('')
  const filteredArticles = PUBLIC_HELP_ARTICLES.filter(article =>
    !query.trim() || article.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-purple-600">Help center</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Answers before support tickets.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">{HELP_STATIC_DISCLAIMER}</p>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <label htmlFor="help-search" className="sr-only">Search help articles</label>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 shadow-sm">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                id="help-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter popular articles…"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Full-text search across all docs is coming soon.</p>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLIC_HELP_CATEGORIES.map((category, index) => {
            const Icon = categoryIcons[index] ?? BookOpen
            return (
              <article key={category.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="h-6 w-6 text-purple-600" />
                <h2 className="mt-4 font-bold">{category.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
              </article>
            )
          })}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-black">Popular articles</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {filteredArticles.map((article) => (
                <Link key={article} href="/faq" className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                  {article}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
              {filteredArticles.length === 0 && (
                <p className="text-sm text-slate-500">No articles match your filter.</p>
              )}
            </div>
          </div>
          <aside className="rounded-3xl bg-slate-950 p-6 text-white">
            <LifeBuoy className="h-7 w-7 text-cyan-300" />
            <h2 className="mt-4 text-xl font-black">Need human help?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Creators can open live support from the dashboard. Learners can use community support or contact the creator.</p>
            <Link href="/creator/help" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950">
              Creator help <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}
