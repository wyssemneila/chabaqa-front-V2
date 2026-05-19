import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import EnhancedVideoPlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/enhanced-video-player"
import { coursesApi } from "@/lib/api/courses.api"
import { videoPlaybackApi } from "@/lib/api/video-playback.api"

jest.mock("@/lib/api/courses.api", () => ({
  coursesApi: {
    updateChapterWatchTime: jest.fn().mockResolvedValue({}),
    completeChapterEnrollment: jest.fn().mockResolvedValue({ success: true }),
  },
}))

jest.mock("@/lib/api/video-playback.api", () => ({
  videoPlaybackApi: {
    createPlaybackSession: jest.fn(),
    extendSession: jest.fn().mockResolvedValue({}),
  },
}))

type MockYouTube = {
  playerCtor: jest.Mock
  playerInstance: any
}

function mockYoutubePlayer(params?: {
  currentTime?: number | number[]
  duration?: number
  playerState?: number
  includeGetCurrentTime?: boolean
  includeGetDuration?: boolean
}): MockYouTube {
  const currentTimeValues = Array.isArray(params?.currentTime)
    ? params?.currentTime.map((value) => Number(value))
    : [Number(params?.currentTime ?? 12)]
  const duration = Number(params?.duration ?? 100)
  const playerState = Number(params?.playerState ?? 2)
  let currentTimeIndex = 0

  const playerInstance: any = {
    getPlayerState: jest.fn().mockReturnValue(playerState),
    seekTo: jest.fn(),
    destroy: jest.fn(),
  }
  if (params?.includeGetCurrentTime !== false) {
    playerInstance.getCurrentTime = jest.fn().mockImplementation(async () => {
      const value = currentTimeValues[Math.min(currentTimeIndex, currentTimeValues.length - 1)] ?? 0
      currentTimeIndex += 1
      return value
    })
  }
  if (params?.includeGetDuration !== false) {
    playerInstance.getDuration = jest.fn().mockResolvedValue(duration)
  }

  const playerCtor = jest.fn((_element: unknown, options: any) => {
    ;(playerCtor as any).lastOptions = options
    return playerInstance
  })

  ;(window as any).YT = {
    Player: playerCtor,
    PlayerState: {
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
    },
  }

  return { playerCtor, playerInstance }
}

function renderYoutubePlayer(
  videoUrl: string,
  options?: { enrollment?: any; onWatchTimeUpdate?: jest.Mock; onProgressSaved?: jest.Mock },
) {
  const onWatchTimeUpdate = options?.onWatchTimeUpdate ?? jest.fn()
  const enrollmentProp =
    options && Object.prototype.hasOwnProperty.call(options, "enrollment")
      ? options.enrollment
      : { progress: [] }
  return render(
    <EnhancedVideoPlayer
      creatorSlug="creator"
      slug="community"
      courseId="course-1"
      currentChapter={{
        id: "chapter-1",
        title: "Chapter 1",
        videoUrl,
        duration: 100,
        isPreview: true,
      }}
      isChapterAccessible={() => true}
      enrollment={enrollmentProp}
      onWatchTimeUpdate={onWatchTimeUpdate}
      onProgressSaved={options?.onProgressSaved}
    />,
  )
}

