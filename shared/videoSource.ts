const VIDEO_FILE_EXTENSION = /\.(?:mp4|webm|ogv|mov)$/i;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIMEO_HOSTS = new Set([
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
]);

export type VideoFileSource = {
  kind: "file";
  url: string;
};

export type YouTubeVideoSource = {
  kind: "youtube";
  id: string;
  canonicalUrl: string;
};

export type VimeoVideoSource = {
  kind: "vimeo";
  id: string;
  canonicalUrl: string;
};

export type VideoSource = VideoFileSource | YouTubeVideoSource | VimeoVideoSource;

export type VideoEmbedOptions = {
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  privacyEnhanced?: boolean;
};

function hasUnsafeCharacters(value: string): boolean {
  return /[\u0000-\u001f\u007f\\]/.test(value);
}

function isVideoPath(pathname: string): boolean {
  return VIDEO_FILE_EXTENSION.test(pathname);
}

function isSafeLocalVideoPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || hasUnsafeCharacters(value)) {
    return false;
  }

  try {
    const queryIndex = value.indexOf("?");
    const hashIndex = value.indexOf("#");
    const pathEnd = [queryIndex, hashIndex]
      .filter((index) => index >= 0)
      .reduce((lowest, index) => Math.min(lowest, index), value.length);
    const decodedRawPath = decodeURIComponent(value.slice(0, pathEnd));
    const rawSegments = decodedRawPath.split("/");
    if (rawSegments.some((segment) => segment === ".." || segment === ".")) return false;

    const parsed = new URL(value, "https://local.invalid");
    if (parsed.origin !== "https://local.invalid" || parsed.hash) return false;

    const decodedPath = decodeURIComponent(parsed.pathname);
    return isVideoPath(decodedPath);
  } catch {
    return false;
  }
}

function parseYouTubeId(url: URL): string | null {
  if (!YOUTUBE_HOSTS.has(url.hostname) || url.protocol !== "https:" || url.port) return null;

  let id: string | null = null;
  const segments = url.pathname.split("/").filter(Boolean);

  if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
    if (segments.length === 1) id = segments[0];
  } else if (url.pathname === "/watch") {
    id = url.searchParams.get("v");
  } else if (
    segments.length === 2 &&
    ["embed", "shorts", "live"].includes(segments[0])
  ) {
    id = segments[1];
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

function parseVimeoId(url: URL): string | null {
  if (!VIMEO_HOSTS.has(url.hostname) || url.protocol !== "https:" || url.port) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;

  if (url.hostname === "player.vimeo.com") {
    if (segments.length === 2 && segments[0] === "video") id = segments[1];
  } else if (segments.length === 1) {
    id = segments[0];
  }

  return id && VIMEO_ID.test(id) ? id : null;
}

/**
 * Parses only the video sources supported by the public site:
 * local absolute paths, direct HTTPS video files, YouTube and Vimeo.
 */
export function parseVideoSource(value: string | null | undefined): VideoSource | null {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate || hasUnsafeCharacters(candidate)) return null;

  if (candidate.startsWith("/")) {
    return isSafeLocalVideoPath(candidate) ? { kind: "file", url: candidate } : null;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash) {
    return null;
  }

  const youtubeId = parseYouTubeId(parsed);
  if (youtubeId) {
    return {
      kind: "youtube",
      id: youtubeId,
      canonicalUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  const vimeoId = parseVimeoId(parsed);
  if (vimeoId) {
    return {
      kind: "vimeo",
      id: vimeoId,
      canonicalUrl: `https://vimeo.com/${vimeoId}`,
    };
  }

  if (!isVideoPath(parsed.pathname)) return null;
  return { kind: "file", url: parsed.toString() };
}

/** Returns a stable value suitable for storage in site_config. */
export function normalizeVideoSource(value: string | null | undefined): string | null {
  const source = parseVideoSource(value);
  if (!source) return null;
  return source.kind === "file" ? source.url : source.canonicalUrl;
}

/** Builds a provider embed URL. Direct/local files deliberately return null. */
export function buildVideoEmbedUrl(
  source: VideoSource,
  options: VideoEmbedOptions = {},
): string | null {
  if (source.kind === "file") return null;

  const {
    autoplay = false,
    controls = true,
    loop = false,
    muted = autoplay,
    playsInline = true,
    privacyEnhanced = true,
  } = options;

  if (source.kind === "youtube") {
    const host = privacyEnhanced ? "www.youtube-nocookie.com" : "www.youtube.com";
    const url = new URL(`https://${host}/embed/${source.id}`);
    url.searchParams.set("rel", "0");
    if (playsInline) url.searchParams.set("playsinline", "1");
    if (autoplay) url.searchParams.set("autoplay", "1");
    if (muted) url.searchParams.set("mute", "1");
    if (!controls) url.searchParams.set("controls", "0");
    if (loop) {
      url.searchParams.set("loop", "1");
      url.searchParams.set("playlist", source.id);
    }
    return url.toString();
  }

  const url = new URL(`https://player.vimeo.com/video/${source.id}`);
  if (privacyEnhanced) url.searchParams.set("dnt", "1");
  if (playsInline) url.searchParams.set("playsinline", "1");
  if (autoplay) url.searchParams.set("autoplay", "1");
  if (muted) url.searchParams.set("muted", "1");
  if (!controls) url.searchParams.set("controls", "0");
  if (loop) url.searchParams.set("loop", "1");
  return url.toString();
}
