"use client";

import { useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
} from "../../components";
import { MemberDirectory } from "../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Search,
  Eye,
  Shield,
  UserCheck,
  Clock,
  Filter,
  Download,
  MoreVertical,
  MessageSquare,
  Flag,
  Ban,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock member data
const MOCK_MEMBERS = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", avatar: null, role: "member", joinedAt: "2026-01-15", lastActive: "2 hours ago", posts: 45 },
  { id: "2", name: "Bob Smith", email: "bob@example.com", avatar: null, role: "member", joinedAt: "2026-02-01", lastActive: "1 day ago", posts: 23 },
  { id: "3", name: "Carol White", email: "carol@example.com", avatar: null, role: "member", joinedAt: "2026-02-20", lastActive: "Just now", posts: 12 },
  { id: "4", name: "David Brown", email: "david@example.com", avatar: null, role: "member", joinedAt: "2026-03-01", lastActive: "3 days ago", posts: 8 },
  { id: "5", name: "Eve Davis", email: "eve@example.com", avatar: null, role: "member", joinedAt: "2026-03-10", lastActive: "1 week ago", posts: 2 },
];

export default function ModeratorMembersPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("moderator");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  if (isLoading) return <DashboardLoading message="Loading members..." />;
  if (!canAccessDashboard("moderator")) {
    return <DashboardUnauthorized role={role} requiredRole="moderator" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.MEMBERS_VIEW)) {
    return (
      <DashboardShell variant="moderator">
        <DashboardUnauthorized role={role} requiredRole="moderator with members.view" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const filteredMembers = MOCK_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell variant="moderator">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Member Directory</h1>
            <p className="mt-1 text-muted-foreground">View community members and their activity (read-only).</p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Eye className="mr-1 h-3 w-3" />
            Read-only Access
          </Badge>
        </div>
      </div>

      {/* Member Stats */}
      <DashboardSection title="Member Overview" description="Community membership stats" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Members" value="3,847" description="All time" icon={Users} />
          <StatCard title="Active Today" value="156" description="Online now: 23" icon={UserCheck} />
          <StatCard title="New This Week" value="45" description="+12% vs last week" icon={Clock} />
          <StatCard title="Avg. Posts/Member" value="8.2" description="Engagement metric" icon={MessageSquare} />
        </div>
      </DashboardSection>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Active</SelectItem>
            <SelectItem value="joined">Join Date</SelectItem>
            <SelectItem value="posts">Most Posts</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Community Members</CardTitle>
          <CardDescription>Showing {filteredMembers.length} of {MOCK_MEMBERS.length} members</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <DashboardEmpty title="No members found" description="Try adjusting your search term." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar ?? undefined} />
                          <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.joinedAt}</TableCell>
                    <TableCell>
                      <Badge variant={member.lastActive === "Just now" ? "default" : "secondary"} className="text-xs">
                        {member.lastActive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{member.posts}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Profile</DropdownMenuItem>
                          <DropdownMenuItem><MessageSquare className="mr-2 h-4 w-4" />View Posts</DropdownMenuItem>
                          <DropdownMenuItem className="text-amber-600"><Flag className="mr-2 h-4 w-4" />Flag for Review</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Advanced Directory Component */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Advanced Member Directory</h3>
        <MemberDirectory communityId={communityId} />
      </div>
    </DashboardShell>
  );
}
