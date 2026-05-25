"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TbPlus, TbRefresh } from "react-icons/tb";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import { api, type AiAgent } from "@/lib/api";
import { AiShellLayout } from "@/components/ai/ai-shell-layout";
import { AgentCard } from "@/components/ai/agent-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AiStaffPage() {
  const { guard, selectedCommunityId } = useCommunityGuard();
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [knowledgeStatus, setKnowledgeStatus] = useState<{ count: number; status: string; updatedAt: string | null; sourceTypes?: Array<{ sourceType: string; count: number }> } | null>(null);

  const load = async () => {
    if (!selectedCommunityId) return;
    const [nextAgents, nextKnowledgeStatus] = await Promise.all([
      api.aiAgents.list(selectedCommunityId),
      api.aiAgents.getKnowledgeStatus(selectedCommunityId).catch(() => null),
    ]);
    setAgents(nextAgents);
    setKnowledgeStatus(nextKnowledgeStatus);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load AI staff"));
  }, [selectedCommunityId]);

  if (guard) return guard;

  const reindex = async () => {
    if (!selectedCommunityId) return;
    const result = await api.aiAgents.reindexKnowledge(selectedCommunityId);
    setKnowledgeStatus(await api.aiAgents.getKnowledgeStatus(selectedCommunityId).catch(() => null));
    toast.success(`Knowledge index refreshed (${result.indexed} document${result.indexed === 1 ? "" : "s"})`);
  };

  return (
    <AiShellLayout
      title="AI Staff roster"
      description="Create specialist agents with scoped knowledge, surfaces, tone, and escalation behavior."
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={reindex}>
          <TbRefresh className="mr-2 h-4 w-4" />
          Reindex knowledge
        </Button>
        <Button asChild>
          <Link href="/creator/ai/staff/new">
            <TbPlus className="mr-2 h-4 w-4" />
            New agent
          </Link>
        </Button>
      </div>
      <Card className="border-dashed bg-white/80">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">Knowledge index</p>
              <Badge variant={knowledgeStatus?.status === "ready" ? "default" : "secondary"}>
                {knowledgeStatus?.status || "unknown"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {knowledgeStatus
                ? `${knowledgeStatus.count} indexed source${knowledgeStatus.count === 1 ? "" : "s"}${knowledgeStatus.updatedAt ? ` · last indexed ${new Date(knowledgeStatus.updatedAt).toLocaleString()}` : ""}`
                : "Index status unavailable."}
            </p>
          </div>
          {knowledgeStatus?.sourceTypes?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {knowledgeStatus.sourceTypes.map((source) => (
                <Badge key={source.sourceType} variant="outline" className="capitalize">
                  {source.sourceType.replace(/_/g, " ")}: {source.count}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="AI agents"
      >
        {agents.map((agent) => (
          <AgentCard key={agent._id} agent={agent} />
        ))}
        {!agents.length && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            No AI staff yet. Create a concierge to give members a clear first
            place to ask for help.
          </div>
        )}
      </section>
    </AiShellLayout>
  );
}
