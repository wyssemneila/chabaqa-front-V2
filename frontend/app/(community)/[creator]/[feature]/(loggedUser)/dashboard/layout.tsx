"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { DashboardProvider } from "./components/dashboard-context";
import { DashboardLoading, DashboardError } from "./components/dashboard-cards";
import { communitiesApi } from "@/lib/api/communities.api";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface CommunityInfo {
  id: string;
  slug: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const params = useParams<{ creator: string; feature: string }>();
  const { creator, feature } = params;

  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommunity() {
      if (!feature) {
        setError("No community specified");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await communitiesApi.getBySlug(feature);
        const data = response?.data || response;

        const communityId = String((data as any)?._id || (data as any)?.id || "").trim();

        if (!communityId) {
          throw new Error("Community not found");
        }

        setCommunity({ id: communityId, slug: feature });
      } catch (err: any) {
        console.error("[DashboardLayout] Failed to load community:", err);
        setError(err?.message || "Failed to load community");
      } finally {
        setIsLoading(false);
      }
    }

    loadCommunity();
  }, [feature]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <DashboardLoading message="Initializing dashboard..." />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="container mx-auto p-8">
        <DashboardError
          title="Unable to load dashboard"
          message={error || "Community not found. Please check the URL and try again."}
          retry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <DashboardProvider communityId={community.id} creatorSlug={creator} feature={feature}>
      {children}
    </DashboardProvider>
  );
}
