"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, AlertTriangle, Lock, Loader2, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Design tokens (reference dashboard palette) ─────────────────────────────
const T = {
  bg:        "#f5f4f0",
  surface:   "#ffffff",
  surface2:  "#f0efe9",
  border:    "#e4e2db",
  text1:     "#1a1916",
  text2:     "#5a5850",
  text3:     "#9a9890",
  accent:    "#2a5cff",
  accentBg:  "#eef1ff",
  green:     "#1a7a4a",
  greenBg:   "#eaf5ee",
  red:       "#b83232",
  redBg:     "#fdeeed",
  amber:     "#8a5a00",
  amberBg:   "#fef6e4",
} as const;

// ─── DashboardSection ─────────────────────────────────────────────────────────
interface DashboardSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function DashboardSection({ title, description, children, action, className }: DashboardSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[.05em] uppercase" style={{ color: T.text3 }}>
            {title}
          </p>
          {description && (
            <p className="text-[13px] mt-0.5" style={{ color: T.text2 }}>{description}</p>
          )}
        </div>
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-75"
              style={{ color: T.accent }}
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-75"
              style={{ color: T.accent }}
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>
      {children}
    </section>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  iconBg?: string;
  iconColor?: string;
  href?: string;
  className?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, description, icon: Icon, trend, iconBg, iconColor, href, className, isLoading }: StatCardProps) {
  const trendPositive = trend && trend.value >= 0;

  const content = (
    <div
      className={cn(
        "rounded-[14px] border p-[18px_20px] transition-shadow",
        href && "cursor-pointer",
        className
      )}
      style={{
        background: T.surface,
        borderColor: T.border,
      }}
      onMouseEnter={href ? (e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)") : undefined}
      onMouseLeave={href ? (e) => (e.currentTarget.style.boxShadow = "none") : undefined}
    >
      {/* Label + icon row */}
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && (
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
            style={{ background: iconBg || T.accentBg }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: iconColor || T.accent }} />
          </div>
        )}
        <span className="text-[11px] font-medium uppercase tracking-[.05em]" style={{ color: T.text3 }}>
          {title}
        </span>
      </div>

      {/* Value */}
      {isLoading ? (
        <Skeleton className="h-8 w-24 mb-2" />
      ) : (
        <div className="font-mono text-[28px] font-semibold leading-none mb-2" style={{ color: T.text1 }}>
          {value}
        </div>
      )}

      {/* Trend / description */}
      {(description || trend) && !isLoading && (
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: trendPositive ? T.greenBg : T.redBg,
                color:      trendPositive ? T.green   : T.red,
              }}
            >
              {trendPositive ? "▲" : "▼"} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
            </span>
          )}
          {description && (
            <span className="text-[11px]" style={{ color: T.text3 }}>{description}</span>
          )}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── ActionCard (alias: DashboardCard) ───────────────────────────────────────
interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  disabled?: boolean;
  backendRequired?: boolean;
  className?: string;
}

export const ActionCard = forwardRef<HTMLDivElement, ActionCardProps>(
  ({ title, description, icon: Icon, href, onClick, badge, disabled, backendRequired, className }, ref) => {
    const isDisabled = disabled || backendRequired;

    const content = (
      <div
        ref={ref}
        onClick={isDisabled ? undefined : onClick}
        className={cn(
          "group rounded-[14px] border p-[18px_20px] transition-all duration-200",
          !isDisabled && "cursor-pointer",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        style={{ background: T.surface, borderColor: T.border }}
        onMouseEnter={!isDisabled ? (e) => {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)";
          e.currentTarget.style.borderColor = T.border;
        } : undefined}
        onMouseLeave={!isDisabled ? (e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = T.border;
        } : undefined}
      >
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{ background: T.accentBg }}
          >
            {backendRequired
              ? <Lock className="h-5 w-5" style={{ color: T.text3 }} />
              : <Icon className="h-5 w-5" style={{ color: T.accent }} />
            }
          </div>
          {badge && (
            <span className="text-[9px] font-semibold tracking-[.04em] bg-[#f0efe9] text-[#9a9890] px-1.5 py-0.5 rounded-full border border-[#e4e2db]">
              {badge}
            </span>
          )}
        </div>

        {/* Title + description */}
        <p className="text-[13px] font-semibold mb-1" style={{ color: T.text1 }}>{title}</p>
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: T.text2 }}>{description}</p>

        {/* Footer action */}
        <div
          className="flex items-center gap-1 text-[12px] font-medium transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: backendRequired ? T.text3 : T.accent }}
        >
          {backendRequired ? (
            <><AlertTriangle className="h-3.5 w-3.5 text-[#8a5a00]" /> Requires backend</>
          ) : href ? (
            <>Open <ExternalLink className="h-3.5 w-3.5" /></>
          ) : (
            <>Get started <ArrowRight className="h-3.5 w-3.5" /></>
          )}
        </div>
      </div>
    );

    return href && !isDisabled ? <Link href={href}>{content}</Link> : content;
  }
);
ActionCard.displayName = "ActionCard";

