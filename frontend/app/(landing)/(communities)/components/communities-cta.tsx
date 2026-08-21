"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"

/** Minimal centered CTA for the Explore page. */
export function CommunitiesCTA() {
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)

  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 dark:bg-[var(--bg)] sm:py-28" aria-label="Create your community">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-100/70 blur-3xl dark:bg-violet-400/5"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-[var(--t1)] sm:text-5xl lg:text-6xl">
          Ready to build your creator community?
        </h2>
        <p className="mt-5 max-w-2xl text-base text-slate-600 dark:text-[var(--t2)] sm:text-lg">
          Launch, grow, and monetize your Chabaqa community with every creator tool in one place.
        </p>
        <Link
          href={withLocale("/dashboard/create-community")}
          className="mt-8 inline-flex items-center gap-4 rounded-full bg-slate-950 py-1.5 pl-6 pr-1.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-[var(--white)] dark:text-[var(--t1)]"
        >
          Start creating
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950 dark:bg-[var(--p)] dark:text-white">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </Link>
      </div>
    </section>
  )
}
