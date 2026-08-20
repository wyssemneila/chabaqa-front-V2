"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Send, Loader2, Monitor, AlertTriangle } from "lucide-react";
import { notificationsApi, type PushStatusResponse } from "@/lib/api/social/notifications.api";
import { registerBrowserPushForCurrentUser } from "@/lib/push-notifications";

interface PushSettingsProps {
  userId?: string;
}

export function PushSettings({ userId }: PushSettingsProps) {
  const [status, setStatus] = useState<PushStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await notificationsApi.getPushStatus();
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [fetchStatus]);

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    try {
      if (enabled) {
        await registerBrowserPushForCurrentUser(userId);
        if (typeof window !== "undefined" && "Notification" in window) {
          setBrowserPermission(Notification.permission);
        }
      } else {
        // Unsubscribe from push
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration("/sw.js");
          const subscription = await registration?.pushManager?.getSubscription();
          if (subscription) {
            await notificationsApi.unsubscribePush(subscription.endpoint);
            await subscription.unsubscribe();
          }
        }
      }
      await fetchStatus();
    } catch (err) {
      console.warn("Push toggle failed:", err);
    } finally {
      setToggling(false);
    }
  };

  const handleTestPush = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await notificationsApi.sendTestPush();
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      setTestResult(data?.message || "Test sent!");
    } catch (err: any) {
      setTestResult(err?.message || "Failed to send test push.");
    } finally {
      setTesting(false);
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

  const isEnabled = status?.enabled && status?.subscriptionCount > 0;
  const isSupported = status?.supported;
  const browserSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEnabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">Push Notifications</CardTitle>
          </div>
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>
          Receive push notifications for important updates even when the app is not open.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Browser support check */}
        {!browserSupported && (
          <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Push notifications are not supported in this browser.</span>
          </div>
        )}

        {/* Server support check */}
        {browserSupported && !isSupported && (
          <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Push notifications are not configured on the server.</span>
          </div>
        )}

        {/* Permission denied */}
        {browserSupported && browserPermission === "denied" && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Browser notification permission is blocked. Please update your browser settings
              to allow notifications for this site.
            </span>
          </div>
        )}

        {/* Enable/Disable toggle */}
        {browserSupported && isSupported && browserPermission !== "denied" && (
          <div className="flex items-center justify-between">
            <Label htmlFor="push-toggle" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Enable push notifications
            </Label>
            <Switch
              id="push-toggle"
              checked={!!isEnabled}
              onCheckedChange={handleToggle}
              disabled={toggling}
            />
          </div>
        )}

        {/* Subscription count */}
        {isEnabled && (
          <p className="text-sm text-muted-foreground">
            Active on {status?.subscriptionCount || 0} device(s).
          </p>
        )}

        {/* Test push button */}
        {isEnabled && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestPush}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Test
            </Button>
            {testResult && (
              <span className="text-sm text-muted-foreground">{testResult}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
