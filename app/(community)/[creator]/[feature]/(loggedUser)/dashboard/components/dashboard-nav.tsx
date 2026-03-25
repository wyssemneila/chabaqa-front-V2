"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "./dashboard-context";
import { cn } from "@/lib/utils";
import { CommunityPermission, ROLE_LABELS } from "@/lib/permissions";
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
  Home,
  AlertTriangle,
} from "lucide-react";

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
        title: "Team",
        items: [
          { label: "Staff & Roles",  href: `${basePath}/admin/staff`,       icon: Shield,    permission: CommunityPermission.ROLES_MANAGE   },
          { label: "Members",        href: `${basePath}/admin/members`,     icon: Users,     permission: CommunityPermission.MEMBERS_VIEW   },
          { label: "Invitations",    href: `${basePath}/admin/invitations`, icon: UserPlus,  permission: CommunityPermission.MEMBERS_MANAGE },
        ],
      },
      {
        title: "Content",
        items: [
          { label: "Content",        href: `${basePath}/admin/content`,    icon: FileText,     permission: CommunityPermission.CONTENT_MANAGE  },
          { label: "Moderation",     href: `${basePath}/admin/moderation`, icon: MessageSquare,permission: CommunityPermission.POSTS_MODERATE  },
        ],
      },
      {
        title: "Growth",
        items: [
          { label: "Marketing",  href: `${basePath}/admin/marketing`,  icon: Megaphone, permission: CommunityPermission.MARKETING_MANAGE  },
          { label: "Affiliates", href: `${basePath}/admin/affiliates`, icon: Users,     permission: CommunityPermission.AFFILIATES_MANAGE },
        ],
      },
      {
        title: "Insights",
        items: [
          { label: "Analytics", href: `${basePath}/admin/analytics`, icon: BarChart3, permission: CommunityPermission.ANALYTICS_VIEW },
          { label: "Finance",   href: `${basePath}/admin/finance`,   icon: DollarSign,permission: CommunityPermission.FINANCE_VIEW   },
        ],
      },
      {
        title: "Settings",
        items: [
          { label: "Community Settings", href: `${basePath}/admin/settings`, icon: Settings,       permission: CommunityPermission.COMMUNITY_MANAGE_SETTINGS },
          { label: "Support Center",     href: `${basePath}/admin/support`,  icon: HeadphonesIcon, permission: CommunityPermission.SUPPORT_MANAGE, badge: "Limited", badgeVariant: "secondary" },
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
          { label: "Review Queue",   href: `${basePath}/moderator/queue`,  icon: MessageSquare, permission: CommunityPermission.POSTS_MODERATE },
          { label: "Pinned Content", href: `${basePath}/moderator/pinned`, icon: Pin,           permission: CommunityPermission.POSTS_MODERATE },
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
        title: "Support",
        items: [
          { label: "Member Lookup",  href: `${basePath}/support/members`, icon: Users,          permission: CommunityPermission.MEMBERS_VIEW  },
          { label: "Support Queue",  href: `${basePath}/support/queue`,   icon: HeadphonesIcon, permission: CommunityPermission.SUPPORT_MANAGE, badge: "Soon", badgeVariant: "secondary", backendRequired: true },
        ],
      }
    );
  }

  return sections;
}

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  can: (permission: string) => boolean;
}

function NavItemComponent({ item, isActive, can }: NavItemComponentProps) {
  const Icon = item.icon;
  const hasPermission = !item.permission || can(item.permission as any);

  if (!hasPermission) return null;

  return (
    <Link
      href={item.backendRequired ? "#" : item.href}
      onClick={item.backendRequired ? (e) => e.preventDefault() : undefined}
      className={cn(
        "relative flex items-center gap-2 px-4 py-[7px] text-[13px] transition-colors",
        isActive
          ? "bg-[#ede9ff] text-[#8e78fb] font-semibold"
          : "text-[#6b7280] hover:bg-[#f5f3ff] hover:text-[#111827]",
        item.backendRequired && "cursor-not-allowed opacity-50"
      )}
    >
      {/* Active left border indicator */}
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#8e78fb] rounded-r-[3px]" />
      )}

      <Icon
        className={cn(
          "h-[15px] w-[15px] shrink-0",
          isActive ? "opacity-100 text-[#8e78fb]" : "opacity-70"
        )}
      />

      <span className="flex-1 truncate">{item.label}</span>

      {item.badge && (
        <span className="ml-auto text-[9px] font-bold tracking-[.06em] bg-[#f5f3ff] text-[#9ca3af] px-1.5 py-0.5 rounded-full border border-[#e5e7eb]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

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
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#8e78fb] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <AlertTriangle className="h-7 w-7 text-[#b83232]" />
        <p className="text-[13px] text-[#9a9890]">Failed to load permissions</p>
      </div>
    );
  }

  return (
    <nav className="flex h-full flex-col">

      {/* Workspace header */}
      <div className="px-4 pt-[18px] pb-[14px] border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #8e78fb 0%, #6c52f0 100%)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#111827] truncate capitalize">
              {variant} Workspace
            </p>
            <p className="text-[11px] text-[#9ca3af]">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.title} className="pt-2.5 pb-1">
            <p className="text-[10px] font-bold tracking-[.07em] uppercase text-[#9ca3af] px-4 pb-1.5">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                can={can}
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
