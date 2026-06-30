"use client";

import { Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function AiUsageMeter({ usage }: { usage?: any }) {
  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 0;
  const percentage = usage?.percentage ?? 0;

  return (
    <section
      aria-label="AI usage"
      className="rounded-xl border border-gray-200 bg-white p-4 text-card-foreground shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Usage & limits</h2>
        </div>
        <Badge variant="secondary" className="rounded-md">
          {usage?.planName || "Plan"}
        </Badge>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{used.toLocaleString()} AI actions</span>
        <span>
          {limit ? `${limit.toLocaleString()} limit` : "Meter warming up"}
        </span>
      </div>
    </section>
  );
}
