import { challengesApi } from "./challenges.api";

const viewKey = (challengeId: string) => `challenge:view:${challengeId}`;

export async function trackChallengeViewOnce(challengeId: string): Promise<void> {
  if (!challengeId || typeof window === "undefined") return;

  const key = viewKey(challengeId);
  if (window.sessionStorage.getItem(key)) return;

  try {
    await challengesApi.trackView(challengeId);
    window.sessionStorage.setItem(key, "1");
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // Non-blocking analytics signal
      console.debug("[challenge-tracking] trackView failed", error);
    }
  }
}
