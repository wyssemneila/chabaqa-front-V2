"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import { api, type AiAgent } from "@/lib/api";
import { AiShellLayout } from "@/components/ai/ai-shell-layout";
import { AgentCard } from "@/components/ai/agent-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AiStaffPage() {
  const { guard, selectedCommunityId } = useCommunityGuard();
  const [agents, setAgents] = useState<AiAgent[]>([]);

  const load = async () => {
    if (!selectedCommunityId) return;
    setAgents(await api.aiAgents.list(selectedCommunityId));
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load AI staff"));
  }, [selectedCommunityId]);

  if (guard) return guard;

  const reindex = async () => {
    if (!selectedCommunityId) return;
    await api.aiAgents.reindexKnowledge(selectedCommunityId);
    toast.success("Knowledge index refreshed");
  };

  return (
    <AiShellLayout
      title="AI Staff roster"
      description="Create specialist agents with scoped knowledge, surfaces, tone, and escalation behavior."
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={reindex}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reindex knowledge
        </Button>
        <Button asChild>
          <Link href="/creator/ai/staff/new">
            <Plus className="mr-2 h-4 w-4" />
            New agent
          </Link>
        </Button>
      </div>
      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="AI agents"
      >
        {agents.map((agent) => (
          <AgentCard key={agent._id} agent={agent} />
        ))}
        {!agents.length && (
          <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            No AI staff yet. Create a concierge to give members a clear first
            place to ask for help.
          </div>
        )}
      </section>
    </AiShellLayout>
  );
}
