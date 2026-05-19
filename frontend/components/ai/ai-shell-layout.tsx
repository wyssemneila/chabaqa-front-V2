"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Bot, Gauge, Rocket, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/creator/ai", label: "Overview", icon: Gauge },
  { href: "/creator/ai/staff", label: "AI Staff", icon: Bot },
  { href: "/creator/ai/cofounder", label: "Cofounder", icon: Rocket },
  { href: "/creator/ai/create", label: "Create with AI", icon: Wand2 },
];

export function AiShellLayout({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg)] text-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">Chabaqa AI</p>
              <p className="text-xs text-muted-foreground">
                Studio control room
              </p>
            </div>
          </div>
          <nav aria-label="Chabaqa AI">
            <div className="grid gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>
        <main id="ai-main" className="space-y-6">
          <header className="rounded-xl border border-[var(--bd)] bg-gradient-to-br from-card via-card to-[var(--p2)]/60 p-6 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
              Chabaqa AI · Review before publish
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--t1)] md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--t2)]">
              {description}
            </p>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
