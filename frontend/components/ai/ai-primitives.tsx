"use client";

import type { IconType } from "react-icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AiPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AiTypeSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; icon: IconType }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Offer type">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-gray-200 bg-white text-muted-foreground hover:border-gray-300 hover:bg-gray-50 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AiHeroStrip({
  badge,
  title,
  icon: Icon,
}: {
  badge: string;
  title: string;
  icon: IconType;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Badge className="rounded-md bg-primary/15 text-primary hover:bg-primary/15">
            {badge}
          </Badge>
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-[var(--t1)] md:text-3xl">
            {title}
          </h2>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

export function AiEmptyDraft({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: IconType;
}) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--t1)]">{title}</h3>
      <p className="max-w-md text-sm text-[var(--t2)]">{description}</p>
    </div>
  );
}

export function AiCodeBlock({ children }: { children: string }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-lg border border-gray-800 bg-[var(--t1)] p-4 text-xs leading-relaxed text-[var(--p2)]">
      {children}
    </pre>
  );
}

