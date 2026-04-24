
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent } from "@/components/ui/card"
import { Zap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NoChallengesCard() {
  return (
    <EnhancedCard className="text-center py-12">
      <CardContent>
        <Zap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
        <p className="text-muted-foreground mb-6">
          Create your first challenge to get started
        </p>
        <Button asChild>
          <Link href="/creator/challenges/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Link>
        </Button>
      </CardContent>
    </EnhancedCard>
  )
}
