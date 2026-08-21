"use client";

import { type ChangeEvent, useEffect, useState, useCallback } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  DashboardLoading,
  DashboardUnauthorized,
  BackendRequiredPlaceholder,
  DashboardError,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Save,
  Upload,
  Image as ImageIcon,
  Link2,
  Shield,
  Eye,
  EyeOff,
  Users,
  MessageSquare,
  Mail,
  CreditCard,
  LayoutGrid,
  ScrollText,
  Plus,
  Trash2,
  GripVertical,
  Check,
  Crown,
  Star,
  Zap,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { communitiesApi } from "@/lib/api/communities.api";
import { mediaApi, type MediaPurpose } from "@/lib/api/media.api";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────── */

type PricingModel = "free" | "subscription" | "freemium" | "one-time";
type BillingCycle = "monthly" | "annual" | "both";

interface PricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface CommunityRule {
  id: string;
  title: string;
  description: string;
}

interface TabVisibility {
  courses: boolean;
  challenges: boolean;
  events: boolean;
  sessions: boolean;
  products: boolean;
  calendar: boolean;
  leaderboard: boolean;
}

interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

/* ─── Main Component ─────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const {
    role,
    can,
    isLoading,
    canAccessDashboard,
    getDashboardPath,
    creatorSlug,
    communityId,
  } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── General ──
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [membershipQuestions, setMembershipQuestions] = useState<string[]>([""]);
  const [shareLink, setShareLink] = useState("");
  const [allowComments, setAllowComments] = useState(true);

  // ── Branding ──
  const [primaryColor, setPrimaryColor] = useState("#8e78fb");
  const [accentColor, setAccentColor] = useState("#47c7ea");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  // ── Pricing ──
  const [pricingModel, setPricingModel] = useState<PricingModel>("free");
  const [subscriptionPrice, setSubscriptionPrice] = useState(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);
  const [freeTrialDays, setFreeTrialDays] = useState(7);
  const [oneTimePrice, setOneTimePrice] = useState(0);
  const [freemiumTiers, setFreemiumTiers] = useState<PricingTier[]>([
    { id: generateId(), name: "Standard", price: 0, features: ["Access to community", "Basic content"] },
    { id: generateId(), name: "Premium", price: 29, features: ["All Standard features", "Premium content", "Priority support"] },
  ]);

  // ── Tabs & Layout ──
  const [tabVisibility, setTabVisibility] = useState<TabVisibility>({
    courses: true,
    challenges: true,
    events: true,
    sessions: true,
    products: true,
    calendar: true,
    leaderboard: false,
  });

  // ── Rules ──
  const [rules, setRules] = useState<CommunityRule[]>([
    { id: generateId(), title: "Be respectful", description: "Treat all members with respect and kindness." },
    { id: generateId(), title: "No spam", description: "Avoid posting irrelevant or promotional content." },
  ]);

  // ── Notifications ──
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    membershipRequest: true,
    newPost: true,
    newMember: true,
    flaggedContent: true,
    weeklyRecap: true,
    dailyDigest: false,
    eventReminder: true,
    adminBroadcast: true,
  });

  // ── Domain ──
  const [customDomain, setCustomDomain] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);

  /* ── Load Settings ──────────────────────────────────────────── */

  const loadSettings = useCallback(async () => {
    if (!communityId) return;
    setLoadError(null);
    try {
      const [communityResult, settingsResult] = await Promise.allSettled([
        communitiesApi.getById(communityId),
        communitiesApi.getSettings(communityId),
      ]);

      if (communityResult.status === "rejected") throw communityResult.reason;

      const community =
        (communityResult.value as any)?.data?.data ||
        (communityResult.value as any)?.data ||
        communityResult.value;
      const settings =
        settingsResult.status === "fulfilled"
          ? (settingsResult.value as any)?.data?.data ||
            (settingsResult.value as any)?.data ||
            settingsResult.value
          : {};

      setCommunityName(community?.name || "");
      setDescription(community?.description || community?.bio || "");
      setSlug(community?.slug || creatorSlug || "");
      setIsPublic(
        (settings?.visibility || (community?.isPrivate ? "private" : "public")) ===
          "public"
      );
      setAllowComments(settings?.allowMemberPosts ?? true);
      setRequireApproval(settings?.requireApproval ?? false);
      setPrimaryColor(settings?.primaryColor || "#8e78fb");
      setAccentColor(settings?.accentColor || "#47c7ea");
      setLogoUrl(settings?.logo || community?.logo || "");
      setCoverUrl(
        settings?.heroBackground ||
          community?.coverImage ||
          community?.image ||
          ""
      );
      setIconUrl(settings?.favicon || community?.icon || "");
      setShareLink(
        `https://chabaqa.io/${community?.slug || creatorSlug}/about`
      );

      if (settings?.notifications) setNotifications(settings.notifications);
      if (settings?.pricingModel) setPricingModel(settings.pricingModel);
      if (settings?.rules) setRules(settings.rules);
      if (settings?.tabVisibility) setTabVisibility(settings.tabVisibility);
      if (settings?.customDomain) setCustomDomain(settings.customDomain);
    } catch (err: any) {
      setLoadError(err?.message || "Unable to load community settings.");
    }
  }, [communityId, creatorSlug]);

  useEffect(() => {
    if (
      !isLoading &&
      canAccessDashboard("admin") &&
      can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS)
    ) {
      loadSettings();
    }
  }, [communityId, creatorSlug, isLoading, canAccessDashboard, can, loadSettings]);

  /* ── Guards ──────────────────────────────────────────────────── */

  if (isLoading) return <DashboardLoading message="Loading settings..." />;
  if (!canAccessDashboard("admin")) {
    return (
      <DashboardUnauthorized
        role={role}
        requiredRole="admin"
        backAction={{ label: "Back", href: `/${creatorSlug}` }}
      />
    );
  }
  if (!can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized
          role={role}
          requiredRole="admin with community.manage_settings"
          backAction={{ label: "Back", href: basePath }}
        />
      </DashboardShell>
    );
  }

  /* ── Save ────────────────────────────────────────────────────── */

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        communitiesApi.update(communityId, {
          name: communityName,
          description,
          bio: description,
          logo: logoUrl || undefined,
          coverImage: coverUrl || undefined,
          image: coverUrl || undefined,
        } as any),
        communitiesApi.updateSettings(communityId, {
          visibility: isPublic ? "public" : "private",
          requireApproval,
          allowMemberPosts: allowComments,
          primaryColor,
          accentColor,
          logo: logoUrl || undefined,
          favicon: iconUrl || undefined,
          heroBackground: coverUrl || undefined,
          pricingModel,
          subscriptionPrice,
          billingCycle,
          freeTrialEnabled,
          freeTrialDays,
          oneTimePrice,
          freemiumTiers,
          tabVisibility,
          rules,
          notifications,
          customDomain,
          membershipQuestions: requireApproval ? membershipQuestions.filter(Boolean) : [],
        } as any),
      ]);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Unable to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Image Upload ────────────────────────────────────────────── */

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    purpose: MediaPurpose,
    setter: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await mediaApi.uploadSmart(file, {
        purpose,
        entityType: "community",
        entityId: communityId,
        visibility: "public",
      });
      setter(asset.url);
      toast.success("Image uploaded. Save to apply.");
    } catch (err: any) {
      toast.error(err?.message || "Unable to upload image");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  /* ── Pricing Helpers ─────────────────────────────────────────── */

  const addFreemiumTier = () => {
    setFreemiumTiers((prev) => [
      ...prev,
      { id: generateId(), name: "", price: 0, features: [] },
    ]);
  };

  const removeFreemiumTier = (id: string) => {
    setFreemiumTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const updateFreemiumTier = (id: string, field: keyof PricingTier, value: any) => {
    setFreemiumTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  /* ── Rules Helpers ───────────────────────────────────────────── */

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: generateId(), title: "", description: "" },
    ]);
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, field: keyof CommunityRule, value: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  /* ── Membership Questions Helpers ────────────────────────────── */

  const addQuestion = () => setMembershipQuestions((prev) => [...prev, ""]);
  const removeQuestion = (index: number) =>
    setMembershipQuestions((prev) => prev.filter((_, i) => i !== index));
  const updateQuestion = (index: number, value: string) =>
    setMembershipQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));

  /* ── Copy Share Link ─────────────────────────────────────────── */

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied!");
  };

  /* ── Render ──────────────────────────────────────────────────── */

  const NOTIFICATION_ITEMS: NotificationPreference[] = [
    { key: "membershipRequest", label: "Membership Requests", description: "When someone requests to join", enabled: notifications.membershipRequest, icon: Users },
    { key: "newPost", label: "New Posts", description: "When a member publishes a post", enabled: notifications.newPost, icon: MessageSquare },
    { key: "newMember", label: "New Members", description: "When someone joins the community", enabled: notifications.newMember, icon: Users },
    { key: "flaggedContent", label: "Flagged Content", description: "When content is reported by members", enabled: notifications.flaggedContent, icon: AlertCircle },
    { key: "weeklyRecap", label: "Weekly Recap", description: "Summary of community activity each week", enabled: notifications.weeklyRecap, icon: Mail },
    { key: "dailyDigest", label: "Daily Digest", description: "Daily summary of new posts and activity", enabled: notifications.dailyDigest, icon: Mail },
    { key: "eventReminder", label: "Event Reminders", description: "Reminders before scheduled events", enabled: notifications.eventReminder, icon: Bell },
    { key: "adminBroadcast", label: "Admin Broadcasts", description: "Messages sent by admin to all staff", enabled: notifications.adminBroadcast, icon: Mail },
  ];

  const TAB_ITEMS: { key: keyof TabVisibility; label: string; description: string }[] = [
    { key: "courses", label: "Courses", description: "Educational content and curriculum" },
    { key: "challenges", label: "Challenges", description: "Competitions and challenges for members" },
    { key: "events", label: "Events", description: "Online and in-person events" },
    { key: "sessions", label: "Sessions", description: "1-on-1 or group coaching sessions" },
    { key: "products", label: "Products", description: "Digital products and downloads" },
    { key: "calendar", label: "Calendar", description: "Community event calendar view" },
    { key: "leaderboard", label: "Leaderboard", description: "Member rankings and gamification" },
  ];

  const PRICING_MODELS: { value: PricingModel; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "free", label: "Free", description: "Free to join", icon: Check },
    { value: "subscription", label: "Subscription", description: "Monthly, annual, or both", icon: CreditCard },
    { value: "freemium", label: "Freemium", description: "Free + paid tiers", icon: Zap },
    { value: "one-time", label: "One-time", description: "Single payment", icon: Star },
  ];

  return (
    <DashboardShell variant="admin">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href={basePath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Community Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your community preferences and configuration
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {loadError ? (
        <DashboardError message={loadError} retry={loadSettings} />
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-8">
          {/* ── Tab Navigation ── */}
          <div className="border-b">
            <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
              {[
                { value: "general", label: "General", icon: Settings },
                { value: "branding", label: "Branding", icon: Palette },
                { value: "pricing", label: "Pricing", icon: CreditCard },
                { value: "tabs", label: "Tabs & Layout", icon: LayoutGrid },
                { value: "rules", label: "Rules", icon: ScrollText },
                { value: "notifications", label: "Notifications", icon: Bell },
                { value: "domain", label: "Domain", icon: Globe },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className={cn(
                    "relative rounded-none border-b-2 border-transparent px-4 py-3 font-medium text-muted-foreground transition-colors",
                    "hover:text-foreground",
                    "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  )}
                >
                  <t.icon className="mr-2 h-4 w-4 hidden sm:inline-block" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ═══════════════════════════════════════════════════════
              TAB 1 — GENERAL
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="general" className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Your community&apos;s name, description, and URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    placeholder="Enter community name"
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {communityName.length}/30
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your community..."
                    rows={3}
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/150
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Community URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      chabaqa.io/
                    </span>
                    <Input
                      id="slug"
                      value={slug || creatorSlug}
                      disabled
                      className="max-w-[240px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Share Your Community
                </CardTitle>
                <CardDescription>
                  Share this link so people can discover and join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-sm text-primary"
                  />
                  <Button variant="outline" onClick={copyShareLink} className="shrink-0 gap-2">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy & Access
                </CardTitle>
                <CardDescription>
                  Control who can see and join your community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Public / Private */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all",
                      !isPublic
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    {!isPublic && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <EyeOff className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-semibold">Private</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Only members can see content
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all",
                      isPublic
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    {isPublic && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <Eye className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-semibold">Public</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Everyone can see content
                    </span>
                  </button>
                </div>

                <Separator />

                {/* Require Approval */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Require Approval
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      New members must be approved before joining
                    </p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>

                {/* Membership Questions */}
                {requireApproval && (
                  <div className="ml-6 space-y-3 border-l-2 border-primary/20 pl-4">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Membership Questions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Ask questions before someone can request to join
                    </p>
                    {membershipQuestions.map((q, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={q}
                          onChange={(e) => updateQuestion(i, e.target.value)}
                          placeholder={`Question ${i + 1}`}
                          className="flex-1"
                        />
                        {membershipQuestions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(i)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {membershipQuestions.length < 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addQuestion}
                        className="gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Question
                      </Button>
                    )}
                  </div>
                )}

                <Separator />

                {/* Allow Comments */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Allow Member Posts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Members can create posts and comment
                    </p>
                  </div>
                  <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════
              TAB 2 — BRANDING
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="branding" className="space-y-6">
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Visual Identity
                </CardTitle>
                <CardDescription>
                  Upload your community icon, logo, and cover image
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 sm:grid-cols-3">
                  {/* Icon */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Icon</Label>
                    <p className="text-xs text-muted-foreground">128 x 128px</p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                        {iconUrl ? (
                          <img src={iconUrl} alt="Icon" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <Button variant="outline" size="sm" disabled={isUploadingIcon} asChild>
                        <label className="cursor-pointer">
                          <Upload className="mr-2 h-3.5 w-3.5" />
                          {isUploadingIcon ? "Uploading..." : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, "community_logo" as MediaPurpose, setIconUrl, setIsUploadingIcon)
                            }
                          />
                        </label>
                      </Button>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Logo</Label>
                    <p className="text-xs text-muted-foreground">Recommended: SVG or PNG</p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-24 w-40 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <Button variant="outline" size="sm" disabled={isUploadingLogo} asChild>
                        <label className="cursor-pointer">
                          <Upload className="mr-2 h-3.5 w-3.5" />
                          {isUploadingLogo ? "Uploading..." : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, "community_logo", setLogoUrl, setIsUploadingLogo)
                            }
                          />
                        </label>
                      </Button>
                    </div>
                  </div>

                  {/* Cover */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Cover Image</Label>
                    <p className="text-xs text-muted-foreground">1084 x 576px</p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-24 w-44 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <Button variant="outline" size="sm" disabled={isUploadingCover} asChild>
                        <label className="cursor-pointer">
                          <Upload className="mr-2 h-3.5 w-3.5" />
                          {isUploadingCover ? "Uploading..." : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, "community_cover" as MediaPurpose, setCoverUrl, setIsUploadingCover)
                            }
                          />
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Brand Colors
                </CardTitle>
                <CardDescription>
                  Set the colors that represent your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-xl border-2 border-muted shadow-sm cursor-pointer transition-transform hover:scale-105"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <div className="flex-1">
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-10 w-full cursor-pointer"
                        />
                      </div>
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-28 font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-xl border-2 border-muted shadow-sm cursor-pointer transition-transform hover:scale-105"
                        style={{ backgroundColor: accentColor }}
                      />
                      <div className="flex-1">
                        <Input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="h-10 w-full cursor-pointer"
                        />
                      </div>
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-28 font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 rounded-xl border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Preview</p>
                  <div className="flex items-center gap-3">
                    <Button size="sm" style={{ backgroundColor: primaryColor, color: "#fff" }}>
                      Primary Button
                    </Button>
                    <Button size="sm" variant="outline" style={{ borderColor: accentColor, color: accentColor }}>
                      Accent Button
                    </Button>
                    <Badge style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}30` }} className="border">
                      Badge
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════
              TAB 3 — PRICING
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Pricing Model
                </CardTitle>
                <CardDescription>
                  Choose how members pay to access your community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model Selection */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PRICING_MODELS.map((model) => {
                    const Icon = model.icon;
                    const isSelected = pricingModel === model.value;
                    return (
                      <button
                        key={model.value}
                        type="button"
                        onClick={() => setPricingModel(model.value)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-semibold">{model.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          {model.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Separator />

                {/* Subscription Config */}
                {pricingModel === "subscription" && (
                  <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
                    <h4 className="text-sm font-semibold">Subscription Settings</h4>

                    {/* Billing Cycle */}
                    <div className="space-y-2">
                      <Label>Billing Cycle</Label>
                      <div className="flex gap-2">
                        {(["monthly", "annual", "both"] as BillingCycle[]).map((cycle) => (
                          <button
                            key={cycle}
                            type="button"
                            onClick={() => setBillingCycle(cycle)}
                            className={cn(
                              "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                              billingCycle === cycle
                                ? "border-primary bg-primary text-white"
                                : "border-muted hover:border-primary/50"
                            )}
                          >
                            {cycle === "both" ? "Monthly & Annual" : cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <Label htmlFor="sub-price">Price</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="sub-price"
                          type="number"
                          value={subscriptionPrice}
                          onChange={(e) => setSubscriptionPrice(Number(e.target.value))}
                          min={0}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">
                          TND / {billingCycle === "both" ? "month" : billingCycle === "annual" ? "year" : "month"}
                        </span>
                      </div>
                    </div>

                    {/* Free Trial */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Free Trial</Label>
                        <p className="text-xs text-muted-foreground">
                          Let members try before they pay
                        </p>
                      </div>
                      <Switch checked={freeTrialEnabled} onCheckedChange={setFreeTrialEnabled} />
                    </div>
                    {freeTrialEnabled && (
                      <div className="ml-6 flex items-center gap-2">
                        <Input
                          type="number"
                          value={freeTrialDays}
                          onChange={(e) => setFreeTrialDays(Number(e.target.value))}
                          min={1}
                          max={30}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    )}
                  </div>
                )}

                {/* One-time Config */}
                {pricingModel === "one-time" && (
                  <div className="space-y-4 rounded-xl border bg-muted/30 p-5">
                    <h4 className="text-sm font-semibold">One-Time Payment</h4>
                    <div className="space-y-2">
                      <Label htmlFor="onetime-price">Price</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="onetime-price"
                          type="number"
                          value={oneTimePrice}
                          onChange={(e) => setOneTimePrice(Number(e.target.value))}
                          min={0}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">TND</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Freemium Config */}
                {pricingModel === "freemium" && (
                  <div className="space-y-4 rounded-xl border bg-muted/30 p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Pricing Tiers</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addFreemiumTier}
                        className="gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Tier
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {freemiumTiers.map((tier, index) => (
                        <div
                          key={tier.id}
                          className={cn(
                            "relative rounded-xl border-2 bg-background p-4 space-y-3",
                            index === 0 && "border-muted",
                            index === 1 && "border-primary shadow-sm",
                            index >= 2 && "border-amber-400"
                          )}
                        >
                          {index === 1 && (
                            <Badge className="absolute -top-2.5 left-3 bg-primary text-white gap-1">
                              <Star className="h-3 w-3" /> Popular
                            </Badge>
                          )}
                          {index >= 2 && (
                            <Badge className="absolute -top-2.5 left-3 bg-amber-500 text-white gap-1">
                              <Crown className="h-3 w-3" /> VIP
                            </Badge>
                          )}

                          {freemiumTiers.length > 2 && index >= 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFreemiumTier(tier.id)}
                              className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs">Tier Name</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) =>
                                updateFreemiumTier(tier.id, "name", e.target.value)
                              }
                              placeholder="e.g. Premium"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Price{index === 0 && " (Free)"}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={tier.price}
                                onChange={(e) =>
                                  updateFreemiumTier(
                                    tier.id,
                                    "price",
                                    Number(e.target.value)
                                  )
                                }
                                min={0}
                                disabled={index === 0}
                                className="w-24"
                              />
                              <span className="text-xs text-muted-foreground">
                                TND/mo
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════
              TAB 4 — TABS & LAYOUT
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="tabs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  Content Tabs
                </CardTitle>
                <CardDescription>
                  Choose which sections are visible on your community page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {TAB_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg px-4 py-3.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            tabVisibility[item.key]
                              ? "text-emerald-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {tabVisibility[item.key] ? "Visible" : "Hidden"}
                        </span>
                        <Switch
                          checked={tabVisibility[item.key]}
                          onCheckedChange={(checked) =>
                            setTabVisibility((prev) => ({
                              ...prev,
                              [item.key]: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════
              TAB 5 — RULES
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ScrollText className="h-5 w-5 text-primary" />
                      Community Rules
                    </CardTitle>
                    <CardDescription>
                      Set discussion guidelines shown to members before posting
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addRule} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="group flex gap-3 rounded-xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={rule.title}
                          onChange={(e) => updateRule(rule.id, "title", e.target.value)}
                          placeholder="Rule title"
                          className="font-medium"
                        />
                        <Textarea
                          value={rule.description}
                          onChange={(e) =>
                            updateRule(rule.id, "description", e.target.value)
                          }
                          placeholder="Describe this rule..."
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(rule.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {rules.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ScrollText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No rules defined yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add rules to set community discussion guidelines
                      </p>
                      <Button variant="outline" size="sm" onClick={addRule} className="mt-4 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add First Rule
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════
              TAB 6 — NOTIFICATIONS
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose which notifications you receive as a creator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {NOTIFICATION_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-lg px-4 py-3.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notifications[item.key]}
                          onCheckedChange={(checked) =>
                            setNotifications((prev) => ({
                              ...prev,
                              [item.key]: checked,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════
              TAB 7 — DOMAIN
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="domain" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Custom Domain
                </CardTitle>
                <CardDescription>
                  Use your own domain for a professional look
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="community.yourdomain.com"
                  />
                </div>

                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">How to set up</p>
                  </div>
                  <ol className="ml-6 list-decimal text-xs text-muted-foreground space-y-1.5">
                    <li>Go to your domain registrar&apos;s DNS settings</li>
                    <li>
                      Add a CNAME record pointing to{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                        chabaqa.io
                      </code>
                    </li>
                    <li>Wait for DNS propagation (up to 48 hours)</li>
                    <li>Click &quot;Verify Domain&quot; below to confirm</li>
                  </ol>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" className="gap-2" disabled={!customDomain}>
                    <Link2 className="h-4 w-4" />
                    Verify Domain
                  </Button>
                  {domainVerified && (
                    <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                      <Check className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardShell>
  );
}
