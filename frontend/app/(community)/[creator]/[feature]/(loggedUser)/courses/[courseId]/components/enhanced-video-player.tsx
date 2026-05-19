"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Check,
  Gauge,
  Loader2,
  Lock,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  PlayCircle,
  RotateCcw,
  RotateCw,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { coursesApi } from "@/lib/api/courses.api"
import { videoPlaybackApi, type PlaybackSessionResponse } from "@/lib/api/video-playback.api"
import { detectVideoPlatform, parseVimeoVideoId, parseYouTubeVideoId } from "@/lib/utils/video-source"
import { tokenStorage } from "@/lib/token-storage"
import { ChabaqaLogoWatermark } from "@/components/media/chabaqa-logo-watermark"
import { cn } from "@/lib/utils"

interface EnhancedVideoPlayerProps {
  creatorSlug: string
  currentChapter: any
  isChapterAccessible: (chapterId: string) => boolean
  enrollment: any
  slug: string
  courseId: string
  onWatchTimeUpdate?: (seconds: number, duration?: number) => void
  onEnrollNow?: () => void
  /** Called after watch time is saved so parent can refetch progress (e.g. when enrollment was auto-created). */
  onProgressSaved?: () => void
  /** Called when chapter is marked complete — replaces global window.__onChapterComplete coupling. */
  onChapterComplete?: (chapterId: string) => void
}

type YouTubeApiPlayer = {
  getCurrentTime: () => Promise<number> | number
  getDuration: () => Promise<number> | number
  getPlayerState?: () => Promise<number> | number
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void
  destroy?: () => void
}

let youtubeIframeApiPromise: Promise<void> | null = null
const COMPLETION_RATIO = 0.99
type WatchTimeSyncOptions = { isFinal?: boolean }
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const formatVideoTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00"
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

const clampTime = (value: number, max: number) => {
  const safeMax = Number.isFinite(max) && max > 0 ? max : Number.MAX_SAFE_INTEGER
  return Math.min(Math.max(Number(value) || 0, 0), safeMax)
}

const normalizeApiError = (error: unknown) => {
  if (!error || typeof error !== "object") return error
  const anyError = error as any
  return {
    message: anyError?.message || anyError?.response?.data?.message,
    code: anyError?.code || anyError?.response?.data?.code,
    statusCode: anyError?.statusCode || anyError?.response?.status,
    details: anyError?.response?.data || anyError,
  }
}

const loadYouTubeIframeApi = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if ((window as any).YT?.Player) {
    return Promise.resolve()
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise
  }

  youtubeIframeApiPromise = new Promise<void>((resolve) => {
    let resolved = false
    let pollTimer = 0
    let timeoutTimer = 0

    const finish = () => {
      if (resolved) return
      cleanup()
      resolved = true
      resolve()
    }

    const cleanup = () => {
      if (pollTimer) {
        window.clearInterval(pollTimer)
        pollTimer = 0
      }
      if (timeoutTimer) {
        window.clearTimeout(timeoutTimer)
        timeoutTimer = 0
      }
    }

    const previousReady = (window as any).onYouTubeIframeAPIReady
    ;(window as any).onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") {
        try {
          previousReady()
        } catch {
          // ignore callback errors from other YouTube consumers
        }
      }
      finish()
    }

    pollTimer = window.setInterval(() => {
      if ((window as any).YT?.Player) {
        finish()
      }
    }, 100)

    timeoutTimer = window.setTimeout(() => {
      finish()
    }, 15000)

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    )
    if (!existingScript) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
    }
  })

  return youtubeIframeApiPromise
}

// ─── Dynamic Watermark Component ─────────────────────────────────────────────
function WatermarkText({ text, sessionShort }: { text: string; sessionShort: string }) {
  const [position, setPosition] = useState({ top: 10, left: 10 })

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        top: 8 + Math.floor(Math.random() * 70),
        left: 5 + Math.floor(Math.random() * 60),
      })
    }, 30000) // Reposition every 30 seconds
    setPosition({ top: 8 + Math.floor(Math.random() * 70), left: 5 + Math.floor(Math.random() * 60) })
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div
        className="absolute text-white/20 text-xs font-mono whitespace-nowrap transition-all duration-1000"
        style={{ top: `${position.top}%`, left: `${position.left}%` }}
      >
        {text}
      </div>
      <div
        className="absolute text-white/15 text-[10px] font-mono whitespace-nowrap transition-all duration-1000"
        style={{ top: `${(position.top + 45) % 85}%`, left: `${(position.left + 35) % 80}%` }}
      >
        {sessionShort}
      </div>
    </>
  )
}

