"use client";

import { useDashboard } from "./dashboard-context";
import { DashboardNav } from "./dashboard-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface DashboardShellProps {
  children: React.ReactNode;
  variant: "admin" | "moderator" | "support";
}

export function DashboardShell({ children, variant }: DashboardShellProps) {
  const { creatorSlug, getDashboardPath } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const communityPath = `/${creatorSlug}`;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#fafafe]">

      {/* Desktop Sidebar */}
      <aside className="hidden w-[220px] shrink-0 border-r border-[#e5e7eb] bg-white lg:flex lg:flex-col sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <DashboardNav variant={variant} />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile Header */}
        <header className="sticky top-16 z-40 flex h-14 items-center gap-4 border-b border-[#e5e7eb] bg-white px-4 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 text-[#6b7280] hover:text-[#111827] hover:bg-[#f5f3ff]">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[220px] p-0 bg-white border-r border-[#e5e7eb]">
              <DashboardNav variant={variant} />
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <h1 className="text-[13px] font-bold text-[#111827] capitalize">{variant} Dashboard</h1>
          </div>

          <Button variant="ghost" size="sm" asChild className="text-[#6b7280] hover:text-[#111827] hover:bg-[#f5f3ff] text-xs">
            <Link href={communityPath}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back
            </Link>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
