import { hasAnalyticsConsent } from "@/lib/cookie-consent"

// GA4 client-side helper for the Chabaqa web app
// Usage:
//  - Configure NEXT_PUBLIC_GA_MEASUREMENT_ID in your env
//  - Include the GA4 script in the root layout (see app/(community)/layout.tsx)
//  - Import and use trackEvent / setUserProperties in client components

type GA4EventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const isGa4Enabled = typeof window !== "undefined" && !!GA_MEASUREMENT_ID;

function safeGtag(...args: any[]) {
  if (
    !isGa4Enabled ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function" ||
    !hasAnalyticsConsent()
  ) {
    return;
  }
  window.gtag(...args);
}

export function trackEvent(eventName: string, params: GA4EventParams = {}): void {
  // Never crash the UI if GA is misconfigured
  try {
    safeGtag("event", eventName, params);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[GA4] Failed to send event", eventName, error);
    }
  }
}

export function setUserProperties(props: GA4EventParams): void {
  try {
    safeGtag("set", "user_properties", props);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[GA4] Failed to set user properties", error);
    }
  }
}
