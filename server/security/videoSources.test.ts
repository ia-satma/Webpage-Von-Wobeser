import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVideoEmbedUrl,
  normalizeVideoSource,
  parseVideoSource,
} from "../../shared/videoSource";

test("acepta rutas locales y archivos HTTPS con extensiones de video", () => {
  assert.deepEqual(parseVideoSource("/uploads/video/hero.mp4"), {
    kind: "file",
    url: "/uploads/video/hero.mp4",
  });
  assert.deepEqual(parseVideoSource("/media/demo.WEBM?v=3"), {
    kind: "file",
    url: "/media/demo.WEBM?v=3",
  });
  assert.deepEqual(parseVideoSource("https://cdn.example.com/videos/office.mov?version=2"), {
    kind: "file",
    url: "https://cdn.example.com/videos/office.mov?version=2",
  });
});

test("normaliza las variantes válidas de YouTube", () => {
  const id = "dQw4w9WgXcQ";
  const inputs = [
    `https://www.youtube.com/watch?v=${id}&feature=share`,
    `https://youtu.be/${id}?si=test`,
    `https://m.youtube.com/shorts/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://youtube.com/live/${id}`,
  ];

  for (const input of inputs) {
    assert.deepEqual(parseVideoSource(input), {
      kind: "youtube",
      id,
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    });
    assert.equal(normalizeVideoSource(input), `https://www.youtube.com/watch?v=${id}`);
  }
});

test("normaliza enlaces válidos de Vimeo", () => {
  const id = "76979871";
  assert.deepEqual(parseVideoSource(`https://vimeo.com/${id}?share=copy`), {
    kind: "vimeo",
    id,
    canonicalUrl: `https://vimeo.com/${id}`,
  });
  assert.deepEqual(parseVideoSource(`https://player.vimeo.com/video/${id}`), {
    kind: "vimeo",
    id,
    canonicalUrl: `https://vimeo.com/${id}`,
  });
});

test("genera reproductores privados con opciones seguras", () => {
  const youtube = parseVideoSource("https://youtu.be/dQw4w9WgXcQ");
  assert.ok(youtube && youtube.kind === "youtube");
  const youtubeEmbed = buildVideoEmbedUrl(youtube, {
    autoplay: true,
    controls: false,
    loop: true,
  });
  assert.ok(youtubeEmbed);
  const youtubeUrl = new URL(youtubeEmbed);
  assert.equal(youtubeUrl.hostname, "www.youtube-nocookie.com");
  assert.equal(youtubeUrl.pathname, "/embed/dQw4w9WgXcQ");
  assert.equal(youtubeUrl.searchParams.get("autoplay"), "1");
  assert.equal(youtubeUrl.searchParams.get("mute"), "1");
  assert.equal(youtubeUrl.searchParams.get("controls"), "0");
  assert.equal(youtubeUrl.searchParams.get("playlist"), "dQw4w9WgXcQ");

  const vimeo = parseVideoSource("https://vimeo.com/76979871");
  assert.ok(vimeo && vimeo.kind === "vimeo");
  const vimeoEmbed = buildVideoEmbedUrl(vimeo, { autoplay: true, loop: true });
  assert.ok(vimeoEmbed);
  const vimeoUrl = new URL(vimeoEmbed);
  assert.equal(vimeoUrl.hostname, "player.vimeo.com");
  assert.equal(vimeoUrl.searchParams.get("dnt"), "1");
  assert.equal(vimeoUrl.searchParams.get("muted"), "1");
  assert.equal(vimeoUrl.searchParams.get("loop"), "1");

  assert.equal(buildVideoEmbedUrl({ kind: "file", url: "/video.mp4" }), null);
});

test("rechaza protocolos, hosts parecidos, traversal y archivos no permitidos", () => {
  const invalid = [
    "",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "blob:https://example.com/id",
    "http://cdn.example.com/video.mp4",
    "https://user:pass@cdn.example.com/video.mp4",
    "https://cdn.example.com/video.mp4#fragment",
    "https://cdn.example.com/video.avi",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=too-short",
    "https://vimeo.com.evil.example/76979871",
    "https://vimeo.com/not-a-number",
    "//cdn.example.com/video.mp4",
    "/../private/video.mp4",
    "/%2e%2e/private/video.mp4",
    "/uploads/video.mp4#fragment",
    "/uploads\\video.mp4",
  ];

  for (const input of invalid) {
    assert.equal(parseVideoSource(input), null, `debía rechazar: ${input}`);
    assert.equal(normalizeVideoSource(input), null, `no debía normalizar: ${input}`);
  }
});
