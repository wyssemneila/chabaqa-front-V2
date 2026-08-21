"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider";
import { getAdminLandingPath } from "@/app/(admin)/lib/admin-capability-routing";
import { useTranslations } from "next-intl";

export default function AdminRootPage() {
  const router = useRouter();
  const { loading, isAuthenticated, capabilities } = useAdminAuth()
  const t = useTranslations("admin.routing")

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) return

    router.replace(getAdminLandingPath(capabilities))
  }, [capabilities, isAuthenticated, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("redirectingWorkspace")}</h1>
      </div>
    </div>
  );
}
