"use client";

import { useState } from "react";
import { Rocket, Save, TrendingUp, Users, Wrench } from "lucide-react";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import { api } from "@/lib/api";
import { AiShellLayout } from "@/components/ai/ai-shell-layout";
import { MemberAiBadge } from "@/components/ai/member-ai-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AiCofounderPage() {
  const { guard, selectedCommunityId } = useCommunityGuard();
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [promise, setPromise] = useState("");
  const [goal, setGoal] = useState("");
  const [durationDays, setDurationDays] = useState<7 | 14 | 30>(14);
  const [result, setResult] = useState<any>(null);

  if (guard) return guard;

  const run = async (kind: "build" | "launch" | "fix" | "grow") => {
    if (kind !== "build" && !selectedCommunityId) return;
    try {
      if (kind === "build")
        setResult(
          await api.aiCofounder.buildCommunity({ niche, audience, promise }),
        );
      if (kind === "launch")
        setResult(
          await api.aiCofounder.createLaunchPlan({
            communityId: selectedCommunityId!,
            durationDays,
            goal,
          }),
        );
      if (kind === "fix")
        setResult(await api.aiCofounder.fixFunnel(selectedCommunityId!));
      if (kind === "grow")
        setResult(await api.aiCofounder.growCommunity(selectedCommunityId!));
      toast.success("Cofounder draft ready");
    } catch (error: any) {
      toast.error(error?.message || "Cofounder could not complete that flow");
    }
  };

  return (
    <AiShellLayout
      title="AI Cofounder workspace"
      description="Build community drafts, launch plans, funnel fixes, and growth campaigns without publishing anything automatically."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Tabs
          defaultValue="build"
          className="rounded-xl border border-[var(--bd)] bg-card p-4 shadow-sm"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-lg bg-muted p-1 lg:grid-cols-4">
            <TabsTrigger value="build">
              <Users className="mr-2 h-4 w-4" />
              Build
            </TabsTrigger>
            <TabsTrigger value="launch">
              <Rocket className="mr-2 h-4 w-4" />
              Launch
            </TabsTrigger>
            <TabsTrigger value="fix">
              <Wrench className="mr-2 h-4 w-4" />
              Fix
            </TabsTrigger>
            <TabsTrigger value="grow">
              <TrendingUp className="mr-2 h-4 w-4" />
              Grow
            </TabsTrigger>
          </TabsList>
          <TabsContent value="build" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="niche">Niche</Label>
                <Input
                  id="niche"
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promise">Promise</Label>
              <Textarea
                id="promise"
                value={promise}
                onChange={(event) => setPromise(event.target.value)}
              />
            </div>
            <Button onClick={() => run("build")}>
              Draft community
            </Button>
          </TabsContent>
          <TabsContent value="launch" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Launch goal</Label>
              <Input
                id="goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={String(durationDays)}
                onValueChange={(value) =>
                  setDurationDays(Number(value) as 7 | 14 | 30)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => run("launch")}
            >
              Create launch plan
            </Button>
          </TabsContent>
          <TabsContent value="fix" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Uses the selected community context to suggest safer landing and
              conversion improvements.
            </p>
            <Button
              onClick={() => run("fix")}
            >
              Fix funnel
            </Button>
          </TabsContent>
          <TabsContent value="grow" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Creates a reactivation campaign draft for inactive members.
            </p>
            <Button
              onClick={() => run("grow")}
            >
              Draft growth campaign
            </Button>
          </TabsContent>
        </Tabs>

        <aside className="rounded-xl border border-[var(--bd)] bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Draft review</h2>
            <MemberAiBadge />
          </div>
          {result ? (
            <>
              <pre className="max-h-[520px] overflow-auto rounded-lg border border-[var(--bd)] bg-[var(--t1)] p-4 text-xs text-[var(--p2)]">
                {JSON.stringify(result, null, 2)}
              </pre>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() =>
                  navigator.clipboard
                    .writeText(JSON.stringify(result, null, 2))
                    .then(() => toast.success("Draft copied"))
                }
              >
                <Save className="mr-2 h-4 w-4" />
                Copy draft
              </Button>
            </>
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-[var(--bd2)] bg-[var(--p2)]/30 text-center text-sm text-muted-foreground">
              Cofounder output appears here for review before publishing.
            </div>
          )}
        </aside>
      </div>
    </AiShellLayout>
  );
}
