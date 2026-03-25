
import { Button } from "@/components/ui/button"
import { Filter, Plus } from "lucide-react"
import Link from "next/link"

export function CreatorCoursesHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-4xl font-bold gradient-text-courses">Course Manager</h1>
        <p className="text-muted-foreground mt-2 text-lg">Create and manage your educational content</p>
      </div>
      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button size="sm" className="bg-courses-500 hover:bg-courses-600" asChild>
          <Link href="/creator/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Link>
        </Button>
      </div>
    </div>
  )
}