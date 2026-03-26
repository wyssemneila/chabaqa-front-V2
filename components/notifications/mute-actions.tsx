"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, VolumeX, Volume2, Trash2 } from "lucide-react";
import { notificationsApi, type NotificationMutePayload } from "@/lib/api/social/notifications.api";

interface MuteButtonProps {
  targetType: "thread" | "user" | "community";
  targetId: string;
  label?: string;
  className?: string;
}

/** Inline mute/unmute toggle button for use in post threads, DM screens, etc. */
export function MuteButton({ targetType, targetId, label, className }: MuteButtonProps) {
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .getMutes()
      .then((res) => {
        if (cancelled) return;
        const data: NotificationMutePayload[] =
          (res as any)?.data?.data ?? (res as any)?.data ?? [];
        const match = (Array.isArray(data) ? data : []).find(
          (m) => m.targetType === targetType && m.targetId === targetId,
        );
        setMuted(!!match);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (muted) {
        await notificationsApi.removeMute(targetType, targetId);
        setMuted(false);
      } else {
        await notificationsApi.createMute({ targetType, targetId });
        setMuted(true);
      }
    } catch (err) {
      console.error("Mute toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultLabel = muted ? "Unmute" : "Mute";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : muted ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      {label || defaultLabel}
    </Button>
  );
}

/** Full mute management list for the notification settings page. */
export function MutesList() {
  const [mutes, setMutes] = useState<NotificationMutePayload[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMutes = useCallback(async () => {
    try {
      const res = await notificationsApi.getMutes();
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      setMutes(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMutes();
  }, [fetchMutes]);

  const handleRemove = async (targetType: string, targetId: string) => {
    try {
      await notificationsApi.removeMute(targetType, targetId);
      setMutes((prev) => prev.filter((m) => !(m.targetType === targetType && m.targetId === targetId)));
    } catch (err) {
      console.error("Failed to remove mute:", err);
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VolumeX className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Muted Notifications</CardTitle>
        </div>
        <CardDescription>
          Muted threads, users, and communities. You won&apos;t receive notifications from these.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mutes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active mutes.</p>
        ) : (
          <div className="space-y-2">
            {mutes.map((mute) => (
              <div
                key={`${mute.targetType}-${mute.targetId}`}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {mute.targetType}
                  </Badge>
                  <span className="text-sm font-mono truncate max-w-[200px]">{mute.targetId}</span>
                  {mute.reason && (
                    <span className="text-xs text-muted-foreground">({mute.reason})</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(mute.targetType, mute.targetId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
