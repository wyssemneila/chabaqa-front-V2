"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Clock, Save, Bell } from "lucide-react";
import {
  notificationsApi,
  type ChannelPreferencesPayload,
  type NotificationPreferencesResponse,
  type PreferenceItemPayload,
} from "@/lib/api/notifications.api";

const NOTIFICATION_TYPES = [
  { key: "post_mention", label: "Post Mentions" },
  { key: "comment_mention", label: "Comment Mentions" },
  { key: "new_dm_message", label: "Direct Messages" },
  { key: "event_reminder", label: "Event Reminders" },
  { key: "event_created", label: "New Events" },
  { key: "new_community_member", label: "New Members" },
  { key: "course_enrolled", label: "Course Enrollments" },
  { key: "challenge_completed", label: "Challenge Completions" },
  { key: "product_purchased", label: "Product Purchases" },
  { key: "payment_received", label: "Payments Received" },
] as const;

const CHANNELS = ["inApp", "email", "push"] as const;
const CHANNEL_LABELS: Record<string, string> = {
  inApp: "In-App",
  email: "Email",
  push: "Push",
};

interface NotificationPreferencesProps {
  communityId?: string | null;
}

export function NotificationPreferences({ communityId }: NotificationPreferencesProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalPrefs, setGlobalPrefs] = useState<NotificationPreferencesResponse | null>(null);
  const [items, setItems] = useState<Record<string, ChannelPreferencesPayload>>({});
  const [quietHours, setQuietHours] = useState({ start: "22:00", end: "08:00", isEnabled: false });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch global preferences for quiet hours
      const prefsRes = await notificationsApi.getPreferences();
      const prefsData = (prefsRes as any)?.data?.data ?? (prefsRes as any)?.data ?? prefsRes;
      setGlobalPrefs(prefsData);
      if (prefsData?.quietHours) {
        setQuietHours(prefsData.quietHours);
      }

      // Fetch preference items (global or per-community)
      const itemsRes = await notificationsApi.getPreferenceItems(communityId || undefined);
      const itemsData: PreferenceItemPayload[] =
        (itemsRes as any)?.data?.data ?? (itemsRes as any)?.data ?? [];

      const itemsMap: Record<string, ChannelPreferencesPayload> = {};
      for (const item of (Array.isArray(itemsData) ? itemsData : [])) {
        itemsMap[item.type] = item.channels;
      }

      // Fill gaps from legacy preferences
      if (!communityId && prefsData?.preferences) {
        const legacyPrefs =
          prefsData.preferences instanceof Map
            ? Object.fromEntries(prefsData.preferences)
            : (prefsData.preferences as Record<string, ChannelPreferencesPayload>);

        for (const { key } of NOTIFICATION_TYPES) {
          if (!itemsMap[key] && legacyPrefs[key]) {
            itemsMap[key] = legacyPrefs[key];
          }
        }
      }

      // Fill remaining with defaults
      for (const { key } of NOTIFICATION_TYPES) {
        if (!itemsMap[key]) {
          itemsMap[key] = { inApp: true, email: true, push: true };
        }
      }

      setItems(itemsMap);
    } catch (err) {
      console.error("Failed to load notification preferences:", err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChannelToggle = (type: string, channel: string, value: boolean) => {
    setItems((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save preference items
      const bulkItems: PreferenceItemPayload[] = NOTIFICATION_TYPES.map(({ key }) => ({
        communityId: communityId || null,
        type: key,
        channels: items[key] || { inApp: true, email: true, push: true },
      }));
      await notificationsApi.bulkUpsertPreferenceItems(bulkItems);

      // Save quiet hours (only for global)
      if (!communityId) {
        await notificationsApi.updatePreferences({ quietHours });
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preference Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {communityId ? "Community Notification Preferences" : "Notification Preferences"}
            </CardTitle>
          </div>
          <CardDescription>
            {communityId
              ? "Override notification channels for this community."
              : "Choose how you want to be notified for each type."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Type</th>
                  {CHANNELS.map((ch) => (
                    <th key={ch} className="py-2 text-center font-medium w-20">
                      {CHANNEL_LABELS[ch]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_TYPES.map(({ key, label }) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-3">{label}</td>
                    {CHANNELS.map((ch) => (
                      <td key={ch} className="py-3 text-center">
                        <Switch
                          checked={items[key]?.[ch] ?? true}
                          onCheckedChange={(v) => handleChannelToggle(key, ch, v)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours (global only) */}
      {!communityId && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quiet Hours</CardTitle>
            </div>
            <CardDescription>
              Suppress push and email notifications during these hours (high-priority notifications still get through).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours-toggle">Enable quiet hours</Label>
              <Switch
                id="quiet-hours-toggle"
                checked={quietHours.isEnabled}
                onCheckedChange={(v) => setQuietHours((prev) => ({ ...prev, isEnabled: v }))}
              />
            </div>
            {quietHours.isEnabled && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="quiet-start">From</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={quietHours.start}
                    onChange={(e) => setQuietHours((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-28"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="quiet-end">To</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={quietHours.end}
                    onChange={(e) => setQuietHours((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-28"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
