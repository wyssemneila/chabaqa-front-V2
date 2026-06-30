import Link from "next/link"
import { ArrowRight, BookOpen, CreditCard, LifeBuoy, Search, ShieldCheck, Sparkles, Users } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const categories = [
  { title: "Getting started", description: "Create an account, join a community, and set up your profile.", icon: Sparkles },
  { title: "Creator setup", description: "Launch a community, publish content, invite members, and price offers.", icon: Users },
  { title: "Payments & refunds", description: "Understand checkout, refunds, payouts, subscriptions, and trials.", icon: CreditCard },
  { title: "Safety & moderation", description: "Learn how reporting, AI checks, appeals, and admin review work.", icon: ShieldCheck },
]

const articles = [
  "How to create your first community",
  "What happens after a member buys an event ticket?",
  "How refunds and manual review work",
  "How AI moderation protects communities",
  "How to invite your first 100 members",
]

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-purple-600">Help center</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Answers before support tickets.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">Searchable guidance for learners, creators, payments, moderation, and launch operations.</p>
          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-left shadow-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-500">Search articles, refunds, events, payouts...</span>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <article key={category.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
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
              {articles.map((article) => (
                <Link key={article} href="/faq" className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                  {article}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
          <aside className="rounded-3xl bg-slate-950 p-6 text-white">
            <LifeBuoy className="h-7 w-7 text-cyan-300" />
            <h2 className="mt-4 text-xl font-black">Need human help?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Creators can open support from the dashboard. Learners can use community support or contact the creator.</p>
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
