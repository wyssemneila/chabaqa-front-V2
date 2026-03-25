import { notFound } from "next/navigation"
import CoursesPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CoursesPageContent'
import { coursesCommunityApi } from "@/lib/api/courses-community.api"

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ creator: string; feature: string }>
}) {
  const { creator, feature } = await params
  
  try {
    const data = await coursesCommunityApi.getCoursesPageData(feature)
    
    if (!data.community) {
      notFound()
  }

  return (
    <CoursesPageContent 
      creatorSlug={creator}
      slug={feature}
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