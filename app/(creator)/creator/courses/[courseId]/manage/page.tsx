import { CourseManager } from "./components/course-manager"

export default function ManageCoursePage({ params }: { params: { courseId: string } }) {
  return (
      <CourseManager courseId={params.courseId} />
  )
}