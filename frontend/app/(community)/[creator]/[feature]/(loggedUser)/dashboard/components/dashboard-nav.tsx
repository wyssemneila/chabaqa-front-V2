"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "./dashboard-context";
import { cn } from "@/lib/utils";
import { CommunityPermission, ROLE_LABELS, ROLE_COLORS, type CommunityPermissionValue } from "@/lib/permissions";
import {
  Shield,
  Users,
  UserPlus,
  FileText,
  BarChart3,
  DollarSign,
  Megaphone,
  Settings,
  MessageSquare,
  Pin,
  Eye,
  HeadphonesIcon,
  ChevronRight,
  Home,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: CommunityPermissionValue;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  backendRequired?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function getNavSections(basePath: string, variant: "admin" | "moderator" | "support"): NavSection[] {
  const sections: NavSection[] = [];

  if (variant === "admin") {
    sections.push(
      {
        title: "Overview",
        items: [
          { label: "Dashboard Home", href: `${basePath}/admin`, icon: Home },
        ],
      },
      {
        title: "Team Management",
        items: [
          { label: "Staff & Roles", href: `${basePath}/admin/staff`, icon: Shield, permission: CommunityPermission.ROLES_MANAGE },
          { label: "Members", href: `${basePath}/admin/members`, icon: Users, permission: CommunityPermission.MEMBERS_VIEW },
          { label: "Invitations", href: `${basePath}/admin/invitations`, icon: UserPlus, permission: CommunityPermission.MEMBERS_MANAGE },
        ],
      },
      {
        title: "Content",
        items: [
          { label: "Content Management", href: `${basePath}/admin/content`, icon: FileText, permission: CommunityPermission.CONTENT_MANAGE },
          { label: "Post Moderation", href: `${basePath}/admin/moderation`, icon: MessageSquare, permission: CommunityPermission.POSTS_MODERATE },
        ],
      },
      {
        title: "Growth",
        items: [
          { label: "Marketing", href: `${basePath}/admin/marketing`, icon: Megaphone, permission: CommunityPermission.MARKETING_MANAGE },
          { label: "Affiliates", href: `${basePath}/admin/affiliates`, icon: Users, permission: CommunityPermission.AFFILIATES_MANAGE },
        ],
      },
      {
        title: "Insights",
        items: [
          { label: "Analytics", href: `${basePath}/admin/analytics`, icon: BarChart3, permission: CommunityPermission.ANALYTICS_VIEW },
          { label: "Finance", href: `${basePath}/admin/finance`, icon: DollarSign, permission: CommunityPermission.FINANCE_VIEW },
        ],
      },
      {
        title: "Settings",
        items: [
          { label: "Community Settings", href: `${basePath}/admin/settings`, icon: Settings, permission: CommunityPermission.COMMUNITY_MANAGE_SETTINGS },
          { label: "Support Center", href: `${basePath}/admin/support`, icon: HeadphonesIcon, permission: CommunityPermission.SUPPORT_MANAGE, badge: "Limited", badgeVariant: "secondary" },
        ],
      }
    );
  }

  if (variant === "moderator") {
    sections.push(
      { title: "Overview", items: [{ label: "Dashboard Home", href: `${basePath}/moderator`, icon: Home }] },
      {
        title: "Moderation",
        items: [
          { label: "Moderation Queue", href: `${basePath}/moderator/queue`, icon: MessageSquare, permission: CommunityPermission.POSTS_MODERATE },
          { label: "Pinned Content", href: `${basePath}/moderator/pinned`, icon: Pin, permission: CommunityPermission.POSTS_MODERATE },
        ],
      },
      {
        title: "Members",
        items: [
          { label: "Member Directory", href: `${basePath}/moderator/members`, icon: Eye, permission: CommunityPermission.MEMBERS_VIEW },
        ],
      }
    );
  }

  if (variant === "support") {
    sections.push(
      { title: "Overview", items: [{ label: "Dashboard Home", href: `${basePath}/support`, icon: Home }] },
      {
        title: "Support Tools",
        items: [
          { label: "Member Lookup", href: `${basePath}/support/members`, icon: Users, permission: CommunityPermission.MEMBERS_VIEW },
          { label: "Support Queue", href: `${basePath}/support/queue`, icon: HeadphonesIcon, permission: CommunityPermission.SUPPORT_MANAGE, badge: "Backend Required", badgeVariant: "destructive", backendRequired: true },
        ],
      }
    );
  }

  return sections;
}

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  can: (permission: CommunityPermissionValue) => boolean;
}

const NavItemComponent = memo(function NavItemComponent({ item, isActive, can }: NavItemComponentProps) {
  const Icon = item.icon;
  const hasPermission = !item.permission || can(item.permission);

  if (!hasPermission) return null;

  return (
    <Link
      href={item.backendRequired ? "#" : item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        item.backendRequired && "cursor-not-allowed opacity-60"
      )}
      onClick={item.backendRequired ? (e) => e.preventDefault() : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && <Badge variant={item.badgeVariant ?? "secondary"} className="ml-auto text-xs">{item.badge}</Badge>}
      {!item.badge && <ChevronRight className={cn("h-4 w-4 opacity-0 transition-all duration-200", "group-hover:opacity-50 group-hover:translate-x-0.5", isActive && "opacity-70")} />}
    </Link>
  );
})

interface DashboardNavProps {
  variant: "admin" | "moderator" | "support";
}

export function DashboardNav({ variant }: DashboardNavProps) {
  const pathname = usePathname();
  const { role, can, getDashboardPath, isLoading, error } = useDashboard();

  const basePath = getDashboardPath();
  const sections = getNavSections(basePath, variant);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load permissions</p>
      </div>
    );
  }

  return (
    <nav className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">{variant.charAt(0).toUpperCase() + variant.slice(1)} Workspace</span>
        </div>
        <div className="mt-2">
          <Badge className={cn("text-xs", ROLE_COLORS[role])}>{ROLE_LABELS[role]}</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{section.title}</h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItemComponent key={item.href} item={item} isActive={pathname === item.href} can={can} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </nav>
  );
}
