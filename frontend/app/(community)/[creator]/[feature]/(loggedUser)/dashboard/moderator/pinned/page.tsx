"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";

const PinnedContentManager = dynamic(
  () => import("../components/pinned-content-manager").then(mod => ({ default: mod.PinnedContentManager })),
  {
    loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />,
    ssr: false,
  }
);
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pin,
  PinOff,
  Plus,
  Search,
  GripVertical,
  MoreVertical,
  Eye,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock pinned posts for fallback display
const MOCK_PINNED = [
  { id: "1", title: "Welcome to Our Community!", author: "Admin", pinnedAt: "2026-03-01", views: 1245 },
  { id: "2", title: "Community Guidelines", author: "Admin", pinnedAt: "2026-02-15", views: 892 },
  { id: "3", title: "Upcoming Events March 2026", author: "Moderator", pinnedAt: "2026-03-15", views: 456 },
];

export default function ModeratorPinnedPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("moderator");
  const [search, setSearch] = useState("");
  const [pinnedPosts, setPinnedPosts] = useState(MOCK_PINNED);

  if (isLoading) return <DashboardLoading message="Loading pinned content..." />;
  if (!canAccessDashboard("moderator")) {
    return <DashboardUnauthorized role={role} requiredRole="moderator" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.POSTS_MODERATE)) {
    return (
      <DashboardShell variant="moderator">
        <DashboardUnauthorized role={role} requiredRole="moderator with posts.moderate" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPosts = [...pinnedPosts];
    [newPosts[index - 1], newPosts[index]] = [newPosts[index], newPosts[index - 1]];
    setPinnedPosts(newPosts);
  };

  const moveDown = (index: number) => {
    if (index === pinnedPosts.length - 1) return;
    const newPosts = [...pinnedPosts];
    [newPosts[index], newPosts[index + 1]] = [newPosts[index + 1], newPosts[index]];
    setPinnedPosts(newPosts);
  };

  const unpin = (id: string) => {
    setPinnedPosts(pinnedPosts.filter(p => p.id !== id));
  };

  const filteredPosts = pinnedPosts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell variant="moderator">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pinned Content</h1>
            <p className="mt-1 text-muted-foreground">Manage posts pinned to the top of your community feed.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Pin New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pin a Post</DialogTitle>
                <DialogDescription>Search for a post to pin to your community feed.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search posts..." className="pl-9" />
                </div>
                <p className="text-sm text-muted-foreground text-center py-8">Enter a search term to find posts</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <DashboardSection title="Pinned Content Stats" description="Overview" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Pinned Posts" value={pinnedPosts.length.toString()} description="Currently active" icon={Pin} />
          <StatCard title="Total Views" value="2.5K" description="On pinned content" icon={Eye} />
          <StatCard title="Max Pins" value="10" description="Slots available" icon={MessageSquare} />
        </div>
      </DashboardSection>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search pinned posts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Pinned Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Pinned Posts</CardTitle>
          <CardDescription>Drag to reorder or use the arrows to change position</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <DashboardEmpty title="No pinned posts" description="Pin important posts to keep them visible at the top of your feed." />
          ) : (
            <div className="space-y-2">
              {filteredPosts.map((post, index) => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveUp(index)} disabled={index === 0}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDown(index)} disabled={index === filteredPosts.length - 1}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Pin className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-medium truncate">{post.title}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>By {post.author}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.pinnedAt}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">#{index + 1}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Post</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => unpin(post.id)} className="text-destructive">
                        <PinOff className="mr-2 h-4 w-4" />Unpin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced manager component */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Advanced Pinned Content Manager</h3>
        <PinnedContentManager communityId={communityId} />
      </div>
    </DashboardShell>
  );
}
