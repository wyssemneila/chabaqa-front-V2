"use client";

import Link from "next/link";
import {
  Bot,
  Headphones,
  Megaphone,
  MessageCircleQuestion,
  Trophy,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiAgent } from "@/lib/api";

const icons = {
  concierge: Bot,
  tutor: GraduationCap,
  challenge_coach: Trophy,
  support: Headphones,
  sales: Megaphone,
};

export function AgentCard({ agent }: { agent: AiAgent }) {
  const Icon = icons[agent.type] || MessageCircleQuestion;
  return (
    <article className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">{agent.name}</h2>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {agent.type.replace("_", " ")}
            </p>
          </div>
        </div>
        <Badge
          variant={agent.status === "active" ? "default" : "secondary"}
          className="rounded-md"
        >
          {agent.status}
        </Badge>
      </div>
      <p className="mt-4 min-h-10 text-sm text-muted-foreground">
        {agent.bio || "Ready to answer with community context and citations."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {agent.enabledSurfaces?.slice(0, 3).map((surface) => (
          <Badge key={surface} variant="outline" className="rounded-md">
            {surface}
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {agent.stats?.conversations || 0} conversations
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={`/creator/ai/staff/${agent._id}`}>Configure</Link>
        </Button>
      </div>
    </article>
  );
}