// Export alias so both names resolve to the same component
export { ActionCard as DashboardCard };

// ─── DashboardLoading ─────────────────────────────────────────────────────────
export function DashboardLoading({ message = "Loading dashboard..." }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: T.accent }} />
      <p className="text-[13px]" style={{ color: T.text3 }}>{message}</p>
    </div>
  );
}

// ─── DashboardEmpty ───────────────────────────────────────────────────────────
interface DashboardEmptyProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function DashboardEmpty({ icon: Icon, title, description, action }: DashboardEmptyProps) {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-[14px] border border-dashed p-8 text-center"
      style={{ borderColor: T.border, background: T.surface }}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: T.surface2 }}>
          <Icon className="h-6 w-6" style={{ color: T.text3 }} />
        </div>
      )}
      <div>
        <h3 className="text-[14px] font-semibold mb-1" style={{ color: T.text1 }}>{title}</h3>
        <p className="text-[13px] max-w-sm" style={{ color: T.text2 }}>{description}</p>
      </div>
      {action && (
        action.href
          ? <Link href={action.href}><button className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-white transition-opacity hover:opacity-85" style={{ background: T.text1 }}>{action.label}</button></Link>
          : <button onClick={action.onClick} className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-white transition-opacity hover:opacity-85" style={{ background: T.text1 }}>{action.label}</button>
      )}
    </div>
  );
}

// ─── DashboardError ───────────────────────────────────────────────────────────
export function DashboardError({
  title = "Something went wrong",
  message = "We couldn't load this section. Please try again.",
  retry,
}: { title?: string; message?: string; retry?: () => void }) {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-[14px] border p-8 text-center"
      style={{ borderColor: "#fcd5d5", background: T.redBg }}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#fcd5d5" }}>
        <AlertTriangle className="h-6 w-6" style={{ color: T.red }} />
      </div>
      <div>
        <h3 className="text-[14px] font-semibold mb-1" style={{ color: T.text1 }}>{title}</h3>
        <p className="text-[13px] max-w-sm" style={{ color: T.text2 }}>{message}</p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 rounded-[10px] text-[13px] font-medium border transition-colors hover:bg-white"
          style={{ borderColor: T.border, color: T.text1, background: T.surface }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── DashboardUnauthorized ────────────────────────────────────────────────────
export function DashboardUnauthorized({
  role = "member",
  requiredRole = "staff",
  backAction,
}: { role?: string; requiredRole?: string; backAction?: { label: string; href: string } }) {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: T.amberBg }}>
        <Lock className="h-8 w-8" style={{ color: T.amber }} />
      </div>
      <div>
        <h1 className="text-[20px] font-bold mb-2" style={{ color: T.text1 }}>Access Restricted</h1>
        <p className="text-[13px] max-w-md" style={{ color: T.text2 }}>
          This dashboard requires <strong>{requiredRole}</strong> access. Your current role is <strong>{role}</strong>.
        </p>
      </div>
      {backAction && (
        <Link href={backAction.href}>
          <button className="px-5 py-2.5 rounded-[10px] text-[13px] font-medium text-white transition-opacity hover:opacity-85" style={{ background: T.text1 }}>
            {backAction.label}
          </button>
        </Link>
      )}
    </div>
  );
}

// ─── BackendRequiredPlaceholder ───────────────────────────────────────────────
export function BackendRequiredPlaceholder({ feature, description }: { feature: string; description?: string }) {
  return (
    <div
      className="rounded-[14px] border p-[18px_20px]"
      style={{ borderColor: "#f5d9a8", background: T.amberBg }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4" style={{ color: T.amber }} />
        <p className="text-[13px] font-semibold" style={{ color: T.text1 }}>Backend Required</p>
      </div>
      <p className="text-[13px] mb-3" style={{ color: T.text2 }}>
        {description || `The ${feature} feature requires backend endpoint implementation.`}
      </p>
      <span className="inline-block text-[9px] font-semibold tracking-[.04em] bg-white text-[#8a5a00] px-2 py-0.5 rounded-full border border-[#f5d9a8]">
        Pending API
      </span>
    </div>
  );
}
