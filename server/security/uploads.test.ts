import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import JSZip from "jszip";
import sharp from "sharp";
import {
  assembleChunkedMediaUpload,
  ChunkedMediaUploadError,
  createChunkedMediaUpload,
  MEDIA_CHUNK_BYTES,
  removeChunkedMediaUpload,
  storeChunkedMediaPart,
} from "../media/chunkedUpload";
import { sanitizeRasterImage } from "../media/optimizeImage";
import { readRouteSources } from "./routeTestSources";
import {
  validateCvFile,
  inspectVideoContainer,
  validatePublicMediaSignature,
  validateVideoContainer,
  videoMetadataAllowed,
} from "./uploads";

test("presentation uploader supports multiple client files up to 100 MB each", async () => {
  const root = process.cwd();
  const clientSource = await fs.readFile(
    path.join(root, "client/src/components/admin/DocumentUpload.tsx"),
    "utf8",
  );
  const routeSource = readRouteSources();

  assert.match(clientSource, /const MAX_DOCUMENTS = 20/);
  assert.match(clientSource, /const MAX_DOCUMENT_MB = 100/);
  assert.match(clientSource, /type="file"[\s\S]{0,120}multiple/);
  assert.match(routeSource, /fileSize: 100 \* 1024 \* 1024/);
  assert.match(routeSource, /PRESENTATION_FILE_TOO_LARGE/);
});

