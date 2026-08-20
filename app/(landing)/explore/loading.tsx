import React from "react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-2">
        <section className="py-2">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-4 max-w-2xl text-center">
              <div className="mx-auto h-8 w-64 animate-pulse rounded bg-gray-200" />
              <div className="mx-auto mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 h-10 w-full animate-pulse rounded bg-gray-100" />
              <div className="flex flex-wrap gap-2">
                <div className="h-7 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-7 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-7 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="aspect-[16/9] animate-pulse bg-gray-100" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                    <div className="h-8 w-full animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
