"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Eye, Share } from "lucide-react"
import Link from "next/link"
import { Course } from "@/lib/models"

interface CourseHeaderProps {
  course: Course
  onSave: () => void
  isLoading: boolean
}

export function CourseHeader({ course, onSave, isLoading }: CourseHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text-courses">Manage Course</h1>
          <p className="text-muted-foreground mt-1">{course.title}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/creator/courses">
            <Share className="h-4 w-4 mr-2" />
            Landing Page
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/creator/courses">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Link>
        </Button>
        <Button size="sm" onClick={onSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}