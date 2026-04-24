import { apiClient } from './client';

export interface PlaybackSessionResponse {
  sessionId: string;
  streamUrl: string;
  streamType: 'mp4' | 'hls';
  expiresAt: string;
  watermark: {
    text: string;
    sessionShort: string;
  };
}

/**
 * Video Playback API — manages secure video delivery through playback sessions.
 * Premium videos are never accessed directly; instead the player:
 * 1. Creates a short-lived session via createPlaybackSession()
 * 2. Uses the returned streamUrl as the <video> src or hls.js manifest
 * 3. Periodically extends the session while actively watching
 */
export const videoPlaybackApi = {
  /**
   * Create a playback session for a chapter.
   * Requires authentication and chapter entitlement.
   */
  createPlaybackSession: async (
    courseId: string,
    chapterId: string,
  ): Promise<{ success: boolean; data: PlaybackSessionResponse }> => {
    return apiClient.post('/video/playback-session', { courseId, chapterId });
  },

  /**
   * Extend an active playback session (heartbeat).
   * Call this periodically while the user is actively watching.
   */
  extendSession: async (
    sessionId: string,
  ): Promise<{ success: boolean; data: { extended: boolean } }> => {
    return apiClient.post('/video/extend-session', { sessionId });
  },
};
