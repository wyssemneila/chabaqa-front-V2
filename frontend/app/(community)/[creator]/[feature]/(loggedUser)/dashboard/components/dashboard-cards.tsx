"use client";

import { forwardRef, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowRight, AlertTriangle, Lock, Loader2, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface DashboardSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function DashboardSection({ title, description, children, action, className }: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && (action.href ? (
          <Button variant="ghost" size="sm" asChild><Link href={action.href}>{action.label}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={action.onClick}>{action.label}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        ))}
      </div>
      {children}
    </section>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  href?: string;
  className?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, description, icon: Icon, trend, href, className, isLoading }: StatCardProps) {
  const content = (
    <Card className={cn("relative overflow-hidden transition-all duration-200", href && "cursor-pointer hover:shadow-md hover:border-primary/20", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-24" /> : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {(description || trend) && (
              <div className="flex items-center gap-2 mt-1">
                {trend && <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-green-600" : "text-red-600")}>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>}
                {description && <span className="text-xs text-muted-foreground">{description}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

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
  ({ title, description, icon: Icon, href, onClick, badge, badgeVariant = "secondary", disabled, backendRequired, className }, ref) => {
    const isDisabled = disabled || backendRequired;
    const content = (
      <Card ref={ref} className={cn("group relative cursor-pointer overflow-hidden transition-all duration-200", !isDisabled && "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5", isDisabled && "cursor-not-allowed opacity-60", className)} onClick={isDisabled ? undefined : onClick}>
        <div className={cn("absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-200", !isDisabled && "group-hover:opacity-100")} />
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-200", !isDisabled && "group-hover:bg-primary/20")}>
              {backendRequired ? <Lock className="h-5 w-5 text-muted-foreground" /> : <Icon className="h-5 w-5 text-primary" />}
            </div>
            {badge && <Badge variant={badgeVariant} className="text-xs">{badge}</Badge>}
          </div>
          <CardTitle className="text-base mt-3">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="relative pt-0">
          <div className={cn("flex items-center text-sm font-medium text-primary transition-all duration-200", !isDisabled && "group-hover:translate-x-1")}>
            {backendRequired ? (<><AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /><span className="text-muted-foreground">Requires backend</span></>) : href ? (<>Open<ExternalLink className="ml-2 h-4 w-4" /></>) : (<>Get started<ArrowRight className="ml-2 h-4 w-4" /></>)}
          </div>
        </CardContent>
      </Card>
    );
    return href && !isDisabled ? <Link href={href}>{content}</Link> : content;
  }
);
ActionCard.displayName = "ActionCard";

export function DashboardLoading({ message = "Loading dashboard..." }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface DashboardEmptyProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function DashboardEmpty({ icon: Icon, title, description, action }: DashboardEmptyProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
      {Icon && <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Icon className="h-6 w-6 text-muted-foreground" /></div>}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {action && (action.href ? <Button asChild><Link href={action.href}>{action.label}</Link></Button> : <Button onClick={action.onClick}>{action.label}</Button>)}
    </div>
  );
}

export function DashboardError({ title = "Something went wrong", message = "We couldn't load this section. Please try again.", retry }: { title?: string; message?: string; retry?: () => void }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
      <div className="space-y-1"><h3 className="text-lg font-semibold">{title}</h3><p className="text-sm text-muted-foreground max-w-sm">{message}</p></div>
      {retry && <Button variant="outline" onClick={retry}>Try again</Button>}
    </div>
  );
}

export function DashboardUnauthorized({ role = "member", requiredRole = "staff", backAction }: { role?: string; requiredRole?: string; backAction?: { label: string; href: string } }) {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"><Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" /></div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md">This dashboard requires <strong>{requiredRole}</strong> access. Your current role is <strong>{role}</strong>.</p>
      </div>
      {backAction && <Button asChild><Link href={backAction.href}>{backAction.label}</Link></Button>}
    </div>
  );
}

export function BackendRequiredPlaceholder({ feature, description }: { feature: string; description?: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" /><CardTitle className="text-base">Backend Required</CardTitle></div>
        <CardDescription>{description || `The ${feature} feature requires backend endpoint implementation.`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">Pending API</Badge>
          <span>This feature will be available once the backend is aligned.</span>
        </div>
      </CardContent>
    </Card>
  );
}
