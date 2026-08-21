
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function PageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-4xl font-bold gradient-text-challenges">Challenge Manager</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Create and manage engaging community challenges
        </p>
      </div>
      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
        <Button
          size="sm"
          className="bg-challenges-500 hover:bg-challenges-600"
          asChild
        >
          <Link href="/creator/challenges/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Link>
        </Button>
      </div>
    </div>
  )
}
