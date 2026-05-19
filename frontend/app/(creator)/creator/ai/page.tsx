"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, GraduationCap, Headphones, Rocket, Wand2 } from "lucide-react";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import { api } from "@/lib/api";
import { AiShellLayout } from "@/components/ai/ai-shell-layout";
import { AiUsageMeter } from "@/components/ai/ai-usage-meter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const actions = [
  {
    title: "AI Staff",
    href: "/creator/ai/staff",
    icon: Bot,
    copy: "Create concierge, support, tutor, sales, and coach agents.",
  },
  {
    title: "AI Cofounder",
    href: "/creator/ai/cofounder",
    icon: Rocket,
    copy: "Build communities, launch plans, growth campaigns, and funnel fixes.",
  },
  {
    title: "Create offer",
    href: "/creator/ai/create",
    icon: Wand2,
    copy: "Turn one rough idea into a reviewable Chabaqa draft.",
  },
];

export default function AiHubPage() {
  const {
    guard,
    selectedCommunityId,
    isLoading: communityLoading,
  } = useCommunityGuard();
  const [settings, setSettings] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    if (communityLoading || !selectedCommunityId) return;
    Promise.all([
      api.ai.getSettings(selectedCommunityId),
      api.ai.getUsage(selectedCommunityId),
    ])
      .then(([settingsData, usageData]) => {
        setSettings(settingsData);
        setUsage(usageData);
      })
      .catch(() => toast.error("Failed to load Chabaqa AI"));
  }, [communityLoading, selectedCommunityId]);

  if (guard) return guard;

  const toggle = async (key: string, value: boolean) => {
    if (!selectedCommunityId) return;
    const previous = settings;
    setSettings({ ...settings, [key]: value });
    try {
      await api.ai.updateSettings(selectedCommunityId, { [key]: value } as any);
      toast.success("AI setting updated");
    } catch {
      setSettings(previous);
      toast.error("Could not update setting");
    }
  };

  return (
    <AiShellLayout
      title="Run your creator team from one AI control room."
      description="Configure specialist agents, draft launches, and keep every generated object in review before it reaches members."
    >
      <AiUsageMeter usage={usage} />

      <section
        className="grid gap-4 md:grid-cols-3"
        aria-label="AI quick actions"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <article
              key={action.href}
              className="rounded-xl border border-[var(--bd)] bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--t1)]">
                {action.title}
              </h2>
              <p className="mt-2 min-h-12 text-sm text-[var(--t2)]">
                {action.copy}
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href={action.href}>Open</Link>
              </Button>
            </article>
          );
        })}
      </section>

      <section
        className="grid gap-3 rounded-xl border border-[var(--bd)] bg-card p-4 shadow-sm"
        aria-label="AI settings"
      >
        {[
          [
            "courseTutorEnabled",
            "Course tutor",
            GraduationCap,
            "Chapter-aware answers inside the course player.",
          ],
          [
            "supportAgentEnabled",
            "Support agent",
            Headphones,
            "First response for common member questions.",
          ],
          [
            "agentsEnabled",
            "AI Staff",
            Bot,
            "Enable configurable agents across community surfaces.",
          ],
          [
            "cofounderEnabled",
            "AI Cofounder",
            Rocket,
            "Enable object creation and launch planning flows.",
          ],
        ].map(([key, label, Icon, copy]: any) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-lg border border-[var(--bd)] bg-background/80 p-3"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--t1)]">
                  {label}
                </h2>
                <p className="text-xs text-[var(--t3)]">{copy}</p>
              </div>
            </div>
            <Switch
              checked={Boolean(settings?.[key])}
              onCheckedChange={(value) => toggle(key, value)}
              aria-label={`Toggle ${label}`}
            />
          </div>
        ))}
      </section>
    </AiShellLayout>
  );
}
