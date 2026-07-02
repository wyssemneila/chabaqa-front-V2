'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { searchContent, type SearchHit } from '@/lib/api/search.api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setResults([])
      setTotal(0)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await searchContent({ q: trimmed, limit: 24 })
      setResults(data.hits || [])
      setTotal(data.total || 0)
    } catch {
      setError('Search is temporarily unavailable.')
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQ.trim().length >= 2) {
      void runSearch(initialQ)
    }
  }, [initialQ])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Search Chabaqa</h1>
      <form
        className="mb-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void runSearch(query)
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Courses, communities, events…"
          aria-label="Search"
        />
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {!loading && !error && query.trim().length >= 2 && (
        <p className="mb-4 text-sm text-muted-foreground">{total} result(s)</p>
      )}
      <ul className="space-y-4">
        {results.map((hit) => (
          <li key={hit.id} className="rounded-lg border p-4">
            <p className="text-xs uppercase text-muted-foreground">{hit.type}</p>
            <p className="font-medium">{hit.title}</p>
            {hit.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{hit.description}</p>
            )}
            {hit.slug && (
              <Link className="mt-2 inline-block text-sm text-primary underline" href={`/explore`}>
                View in explore
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
