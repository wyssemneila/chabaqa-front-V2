export type VideoPlatform = "youtube" | "vimeo" | "upload" | "other" | "none";
export type CreatorVideoSource = "empty" | "youtube" | "upload" | "unsupported";

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function parseUrlLenient(value: string): URL | null {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    const looksLikeHost =
      /^(?:www\.)?(?:youtu\.be|youtube\.com|m\.youtube\.com|music\.youtube\.com|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com)/i.test(
        value,
      );
    if (!looksLikeHost) return null;

    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

function extractIdFromPath(pathname: string, prefix: string): string | null {
  if (!pathname.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  const candidate = pathname.slice(prefix.length).split("/")[0]?.trim();
  return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
}

export function normalizeVideoUrl(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isUploadVideoUrl(value: unknown): boolean {
  const url = normalizeVideoUrl(value);
  if (!url) return false;

  if (/^\/?uploads(?:\/|$)/i.test(url)) {
    return true;
  }

  const parsed = parseUrlLenient(url);
  if (!parsed) return false;

  return /^\/uploads(?:\/|$)/i.test(parsed.pathname || "");
}

export function parseYouTubeVideoId(value: unknown): string | null {
  const url = normalizeVideoUrl(value);
  if (!url) return null;

  if (YOUTUBE_ID_PATTERN.test(url)) {
    return url;
  }

  const parsed = parseUrlLenient(url);
  if (!parsed) return null;

  const host = normalizeHostname(parsed.hostname);
  const pathname = parsed.pathname || "";

  if (host === "youtu.be") {
    const candidate = pathname.replace(/^\/+/, "").split("/")[0]?.trim();
    return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
  }

  const isYoutubeHost =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com";

  if (!isYoutubeHost) return null;

  const queryCandidate = parsed.searchParams.get("v")?.trim() || "";
  if (YOUTUBE_ID_PATTERN.test(queryCandidate)) {
    return queryCandidate;
  }

  return (
    extractIdFromPath(pathname, "/embed/") ||
    extractIdFromPath(pathname, "/shorts/") ||
    extractIdFromPath(pathname, "/live/") ||
    extractIdFromPath(pathname, "/v/")
  );
}

export function parseVimeoVideoId(value: unknown): string | null {
  const url = normalizeVideoUrl(value);
  if (!url) return null;

  const parsed = parseUrlLenient(url);
  if (!parsed) return null;

  const host = normalizeHostname(parsed.hostname);
  if (host !== "vimeo.com" && host !== "player.vimeo.com") {
    return null;
  }

  const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/i);
  return match ? match[1] : null;
}

export function detectVideoPlatform(value: unknown): VideoPlatform {
  const url = normalizeVideoUrl(value);
  if (!url) return "none";

  if (parseYouTubeVideoId(url)) return "youtube";
  if (parseVimeoVideoId(url)) return "vimeo";
  if (isUploadVideoUrl(url)) return "upload";
  return "other";
}

export function getCreatorVideoSource(value: unknown): CreatorVideoSource {
  const url = normalizeVideoUrl(value);
  if (!url) return "empty";

  if (parseYouTubeVideoId(url)) return "youtube";
  if (isUploadVideoUrl(url)) return "upload";
  return "unsupported";
}

export function isSupportedCreatorVideoUrl(value: unknown): boolean {
  const source = getCreatorVideoSource(value);
  return source === "empty" || source === "youtube" || source === "upload";
}

export function getCreatorVideoUrlError(value: unknown): string | null {
  const source = getCreatorVideoSource(value);
  if (source === "unsupported") {
    return "Use a YouTube link or an uploaded /uploads/... video URL.";
  }
  return null;
}
