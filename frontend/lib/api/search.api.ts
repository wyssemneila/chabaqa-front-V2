const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export type SearchResultType = 'community' | 'course' | 'product' | 'event' | 'post'

export interface SearchHit {
  id: string
  type: SearchResultType
  title: string
  description?: string
  slug?: string
  communityId?: string
  url?: string
}

export interface SearchResponse {
  hits: SearchHit[]
  total: number
  page: number
  limit: number
  engine?: string
}

export async function searchContent(params: {
  q: string
  type?: string
  page?: number
  limit?: number
}): Promise<SearchResponse> {
  const query = new URLSearchParams()
  query.set('q', params.q)
  if (params.type) query.set('type', params.type)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const res = await fetch(`${apiBase}/search?${query.toString()}`, {
    next: { revalidate: 30 },
  })
  if (!res.ok) {
    throw new Error('Search failed')
  }
  const json = await res.json()
  return json?.data ?? json
}
