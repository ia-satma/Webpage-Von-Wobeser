import assert from "node:assert/strict";
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
import { validateCvFile, validatePublicMediaSignature, validateVideoContainer } from "./uploads";

test("presentation uploader supports multiple client files up to 100 MB each", async () => {
  const root = process.cwd();
  const clientSource = await fs.readFile(
    path.join(root, "client/src/components/admin/DocumentUpload.tsx"),
    "utf8",
  );
  const routeSource = await fs.readFile(path.join(root, "server/routes.ts"), "utf8");

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
  assert.equal(await validateVideoContainer(validVideo), true);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-video-test-"));
  try {
    const forgedVideo = path.join(directory, "forged.mp4");
    await fs.writeFile(forgedVideo, Buffer.from("not a playable video"));
    assert.equal(await validateVideoContainer(forgedVideo), false);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
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
  const routeSource = await fs.readFile(path.join(root, "server/routes.ts"), "utf8");

  assert.match(clientSource, /MAX_ADMIN_MEDIA_MB = 200/);
  assert.match(clientSource, /CHUNKED_UPLOAD_THRESHOLD = 6 \* 1024 \* 1024/);
  assert.match(clientSource, /xhr\.upload\.onprogress/);
  assert.match(clientSource, /Guardado en App Storage/);
  assert.match(clientSource, /\/api\/admin\/media\/upload\/start/);
  assert.match(clientSource, /\/api\/admin\/media\/upload\/chunk/);
  assert.match(clientSource, /\/api\/admin\/media\/upload\/complete/);
  assert.match(fieldSource, /720p, 1080p y 4K/);
  assert.match(routeSource, /MEDIA_FILE_TOO_LARGE/);
  assert.match(routeSource, /validateVideoContainer/);
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
    await storeChunkedMediaPart(token, "test-admin", 0, contents.subarray(0, MEDIA_CHUNK_BYTES));
    await storeChunkedMediaPart(token, "test-admin", 1, contents.subarray(MEDIA_CHUNK_BYTES));

    const destination = path.join(directory, "assembled.mp4");
    const result = await assembleChunkedMediaUpload(token, "test-admin", destination);
    assert.deepEqual(await fs.readFile(destination), contents);
    assert.equal(result.mimeType, "video/mp4");
    assert.equal(result.originalName, "master-video.mp4");

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
  assert.match(source, /"-crf", "24"/);
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
