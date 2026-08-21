
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function SessionHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/sessions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text-sessions">Create New Session</h1>
          <p className="text-muted-foreground mt-1">Set up a 1-on-1 mentoring session for your community</p>
        </div>
      </div>
    </div>
  )
}