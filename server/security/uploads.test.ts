import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import JSZip from "jszip";
import sharp from "sharp";
import { sanitizeRasterImage } from "../media/optimizeImage";
import { validateCvFile, validatePublicMediaSignature } from "./uploads";

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
