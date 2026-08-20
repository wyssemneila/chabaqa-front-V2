import Link from "next/link"
import { CalendarDays, Mail } from "lucide-react"

type LegalSection = {
  id: string
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

interface LegalDocumentLayoutProps {
  title: string
  subtitle: string
  effectiveDate: string
  lastUpdated: string
  contactEmail: string
  sections: LegalSection[]
  labels?: {
    badge?: string
    effective?: string
    updated?: string
    onThisPage?: string
    relatedDocument?: string
  }
  relatedLink: {
    href: string
    label: string
    description: string
  }
}

export function LegalDocumentLayout({
  title,
  subtitle,
  effectiveDate,
  lastUpdated,
  contactEmail,
  sections,
  labels,
  relatedLink,
}: LegalDocumentLayoutProps) {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-gray-100 bg-white">
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          <div className="rounded-3xl border border-white/50 bg-gradient-to-br from-chabaqa-primary via-chabaqa-secondary2 to-chabaqa-secondary1 p-8 text-white shadow-2xl shadow-cyan-200/40 backdrop-blur-sm sm:p-10">
            <p className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              {labels?.badge || "Legal"}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-base text-white/90 sm:text-lg">{subtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2">
                <CalendarDays className="h-4 w-4" />
                {labels?.effective || "Effective"}: {effectiveDate}
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2">
                <CalendarDays className="h-4 w-4" />
                {labels?.updated || "Updated"}: {lastUpdated}
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2">
                <Mail className="h-4 w-4" />
                {contactEmail}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-8 lg:pb-24 lg:pt-10">
        <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">{labels?.onThisPage || "On This Page"}</h2>
            <nav className="mt-4 space-y-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg border border-transparent px-3 py-2 text-sm text-gray-600 transition-all hover:border-chabaqa-primary/25 hover:bg-chabaqa-primary/5 hover:text-chabaqa-primary"
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>

            <div className="mt-6 rounded-xl border border-chabaqa-primary/20 bg-chabaqa-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-chabaqa-primary">{labels?.relatedDocument || "Related Document"}</p>
              <p className="mt-2 text-sm text-gray-600">{relatedLink.description}</p>
              <Link
                href={relatedLink.href}
                className="mt-3 inline-flex text-sm font-semibold text-chabaqa-primary hover:text-chabaqa-primary/80"
              >
                {relatedLink.label}
              </Link>
            </div>
          </aside>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="space-y-6">
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
                >
                  <h2 className="text-2xl font-bold text-gray-900">
                    {index + 1}. {section.title}
                  </h2>

                  {section.paragraphs && (
                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-base leading-7 text-gray-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {section.bullets && (
                    <ul className="mt-4 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-gray-600">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-chabaqa-primary" />
                          <span className="text-base leading-7">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
