"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import { api, type AiAgent } from "@/lib/api";
import { AiShellLayout } from "@/components/ai/ai-shell-layout";
import { MemberAiBadge } from "@/components/ai/member-ai-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = String(params.agentId);
  const { guard, selectedCommunityId } = useCommunityGuard();
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<any>(null);
  const agent = useMemo(
    () => agents.find((item) => item._id === agentId),
    [agents, agentId],
  );

  useEffect(() => {
    if (!selectedCommunityId) return;
    api.aiAgents
      .list(selectedCommunityId)
      .then(setAgents)
      .catch(() => toast.error("Failed to load agent"));
  }, [selectedCommunityId]);

  if (guard) return guard;

  const send = async () => {
    if (!selectedCommunityId || !message.trim()) return;
    const response = await api.aiAgents.chat(
      selectedCommunityId,
      agentId,
      message,
    );
    setAnswer(response);
    setMessage("");
  };

  return (
    <AiShellLayout
      title={agent?.name || "AI agent"}
      description="Review configuration and test the member-facing response with citations."
    >
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {agent?.type?.replace("_", " ") || "Agent"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {agent?.bio || "Loading configuration..."}
              </p>
            </div>
            <MemberAiBadge />
          </div>
          <div className="flex flex-wrap gap-2">
            {agent?.enabledSurfaces?.map((surface) => (
              <Badge key={surface} variant="outline" className="rounded-md">
                {surface}
              </Badge>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Test chat</h2>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask what members might ask..."
            />
            <Button onClick={send} aria-label="Send test message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {answer && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              <p>{answer.answer}</p>
              <div className="mt-3 space-y-2">
                {answer.citations?.map((citation: any, index: number) => (
                  <p
                    key={index}
                    className="rounded-md border bg-card p-2 text-xs text-muted-foreground"
                  >
                    {citation.excerpt}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </AiShellLayout>
  );
}
