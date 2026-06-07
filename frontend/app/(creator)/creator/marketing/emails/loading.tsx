export default function Loading() {
  return (
    <div className="w-full max-w-none space-y-6">
      <div className="rounded-lg border bg-white p-5">
        <div className="h-6 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-60 animate-pulse rounded-lg border bg-white" />
        ))}
      </div>
    </div>
  )
}
