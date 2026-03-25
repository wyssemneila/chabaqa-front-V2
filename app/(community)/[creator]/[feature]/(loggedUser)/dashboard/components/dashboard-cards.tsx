"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, AlertTriangle, Lock, Loader2, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Design tokens — aligned with landing & explore pages ────────────────────
const T = {
  bg:        "#fafafe",
  surface:   "#ffffff",
  surface2:  "#f5f3ff",
  border:    "#e5e7eb",
  border2:   "#d1d5db",
  text1:     "#111827",
  text2:     "#6b7280",
  text3:     "#9ca3af",
  accent:    "#8e78fb",
  accentDark:"#6c52f0",
  accentBg:  "#ede9ff",
  green:     "#059669",
  greenBg:   "#d1fae5",
  red:       "#dc2626",
  redBg:     "#fee2e2",
  amber:     "#d97706",
  amberBg:   "#fef3c7",
  cyan:      "#0891b2",
  cyanBg:    "#cffafe",
  orange:    "#ea580c",
  orangeBg:  "#ffedd5",
  pink:      "#db2777",
  pinkBg:    "#fce7f3",
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
          <p className="text-[11px] font-bold tracking-[.07em] uppercase" style={{ color: T.text3 }}>
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
              className="flex items-center gap-1 text-[12px] font-semibold transition-opacity hover:opacity-75"
              style={{ color: T.accent }}
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="flex items-center gap-1 text-[12px] font-semibold transition-opacity hover:opacity-75"
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
        "rounded-2xl border p-5 transition-all duration-300 cursor-default",
        href && "cursor-pointer",
        className
      )}
      style={{ background: T.surface, borderColor: T.border }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 16px 48px rgba(142,120,251,.14)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "#c4b8fd";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = T.border;
      }}
    >
      {/* Label + icon row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-[.07em]" style={{ color: T.text3 }}>
          {title}
        </span>
        {Icon && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg || T.accentBg }}
          >
            <Icon className="h-4 w-4" style={{ color: iconColor || T.accent }} />
          </div>
        )}
      </div>

      {/* Value */}
      {isLoading ? (
        <Skeleton className="h-9 w-24 mb-2" />
      ) : (
        <div className="font-black text-[32px] leading-none mb-2 tracking-tight" style={{ color: T.text1 }}>
          {value}
        </div>
      )}

      {/* Trend / description */}
      {(description || trend) && !isLoading && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: trendPositive ? T.greenBg : T.redBg,
                color:      trendPositive ? T.green   : T.red,
              }}
            >
              {trendPositive ? "▲" : "▼"} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
            </span>
          )}
          {description && (
            <span className="text-[12px]" style={{ color: T.text3 }}>{description}</span>
          )}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── ActionCard ───────────────────────────────────────────────────────────────
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
          "group rounded-2xl border p-5 transition-all duration-300",
          !isDisabled && "cursor-pointer",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        style={{ background: T.surface, borderColor: T.border }}
        onMouseEnter={!isDisabled ? (e) => {
          e.currentTarget.style.boxShadow = "0 16px 48px rgba(142,120,251,.14)";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = "#c4b8fd";
        } : undefined}
        onMouseLeave={!isDisabled ? (e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = T.border;
        } : undefined}
      >
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: T.accentBg }}
          >
            {backendRequired
              ? <Lock className="h-5 w-5" style={{ color: T.text3 }} />
              : <Icon className="h-5 w-5" style={{ color: T.accent }} />
            }
          </div>
          {badge && (
            <span className="text-[9px] font-bold tracking-[.06em] px-2 py-0.5 rounded-full border"
              style={{ background: T.surface2, color: T.text3, borderColor: T.border }}>
              {badge}
            </span>
          )}
        </div>

        {/* Title + description */}
        <p className="text-[14px] font-bold mb-1" style={{ color: T.text1 }}>{title}</p>
        <p className="text-[12px] leading-relaxed mb-4" style={{ color: T.text2 }}>{description}</p>

        {/* Footer */}
        <div
          className="flex items-center gap-1.5 text-[12px] font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: backendRequired ? T.text3 : T.accent }}
        >
          {backendRequired ? (
            <><AlertTriangle className="h-3.5 w-3.5" style={{ color: T.amber }} /> Requires backend</>
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
      className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-8 text-center"
      style={{ borderColor: T.border, background: T.surface }}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: T.accentBg }}>
          <Icon className="h-6 w-6" style={{ color: T.accent }} />
        </div>
      )}
      <div>
        <h3 className="text-[15px] font-bold mb-1" style={{ color: T.text1 }}>{title}</h3>
        <p className="text-[13px] max-w-sm" style={{ color: T.text2 }}>{description}</p>
      </div>
      {action && (
        action.href
          ? <Link href={action.href}><button className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px" style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)` }}>{action.label}</button></Link>
          : <button onClick={action.onClick} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px" style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)` }}>{action.label}</button>
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
      className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center"
      style={{ borderColor: "#fca5a5", background: T.redBg }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#fecaca" }}>
        <AlertTriangle className="h-6 w-6" style={{ color: T.red }} />
      </div>
      <div>
        <h3 className="text-[15px] font-bold mb-1" style={{ color: T.text1 }}>{title}</h3>
        <p className="text-[13px] max-w-sm" style={{ color: T.text2 }}>{message}</p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors hover:bg-white"
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
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: T.amberBg }}>
        <Lock className="h-8 w-8" style={{ color: T.amber }} />
      </div>
      <div>
        <h1 className="text-[22px] font-black mb-2" style={{ color: T.text1 }}>Access Restricted</h1>
        <p className="text-[14px] max-w-md" style={{ color: T.text2 }}>
          This dashboard requires <strong>{requiredRole}</strong> access. Your current role is <strong>{role}</strong>.
        </p>
      </div>
      {backAction && (
        <Link href={backAction.href}>
          <button className="px-6 py-3 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px shadow-[0_8px_24px_rgba(142,120,251,.3)]"
            style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)` }}>
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
      className="rounded-2xl border p-5"
      style={{ borderColor: "#fde68a", background: T.amberBg }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4" style={{ color: T.amber }} />
        <p className="text-[13px] font-bold" style={{ color: T.text1 }}>Backend Required</p>
      </div>
      <p className="text-[13px] mb-3" style={{ color: T.text2 }}>
        {description || `The ${feature} feature requires backend endpoint implementation.`}
      </p>
      <span className="inline-block text-[9px] font-bold tracking-[.06em] bg-white px-2 py-0.5 rounded-full border"
        style={{ color: T.amber, borderColor: "#fde68a" }}>
        Pending API
      </span>
    </div>
  );
}
