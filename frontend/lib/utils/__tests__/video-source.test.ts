import {
  detectVideoPlatform,
  getCreatorVideoSource,
  isSupportedCreatorVideoUrl,
  parseYouTubeVideoId,
} from "@/lib/utils/video-source"

describe("video-source utils", () => {
  const youtubeId = "dQw4w9WgXcQ"

  it("parses all supported YouTube URL formats", () => {
    const urls = [
      `https://www.youtube.com/watch?v=${youtubeId}`,
      `https://youtu.be/${youtubeId}`,
      `https://www.youtube.com/embed/${youtubeId}`,
      `https://www.youtube.com/shorts/${youtubeId}`,
      `https://www.youtube.com/live/${youtubeId}`,
      `https://www.youtube-nocookie.com/embed/${youtubeId}`,
    ]

    for (const url of urls) {
      expect(parseYouTubeVideoId(url)).toBe(youtubeId)
      expect(detectVideoPlatform(url)).toBe("youtube")
      expect(isSupportedCreatorVideoUrl(url)).toBe(true)
      expect(getCreatorVideoSource(url)).toBe("youtube")
    }
  })

  it("parses youtube watch URLs with /watch/ and v query", () => {
    const youtubeId = "dQw4w9WgXcQ"
    expect(parseYouTubeVideoId(`https://www.youtube.com/watch/?v=${youtubeId}`)).toBe(youtubeId)
    expect(detectVideoPlatform(`https://www.youtube.com/watch/?v=${youtubeId}`)).toBe("youtube")
  })

  it("parses youtube watch URLs with v query and extra params", () => {
    const youtubeId = "dQw4w9WgXcQ"
    expect(parseYouTubeVideoId(`https://www.youtube.com/watch?si=abc123&v=${youtubeId}&t=42`)).toBe(youtubeId)
    expect(parseYouTubeVideoId(`https://m.youtube.com/watch?list=PL123&v=${youtubeId}`)).toBe(youtubeId)
  })

  it("accepts upload URLs and upload paths for creators", () => {
    const urls = [
      "/uploads/video/chapter.mp4",
      "uploads/video/chapter.mp4",
      "https://api.chabaqa.io/uploads/video/chapter.mp4",
    ]

    for (const url of urls) {
      expect(isSupportedCreatorVideoUrl(url)).toBe(true)
      expect(getCreatorVideoSource(url)).toBe("upload")
    }
  })

  it("rejects unsupported hosts for creator chapter video links", () => {
    const urls = [
      "https://example.com/video.mp4",
      "https://vimeo.com/123456",
      "https://youtube.com/watch?v=short",
    ]

    for (const url of urls) {
      expect(isSupportedCreatorVideoUrl(url)).toBe(false)
      expect(getCreatorVideoSource(url)).toBe("unsupported")
    }
  })
})
