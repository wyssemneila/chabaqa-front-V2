import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Compass, CreditCard, Sparkles, Users } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const learnerSteps = [
  { title: "Find your first community", description: "Browse trusted creators, compare topics, and join the space that matches your goal.", icon: Compass },
  { title: "Explore content", description: "Start with free posts, previews, events, or a beginner-friendly course path.", icon: BookOpen },
  { title: "Complete your profile", description: "Add interests and social links so creators and members can recognize you.", icon: Users },
]

const creatorSteps = [
  { title: "Create a community", description: "Pick your niche, logo, promise, pricing, and first channels.", icon: Sparkles },
  { title: "Publish starter content", description: "Add one post, one course/event/product, and a welcome message before inviting members.", icon: CheckCircle2 },
  { title: "Configure payments", description: "Connect billing, payout threshold, refund policy, and affiliate settings.", icon: CreditCard },
]

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-12 text-white shadow-2xl sm:px-10 lg:px-14">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Chabaqa onboarding</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Launch with a checklist, not guesswork.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            A short path for learners and creators so new accounts can reach value without opening random dashboards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
              Find communities <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/creator/create-community" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white">
              Start as creator
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Checklist title="For learners" steps={learnerSteps} />
          <Checklist title="For creators" steps={creatorSteps} />
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Checklist({ title, steps }: { title: string; steps: typeof learnerSteps }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      <div className="mt-6 grid gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Step {index + 1}</p>
                <h3 className="mt-1 font-bold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
