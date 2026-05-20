"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TbDeviceFloppy, TbRobot } from "react-icons/tb";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import {
  api,
  type AiAgentSurface,
  type AiAgentTone,
  type AiAgentType,
} from "@/lib/api";
import { AiShellLayout } from "@/components/ai/ai-shell-layout";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const surfaces: AiAgentSurface[] = [
  "community",
  "course",
  "challenge",
  "checkout",
  "support",
];

export default function NewAiAgentPage() {
  const router = useRouter();
  const { guard, selectedCommunityId } = useCommunityGuard();
  const [type, setType] = useState<AiAgentType>("concierge");
  const [tone, setTone] = useState<AiAgentTone>("friendly");
  const [name, setName] = useState("Community Concierge");
  const [bio, setBio] = useState("Helps members find the right next step.");
  const [enabledSurfaces, setEnabledSurfaces] = useState<AiAgentSurface[]>([
    "community",
  ]);
  const [systemPromptOverride, setSystemPromptOverride] = useState("");
  const [saving, setSaving] = useState(false);

  if (guard) return guard;

  const save = async () => {
    if (!selectedCommunityId || !name.trim()) return;
    setSaving(true);
    try {
      const agent = await api.aiAgents.create(selectedCommunityId, {
        type,
        tone,
        name,
        bio,
        enabledSurfaces,
        languages: ["en", "fr", "ar"],
        systemPromptOverride: systemPromptOverride || undefined,
      });
      toast.success("AI agent created");
      router.push(`/creator/ai/staff/${agent._id}`);
    } catch (error: any) {
      toast.error(error?.message || "Could not create agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AiShellLayout
      title="New AI agent"
      description="Choose a role, personality, knowledge behavior, and where this agent is allowed to appear."
    >
      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 text-card-foreground shadow-sm lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={type}
                onValueChange={(value: AiAgentType) => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concierge">Community Concierge</SelectItem>
                  <SelectItem value="tutor">Course Tutor</SelectItem>
                  <SelectItem value="challenge_coach">
                    Challenge Coach
                  </SelectItem>
                  <SelectItem value="support">Support Agent</SelectItem>
                  <SelectItem value="sales">Sales Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={tone}
                onValueChange={(value: AiAgentTone) => setTone(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-bio">Bio</Label>
            <Textarea
              id="agent-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Surfaces</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {surfaces.map((surface) => (
                <label
                  key={surface}
                  className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm transition hover:bg-accent"
                >
                  <Checkbox
                    checked={enabledSurfaces.includes(surface)}
                    onCheckedChange={(checked) =>
                      setEnabledSurfaces((current) =>
                        checked
                          ? [...new Set([...current, surface])]
                          : current.filter((item) => item !== surface),
                      )
                    }
                  />
                  {surface}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="agent-prompt">Guardrails</Label>
            <Textarea
              id="agent-prompt"
              value={systemPromptOverride}
              onChange={(event) => setSystemPromptOverride(event.target.value)}
              placeholder="Optional extra instructions. Keep pricing and policy answers grounded in retrieved sources."
            />
          </div>
          <Button onClick={save} disabled={saving}>
            <TbDeviceFloppy className="mr-2 h-4 w-4" />
            Create agent
          </Button>
        </div>
        <aside className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <TbRobot className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-semibold">{name || "New agent"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{bio}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-primary">
            AI · Review before publish
          </p>
        </aside>
      </section>
    </AiShellLayout>
  );
}
