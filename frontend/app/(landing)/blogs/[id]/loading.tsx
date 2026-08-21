export default function Loading() {
  return (
    <div style={{ background: "var(--bg,#fafafe)", minHeight: "100vh" }}>
      {/* Hero skeleton */}
      <div className="pt-24 pb-12 px-6 text-center animate-pulse">
        <div className="max-w-3xl mx-auto">
          <div className="h-4 w-28 bg-[var(--bd)] rounded mx-auto mb-6" />
          <div className="h-6 w-24 bg-[var(--bd)] rounded-full mx-auto mb-4" />
          <div className="h-10 w-3/4 bg-[var(--bd)] rounded-xl mx-auto mb-4" />
          <div className="h-10 w-1/2 bg-[var(--bd)] rounded-xl mx-auto mb-6" />
          <div className="flex items-center justify-center gap-4">
            <div className="h-4 w-24 bg-[var(--bd)] rounded" />
            <div className="h-4 w-20 bg-[var(--bd)] rounded" />
            <div className="h-8 w-20 bg-[var(--bd)] rounded-full" />
          </div>
        </div>
      </div>

      {/* Two-column layout skeleton */}
      <div className="max-w-5xl mx-auto px-6 pb-20 flex gap-12">
        {/* Sidebar */}
        <div className="hidden lg:block w-52 flex-shrink-0 animate-pulse pt-4">
          <div className="h-3 w-24 bg-[var(--bd)] rounded mb-4" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 bg-[var(--bd)] rounded mb-2" style={{ width: `${60 + i * 5}%` }} />
          ))}
          <div className="mt-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-[var(--bd)] rounded mb-2 ms-4" style={{ width: `${50 + i * 4}%` }} />
          ))}
        </div>

        {/* Article content */}
        <div className="flex-1 animate-pulse">
          {/* Paragraph lines */}
          {[...Array(4)].map((_, pi) => (
            <div key={pi} className="mb-6">
              {[...Array(5)].map((_, li) => (
                <div key={li} className="h-4 bg-[var(--bd)] rounded mb-2" style={{ width: li === 4 ? "60%" : "100%" }} />
              ))}
            </div>
          ))}
          {/* Heading */}
          <div className="h-7 w-2/3 bg-[var(--bd)] rounded mb-4 mt-8" />
          {[...Array(3)].map((_, pi) => (
            <div key={pi} className="mb-6">
              {[...Array(4)].map((_, li) => (
                <div key={li} className="h-4 bg-[var(--bd)] rounded mb-2" style={{ width: li === 3 ? "70%" : "100%" }} />
              ))}
            </div>
          ))}
          {/* Heading */}
          <div className="h-7 w-1/2 bg-[var(--bd)] rounded mb-4 mt-8" />
          {[...Array(3)].map((_, pi) => (
            <div key={pi} className="mb-6">
              {[...Array(4)].map((_, li) => (
                <div key={li} className="h-4 bg-[var(--bd)] rounded mb-2" style={{ width: li === 3 ? "55%" : "100%" }} />
              ))}
            </div>
          ))}

          {/* Author card skeleton */}
          <div className="rounded-2xl border border-[var(--bd)] p-6 mt-12">
            <div className="h-3 w-24 bg-[var(--bd)] rounded mb-4" />
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--bd)] flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-[var(--bd)] rounded mb-2" />
                <div className="h-3 w-20 bg-[var(--bd)] rounded mb-3" />
                <div className="h-3 bg-[var(--bd)] rounded mb-2" />
                <div className="h-3 bg-[var(--bd)] rounded mb-2 w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
