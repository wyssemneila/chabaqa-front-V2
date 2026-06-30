import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white text-slate-950 flex items-center justify-center px-6">
      <section className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-600">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-4 text-slate-600">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white">
            Go home
          </Link>
          <Link href="/explore" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-900">
            Explore
          </Link>
        </div>
      </section>
    </main>
  )
}
