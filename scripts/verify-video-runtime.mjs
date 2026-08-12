import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const validators = ["ffprobe", "ffmpeg"];

for (const validator of validators) {
  try {
    const { stdout, stderr } = await execFileAsync(validator, ["-version"], {
      timeout: 10_000,
      windowsHide: true,
      maxBuffer: 64 * 1024,
    });
    const version = String(stdout || stderr || "").split(/\r?\n/, 1)[0].trim();
    if (!version) throw new Error("no devolvió una versión");
    console.log(`[video-runtime] ${validator}: ${version}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[video-runtime] ${validator} no está disponible: ${detail}`);
    process.exitCode = 1;
  }
}
