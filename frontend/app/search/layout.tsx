import { Suspense } from 'react'

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10">Loading search…</main>}>
      {children}
    </Suspense>
  )
}
