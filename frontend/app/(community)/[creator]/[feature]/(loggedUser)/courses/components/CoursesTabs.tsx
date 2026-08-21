"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { idsMatch } from "@/lib/utils/course-id"

interface CoursesTabsProps {
  activeTab: string
  setActiveTab: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  allCourses: any[]
  userEnrollments: any[]
  filteredCourses: any[]
  children: React.ReactNode
}

export default function CoursesTabs({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  allCourses,
  userEnrollments,
  filteredCourses,
  children
}: CoursesTabsProps) {
const enrolledCoursesCount = allCourses.filter((course) =>
  userEnrollments.some((enrollment) => idsMatch(enrollment?.courseId, course)),
).length
const availableCoursesCount = Math.max(0, allCourses.length - enrolledCoursesCount)

return (
  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
    {/* Header Section */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Tabs */}
      <TabsList className="flex w-full overflow-x-auto sm:w-auto sm:overflow-visible hide-scrollbar">
        <TabsTrigger value="all" className="whitespace-nowrap">
          All ({allCourses.length})
        </TabsTrigger>
        <TabsTrigger value="enrolled" className="whitespace-nowrap">
          My Courses ({enrolledCoursesCount})
        </TabsTrigger>
        <TabsTrigger value="free" className="whitespace-nowrap">
          Free ({allCourses.filter((c) => c.price === 0).length})
        </TabsTrigger>
        <TabsTrigger value="paid" className="whitespace-nowrap">
          Paid ({allCourses.filter((c) => c.price > 0).length})
        </TabsTrigger>
        <TabsTrigger value="available" className="whitespace-nowrap">
          Available ({availableCoursesCount})
        </TabsTrigger>
      </TabsList>

      {/* Search + Filter */}
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="relative flex-1 sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>

    {/* Content Section */}
    <TabsContent value={activeTab} className="space-y-6">
      {filteredCourses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No courses match your current filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        children
      )}
    </TabsContent>
  </Tabs>
);




}
