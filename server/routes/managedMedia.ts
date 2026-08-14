import type { Request, Response } from "express";
import path from "node:path";
import { managedMediaMimeType, openPersistentPublicMediaStream } from "../media/persistentMedia";

export async function servePersistentManagedMedia(
  req: Request,
  res: Response,
  publicPath: string,
): Promise<boolean> {
  const stream = await openPersistentPublicMediaStream(publicPath);
  if (!stream) return false;

  res.setHeader("Content-Type", managedMediaMimeType(publicPath));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Content-Security-Policy", "sandbox");
  if (req.query.download !== undefined) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(publicPath.split(/[?#]/, 1)[0])}"`,
    );
  }
  if (req.method === "HEAD") {
    stream.destroy();
    res.end();
    return true;
  }

  stream.once("error", () => {
    if (!res.headersSent) res.status(404).end();
    else res.destroy();
  });
  stream.pipe(res);
  return true;
}
