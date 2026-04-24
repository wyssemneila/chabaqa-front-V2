import { CourseManager } from "./components/course-manager"

export default async function ManageCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  return (
      <CourseManager courseId={courseId} />
  )
}