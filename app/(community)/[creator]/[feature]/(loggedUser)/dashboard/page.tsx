"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "./components/dashboard-context";
import { DashboardLoading, DashboardUnauthorized } from "./components/dashboard-cards";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { role, staffRole, isLoading, error, getDashboardPath, creatorSlug } = useDashboard();

  useEffect(() => {
    if (isLoading) return;
    if (!staffRole) return;

    const targetPath = getDashboardPath(staffRole);
    router.replace(targetPath);
  }, [isLoading, staffRole, getDashboardPath, router]);

  if (isLoading) {
    return <DashboardLoading message="Checking your access..." />;
  }

  if (error || !staffRole) {
    return (
      <DashboardUnauthorized
        role={role}
        requiredRole="staff (admin, moderator, or support)"
        backAction={{ label: "Back to Community", href: `/${creatorSlug}` }}
      />
    );
  }

  return <DashboardLoading message="Redirecting to your dashboard..." />;
}
