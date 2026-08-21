export default function Loading() {
  return (
    <div style={{ background: "var(--bg,#fafafe)", minHeight: "100vh" }}>
      {/* Hero skeleton */}
      <div className="pt-32 pb-20 px-6 text-center">
        <div className="animate-pulse max-w-2xl mx-auto">
          <div className="h-6 w-40 bg-[var(--bd)] rounded-full mx-auto mb-6" />
          <div className="h-12 w-80 bg-[var(--bd)] rounded-xl mx-auto mb-4" />
          <div className="h-5 w-64 bg-[var(--bd)] rounded-lg mx-auto" />
        </div>
      </div>
      {/* Filter skeleton */}
      <div className="flex justify-center gap-2 px-6 mb-8">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="animate-pulse h-9 w-20 bg-[var(--bd)] rounded-full" />
        ))}
      </div>
      {/* Cards skeleton grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-[var(--bd)] bg-[var(--white)] animate-pulse">
              <div className="aspect-[16/10] bg-[var(--bd)]" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[var(--bd)] rounded w-1/4" />
                <div className="h-5 bg-[var(--bd)] rounded w-full" />
                <div className="h-5 bg-[var(--bd)] rounded w-3/4" />
                <div className="h-4 bg-[var(--bd)] rounded w-full" />
                <div className="h-4 bg-[var(--bd)] rounded w-5/6" />
                <div className="flex items-center justify-between pt-3 border-t border-[var(--bd)]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--bd)]" />
                    <div className="h-3 w-20 bg-[var(--bd)] rounded" />
                  </div>
                  <div className="h-3 w-16 bg-[var(--bd)] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
