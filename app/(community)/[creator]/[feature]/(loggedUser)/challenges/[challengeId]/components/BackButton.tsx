import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BackButtonProps {
  slug: string
  creatorSlug?: string
}

export default function BackButton({ slug, creatorSlug }: BackButtonProps) {
  // Use the new URL format if creatorSlug is provided
  const backUrl = creatorSlug 
    ? `/${creatorSlug}/${slug}/challenges`
    : `/community/${slug}/challenges`

  return (
    <div className="mb-6">
      <Button variant="ghost" asChild>
        <Link href={backUrl}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Challenges
        </Link>
      </Button>
    </div>
  )
}