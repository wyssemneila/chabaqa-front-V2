
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function ChallengeHeader({
  challenge,
  isLoading,
  onSave,
  onPublish,
  isPublishing = false,
}: {
  challenge: any
  isLoading: boolean
  onSave: () => void
  onPublish: () => void
  isPublishing?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/challenges">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text-challenges">Manage Challenge</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-muted-foreground">{challenge.title}</p>
            <Badge variant={challenge.isActive ? "default" : "secondary"}>
              {challenge.isActive ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {!challenge.isActive && (
          <Button size="sm" variant="secondary" onClick={onPublish} disabled={isPublishing}>
            {isPublishing ? "Publishing..." : "Publish Challenge"}
          </Button>
        )}
        <Button size="sm" onClick={onSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
