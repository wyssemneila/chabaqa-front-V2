"use client";

import { useDashboard } from "./dashboard-context";
import { DashboardNav } from "./dashboard-nav";
import { cn } from "@/lib/utils";
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
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className={cn("hidden w-64 shrink-0 border-r bg-card lg:block", "sticky top-16 h-[calc(100vh-4rem)]")}>
        <DashboardNav variant={variant} />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-16 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <DashboardNav variant={variant} />
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <h1 className="text-base font-semibold capitalize">{variant} Dashboard</h1>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link href={communityPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Link>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
