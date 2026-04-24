"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen } from "lucide-react"
import Link from "next/link"
import { CourseCard } from "./course-card"
import { Course } from "@/lib/models"

interface CreatorCoursesTabsProps {
  allCourses: Course[]
  onDeleted?: (courseId: string) => void
}

export function CreatorCoursesTabs({ allCourses, onDeleted }: CreatorCoursesTabsProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCourses = allCourses.filter((course) => {
    const courseTitle = course.titre || course.title || ''
    const courseDescription = course.description || ''
    const coursePrice = course.prix || course.price || 0

    const matchesSearch =
      courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courseDescription.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "published") {
      return matchesSearch && course.isPublished
    }
    if (activeTab === "draft") {
      return matchesSearch && !course.isPublished
    }
    if (activeTab === "free") {
      return matchesSearch && coursePrice === 0
    }
    if (activeTab === "paid") {
      return matchesSearch && coursePrice > 0
    }
    return matchesSearch
  })

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="all">All Courses ({allCourses.length})</TabsTrigger>
        <TabsTrigger value="published">Published ({allCourses.filter((c) => c.isPublished).length})</TabsTrigger>
        <TabsTrigger value="draft">Draft ({allCourses.filter((c) => !c.isPublished).length})</TabsTrigger>
        <TabsTrigger value="free">Free ({allCourses.filter((c) => (c.prix || c.price || 0) === 0).length})</TabsTrigger>
        <TabsTrigger value="paid">Paid ({allCourses.filter((c) => (c.prix || c.price || 0) > 0).length})</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-6">
        {filteredCourses.length === 0 ? (
          <EnhancedCard className="text-center py-12">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Try adjusting your search terms" : "Create your first course to get started"}
              </p>
              <Button asChild>
                <Link href="/creator/courses/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            </div>
          </EnhancedCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} onDeleted={onDeleted} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
