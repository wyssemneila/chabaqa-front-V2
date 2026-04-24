"use client";

import { notificationsApi, type PushSubscriptionPayload } from "@/lib/api/notifications.api";

const PUSH_PERMISSION_REQUESTED_KEY = "chabaqa_push_permission_requested_v1";
const getPushPermissionRequestedKey = (userId?: string): string => {
  const normalized = String(userId || "").trim();
  return normalized
    ? `${PUSH_PERMISSION_REQUESTED_KEY}:${normalized}`
    : PUSH_PERMISSION_REQUESTED_KEY;
};

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  // Ensure we return a concrete ArrayBuffer (not ArrayBufferLike) for strict TS DOM typings.
  const buffer = new ArrayBuffer(outputArray.length);
  new Uint8Array(buffer).set(outputArray);
  return buffer;
}

function toPayload(
  subscriptionJson: PushSubscriptionJSON | null,
): PushSubscriptionPayload | null {
  if (!subscriptionJson?.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
    return null;
  }

  return {
    endpoint: subscriptionJson.endpoint,
    expirationTime: subscriptionJson.expirationTime ?? null,
    keys: {
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
    },
  };
}

export async function registerBrowserPushForCurrentUser(userId?: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

  const pushConfig = await notificationsApi.getPushPublicKey();
  const publicKey = pushConfig?.data?.publicKey;
  const isEnabled = Boolean(pushConfig?.data?.enabled && publicKey);
  if (!isEnabled) return;

  if (Notification.permission === "denied") return;

  if (Notification.permission === "default") {
    const storageKey = getPushPermissionRequestedKey(userId);
    const alreadyPrompted = window.localStorage.getItem(storageKey) === "1";
    if (alreadyPrompted) return;

    window.localStorage.setItem(storageKey, "1");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
  }

  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.register("/sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(publicKey!),
    }));

  const payload = toPayload(subscription.toJSON());
  if (!payload) return;

  await notificationsApi.subscribePush(payload);
}
