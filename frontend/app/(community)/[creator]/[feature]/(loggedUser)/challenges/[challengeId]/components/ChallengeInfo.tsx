import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface ChallengeInfoProps {
  challenge: any
}

export default function ChallengeInfo({ challenge }: ChallengeInfoProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Challenge Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Start Date</span>
          <span className="font-medium">{formatDate(challenge.startDate)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>End Date</span>
          <span className="font-medium">{formatDate(challenge.endDate)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Duration</span>
          <span className="font-medium">{challenge.duration}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Difficulty</span>
          <Badge variant="outline" className="text-xs">
            {challenge.difficulty}
          </Badge>
        </div>
        {challenge.notes && (
          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-2">Challenge Notes</h4>
            <p className="text-sm text-muted-foreground">{challenge.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}