function PlayerControlButton({
  label,
  children,
  onClick,
  className,
  disabled,
}: {
  label: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-md text-white transition",
            "hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
            "disabled:pointer-events-none disabled:opacity-45",
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="border-white/10 bg-black/90 text-xs text-white">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

// Memoized to prevent re-renders when parent CoursePlayer re-renders due to watch-time state changes.
// The polling interval inside this component would restart on every re-render otherwise.
const EnhancedVideoPlayerInner = React.memo(function EnhancedVideoPlayer({
  creatorSlug,
  currentChapter,
  isChapterAccessible,
  enrollment,
  slug,
  courseId,
  onWatchTimeUpdate,
  onEnrollNow,
  onProgressSaved,
  onChapterComplete,
}: EnhancedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [playbackSession, setPlaybackSession] = useState<PlaybackSessionResponse | null>(null)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPictureInPicture, setIsPictureInPicture] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null)
  const [openNativeMenu, setOpenNativeMenu] = useState<"speed" | "settings" | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null)
  const vimeoIframeRef = useRef<HTMLIFrameElement | null>(null)
  const vimeoReady = useRef(false)
  const [isVimeoReady, setIsVimeoReady] = useState(false)
  const lastObservedEmbeddedTimeRef = useRef<number>(0)
  const embeddedSyncStartedRef = useRef<boolean>(false)
  const progressRefreshTriggeredRef = useRef<boolean>(false)
  const lastEmbeddedUiEmitRef = useRef<number>(-1)
  const youtubeApiRef = useRef<YouTubeApiPlayer | null>(null)
  const isYouTubeReadyRef = useRef<boolean>(false)
  const youtubeMethodErrorLoggedRef = useRef<boolean>(false)
  const youtubeRuntimeErrorLoggedRef = useRef<boolean>(false)
  const youtubePollingBackoffUntilRef = useRef<number>(0)
  const watchTimeRef = useRef<number>(0)
  const videoDurationRef = useRef<number>(0)
  const enrollmentRef = useRef<any>(enrollment)
  const savedWatchPositionRef = useRef<number>(0)
  const sendWatchTimeRef = useRef<(time: number, duration?: number, options?: WatchTimeSyncOptions) => Promise<any>>(async () => null)
  // Use refs for callbacks so the polling interval / YouTube player never needs to
  // restart just because the callback reference changed.
  const onWatchTimeUpdateRef = useRef(onWatchTimeUpdate)
  useEffect(() => { onWatchTimeUpdateRef.current = onWatchTimeUpdate }, [onWatchTimeUpdate])
  const onChapterCompleteRef = useRef(onChapterComplete)
  useEffect(() => { onChapterCompleteRef.current = onChapterComplete }, [onChapterComplete])
  const markChapterCompletedOnceRef = useRef<(reason: string, context?: { currentTime?: number; duration?: number }) => Promise<void>>(async () => {})
  const sessionExtendIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hlsInstanceRef = useRef<any>(null)
  const controlsHideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousVolumeRef = useRef(1)

  const rawVideoUrl = currentChapter?.videoUrl || ''
  const hasProtectedVideo = Boolean(currentChapter?.hasProtectedVideo)

  // Determine the effective video URL:
  // - For protected videos: use the session stream URL
  // - For external embeds (YouTube/Vimeo): use the original URL
  // - For free/preview local videos: normalize the URL
  const videoUrl = useMemo(() => {
    if (hasProtectedVideo && playbackSession?.streamUrl) {
      return playbackSession.streamUrl
    }
    if (!rawVideoUrl) return ''
    if (rawVideoUrl.includes('/uploads/')) {
      try {
        if (rawVideoUrl.startsWith('http://localhost:') || rawVideoUrl.startsWith('http://127.0.0.1:')) return rawVideoUrl
        if (rawVideoUrl.startsWith('http')) {
          const urlObj = new URL(rawVideoUrl)
          if (typeof window !== 'undefined' && urlObj.origin === window.location.origin) return urlObj.pathname + urlObj.search
          return rawVideoUrl
        }
        if (!rawVideoUrl.startsWith('/')) return '/' + rawVideoUrl
        return rawVideoUrl
      } catch {
        const match = rawVideoUrl.match(/(\/uploads\/.*)/)
        if (match) return match[1]
        return rawVideoUrl
      }
    }
    return rawVideoUrl
  }, [rawVideoUrl, hasProtectedVideo, playbackSession?.streamUrl])

  const platform = hasProtectedVideo
    ? (playbackSession?.streamType === 'hls' ? 'hls' : 'local')
    : detectVideoPlatform(videoUrl)
  const youtubeId = platform === 'youtube' ? parseYouTubeVideoId(videoUrl) : null
  const vimeoId = platform === 'vimeo' ? parseVimeoVideoId(videoUrl) : null

  useEffect(() => {
    setPlayerError(null)
  }, [videoUrl, currentChapter?.id])

  const storageKey = useMemo(() => {
    const userIdFromEnrollment = enrollment?.userId ? String(enrollment.userId) : ""
    const userIdFromToken = typeof window !== "undefined" ? tokenStorage.getUserInfo()?.id : undefined
    const userScopeId = userIdFromEnrollment || userIdFromToken || "guest"
    if (!courseId || !currentChapter?.id) return null;
    return `course_progress_${userScopeId}_${courseId}_${currentChapter.id}`;
  }, [courseId, currentChapter?.id, enrollment?.userId]);

  // Saved watch position (seconds) from enrollment/progression (used to resume)
  const savedWatchPosition = useMemo(() => {
    if (!currentChapter?.id || !enrollment?.progress) return 0
    const chapterProgress = enrollment.progress.find((p: any) => String(p.chapterId) === String(currentChapter.id))
    const serverPosition = Number((chapterProgress && (chapterProgress as any).watchTime) ?? 0)

    // Check LocalStorage for a potentially newer position
    if (typeof window !== 'undefined' && storageKey) {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const { time } = JSON.parse(localData);
          if (time > serverPosition) return time;
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
    }

    return serverPosition;
  }, [currentChapter?.id, enrollment?.progress, storageKey])

  const chapterAccessible = currentChapter ? isChapterAccessible(currentChapter.id) : false

  useEffect(() => {
    watchTimeRef.current = watchTime
  }, [watchTime])

  useEffect(() => {
    videoDurationRef.current = videoDuration
  }, [videoDuration])

  useEffect(() => {
    enrollmentRef.current = enrollment
  }, [enrollment])

  useEffect(() => {
    savedWatchPositionRef.current = savedWatchPosition
  }, [savedWatchPosition])

  const getStoredHighWaterMark = useCallback(() => {
    let maxStored = savedWatchPosition
    if (typeof window === "undefined" || !storageKey) {
      return maxStored
    }

    const localData = localStorage.getItem(storageKey)
    if (!localData) {
      return maxStored
    }

    try {
      const parsed = JSON.parse(localData)
      maxStored = Math.max(maxStored, Number(parsed?.time || 0))
    } catch (error) {
      localStorage.removeItem(storageKey)
    }

    return maxStored
  }, [savedWatchPosition, storageKey])

  const persistHighWaterMark = useCallback((time: number) => {
    if (typeof window === "undefined" || !storageKey) return
    if (!Number.isFinite(time)) return

    const roundedTime = Math.max(0, Math.floor(time))
    const maxStored = getStoredHighWaterMark()
    if (roundedTime <= maxStored) return

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        time: roundedTime,
        timestamp: Date.now(),
      }),
    )
  }, [getStoredHighWaterMark, storageKey])

  const mapYouTubeErrorMessage = useCallback((code: number): string => {
    switch (code) {
      case 100:
        return "This YouTube video is unavailable or private."
      case 101:
      case 150:
        return "This YouTube video cannot be embedded. Ask the creator to enable embedding."
      case 2:
        return "Invalid YouTube video URL."
      case 5:
        return "The YouTube player could not load this video."
      default:
        return "Unable to play this YouTube video right now."
    }
  }, [])

  const getKeepAliveHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (typeof window !== "undefined") {
      try {
        // Keep parity with apiClient auth handling for authenticated progress sync.
        const { tokenStorage } = require("@/lib/token-storage")
        const accessToken = tokenStorage.getAccessToken()
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }
      } catch {
        // Ignore token lookup errors; cookie auth may still work.
      }
    }

    return headers
  }, [])

  // Initial UX sync: Notify parent about the saved position immediately on mount
  useEffect(() => {
    if (savedWatchPosition > 0 && onWatchTimeUpdateRef.current && currentChapter?.id) {
      const chapterProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))
      const duration = Number((chapterProgress && (chapterProgress as any).videoDuration) || currentChapter.duration || 0)
      onWatchTimeUpdateRef.current(savedWatchPosition, duration > 0 ? duration : undefined);
      setWatchTime(savedWatchPosition);
      if (duration > 0) setVideoDuration(duration);
    }
  }, [currentChapter?.id]); // Only run when chapter changes

  // ─── Playback Session Management ──────────────────────────────────────────
  useEffect(() => {
    if (!hasProtectedVideo) return
    if (!chapterAccessible) return
    if (!currentChapter?.id) return
    let cancelled = false
    const createSession = async () => {
      setIsLoadingSession(true)
      setPlaybackSession(null)
      try {
        const response = await videoPlaybackApi.createPlaybackSession(courseId, currentChapter.id)
        if (!cancelled && response?.data) setPlaybackSession(response.data)
      } catch (err: any) {
        if (!cancelled) setPlayerError(err?.response?.data?.message || err?.message || 'Failed to start video session')
      } finally {
        if (!cancelled) setIsLoadingSession(false)
      }
    }
    void createSession()
    return () => { cancelled = true }
  }, [hasProtectedVideo, courseId, currentChapter?.id, chapterAccessible])

  // Extend session periodically while watching
  useEffect(() => {
    if (!playbackSession?.sessionId) return
    sessionExtendIntervalRef.current = setInterval(async () => {
      try { await videoPlaybackApi.extendSession(playbackSession.sessionId) } catch {}
    }, 180000)
    return () => { if (sessionExtendIntervalRef.current) { clearInterval(sessionExtendIntervalRef.current); sessionExtendIntervalRef.current = null } }
  }, [playbackSession?.sessionId])

  // Clean up HLS on unmount
  useEffect(() => {
    return () => { if (hlsInstanceRef.current) { hlsInstanceRef.current.destroy(); hlsInstanceRef.current = null } }
  }, [currentChapter?.id])

  const isLocalFileVideo = useCallback(() => {
    const safeUrl = String(videoUrl || '')
    if (!safeUrl) return false
    if (safeUrl.includes('/uploads/')) return true
    if (safeUrl.includes('/api/video/stream/')) return true
    if (/s3\.amazonaws\.com|\.cloudfront\.net|storage\.googleapis\.com|blob\.core\.windows\.net|cdn\./i.test(safeUrl)) return true
    return /\.(mp4|webm|mov|avi|mkv|3gp)(\?.*)?$/i.test(safeUrl)
  }, [videoUrl])

  const progressPercent = videoDuration > 0 ? Math.min((watchTime / videoDuration) * 100, 100) : 0
  const bufferedPercent = videoDuration > 0 ? Math.min((bufferedTime / videoDuration) * 100, 100) : 0
  const visibleSeekTime = seekPreviewTime ?? watchTime
  const volumePercent = Math.round((isMuted ? 0 : volume) * 100)
  const supportsPictureInPicture =
    typeof document !== "undefined" &&
    "pictureInPictureEnabled" in document

  const updateBufferedState = useCallback((videoEl: HTMLVideoElement) => {
    if (!videoEl.buffered || videoEl.buffered.length === 0) {
      setBufferedTime(0)
      return
    }

    let latestBufferedEnd = 0
    for (let index = 0; index < videoEl.buffered.length; index += 1) {
      latestBufferedEnd = Math.max(latestBufferedEnd, videoEl.buffered.end(index))
    }
    setBufferedTime(latestBufferedEnd)
  }, [])

  const clearControlsHideTimer = useCallback(() => {
    if (controlsHideTimerRef.current) {
      clearTimeout(controlsHideTimerRef.current)
      controlsHideTimerRef.current = null
    }
  }, [])

  const showControlsTemporarily = useCallback((force = false) => {
    setControlsVisible(true)
    clearControlsHideTimer()

    if (!force && isPlaying) {
      controlsHideTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, 2400)
    }
  }, [clearControlsHideTimer, isPlaying])

  const toggleNativePlay = useCallback(async () => {
    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    try {
      if (videoEl.paused || videoEl.ended) {
        await videoEl.play()
      } else {
        videoEl.pause()
      }
    } catch {
      setPlayerError("Your browser blocked playback. Try again from the player.")
    }
  }, [])

  const seekNativeVideo = useCallback((targetSeconds: number) => {
    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    const targetTime = clampTime(targetSeconds, videoEl.duration || videoDuration)
    videoEl.currentTime = targetTime
    setWatchTime(targetTime)
    showControlsTemporarily(true)
  }, [showControlsTemporarily, videoDuration])

  const seekNativeBy = useCallback((deltaSeconds: number) => {
    const videoEl = htmlVideoRef.current
    if (!videoEl) return
    seekNativeVideo(Number(videoEl.currentTime || 0) + deltaSeconds)
  }, [seekNativeVideo])

  const setNativeVolume = useCallback((nextVolume: number) => {
    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    const normalizedVolume = Math.min(Math.max(nextVolume, 0), 1)
    videoEl.volume = normalizedVolume
    videoEl.muted = normalizedVolume === 0
    setVolume(normalizedVolume)
    setIsMuted(videoEl.muted)
    if (normalizedVolume > 0) {
      previousVolumeRef.current = normalizedVolume
    }
  }, [])

  const toggleNativeMute = useCallback(() => {
    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    if (videoEl.muted || volume === 0) {
      const restoredVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.8
      videoEl.volume = restoredVolume
      videoEl.muted = false
      setVolume(restoredVolume)
      setIsMuted(false)
    } else {
      previousVolumeRef.current = videoEl.volume || volume || 0.8
      videoEl.muted = true
      setIsMuted(true)
    }
  }, [volume])

  const setNativePlaybackRate = useCallback((rate: number) => {
    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    videoEl.playbackRate = rate
    setPlaybackRate(rate)
    setOpenNativeMenu(null)
  }, [])

  const toggleNativeFullscreen = useCallback(async () => {
    const container = playerContainerRef.current
    if (!container || typeof document === "undefined") return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
    } catch {
      // Fullscreen can be blocked by the browser or host frame.
    }
  }, [])

  const toggleNativePictureInPicture = useCallback(async () => {
    const videoEl = htmlVideoRef.current
    if (!videoEl || typeof document === "undefined") return
    if (!("pictureInPictureEnabled" in document) || !document.pictureInPictureEnabled) return
    if (!("requestPictureInPicture" in videoEl)) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoEl.requestPictureInPicture()
      }
    } catch {
      // PiP is optional and can be denied by the browser.
    }
  }, [])

  const handleNativePlayerKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && openNativeMenu) {
      event.preventDefault()
      setOpenNativeMenu(null)
      return
    }

    const target = event.target as HTMLElement | null
    const tagName = target?.tagName?.toLowerCase()
    if (tagName === "input" || tagName === "button" || tagName === "select") return

    switch (event.key.toLowerCase()) {
      case " ":
      case "k":
        event.preventDefault()
        void toggleNativePlay()
        break
      case "arrowleft":
      case "j":
        event.preventDefault()
        seekNativeBy(-10)
        break
      case "arrowright":
      case "l":
        event.preventDefault()
        seekNativeBy(10)
        break
      case "arrowup":
        event.preventDefault()
        setNativeVolume(Math.min(volume + 0.05, 1))
        break
      case "arrowdown":
        event.preventDefault()
        setNativeVolume(Math.max(volume - 0.05, 0))
        break
      case "m":
        event.preventDefault()
        toggleNativeMute()
        break
      case "f":
        event.preventDefault()
        void toggleNativeFullscreen()
        break
      case "p":
        event.preventDefault()
        void toggleNativePictureInPicture()
        break
      default:
        break
    }
  }, [
    seekNativeBy,
    setNativeVolume,
    openNativeMenu,
    toggleNativeFullscreen,
    toggleNativeMute,
    toggleNativePictureInPicture,
    toggleNativePlay,
    volume,
  ])

  useEffect(() => {
    showControlsTemporarily()
    return clearControlsHideTimer
  }, [clearControlsHideTimer, isPlaying, showControlsTemporarily])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
    }
  }, [])

  // Send watch time to backend (throttled via lastUpdateRef).
  const isSendingRef = useRef<boolean>(false)
  const hasSentCompleteRef = useRef<boolean>(false)
  const completeInFlightRef = useRef<boolean>(false)
  const completeRetryPendingRef = useRef<boolean>(false)
  const completeRetryCountRef = useRef<number>(0)

  const sendWatchTime = useCallback(async (time: number, duration?: number, options?: WatchTimeSyncOptions) => {
    if (!currentChapter?.id) return null
    if (!enrollmentRef.current) {
      // Preview playback stays local; no enrollment mutations.
      persistHighWaterMark(time)
      return null
    }
    if (isSendingRef.current && !options?.isFinal) return null
    if (isSendingRef.current && options?.isFinal) {
      for (let attempt = 0; attempt < 10 && isSendingRef.current; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      if (isSendingRef.current) return null
    }
    isSendingRef.current = true

    try {
      const response = options?.isFinal
        ? await coursesApi.updateChapterWatchTime(
            String(courseId),
            String(currentChapter.id),
            Math.floor(time),
            duration ? Math.floor(duration) : undefined,
            true,
          )
        : await coursesApi.updateChapterWatchTime(
            String(courseId),
            String(currentChapter.id),
            Math.floor(time),
            duration ? Math.floor(duration) : undefined,
          )
      persistHighWaterMark(time)
      lastUpdateRef.current = time

      if (response?.isAutoCompleted) {
        // Chapter auto-completed via backend
      }

      if (onWatchTimeUpdateRef.current) {
        onWatchTimeUpdateRef.current(Math.floor(time), duration ? Math.floor(duration) : undefined)
      }
      // Refresh progress once per chapter session so preview YouTube playback hydrates enrollment state.
      if (!progressRefreshTriggeredRef.current && onProgressSaved) {
        progressRefreshTriggeredRef.current = true
        try {
          await onProgressSaved()
        } catch (refreshError) {
          console.error("Failed to refresh progress after watch-time sync:", refreshError)
        }
      }
      if (completeRetryPendingRef.current && completeRetryCountRef.current < 3) {
        completeRetryPendingRef.current = false
        completeRetryCountRef.current += 1
        try {
          const retryResponse = await coursesApi.completeChapterEnrollment(String(courseId), String(currentChapter.id))
          if (retryResponse?.success) {
            if (onChapterCompleteRef.current) {
              onChapterCompleteRef.current(String(currentChapter.id))
            }
          }
          if (typeof (window as any).__onChapterComplete === 'function') {
            ;(window as any).__onChapterComplete()
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("course-progress-updated", {
                detail: { courseId: String(courseId), chapterId: String(currentChapter.id) },
              }),
            )
          }
          hasSentCompleteRef.current = true
          completeRetryCountRef.current = 0
        } catch (retryError) {
          console.error("Completion retry after watch-time sync failed:", normalizeApiError(retryError))
          completeRetryPendingRef.current = true
        }
      }
      return response
    } catch (error) {
      console.error('Failed to update watch time:', normalizeApiError(error))
      if (options?.isFinal) throw error
      return null
    } finally {
      isSendingRef.current = false
    }
  }, [courseId, currentChapter?.id, onProgressSaved, persistHighWaterMark])

  useEffect(() => {
    sendWatchTimeRef.current = sendWatchTime
  }, [sendWatchTime])

  const markChapterCompletedOnce = useCallback(
    async (reason: string, context?: { currentTime?: number; duration?: number }) => {
      if (!courseId || !currentChapter?.id) return
      if (!enrollmentRef.current) return
      if (hasSentCompleteRef.current || completeInFlightRef.current) return

      completeInFlightRef.current = true
      try {
        const contextWatchTime = Number(context?.currentTime ?? watchTimeRef.current ?? 0)
        const contextDuration = Number(context?.duration ?? videoDurationRef.current ?? 0)
        let completionResponse: any = null
        if (contextWatchTime > 0) {
          completionResponse = await sendWatchTimeRef.current(
            contextWatchTime,
            contextDuration > 0 ? contextDuration : undefined,
            { isFinal: true },
          )
        }
        if (!completionResponse?.isCompleted && !completionResponse?.isAutoCompleted) {
          completionResponse = await coursesApi.completeChapterEnrollment(String(courseId), String(currentChapter.id))
        }

        hasSentCompleteRef.current = true
        completeRetryPendingRef.current = false
        completeRetryCountRef.current = 0

        // Notify via the explicit callback prop (preferred over global coupling).
        if (onChapterCompleteRef.current) {
          onChapterCompleteRef.current(String(currentChapter.id))
        }

        if (typeof (window as any).__onChapterComplete === "function") {
          ;(window as any).__onChapterComplete()
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("course-progress-updated", {
              detail: { courseId: String(courseId), chapterId: String(currentChapter.id), reason },
            }),
          )
        }
      } catch (error) {
        hasSentCompleteRef.current = false
        completeRetryPendingRef.current = true
        console.error("Failed to complete chapter:", normalizeApiError(error))
      } finally {
        completeInFlightRef.current = false
      }
    },
    [courseId, currentChapter?.id],
  )

  useEffect(() => { markChapterCompletedOnceRef.current = markChapterCompletedOnce }, [markChapterCompletedOnce])

  // Initialize YouTube Player
  useEffect(() => {
    if (platform !== 'youtube' || !youtubeId || !playerRef.current) return
    if (!chapterAccessible) return

    const resumePosition = savedWatchPositionRef.current

    let createdPlayer: any = null
    let disposed = false

    const setReadyPlayer = (target: any) => {
      if (disposed) return

      const hasTime = typeof target?.getCurrentTime === "function"
      const hasDuration = typeof target?.getDuration === "function"
      if (!hasTime || !hasDuration) {
        youtubeApiRef.current = null
        isYouTubeReadyRef.current = false
        if (!youtubeMethodErrorLoggedRef.current) {
          youtubeMethodErrorLoggedRef.current = true
          console.warn("[VideoPlayer] YouTube player missing required methods for tracking")
        }
        return
      }

      youtubeApiRef.current = target as YouTubeApiPlayer
      isYouTubeReadyRef.current = true
      youtubeMethodErrorLoggedRef.current = false
      youtubeRuntimeErrorLoggedRef.current = false
      youtubePollingBackoffUntilRef.current = 0
    }

    const initPlayer = () => {
      if (!playerRef.current) return

      try {
        playerRef.current.innerHTML = ""
      } catch {
        // ignore cleanup failures
      }

      createdPlayer = new (window as any).YT.Player(playerRef.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event: any) => {
            const readyTarget = event?.target || createdPlayer
            setReadyPlayer(readyTarget)
            setPlayerError(null)
            // Resume position if available
            if (resumePosition && resumePosition > 0) {
              try {
                readyTarget?.seekTo?.(resumePosition, true)
                lastUpdateRef.current = resumePosition
                setWatchTime(resumePosition)
              } catch (e) {
                // ignore seek errors
              }
            }
          },
          onStateChange: (event: any) => {
            if (event?.target) {
              setReadyPlayer(event.target)
            }
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              setPlayerError(null)
            } else if (event.data === (window as any).YT.PlayerState.ENDED) {
              setIsPlaying(false)
              void markChapterCompletedOnceRef.current("youtube_ended")
            } else {
              setIsPlaying(false)
            }
          },
          onError: (event: any) => {
            const code = Number(event?.data || 0)
            const message = mapYouTubeErrorMessage(code)
            setIsPlaying(false)
            setPlayerError(message)
            isYouTubeReadyRef.current = false
            youtubeApiRef.current = null
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("media:video-error", {
                  detail: {
                    chapterId: currentChapter?.id,
                    platform: "youtube",
                    errorCode: code,
                    message,
                    playableUrl: videoUrl,
                    originalUrl: rawVideoUrl,
                  },
                }),
              )
            }
          },
        },
      })
    }

    void loadYouTubeIframeApi()
      .then(() => {
        if (disposed) return
        if (!(window as any).YT?.Player) {
          if (!youtubeRuntimeErrorLoggedRef.current) {
            youtubeRuntimeErrorLoggedRef.current = true
            console.warn("[VideoPlayer] YouTube API did not initialize in time")
          }
          return
        }
        initPlayer()
      })
      .catch(() => {
        if (!youtubeRuntimeErrorLoggedRef.current) {
          youtubeRuntimeErrorLoggedRef.current = true
          console.warn("[VideoPlayer] Failed to initialize YouTube API")
        }
      })

    return () => {
      disposed = true
      isYouTubeReadyRef.current = false
      youtubeApiRef.current = null
      youtubeMethodErrorLoggedRef.current = false
      youtubeRuntimeErrorLoggedRef.current = false
      youtubePollingBackoffUntilRef.current = 0
      if (createdPlayer && typeof createdPlayer.destroy === "function") {
        createdPlayer.destroy()
      }
    }
  }, [
    youtubeId,
    platform,
    currentChapter?.id,
    chapterAccessible,
    mapYouTubeErrorMessage,
    rawVideoUrl,
    videoUrl,
  ])

  // Initialize Vimeo Player tracking via postMessage API
  useEffect(() => {
    if (platform !== 'vimeo' || !vimeoId || !vimeoIframeRef.current) return
    // Allow initializing Vimeo player for preview chapters even when not enrolled.
    if (!isChapterAccessible(currentChapter?.id)) return

    const iframe = vimeoIframeRef.current
    const iframeWindow = iframe.contentWindow
    if (!iframeWindow) return

    // Enable Vimeo Player API
    const enableApi = () => {
      iframeWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), '*')
      iframeWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'pause' }), '*')
      iframeWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'timeupdate' }), '*')
      iframeWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'ended' }), '*')
      iframeWindow.postMessage(JSON.stringify({ method: 'getDuration' }), '*')
    }

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vimeo.com')) return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data.event === 'ready') {
          vimeoReady.current = true
          setIsVimeoReady(true)
          enableApi()
          // Seek to saved position if available
          if (savedWatchPosition && savedWatchPosition > 0) {
            try {
              iframeWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: savedWatchPosition }), '*')
              lastUpdateRef.current = savedWatchPosition
              setWatchTime(savedWatchPosition)
            } catch (e) {
              // ignore
            }
          }
        } else if (data.event === 'play') {
          setIsPlaying(true)
        } else if (data.event === 'pause') {
          setIsPlaying(false)
        } else if (data.event === 'timeupdate' && data.data) {
          const time = Number(data.data.seconds || 0)
          const duration = Number(data.data.duration || 0)
          const maxStored = getStoredHighWaterMark()
          setWatchTime(time)
          if (duration > 0) setVideoDuration(duration)

          // Immediately notify parent so UI can update optimistically per-second
          if (onWatchTimeUpdateRef.current) {
            try {
              onWatchTimeUpdateRef.current(Math.floor(time), duration > 0 ? Math.floor(duration) : undefined)
            } catch (e) {
              // ignore
            }
          }

          // Send update every 5 seconds (backend can auto-create enrollment)
          if (time - lastUpdateRef.current >= 5) {
            if (time > maxStored) {
               persistHighWaterMark(time)
               void sendWatchTimeRef.current(time, duration > 0 ? duration : undefined)
            }
          }

          // Completion trigger (ended or >=99%) for all chapters
          if (duration > 0 && !hasSentCompleteRef.current) {
            const pct = time / duration
            if (pct >= COMPLETION_RATIO) {
              void markChapterCompletedOnceRef.current("vimeo_99_percent", { currentTime: time, duration })
            }
          }
        } else if (data.event === "ended") {
          setIsPlaying(false)
          void markChapterCompletedOnceRef.current("vimeo_ended")
        } else if (data.method === 'getDuration' && data.value) {
          setVideoDuration(Number(data.value))
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    }

    window.addEventListener('message', handleMessage)

    // Try to enable API after a short delay (iframe may need time to load)
    const timeoutId = setTimeout(() => {
      enableApi()
    }, 1000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timeoutId)
    }
  }, [
    vimeoId,
    platform,
    currentChapter?.id,
    isChapterAccessible,
    getStoredHighWaterMark,
    persistHighWaterMark,
    savedWatchPosition,
  ])

  // Track watch time for native HTML5 video
  useEffect(() => {
    if (!isLocalFileVideo()) return
    const accessAllowed = currentChapter?.id ? isChapterAccessible(currentChapter?.id) : false
    if (!accessAllowed) return

    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    const syncNativeMediaState = () => {
      setIsPlaying(!videoEl.paused && !videoEl.ended)
      setIsMuted(videoEl.muted)
      setVolume(videoEl.volume)
      setPlaybackRate(videoEl.playbackRate)
      if (videoEl.duration > 0) setVideoDuration(videoEl.duration)
      updateBufferedState(videoEl)
    }

    const onTimeUpdate = () => {
      const currentTime = videoEl.currentTime;
      const duration = videoEl.duration;

      // Update local state for current playback
      setWatchTime(currentTime);
      if (duration > 0) setVideoDuration(duration);
      updateBufferedState(videoEl)

      // --- HIGH WATER MARK LOGIC ---
      // We calculate the maximum time reached across all storage layers
      const maxStoredTime = getStoredHighWaterMark()

      // The effective progress is the maximum of current time and anything previously saved
      const effectiveMaxTime = Math.max(maxStoredTime, Math.floor(currentTime));

      // Notify parent with the HIGH WATER MARK for UI/UX stability (sidebar, header, etc)
      if (onWatchTimeUpdateRef.current) {
        onWatchTimeUpdateRef.current(effectiveMaxTime, duration > 0 ? Math.floor(duration) : undefined);
      }

      // Update LocalStorage Mirror (Only if current time is actually greater)
      if (Math.floor(currentTime) > maxStoredTime) {
        persistHighWaterMark(currentTime)
      }

      // --- AUTO-COMPLETION RECOVERY ---
      // If High-Water Mark is already >= 99% (e.g. from local storage), ensure we mark it complete
      // This handles the "I already completed it" case where backend might have missed it.
      if (duration > 0 && !hasSentCompleteRef.current) {
         if (effectiveMaxTime / duration >= COMPLETION_RATIO) {
            void markChapterCompletedOnceRef.current("high_watermark_99_percent", { currentTime: effectiveMaxTime, duration });
         }
      }

      // Throttled sync to backend (every 5 seconds) - ONLY if advancing beyond high-water mark
      if (currentTime - lastUpdateRef.current >= 5 && Math.floor(currentTime) > maxStoredTime) {
        sendWatchTimeRef.current(currentTime, duration > 0 ? duration : undefined);
      }

      // Standard Completion check (Live Playback)
      // (This is redundant if the block above catches it, but kept for safety during active play)
      if (duration > 0 && !hasSentCompleteRef.current) {
        if (currentTime / duration >= COMPLETION_RATIO) {
          void markChapterCompletedOnceRef.current("native_99_percent", { currentTime, duration });
        }
      }
    };

    videoEl.addEventListener('timeupdate', onTimeUpdate);

    // Resume position
    const onLoadedMetadataResume = () => {
      const videoEl = htmlVideoRef.current;
      if (!videoEl) return;

      syncNativeMediaState()

      if (savedWatchPosition > 0) {
        const seekTime = Math.min(savedWatchPosition, videoEl.duration - 0.5);
        try {
          videoEl.currentTime = seekTime;
          lastUpdateRef.current = seekTime;
          setWatchTime(seekTime);
        } catch (e) {
          // Seek failed
        }
      }
    };

    videoEl.addEventListener('loadedmetadata', onLoadedMetadataResume);

    const onPlay = () => {
      setIsPlaying(true)
      showControlsTemporarily()
    }
    const onPause = () => {
      setIsPlaying(false)
      setControlsVisible(true)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setControlsVisible(true)
      void markChapterCompletedOnceRef.current("native_ended", { currentTime: videoEl.currentTime, duration: videoEl.duration })
    }
    const onVolumeChange = () => {
      setIsMuted(videoEl.muted)
      setVolume(videoEl.volume)
      if (!videoEl.muted && videoEl.volume > 0) {
        previousVolumeRef.current = videoEl.volume
      }
    }
    const onRateChange = () => setPlaybackRate(videoEl.playbackRate)
    const onProgress = () => updateBufferedState(videoEl)
    const onEnterPictureInPicture = () => setIsPictureInPicture(true)
    const onLeavePictureInPicture = () => setIsPictureInPicture(false)

    syncNativeMediaState()

    videoEl.addEventListener('play', onPlay)
    videoEl.addEventListener('pause', onPause)
    videoEl.addEventListener('ended', onEnded)
    videoEl.addEventListener('volumechange', onVolumeChange)
    videoEl.addEventListener('ratechange', onRateChange)
    videoEl.addEventListener('progress', onProgress)
    videoEl.addEventListener('durationchange', syncNativeMediaState)
    videoEl.addEventListener('enterpictureinpicture', onEnterPictureInPicture)
    videoEl.addEventListener('leavepictureinpicture', onLeavePictureInPicture)

    return () => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.removeEventListener('play', onPlay)
      videoEl.removeEventListener('pause', onPause)
      videoEl.removeEventListener('ended', onEnded)
      videoEl.removeEventListener('loadedmetadata', onLoadedMetadataResume)
      videoEl.removeEventListener('volumechange', onVolumeChange)
      videoEl.removeEventListener('ratechange', onRateChange)
      videoEl.removeEventListener('progress', onProgress)
      videoEl.removeEventListener('durationchange', syncNativeMediaState)
      videoEl.removeEventListener('enterpictureinpicture', onEnterPictureInPicture)
      videoEl.removeEventListener('leavepictureinpicture', onLeavePictureInPicture)
    }
  }, [
    currentChapter?.id,
    isChapterAccessible,
    isLocalFileVideo,
    savedWatchPosition,
    courseId,
    getStoredHighWaterMark,
    persistHighWaterMark,
    showControlsTemporarily,
    updateBufferedState,
  ]);

  // Track watch time when playing (run even without enrollment so backend can auto-create it)
  useEffect(() => {
    if (platform === 'youtube' && currentChapter?.id) {
      intervalRef.current = setInterval(async () => {
        if (Date.now() < youtubePollingBackoffUntilRef.current) {
          return
        }

        try {
          if (!isYouTubeReadyRef.current || !youtubeApiRef.current) {
            return
          }

          const canReadTime = typeof youtubeApiRef.current.getCurrentTime === "function"
          const canReadDuration = typeof youtubeApiRef.current.getDuration === "function"
          if (!canReadTime || !canReadDuration) {
            if (!youtubeMethodErrorLoggedRef.current) {
              youtubeMethodErrorLoggedRef.current = true
              console.warn("[VideoPlayer] YouTube tracking skipped: missing getCurrentTime/getDuration")
            }
            return
          }

          const currentTime = Number((await youtubeApiRef.current.getCurrentTime()) || 0)
          const duration = Number((await youtubeApiRef.current.getDuration()) || 0)
          youtubeRuntimeErrorLoggedRef.current = false
          youtubePollingBackoffUntilRef.current = 0
          const previousObserved = Number(lastObservedEmbeddedTimeRef.current || 0)
          const isAdvancing = currentTime > previousObserved + 0.25
          if (isAdvancing || currentTime > previousObserved) {
            lastObservedEmbeddedTimeRef.current = currentTime
          }
          if (isAdvancing) {
            embeddedSyncStartedRef.current = true
          }

          setWatchTime(currentTime)
          if (duration > 0) setVideoDuration(duration)

          const flooredTime = Math.floor(currentTime)
          const shouldEmitUiUpdate =
            isAdvancing || flooredTime > lastEmbeddedUiEmitRef.current

          // Keep UI responsive while avoiding repeated identical emits.
          if (shouldEmitUiUpdate && onWatchTimeUpdateRef.current) {
            try {
              lastEmbeddedUiEmitRef.current = flooredTime
              onWatchTimeUpdateRef.current(flooredTime, duration > 0 ? Math.floor(duration) : undefined)
            } catch (e) {
              // ignore
            }
          }

          // Sync when playback has advanced at least once in this session.
          // Throttled to 5 seconds to reduce visual jitter and backend load
          if ((embeddedSyncStartedRef.current || isAdvancing) && currentTime - lastUpdateRef.current >= 5) {
             const maxStored = getStoredHighWaterMark()
             if (currentTime > maxStored) {
               persistHighWaterMark(currentTime)
               await sendWatchTimeRef.current(currentTime, duration > 0 ? duration : undefined)
             }
          }

          // Completion trigger (ended or >=99%) for all chapters
          if (duration > 0 && !hasSentCompleteRef.current) {
            const pct = currentTime / duration
            if (pct >= COMPLETION_RATIO) {
              await markChapterCompletedOnceRef.current("interval_embedded_99_percent", { currentTime, duration })
            }
          }
        } catch (error) {
          youtubePollingBackoffUntilRef.current = Date.now() + 4000
          if (!youtubeRuntimeErrorLoggedRef.current) {
            youtubeRuntimeErrorLoggedRef.current = true
            console.warn("[VideoPlayer] YouTube polling paused after runtime error")
          }
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [
    currentChapter?.id,
    isLocalFileVideo,
    platform,
    getStoredHighWaterMark,
    persistHighWaterMark,
  ])

  // Final sync on tab close / navigation
  useEffect(() => {
    if (!courseId || !currentChapter?.id || !watchTime || !enrollment) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveFinalProgress();
      }
    };

    const handleBeforeUnload = () => {
      saveFinalProgress();
    };

    const saveFinalProgress = () => {
      if (!currentChapter?.id) return;

      // UX Fix: Only save if we are actually at or beyond the saved/max position
      // This prevents sending redundant requests when the user is re-watching
      const maxTime = getStoredHighWaterMark()

      if (Math.floor(watchTime) < maxTime) {
        return;
      }
      persistHighWaterMark(watchTime)

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const endpoint = `${backendUrl}/course-enrollment/${courseId}/chapters/${currentChapter.id}/watch-time`;

      const payload = JSON.stringify({
        watchTime: Math.floor(watchTime),
        videoDuration: videoDuration > 0 ? Math.floor(videoDuration) : undefined,
        isFinal: videoDuration > 0 && watchTime / videoDuration >= COMPLETION_RATIO,
      });

      const keepAliveRequest = fetch(endpoint, {
        method: "PUT",
        credentials: "include",
        keepalive: true,
        headers: getKeepAliveHeaders(),
        body: payload,
      })

      // Fallback for environments where keepalive fetch fails unexpectedly.
      void keepAliveRequest.catch(() => {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }))
        }
      })
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [courseId, currentChapter?.id, watchTime, videoDuration, getKeepAliveHeaders, getStoredHighWaterMark, persistHighWaterMark, enrollment]);

  // Reset completion flag when chapter changes
  useEffect(() => {
    hasSentCompleteRef.current = false
    completeRetryPendingRef.current = false
    completeRetryCountRef.current = 0
    completeInFlightRef.current = false
    lastObservedEmbeddedTimeRef.current = 0
    embeddedSyncStartedRef.current = false
    progressRefreshTriggeredRef.current = false
    lastEmbeddedUiEmitRef.current = -1
    isYouTubeReadyRef.current = false
    youtubeApiRef.current = null
    youtubeMethodErrorLoggedRef.current = false
    youtubeRuntimeErrorLoggedRef.current = false
    youtubePollingBackoffUntilRef.current = 0
    setPlaybackSession(null)
    setIsLoadingSession(false)
    setWatchTime(0)
    setVideoDuration(0)
    setBufferedTime(0)
    setSeekPreviewTime(null)
    setControlsVisible(true)
    setIsPictureInPicture(false)
    setOpenNativeMenu(null)
  }, [currentChapter?.id])

  // Check if video URL is valid (not empty string)
  const hasValidVideoUrl = Boolean(
    (currentChapter?.videoUrl &&
    typeof currentChapter.videoUrl === 'string' &&
    currentChapter.videoUrl.trim() !== '') ||
    hasProtectedVideo
  );

  const shouldShowLocked = !hasValidVideoUrl || !videoUrl || Boolean(playerError) || !chapterAccessible

  // Loading state while creating playback session
  if (isLoadingSession || (hasProtectedVideo && !playbackSession && !playerError && chapterAccessible)) {
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="relative bg-black aspect-video">
          <div className="flex items-center justify-center h-full text-white bg-gray-900">
            <div className="text-center">
              <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin opacity-60" />
              <p className="text-sm text-gray-400">Preparing secure playback...</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // For protected video: skip shouldShowLocked if we have a session
  const effectiveShowLocked = hasProtectedVideo && playbackSession ? false : shouldShowLocked;

  if (effectiveShowLocked) {

    const isAccessDenied = !chapterAccessible
    const isVideoMissing = !hasValidVideoUrl || !videoUrl || Boolean(playerError)

    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="relative bg-black aspect-video">
          <div className="flex items-center justify-center h-full text-white bg-gray-800">
            <div className="text-center">
              {isVideoMissing ? (
                <>
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Video Unavailable</p>
                  <p className="text-sm text-gray-300 mt-2">
                    {playerError || "The video for this chapter is currently unavailable."}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Please contact the course creator to upload the video content.</p>
                </>
              ) : isAccessDenied ? (
                <>
                  <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  {currentChapter?.isPaidChapter ? (
                    <>
                      <p className="text-lg font-semibold">Payment Required</p>
                      <p className="text-sm text-gray-300 mt-2">You must pay to access this chapter.</p>
                      <Button className="mt-4" onClick={onEnrollNow}>
                        Enroll to Access
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold">Chapter Locked</p>
                      {enrollment ? (
                        <p className="text-sm text-gray-300 mt-2">Complete previous chapters to unlock this content.</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-300 mt-2">Enroll in the course to access this content</p>
                          <Button className="mt-4" onClick={onEnrollNow}>
                            Enroll Now
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div
        ref={playerContainerRef}
        className="group relative aspect-video overflow-hidden bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        tabIndex={isLocalFileVideo() ? 0 : undefined}
        role={isLocalFileVideo() ? "region" : undefined}
        aria-label={isLocalFileVideo() ? `${currentChapter?.title || "Course"} video player` : undefined}
        onKeyDown={isLocalFileVideo() ? handleNativePlayerKeyDown : undefined}
        onMouseMove={() => {
          if (isLocalFileVideo()) showControlsTemporarily()
        }}
        onFocus={() => {
          if (isLocalFileVideo()) setControlsVisible(true)
        }}
        onMouseLeave={() => {
          if (isLocalFileVideo() && isPlaying) setControlsVisible(false)
        }}
      >
        {/* Full-surface logo watermark overlay for all player branches.
            Browser/native fullscreen can elevate media layers above DOM overlays. */}
        <ChabaqaLogoWatermark enabled />

        {/* Dynamic Watermark for protected videos */}
        {playbackSession?.watermark && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
            <WatermarkText text={playbackSession.watermark.text} sessionShort={playbackSession.watermark.sessionShort} />
          </div>
        )}

        {isLocalFileVideo() ? (
          <>
            <video
              key={videoUrl} // Force re-render when URL changes
              ref={htmlVideoRef}
              src={videoUrl}
              playsInline
              preload="metadata"
              controlsList="nodownload"
              className="absolute inset-0 h-full w-full object-contain"
              onClick={() => void toggleNativePlay()}
              onDoubleClick={() => void toggleNativeFullscreen()}
              onContextMenu={(e) => e.preventDefault()}
              onError={() => {
                setPlayerError("Unable to load this video right now.")
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("media:video-error", {
                    detail: {
                      chapterId: currentChapter?.id,
                      platform: "local",
                    },
                  }))
                }
              }}
            />

            <TooltipProvider delayDuration={150}>
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 z-40 flex flex-col justify-between transition-opacity duration-200",
                  controlsVisible || !isPlaying ? "opacity-100" : "opacity-0",
                )}
                data-testid="chabaqa-video-controls"
              >
                <div className="pointer-events-none h-20 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />

                {!isPlaying && (
                  <div className="pointer-events-auto absolute inset-0 grid place-items-center">
                    <button
                      type="button"
                      aria-label="Play video"
                      title="Play video"
                      onClick={() => void toggleNativePlay()}
                      className="grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-black/50 text-white shadow-2xl backdrop-blur transition hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Play className="ml-1 h-8 w-8 fill-current" />
                    </button>
                  </div>
                )}

                <div className="pointer-events-auto mt-auto bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10 sm:px-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-medium text-white/90 sm:text-xs">
                    <span className="truncate">{currentChapter?.title || currentChapter?.titre || "Chapter video"}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatVideoTime(visibleSeekTime)} / {formatVideoTime(videoDuration)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={videoDuration > 0 ? videoDuration : 100}
                    step={0.1}
                    value={videoDuration > 0 ? visibleSeekTime : 0}
                    aria-label="Seek video"
                    aria-valuetext={`${formatVideoTime(visibleSeekTime)} of ${formatVideoTime(videoDuration)}`}
                    disabled={videoDuration <= 0}
                    onInput={(event) => {
                      const nextTime = Number(event.currentTarget.value)
                      setSeekPreviewTime(nextTime)
                      seekNativeVideo(nextTime)
                    }}
                    onChange={(event) => {
                      const nextTime = Number(event.currentTarget.value)
                      seekNativeVideo(nextTime)
                    }}
                    onPointerUp={() => setSeekPreviewTime(null)}
                    onBlur={() => setSeekPreviewTime(null)}
                    className="chabaqa-video-range h-2 w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: `linear-gradient(to right, rgb(139 92 246) 0%, rgb(139 92 246) ${progressPercent}%, rgba(255,255,255,0.55) ${progressPercent}%, rgba(255,255,255,0.55) ${Math.max(bufferedPercent, progressPercent)}%, rgba(255,255,255,0.22) ${Math.max(bufferedPercent, progressPercent)}%, rgba(255,255,255,0.22) 100%)`,
                    }}
                  />

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                    <PlayerControlButton label={isPlaying ? "Pause" : "Play"} onClick={() => void toggleNativePlay()}>
                      {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                    </PlayerControlButton>

                    <PlayerControlButton label="Back 10 seconds" onClick={() => seekNativeBy(-10)}>
                      <RotateCcw className="h-4 w-4" />
                    </PlayerControlButton>

                    <PlayerControlButton label="Forward 10 seconds" onClick={() => seekNativeBy(10)}>
                      <RotateCw className="h-4 w-4" />
                    </PlayerControlButton>

                    <div className="flex min-w-0 flex-1 items-center gap-2 pl-1 text-white">
                      <PlayerControlButton
                        label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                        onClick={toggleNativeMute}
                        className="h-8 w-8"
                      >
                        {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </PlayerControlButton>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        aria-label="Volume"
                        aria-valuetext={`${volumePercent}%`}
                        onChange={(event) => setNativeVolume(Number(event.currentTarget.value))}
                        className="chabaqa-video-range hidden h-1.5 w-24 cursor-pointer appearance-none rounded-full sm:block"
                        style={{
                          background: `linear-gradient(to right, rgb(255 255 255) 0%, rgb(255 255 255) ${volumePercent}%, rgba(255,255,255,0.25) ${volumePercent}%, rgba(255,255,255,0.25) 100%)`,
                        }}
                      />
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label="Playback speed"
                        aria-haspopup="menu"
                        aria-expanded={openNativeMenu === "speed"}
                        title="Playback speed"
                        onClick={(event) => {
                          event.stopPropagation()
                          showControlsTemporarily(true)
                          setOpenNativeMenu((menu) => (menu === "speed" ? null : "speed"))
                        }}
                        className="flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      >
                        <Gauge className="h-4 w-4" />
                        <span>{playbackRate}x</span>
                      </button>
                      {openNativeMenu === "speed" && (
                        <div
                          role="menu"
                          aria-label="Playback speed options"
                          className="absolute bottom-11 right-0 z-50 w-36 rounded-md border border-white/10 bg-black/95 p-1 text-white shadow-2xl backdrop-blur"
                        >
                          <div className="px-2 py-1.5 text-xs font-semibold text-white/65">Speed</div>
                          <div className="my-1 h-px bg-white/10" />
                          {PLAYBACK_RATES.map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              role="menuitem"
                              onClick={() => setNativePlaybackRate(rate)}
                              className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                            >
                              <span>{rate}x</span>
                              {playbackRate === rate && <Check className="ml-auto h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <PlayerControlButton
                      label={
                        supportsPictureInPicture
                          ? isPictureInPicture
                            ? "Exit picture in picture"
                            : "Picture in picture"
                          : "Picture in picture unavailable"
                      }
                      onClick={() => void toggleNativePictureInPicture()}
                      disabled={!supportsPictureInPicture}
                    >
                      <PictureInPicture className="h-4 w-4" />
                    </PlayerControlButton>

                    <PlayerControlButton
                      label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                      onClick={() => void toggleNativeFullscreen()}
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </PlayerControlButton>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label="Player settings"
                        aria-haspopup="menu"
                        aria-expanded={openNativeMenu === "settings"}
                        title="Player settings"
                        onClick={(event) => {
                          event.stopPropagation()
                          showControlsTemporarily(true)
                          setOpenNativeMenu((menu) => (menu === "settings" ? null : "settings"))
                        }}
                        className="grid h-9 w-9 place-items-center rounded-md text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      {openNativeMenu === "settings" && (
                        <div
                          role="menu"
                          aria-label="Player shortcuts"
                          className="absolute bottom-11 right-0 z-50 w-52 rounded-md border border-white/10 bg-black/95 p-2 text-white shadow-2xl backdrop-blur"
                        >
                          <div className="px-1 pb-2 text-xs font-semibold text-white/65">Shortcuts</div>
                          {[
                            ["Play / pause", "Space"],
                            ["Seek", "J / L"],
                            ["Mute", "M"],
                            ["Fullscreen", "F"],
                          ].map(([label, shortcut]) => (
                            <div
                              key={label}
                              role="menuitem"
                              className="flex items-center justify-between gap-4 rounded-sm px-1.5 py-1.5 text-sm text-white/90"
                            >
                              <span>{label}</span>
                              <span className="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs text-white/60">
                                {shortcut}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </>
        ) : platform === 'youtube' && youtubeId ? (
          <div ref={playerRef} className="absolute inset-0 w-full h-full" />
        ) : platform === 'vimeo' && vimeoId ? (
          <iframe
            ref={vimeoIframeRef}
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0&api=1`}
            title={currentChapter.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <iframe
            src={videoUrl}
            title={currentChapter.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}

        {/* Watch time indicator (for tracking confirmation) - Only show when advancing BEYOND high-water mark */}
        {enrollment && watchTime > savedWatchPosition && watchTime > 0 && (
          <div className="absolute top-2 right-2 z-30 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${videoDuration > 0 ? (watchTime / videoDuration) * 100 : 0}%`
                }}
              />
            </div>
            <span>
              {Math.floor(watchTime / 60)}:{String(Math.floor(watchTime % 60)).padStart(2, '0')}
              {videoDuration > 0 && ` / ${Math.floor(videoDuration / 60)}:${String(Math.floor(videoDuration % 60)).padStart(2, '0')}`}
            </span>
          </div>
        )}
        <style jsx>{`
          .chabaqa-video-range::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 9999px;
            border: 2px solid rgba(255, 255, 255, 0.95);
            background: rgb(139 92 246);
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2), 0 8px 18px rgba(0, 0, 0, 0.35);
          }

          .chabaqa-video-range::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 9999px;
            border: 2px solid rgba(255, 255, 255, 0.95);
            background: rgb(139 92 246);
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2), 0 8px 18px rgba(0, 0, 0, 0.35);
          }

          .chabaqa-video-range::-moz-range-track {
            background: transparent;
          }
        `}</style>
      </div>
    </Card>
  )
})

export default EnhancedVideoPlayerInner
