import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export interface BuildProvenance {
  schemaVersion: 1;
  commitSha: string;
  packageLockSha256: string;
  sbomSha256: string;
  serverBundleSha256: string;
  publicAssetsSha256: string;
  buildSha256: string;
  sourceTreeDirty: boolean;
  builtAt: string;
  nodeVersion: string;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;

async function sha256File(filePath: string): Promise<string> {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith("._")) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

async function sha256Directory(directory: string): Promise<string> {
  const digest = crypto.createHash("sha256");
  for (const relative of await listFiles(directory)) {
    digest.update(relative);
    digest.update("\0");
    digest.update(await sha256File(path.join(directory, relative)));
    digest.update("\0");
  }
  return digest.digest("hex");
}

function commandOutput(command: string, args: string[]): string {
  return execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function resolveCommitSha(): string {
  for (const candidate of [
    process.env.GITHUB_SHA,
    process.env.SOURCE_COMMIT_SHA,
    process.env.REPLIT_GIT_COMMIT_SHA,
  ]) {
    const value = candidate?.trim().toLowerCase();
    if (value && COMMIT_PATTERN.test(value)) return value;
  }
  try {
    const value = commandOutput("git", ["rev-parse", "HEAD"]).toLowerCase();
    if (COMMIT_PATTERN.test(value)) return value;
  } catch {
    // El verificador rechazará la evidencia si tampoco existe un SHA inyectado.
  }
  return "unknown";
}

function trackedSourceIsDirty(): boolean {
  try {
    // Los archivos no rastreados del workspace no forman parte del build ni deben
    // alterar su evidencia; los cambios sobre archivos rastreados sí se señalan.
    return commandOutput("git", ["status", "--porcelain", "--untracked-files=no"]).length > 0;
  } catch {
    return false;
  }
}

function npmSbom(): string {
  const npmExecPath = process.env.npm_execpath?.trim();
  return npmExecPath
    ? commandOutput(process.execPath, [npmExecPath, "sbom", "--sbom-format=cyclonedx", "--omit=dev"])
    : commandOutput(process.platform === "win32" ? "npm.cmd" : "npm", ["sbom", "--sbom-format=cyclonedx", "--omit=dev"]);
}

function calculateBuildSha(evidence: Omit<BuildProvenance, "buildSha256" | "builtAt" | "nodeVersion">): string {
  return crypto.createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

export async function generateBuildEvidence(root = process.cwd()): Promise<BuildProvenance> {
  const dist = path.join(root, "dist");
  const sbomPath = path.join(dist, "sbom.cdx.json");
  const parsedSbom = JSON.parse(npmSbom());
  await fs.writeFile(sbomPath, `${JSON.stringify(parsedSbom, null, 2)}\n`, { mode: 0o600 });

  const immutable = {
    schemaVersion: 1 as const,
    commitSha: resolveCommitSha(),
    packageLockSha256: await sha256File(path.join(root, "package-lock.json")),
    sbomSha256: await sha256File(sbomPath),
    serverBundleSha256: await sha256File(path.join(dist, "index.cjs")),
    publicAssetsSha256: await sha256Directory(path.join(dist, "public")),
    sourceTreeDirty: trackedSourceIsDirty(),
  };
  const evidence: BuildProvenance = {
    ...immutable,
    buildSha256: calculateBuildSha(immutable),
    builtAt: new Date().toISOString(),
    nodeVersion: process.version,
  };
  await fs.writeFile(
    path.join(dist, "build-provenance.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    { mode: 0o600 },
  );
  return evidence;
}

export async function verifyBuildEvidence(root = process.cwd()): Promise<BuildProvenance> {
  const dist = path.join(root, "dist");
  const evidence = JSON.parse(
    await fs.readFile(path.join(dist, "build-provenance.json"), "utf8"),
  ) as BuildProvenance;
  if (evidence.schemaVersion !== 1 || !COMMIT_PATTERN.test(evidence.commitSha)) {
    throw new Error("Invalid build provenance commit");
  }
  for (const field of [
    "packageLockSha256",
    "sbomSha256",
    "serverBundleSha256",
    "publicAssetsSha256",
    "buildSha256",
  ] as const) {
    if (!SHA256_PATTERN.test(evidence[field])) throw new Error(`Invalid build provenance ${field}`);
  }
  if (!Number.isFinite(Date.parse(evidence.builtAt))) throw new Error("Invalid build provenance timestamp");

  const actual = {
    schemaVersion: 1 as const,
    commitSha: evidence.commitSha,
    packageLockSha256: await sha256File(path.join(root, "package-lock.json")),
    sbomSha256: await sha256File(path.join(dist, "sbom.cdx.json")),
    serverBundleSha256: await sha256File(path.join(dist, "index.cjs")),
    publicAssetsSha256: await sha256Directory(path.join(dist, "public")),
    sourceTreeDirty: evidence.sourceTreeDirty,
  };
  if (actual.packageLockSha256 !== evidence.packageLockSha256
    || actual.sbomSha256 !== evidence.sbomSha256
    || actual.serverBundleSha256 !== evidence.serverBundleSha256
    || actual.publicAssetsSha256 !== evidence.publicAssetsSha256
    || calculateBuildSha(actual) !== evidence.buildSha256) {
    throw new Error("Build provenance digest mismatch");
  }
  return evidence;
}
