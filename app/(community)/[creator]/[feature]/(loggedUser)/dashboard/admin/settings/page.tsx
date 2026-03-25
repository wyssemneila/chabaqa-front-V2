"use client";

import { useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  ActionCard,
  DashboardLoading,
  DashboardUnauthorized,
  BackendRequiredPlaceholder,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Settings,
  Palette,
  Globe,
  Bell,
  Lock,
  Plug,
  Save,
  Upload,
  Image,
  Type,
  Link2,
  Shield,
  Eye,
  EyeOff,
  Users,
  MessageSquare,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // Form states (mock)
  const [communityName, setCommunityName] = useState("My Community");
  const [description, setDescription] = useState("Welcome to our amazing community!");
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  if (isLoading) return <DashboardLoading message="Loading settings..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with community.manage_settings" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    toast.success("Settings saved successfully");
  };

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Community Settings</h1>
            <p className="mt-1 text-muted-foreground">Configure your community appearance, privacy, and integrations.</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="general"><Settings className="mr-2 h-4 w-4 hidden sm:inline" />General</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="mr-2 h-4 w-4 hidden sm:inline" />Branding</TabsTrigger>
          <TabsTrigger value="privacy"><Lock className="mr-2 h-4 w-4 hidden sm:inline" />Privacy</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4 hidden sm:inline" />Notifications</TabsTrigger>
          <TabsTrigger value="domain"><Globe className="mr-2 h-4 w-4 hidden sm:inline" />Domain</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="mr-2 h-4 w-4 hidden sm:inline" />Integrations</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your community's name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name</Label>
                <Input id="name" value={communityName} onChange={e => setCommunityName(e.target.value)} placeholder="Enter community name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your community..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Community URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">chabaqa.com/</span>
                  <Input id="slug" value={creatorSlug} disabled className="max-w-[200px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Identity</CardTitle>
              <CardDescription>Customize your community's appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Community Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload</Button>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary" />
                  <Input type="color" defaultValue="#6366f1" className="h-10 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Access</CardTitle>
              <CardDescription>Control who can see and join your community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Public Community
                  </Label>
                  <p className="text-sm text-muted-foreground">Anyone can discover and view your community</p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Require Approval
                  </Label>
                  <p className="text-sm text-muted-foreground">New members must be approved before joining</p>
                </div>
                <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Allow Comments
                  </Label>
                  <p className="text-sm text-muted-foreground">Members can comment on posts and content</p>
                </div>
                <Switch checked={allowComments} onCheckedChange={setAllowComments} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure notification preferences for you and members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    New Member Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">Get notified when new members join</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comment Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Get notified of new comments on your posts</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Settings */}
        <TabsContent value="domain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Use your own domain for your community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain</Label>
                <Input id="domain" placeholder="community.yourdomain.com" />
                <p className="text-xs text-muted-foreground">Point your domain's CNAME record to chabaqa.com</p>
              </div>
              <Button variant="outline">
                <Link2 className="mr-2 h-4 w-4" />
                Verify Domain
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <DashboardSection title="Connected Services" description="Integrate with third-party services">
            <BackendRequiredPlaceholder feature="Third-party Integrations" description="Integration management requires backend configuration for OAuth and webhook setup." />
          </DashboardSection>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