async function flushInitialEffects() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe("EnhancedVideoPlayer YouTube tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    ;(videoPlaybackApi.createPlaybackSession as jest.Mock).mockResolvedValue({ data: null })
  })

  afterEach(() => {
    jest.useRealTimers()
    delete (window as any).YT
  })

  it("routes supported YouTube URLs to tracked YouTube player branch", async () => {
    const { playerCtor } = mockYoutubePlayer()
    renderYoutubePlayer("https://www.youtube.com/shorts/dQw4w9WgXcQ")

    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions
    expect(options.videoId).toBe("dQw4w9WgXcQ")
  })

  it("persists high-water mark for embedded YouTube playback", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({ currentTime: 12, duration: 100 })
    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })
    await act(async () => {
      options.events.onStateChange({ data: (window as any).YT.PlayerState.PLAYING })
    })
    await act(async () => {
      jest.advanceTimersByTime(1200)
      await Promise.resolve()
    })

    await waitFor(() => expect(playerInstance.getCurrentTime).toHaveBeenCalled())
    await waitFor(() => expect(coursesApi.updateChapterWatchTime).toHaveBeenCalled())

    const payload = localStorage.getItem("course_progress_guest_course-1_chapter-1")
    expect(payload).toBeTruthy()
    expect(JSON.parse(String(payload)).time).toBe(12)
    expect(coursesApi.updateChapterWatchTime).toHaveBeenCalledWith("course-1", "chapter-1", 12, 100)
  })

  it("tracks youtube watch time even when PLAYING state event is never fired", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({
      currentTime: [12, 13],
      duration: 100,
      playerState: (window as any).YT?.PlayerState?.PAUSED ?? 2,
    })

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })

    await act(async () => {
      jest.advanceTimersByTime(2200)
      await Promise.resolve()
    })

    await waitFor(() => expect(playerInstance.getCurrentTime).toHaveBeenCalled())
    await waitFor(() => expect(coursesApi.updateChapterWatchTime).toHaveBeenCalled())
  })

  it("does not send duplicate watch-time updates when embedded time is not advancing", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({
      currentTime: [12, 12, 12, 12],
      duration: 100,
    })

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })

    await act(async () => {
      jest.advanceTimersByTime(4200)
      await Promise.resolve()
    })

    await waitFor(() => expect(coursesApi.updateChapterWatchTime).toHaveBeenCalledTimes(1))
  })

  it("does not persist watch-time to backend for preview playback without enrollment", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({
      currentTime: [12, 13, 14],
      duration: 100,
    })
    const onProgressSaved = jest.fn().mockResolvedValue(undefined)

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
      enrollment: null,
      onProgressSaved,
    })
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })

    await act(async () => {
      jest.advanceTimersByTime(3200)
      await Promise.resolve()
    })

    await act(async () => {
      jest.advanceTimersByTime(1200)
      await Promise.resolve()
    })

    expect(coursesApi.updateChapterWatchTime).not.toHaveBeenCalled()
    expect(onProgressSaved).not.toHaveBeenCalled()
  })

  it("does not call tracking loop until YouTube onReady provides a target", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({ currentTime: [10, 11], duration: 100 })

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await act(async () => {
      jest.advanceTimersByTime(2400)
      await Promise.resolve()
    })
    expect(coursesApi.updateChapterWatchTime).not.toHaveBeenCalled()

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })
    await act(async () => {
      jest.advanceTimersByTime(1300)
      await Promise.resolve()
    })
    await waitFor(() => expect(coursesApi.updateChapterWatchTime).toHaveBeenCalled())
  })

  it("gracefully skips polling when getCurrentTime is missing", async () => {
    jest.useFakeTimers()
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    const { playerCtor, playerInstance } = mockYoutubePlayer({
      includeGetCurrentTime: false,
      duration: 100,
    })

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })
    await act(async () => {
      jest.advanceTimersByTime(3500)
      await Promise.resolve()
    })

    expect(coursesApi.updateChapterWatchTime).not.toHaveBeenCalled()
    const methodWarnings = warnSpy.mock.calls.filter((call) =>
      String(call[0]).includes("YouTube player missing required methods"),
    )
    expect(methodWarnings.length).toBe(1)
    const runtimeErrors = errorSpy.mock.calls.filter((call) =>
      String(call[0]).includes("Error getting current time"),
    )
    expect(runtimeErrors.length).toBe(0)

    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it("resumes normal tracking after a valid onReady target is provided", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({ currentTime: [12, 13], duration: 100 })

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: {} })
    })
    await act(async () => {
      jest.advanceTimersByTime(2200)
      await Promise.resolve()
    })
    expect(coursesApi.updateChapterWatchTime).not.toHaveBeenCalled()

    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })
    await act(async () => {
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
    })
    await waitFor(() => expect(coursesApi.updateChapterWatchTime).toHaveBeenCalled())
  })

  it("does not recreate the YouTube player when enrollment progress updates", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({ currentTime: [12, 13, 14], duration: 100 })
    const onWatchTimeUpdate = jest.fn()

    const { rerender } = render(
      <EnhancedVideoPlayer
        creatorSlug="creator"
        slug="community"
        courseId="course-1"
        currentChapter={{
          id: "chapter-1",
          title: "Chapter 1",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 100,
          isPreview: true,
        }}
        isChapterAccessible={() => true}
        enrollment={{ progress: [] }}
        onWatchTimeUpdate={onWatchTimeUpdate}
      />,
    )

    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })
    await act(async () => {
      jest.advanceTimersByTime(1200)
      await Promise.resolve()
    })

    rerender(
      <EnhancedVideoPlayer
        creatorSlug="creator"
        slug="community"
        courseId="course-1"
        currentChapter={{
          id: "chapter-1",
          title: "Chapter 1",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 100,
          isPreview: true,
        }}
        isChapterAccessible={() => true}
        enrollment={{ progress: [{ chapterId: "chapter-1", watchTime: 25, videoDuration: 100 }] }}
        onWatchTimeUpdate={onWatchTimeUpdate}
      />,
    )

    await act(async () => {
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
    })

    expect(playerCtor).toHaveBeenCalledTimes(1)
  })

  it("does not mark chapter complete before 99%", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({ currentTime: 95, duration: 100 })

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })
    await act(async () => {
      options.events.onStateChange({ data: (window as any).YT.PlayerState.PLAYING })
    })
    await act(async () => {
      jest.advanceTimersByTime(2500)
      await Promise.resolve()
    })

    await waitFor(() => expect(playerInstance.getCurrentTime).toHaveBeenCalled())
    expect(coursesApi.completeChapterEnrollment).not.toHaveBeenCalled()
  })

  it("marks chapter complete once at >=99% and emits progress update event", async () => {
    jest.useFakeTimers()
    const { playerCtor, playerInstance } = mockYoutubePlayer({ currentTime: 99, duration: 100 })
    const progressUpdatedListener = jest.fn()
    window.addEventListener("course-progress-updated", progressUpdatedListener)

    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await waitFor(() => expect(playerCtor).toHaveBeenCalledTimes(1))
    const options = (playerCtor as any).lastOptions

    await flushInitialEffects()
    await act(async () => {
      options.events.onReady({ target: playerInstance })
    })
    await act(async () => {
      options.events.onStateChange({ data: (window as any).YT.PlayerState.PLAYING })
    })
    await act(async () => {
      jest.advanceTimersByTime(2500)
      await Promise.resolve()
    })

    await waitFor(() => expect(playerInstance.getCurrentTime).toHaveBeenCalled())
    await waitFor(() => expect(coursesApi.completeChapterEnrollment).toHaveBeenCalledTimes(1))
    expect(coursesApi.completeChapterEnrollment).toHaveBeenCalledTimes(1)
    expect(progressUpdatedListener).toHaveBeenCalled()
    window.removeEventListener("course-progress-updated", progressUpdatedListener)
  })
})