test("media validation checks bytes instead of trusting browser MIME", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-upload-test-"));
  try {
    const fakePng = path.join(directory, "fake.png");
    await fs.writeFile(fakePng, "<script>alert(1)</script>");
    assert.equal(await validatePublicMediaSignature(fakePng, "image/png"), false);

    const png = path.join(directory, "real.png");
    await fs.writeFile(png, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    assert.equal(await validatePublicMediaSignature(png, "image/png"), true);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("video upload accepts a playable MP4 container and rejects a forged one", async () => {
  const root = process.cwd();
  const validVideo = path.join(root, "frontend-mirror/images/home-hero-mobile-v2.mp4");
  assert.equal(await validateVideoContainer(validVideo, { mimeType: "video/mp4" }), true);
  assert.deepEqual(await inspectVideoContainer(validVideo, {
    ffprobePath: path.join(root, "definitely-missing-ffprobe"),
    ffmpegPath: "ffmpeg",
    mimeType: "video/mp4",
  }), { valid: false, reason: "validator_unavailable" });
  assert.deepEqual(await inspectVideoContainer(validVideo, {
    ffprobePath: path.join(root, "definitely-missing-ffprobe"),
    ffmpegPath: path.join(root, "definitely-missing-ffmpeg"),
    mimeType: "video/mp4",
  }), { valid: false, reason: "validator_unavailable" });

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-video-test-"));
  try {
    const successfulButSilentFfmpeg = path.join(directory, "silent-ffmpeg");
    await fs.writeFile(successfulButSilentFfmpeg, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    assert.deepEqual(await inspectVideoContainer(validVideo, {
      ffmpegPath: successfulButSilentFfmpeg,
      mimeType: "video/mp4",
    }), { valid: false, reason: "invalid" });

    const validContents = await fs.readFile(validVideo);
    const truncatedVideo = path.join(directory, "truncated.mp4");
    await fs.writeFile(truncatedVideo, validContents.subarray(0, Math.floor(validContents.length / 2)));
    assert.equal(await validatePublicMediaSignature(truncatedVideo, "video/mp4"), true);
    assert.equal(await validateVideoContainer(truncatedVideo, { mimeType: "video/mp4" }), false);

    const forgedVideo = path.join(directory, "forged.mp4");
    await fs.writeFile(forgedVideo, Buffer.from("not a playable video"));
    assert.equal(await validateVideoContainer(forgedVideo, { mimeType: "video/mp4" }), false);

    const forgedIsoBmff = path.join(directory, "forged-isobmff.mp4");
    await fs.writeFile(forgedIsoBmff, Buffer.from([
      0x00, 0x00, 0x00, 0x18,
      0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d,
      0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6f, 0x6d,
      0x6d, 0x70, 0x34, 0x32,
    ]));
    assert.equal(await validateVideoContainer(forgedIsoBmff, {
      ffprobePath: path.join(root, "definitely-missing-ffprobe"),
      ffmpegPath: "ffmpeg",
      mimeType: "video/mp4",
    }), false);

    const box = (type: string, payload: Buffer): Buffer => {
      const header = Buffer.alloc(8);
      header.writeUInt32BE(payload.length + 8, 0);
      header.write(type, 4, 4, "ascii");
      return Buffer.concat([header, payload]);
    };
    const handler = Buffer.alloc(12);
    handler.write("vide", 8, 4, "ascii");
    const fakeTrack = box("moov", box("trak", box("mdia", box("hdlr", handler))));
    const fakeWithVideoHandler = path.join(directory, "handler-without-frames.mp4");
    await fs.writeFile(fakeWithVideoHandler, Buffer.concat([
      box("ftyp", Buffer.from([
        0x69, 0x73, 0x6f, 0x6d,
        0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6f, 0x6d,
        0x6d, 0x70, 0x34, 0x32,
      ])),
      box("mdat", Buffer.from("this is not encoded video", "utf8")),
      fakeTrack,
    ]));
    assert.equal(await validatePublicMediaSignature(fakeWithVideoHandler, "video/mp4"), true);
    assert.equal(await validateVideoContainer(fakeWithVideoHandler, { mimeType: "video/mp4" }), false);
    assert.deepEqual(await inspectVideoContainer(fakeWithVideoHandler, {
      ffprobePath: path.join(root, "definitely-missing-ffprobe"),
      mimeType: "video/mp4",
    }), { valid: false, reason: "validator_unavailable" });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("the Replit deployment includes and verifies the strict video validators", async () => {
  const root = process.cwd();
  const [nixConfig, packageJson] = await Promise.all([
    fs.readFile(path.join(root, "replit.nix"), "utf8"),
    fs.readFile(path.join(root, "package.json"), "utf8"),
  ]);

  assert.match(nixConfig, /pkgs\.ffmpeg/);
  assert.match(nixConfig, /pkgs\.clamav/);
  assert.match(packageJson, /"verify:video-runtime": "node scripts\/verify-video-runtime\.mjs"/);
  assert.match(packageJson, /"start:deploy": "node scripts\/start-deploy\.mjs"/);
  const deploymentStart = await fs.readFile(path.join(root, "scripts", "start-deploy.mjs"), "utf8");
  assert.match(deploymentStart, /verify:video-runtime/);
  assert.match(deploymentStart, /db:migrate/);
  assert.match(deploymentStart, /handoff-bootstrap-server/);
});

test("video validation accepts playable low-frame-rate MP4 and WebM files", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-low-fps-video-test-"));
  try {
    const mp4 = path.join(directory, "low-fps.mp4");
    const webm = path.join(directory, "low-fps.webm");
    execFileSync("ffmpeg", [
      "-v", "error",
      "-f", "lavfi",
      "-i", "color=c=black:s=320x180:r=1:d=2",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      mp4,
    ]);
    execFileSync("ffmpeg", [
      "-v", "error",
      "-f", "lavfi",
      "-i", "color=c=black:s=320x180:r=1:d=2",
      "-c:v", "libvpx-vp9",
      "-pix_fmt", "yuv420p",
      webm,
    ]);

    assert.equal(await validateVideoContainer(mp4, { mimeType: "video/mp4" }), true);
    assert.equal(await validateVideoContainer(webm, { mimeType: "video/webm" }), true);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("video policy rejects cover art, mismatched containers and resolutions above 4K", () => {
  const base = {
    streamIndex: 0,
    codecName: "h264",
    width: 1920,
    height: 1080,
    duration: 62.5,
    formatName: "mov,mp4,m4a,3gp,3g2,mj2",
    attachedPicture: false,
  };
  assert.equal(videoMetadataAllowed("video/mp4", base), true);
  assert.equal(videoMetadataAllowed("video/mp4", { ...base, attachedPicture: true }), false);
  assert.equal(videoMetadataAllowed("video/webm", { ...base, formatName: "matroska,webm" }), false);
  assert.equal(videoMetadataAllowed("video/webm", {
    ...base,
    codecName: "vp9",
    formatName: "matroska,webm",
  }), true);
  assert.equal(videoMetadataAllowed("video/ogg", {
    ...base,
    codecName: "theora",
    formatName: "ogg",
  }), true);
  assert.equal(videoMetadataAllowed("video/mp4", { ...base, width: 7680, height: 4320 }), false);
  assert.equal(videoMetadataAllowed("video/mp4", { ...base, duration: 0.02 }), false);
});

test("admin media upload exposes progress and keeps the 200 MB video limit explicit", async () => {
  const root = process.cwd();
  const clientSource = await fs.readFile(
    path.join(root, "client/src/lib/adminMediaUpload.ts"),
    "utf8",
  );
  const fieldSource = await fs.readFile(
    path.join(root, "client/src/components/admin/ImageUpload.tsx"),
    "utf8",
  );
  const routeSource = readRouteSources();

  assert.match(clientSource, /MAX_ADMIN_MEDIA_MB = 200/);
  assert.match(clientSource, /CHUNKED_UPLOAD_THRESHOLD = 6 \* 1024 \* 1024/);
  assert.match(clientSource, /xhr\.upload\.onprogress/);
  assert.match(clientSource, /Guardado en App Storage/);
  assert.match(clientSource, /\/api\/admin\/media\/upload\/start/);
  assert.match(clientSource, /\/api\/admin\/media\/upload\/chunk/);
  assert.match(clientSource, /\/api\/admin\/media\/upload\/complete/);
  assert.match(clientSource, /X-Chunk-SHA256/);
  assert.match(clientSource, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(fieldSource, /720p, 1080p y 4K/);
  assert.match(routeSource, /MEDIA_FILE_TOO_LARGE/);
  assert.match(routeSource, /inspectVideoContainer/);
  assert.match(routeSource, /VIDEO_VALIDATOR_UNAVAILABLE/);
  assert.match(routeSource, /VIDEO_VALIDATION_TIMEOUT/);
  assert.match(routeSource, /receiveMediaChunk/);
});

test("chunked admin media upload reconstructs every byte and rejects altered sessions", async () => {
  const environmentKeys = [
    "NODE_ENV",
    "REPL_ID",
    "REPLIT_DEPLOYMENT",
    "REPLIT_ENVIRONMENT",
    "REPLIT_APP_STORAGE_BUCKET_ID",
    "VWB_APP_STORAGE_ENABLED",
    "VWB_PERSISTENT_MEDIA_REQUIRED",
    "VWB_MEDIA_CHUNK_V2",
    "SESSION_SECRET",
  ] as const;
  const previous = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-chunk-upload-test-"));
  let token = "";
  try {
    for (const key of environmentKeys) delete process.env[key];
    process.env.NODE_ENV = "test";
    process.env.SESSION_SECRET = "chunk-upload-test-secret-with-enough-entropy";

    const contents = Buffer.alloc(MEDIA_CHUNK_BYTES + 17, 0x5a);
    const session = createChunkedMediaUpload({
      userId: "test-admin",
      originalName: "master-video.mp4",
      mimeType: "video/mp4",
      size: contents.length,
    });
    token = session.token;
    assert.equal(session.totalChunks, 2);
    const sessionPayload = JSON.parse(
      Buffer.from(session.token.split(".", 1)[0], "base64url").toString("utf8"),
    ) as { v: number };
    assert.equal(sessionPayload.v, 1, "v1 remains the rolling-deployment compatible default");
    const firstChunk = contents.subarray(0, MEDIA_CHUNK_BYTES);
    const secondChunk = contents.subarray(MEDIA_CHUNK_BYTES);
    const checksum = (chunk: Buffer) => crypto.createHash("sha256").update(chunk).digest("hex");
    await storeChunkedMediaPart(token, "test-admin", 0, firstChunk, checksum(firstChunk));
    // Una pestaña abierta durante el despliegue puede no enviar aún la cabecera.
    // El servidor calcula la huella y mantiene la integridad de todas formas.
    await storeChunkedMediaPart(token, "test-admin", 1, secondChunk);

    const destination = path.join(directory, "assembled.mp4");
    const result = await assembleChunkedMediaUpload(token, "test-admin", destination);
    assert.deepEqual(await fs.readFile(destination), contents);
    assert.equal(result.mimeType, "video/mp4");
    assert.equal(result.originalName, "master-video.mp4");

    process.env.VWB_MEDIA_CHUNK_V2 = "true";
    const corruptedSession = createChunkedMediaUpload({
      userId: "test-admin",
      originalName: "corrupted.mp4",
      mimeType: "video/mp4",
      size: 17,
    });
    const v2Payload = JSON.parse(
      Buffer.from(corruptedSession.token.split(".", 1)[0], "base64url").toString("utf8"),
    ) as { v: number };
    assert.equal(v2Payload.v, 2, "v2 can be enabled after every instance is compatible");
    const corruptedChunk = Buffer.alloc(17, 0x33);
    await storeChunkedMediaPart(
      corruptedSession.token,
      "test-admin",
      0,
      corruptedChunk,
      checksum(corruptedChunk),
    );
    const payload = corruptedSession.token.split(".", 1)[0];
    const sessionId = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).id as string;
    const storedPath = path.join(process.cwd(), "private_uploads/media-chunks", sessionId, "000.part");
    const storedChunk = await fs.readFile(storedPath);
    storedChunk[storedChunk.length - 1] ^= 0xff;
    await fs.writeFile(storedPath, storedChunk);
    await assert.rejects(
      () => assembleChunkedMediaUpload(
        corruptedSession.token,
        "test-admin",
        path.join(directory, "corrupted.mp4"),
      ),
      (error: unknown) => error instanceof ChunkedMediaUploadError && error.code === "CORRUPTED_MEDIA_CHUNK",
    );
    await removeChunkedMediaUpload(corruptedSession.token, "test-admin");

    const rejectedSession = createChunkedMediaUpload({
      userId: "test-admin",
      originalName: "integrity.mp4",
      mimeType: "video/mp4",
      size: 17,
    });
    await assert.rejects(
      () => storeChunkedMediaPart(
        rejectedSession.token,
        "test-admin",
        0,
        Buffer.alloc(17, 0x5a),
        "0".repeat(64),
      ),
      (error: unknown) => error instanceof ChunkedMediaUploadError && error.code === "CHUNK_CHECKSUM_MISMATCH",
    );
    await removeChunkedMediaUpload(rejectedSession.token, "test-admin");

    await assert.rejects(
      () => storeChunkedMediaPart(
        "not-a-session",
        "test-admin",
        0,
        "not-binary" as unknown as Buffer,
      ),
      (error: unknown) => error instanceof ChunkedMediaUploadError && error.code === "INVALID_CHUNK_CONTENTS",
    );

    const altered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
    assert.throws(
      () => createChunkedMediaUpload({
        userId: "test-admin",
        originalName: "x.exe",
        mimeType: "application/x-msdownload",
        size: 10,
      }),
      (error: unknown) => error instanceof ChunkedMediaUploadError && error.code === "INVALID_MEDIA_TYPE",
    );
    await assert.rejects(
      () => assembleChunkedMediaUpload(altered, "test-admin", path.join(directory, "altered.mp4")),
      (error: unknown) => error instanceof ChunkedMediaUploadError && error.code === "INVALID_CHUNK_SESSION",
    );
  } finally {
    if (token) await removeChunkedMediaUpload(token, "test-admin");
    await fs.rm(directory, { recursive: true, force: true });
    for (const key of environmentKeys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("all public admin media screens use the shared resilient uploader", async () => {
  const root = process.cwd();
  const files = [
    "client/src/components/admin/ImageUpload.tsx",
    "client/src/pages/admin/GalleryAdmin.tsx",
    "client/src/pages/admin/AdminOffices.tsx",
    "client/src/pages/admin/AdminPresentations.tsx",
  ];
  for (const relative of files) {
    const source = await fs.readFile(path.join(root, relative), "utf8");
    assert.match(source, /uploadAdminMedia/);
    assert.doesNotMatch(source, /fetch\(["']\/api\/admin\/media\/upload["']/);
  }
});

test("hero video derivatives preserve a Full HD desktop profile without replacing the master", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "server/media/optimizeVideo.ts"),
    "utf8",
  );

  assert.match(source, /scale=1920:1080/);
  assert.match(source, /"-crf", "20"/);
  assert.match(source, /scale=640:360/);
  assert.match(source, /await encodeMobile\("30", "180k", "360k"\)/);
  assert.match(source, /No fue posible crear una variante móvil dentro del presupuesto de 1\.5 MB/);
  assert.match(source, /El archivo original permanece intacto/);
});

test("public raster sanitization decodes and removes appended payloads", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-raster-test-"));
  try {
    const imagePath = path.join(directory, "recognition.png");
    const cleanPng = await sharp({
      create: {
        width: 80,
        height: 60,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).png().toBuffer();
    await fs.writeFile(
      imagePath,
      Buffer.concat([cleanPng, Buffer.from("<script>alert(1)</script>")]),
    );

    const sanitizedSize = await sanitizeRasterImage(imagePath, "image/png");
    const sanitized = await fs.readFile(imagePath);
    const metadata = await sharp(sanitized).metadata();

    assert.equal(sanitizedSize, sanitized.length);
    assert.equal(metadata.width, 80);
    assert.equal(metadata.height, 60);
    assert.equal(sanitized.includes(Buffer.from("<script>")), false);
    assert.equal(await validatePublicMediaSignature(imagePath, "image/png"), true);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("PNG favicon sanitization preserves transparent pixels", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-favicon-alpha-test-"));
  try {
    const imagePath = path.join(directory, "favicon-transparent.png");
    await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 4,
        background: { r: 172, g: 22, b: 44, alpha: 0 },
      },
    }).png().toFile(imagePath);

    await sanitizeRasterImage(imagePath, "image/png");
    const { data, info } = await sharp(imagePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    assert.equal(info.channels, 4);
    assert.equal(data[3], 0);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("DOCX validation requires a Word package and rejects active content", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-docx-test-"));
  try {
    const cleanZip = new JSZip();
    cleanZip.file("[Content_Types].xml", "<Types/>");
    cleanZip.file("word/document.xml", "<w:document/>");
    const cleanPath = path.join(directory, "clean.docx");
    await fs.writeFile(cleanPath, await cleanZip.generateAsync({ type: "nodebuffer" }));
    assert.equal(
      await validateCvFile(cleanPath, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      true,
    );

    cleanZip.file("word/vbaProject.bin", "macro");
    const macroPath = path.join(directory, "macro.docx");
    await fs.writeFile(macroPath, await cleanZip.generateAsync({ type: "nodebuffer" }));
    assert.equal(
      await validateCvFile(macroPath, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      false,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
