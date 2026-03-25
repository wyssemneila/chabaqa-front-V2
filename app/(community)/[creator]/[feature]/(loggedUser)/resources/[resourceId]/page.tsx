'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, BookOpen, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { communitiesApi } from '@/lib/api/communities.api'
import { resourcesApi } from '@/lib/api/resources.api'
import type {
  Community,
  Resource,
  ResourceContentElement,
  ResourceContentGuide,
  ResourceContentVideo,
} from '@/lib/api/types'
import { resolveImageUrl } from '@/lib/resolve-image-url'

const renderElement = (element: ResourceContentElement, index: number) => {
  const key = `${element.type}-${index}`
  const content = element.content

  switch (element.type) {
    case 'text':
      return (
        <p key={key} className="leading-relaxed text-sm text-slate-700">
          {content}
        </p>
      )
    case 'quote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-amber-200 bg-amber-50 px-4 py-3 text-sm italic text-amber-900"
        >
          {content}
        </blockquote>
      )
    case 'code':
      return (
        <pre key={key} className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          <code>{content}</code>
        </pre>
      )
    case 'image':
      return (
        <div key={key} className="space-y-2">
          <div className="relative h-64 w-full overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={resolveImageUrl(content) || content}
              alt={element.alt || element.title || 'Resource image'}
              fill
              className="object-cover"
            />
          </div>
          {(element.caption || element.description) && (
            <p className="text-xs text-slate-500">{element.caption || element.description}</p>
          )}
        </div>
      )
    case 'video':
      return (
        <div key={key} className="space-y-2">
          <video controls className="w-full rounded-xl">
            <source src={content} />
          </video>
          {element.caption && <p className="text-xs text-slate-500">{element.caption}</p>}
        </div>
      )
    case 'audio':
      return (
        <div key={key} className="space-y-2">
          <audio controls className="w-full">
            <source src={content} />
          </audio>
        </div>
      )
    case 'link':
      return (
        <a
          key={key}
          href={content}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary-600 underline-offset-2 hover:underline"
        >
          {element.title || content}
        </a>
      )
    default:
      return null
  }
}

export default function CommunityResourcePage({
  params,
}: {
  params: Promise<{ creator: string; feature: string; resourceId: string }>
}) {
  const { creator, feature, resourceId } = use(params)
  const normalisedSlug = decodeURIComponent(feature).trim()

  const [community, setCommunity] = useState<Community | null>(null)
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [communityResponse, resourceResponse] = await Promise.all([
          communitiesApi.getBySlug(normalisedSlug),
          resourcesApi.getById(resourceId),
        ])

        const communityPayload =
          (communityResponse as any)?.data?.data ?? communityResponse?.data
        const resolvedCommunity = Array.isArray(communityPayload)
          ? communityPayload[0]
          : communityPayload

        setCommunity(resolvedCommunity as Community)
        setResource(resourceResponse as Resource)
      } catch (err: any) {
        setError(err?.message || 'Unable to load resource')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [normalisedSlug, resourceId])

  const basePath = `/${encodeURIComponent(creator)}/${encodeURIComponent(normalisedSlug)}`

  const contentBlocks = useMemo(() => {
    if (!resource?.content) return []

    if (resource.type === 'Guide') {
      const guide = resource.content as ResourceContentGuide
      const sections = guide.sections || []
      return sections
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map((section) => ({
          title: section.title,
          description: section.description,
          elements: section.elements || [],
        }))
    }

    if (resource.type === 'Video') {
      const video = resource.content as ResourceContentVideo
      return [
        {
          title: 'Video',
          elements: video.description || [],
          videoUrl: video.videoUrl,
        },
      ]
    }

    const elements = (resource.content as any)?.elements || []
    return [
      {
        title: 'Overview',
        elements,
      },
    ]
  }, [resource])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading resource...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border border-red-200 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-full bg-red-50 p-3 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Unable to load resource</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {error || 'Resource not available'}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href={`${basePath}/learning-path`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to learning path
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`${basePath}/learning-path`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Learning Path
              </Link>
            </Button>
          </div>

          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            {resource.coverImageUrl && (
              <div className="relative h-64 w-full">
                <Image
                  src={resolveImageUrl(resource.coverImageUrl) || resource.coverImageUrl}
                  alt={resource.titre}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{resource.type}</Badge>
                {resource.category && <Badge variant="outline">{resource.category}</Badge>}
                {resource.readTime && (
                  <Badge variant="outline">{resource.readTime}</Badge>
                )}
              </div>

              <h1 className="text-2xl font-semibold text-foreground">{resource.titre}</h1>
              <p className="text-sm text-muted-foreground">{resource.description}</p>

              {resource.type === 'Video' && (resource.content as any)?.videoUrl && (
                <div className="rounded-xl bg-slate-100 p-3">
                  <video controls className="w-full rounded-lg">
                    <source src={(resource.content as any).videoUrl} />
                  </video>
                </div>
              )}
            </CardContent>
          </Card>

          {contentBlocks.map((block, index) => (
            <Card key={`${block.title}-${index}`} className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                {block.title && (
                  <h2 className="text-lg font-semibold text-foreground">{block.title}</h2>
                )}
                {block.description && (
                  <p className="text-sm text-muted-foreground">{block.description}</p>
                )}
                {block.videoUrl && (
                  <video controls className="w-full rounded-xl">
                    <source src={block.videoUrl} />
                  </video>
                )}
                <div className="space-y-3">
                  {(block.elements || []).map((element: ResourceContentElement, idx: number) =>
                    renderElement(element, idx),
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <BookOpen className="h-4 w-4 text-amber-600" />
                Community context
              </div>
              <p className="text-base font-semibold text-foreground">{community?.name}</p>
              <p className="text-sm text-muted-foreground">
                {community?.description || 'Community overview not available.'}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`${basePath}/home`}>Go to community feed</Link>
              </Button>
            </CardContent>
          </Card>

          {resource.tags && resource.tags.length > 0 && (
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-3 p-5">
                <h3 className="text-sm font-semibold text-foreground">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
