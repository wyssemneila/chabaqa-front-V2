import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, Save } from "lucide-react"

export function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text-courses">Create New Course</h1>
          <p className="text-muted-foreground mt-1">Build engaging educational content for your community</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
      </div>
    </div>
  )
}