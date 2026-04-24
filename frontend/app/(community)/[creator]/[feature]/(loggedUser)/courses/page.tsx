import { Suspense } from "react"
import { notFound } from "next/navigation"
import CoursesPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CoursesPageContent'
import { coursesCommunityApi } from "@/lib/api/courses-community.api"

function CoursesGridSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="h-36 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function CoursesContent({
  creatorSlug,
  slug,
}: {
  creatorSlug: string
  slug: string
}) {
  try {
    const data = await coursesCommunityApi.getCoursesPageData(slug)
    
    if (!data.community) {
      notFound()
    }

    return (
      <CoursesPageContent 
        creatorSlug={creatorSlug}
        slug={slug}
        community={data.community}
        allCourses={data.courses}
        userEnrollments={data.userEnrollments}
      />
    )
  } catch (error) {
    console.error('Error loading courses page:', error)
    notFound()
  }
}

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ creator: string; feature: string }>
}) {
  const { creator, feature } = await params
  
  return (
    <Suspense fallback={<CoursesGridSkeleton />}>
      <CoursesContent creatorSlug={creator} slug={feature} />
    </Suspense>
  )
}