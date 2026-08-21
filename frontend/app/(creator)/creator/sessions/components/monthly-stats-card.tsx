import { Star } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";

interface MonthlyStatsCardProps {
  completed?: number
  hours?: number
  revenue?: number
  avgRating?: number | undefined
}

export default function MonthlyStatsCard({ completed = 0, hours = 0, revenue = 0, avgRating }: MonthlyStatsCardProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="text-lg">This Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Sessions Completed</span><span className="font-semibold">{completed}</span></div>
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Hours Mentored</span><span className="font-semibold">{Number(hours).toFixed(1)}</span></div>
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Revenue Generated</span><span className="font-semibold text-green-600">{Number(revenue).toLocaleString()} TND</span></div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avg Rating</span>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="font-semibold">
              {typeof avgRating === "number" && Number.isFinite(avgRating) ? Number(avgRating).toFixed(1) : "N/A"}
            </span>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  );
}
