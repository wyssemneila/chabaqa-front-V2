import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ResourceList from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ResourceList"

interface ChallengeResourcesProps {
  resources: any[]
}

export default function ChallengeResources({ resources }: ChallengeResourcesProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Challenge Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResourceList resources={resources} />
      </CardContent>
    </Card>
  )
}