describe("EnhancedVideoPlayer watermark overlay", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    ;(videoPlaybackApi.createPlaybackSession as jest.Mock).mockResolvedValue({ data: null })
  })

  it("renders logo watermark overlay for local file video branch", async () => {
    render(
      <EnhancedVideoPlayer
        creatorSlug="creator"
        slug="community"
        courseId="course-1"
        currentChapter={{
          id: "chapter-local",
          title: "Local Video",
          videoUrl: "/uploads/chapter-local.mp4",
          duration: 120,
          isPreview: true,
        }}
        isChapterAccessible={() => true}
        enrollment={{ progress: [] }}
      />,
    )

    expect(await screen.findByTestId("chabaqa-watermark")).toBeInTheDocument()
  })

  it("renders logo watermark overlay for YouTube branch", async () => {
    mockYoutubePlayer()
    renderYoutubePlayer("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    expect(await screen.findByTestId("chabaqa-watermark")).toBeInTheDocument()
  })

  it("renders logo watermark overlay for protected playback session branch", async () => {
    ;(videoPlaybackApi.createPlaybackSession as jest.Mock).mockResolvedValue({
      data: {
        sessionId: "session-1",
        streamUrl: "/api/video/stream/chapter-protected.mp4",
        streamType: "mp4",
      },
    })

    render(
      <EnhancedVideoPlayer
        creatorSlug="creator"
        slug="community"
        courseId="course-1"
        currentChapter={{
          id: "chapter-protected",
          title: "Protected Video",
          videoUrl: "",
          hasProtectedVideo: true,
          duration: 120,
          isPreview: false,
        }}
        isChapterAccessible={() => true}
        enrollment={{ progress: [] }}
      />,
    )

    expect(await screen.findByTestId("chabaqa-watermark")).toBeInTheDocument()
  })
})
