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

type PackageLockEntry = {
  name?: string;
  version?: string;
  integrity?: string;
  dev?: boolean;
  devOptional?: boolean;
  optional?: boolean;
  link?: boolean;
};

type PackageLock = {
  name?: string;
  version?: string;
  packages?: Record<string, PackageLockEntry>;
};

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

function packageNameFromPath(lockPath: string, entry: PackageLockEntry): string {
  if (entry.name) return entry.name;
  const tail = lockPath.split("node_modules/").at(-1) || lockPath;
  const parts = tail.split("/").filter(Boolean);
  return parts[0]?.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] || "unknown");
}

function packagePurl(name: string, version: string): string {
  const encodedName = name.startsWith("@")
    ? `%40${name.slice(1).split("/").map(encodeURIComponent).join("/")}`
    : encodeURIComponent(name);
  return `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
}

function deterministicUuid(seed: string): string {
  const bytes = Buffer.from(crypto.createHash("sha256").update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function integrityHashes(integrity?: string): Array<{ alg: string; content: string }> {
  if (!integrity) return [];
  const algorithms: Record<string, string> = {
    sha256: "SHA-256",
    sha384: "SHA-384",
    sha512: "SHA-512",
  };
  for (const candidate of integrity.split(/\s+/)) {
    const separator = candidate.indexOf("-");
    if (separator < 1) continue;
    const algorithm = candidate.slice(0, separator).toLowerCase();
    const encoded = candidate.slice(separator + 1).split("?")[0];
    if (!algorithms[algorithm]) continue;
    try {
      const content = Buffer.from(encoded, "base64").toString("hex");
      if (content) return [{ alg: algorithms[algorithm], content }];
    } catch {
      // Un integrity inválido no entra al SBOM; npm ci conserva su propia validación.
    }
  }
  return [];
}

/** Genera un inventario CycloneDX 1.5 directamente del lockfile versionado. */
export function generateCycloneDxSbom(lock: PackageLock, builtAt: string): Record<string, unknown> {
  if (!lock.packages || !Number.isFinite(Date.parse(builtAt))) {
    throw new Error("Invalid package lock for SBOM");
  }
  const components = Object.entries(lock.packages)
    .filter(([lockPath]) => lockPath.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([lockPath, entry]) => {
      const name = packageNameFromPath(lockPath, entry);
      const version = entry.version || "unknown";
      const hashes = integrityHashes(entry.integrity);
      return {
        type: "library",
        "bom-ref": `npm:${lockPath}`,
        name,
        version,
        purl: packagePurl(name, version),
        ...(hashes.length ? { hashes } : {}),
        properties: [
          { name: "cdx:npm:package:path", value: lockPath },
          {
            name: "cdx:npm:package:scope",
            value: entry.dev && !entry.devOptional && !entry.optional ? "development" : "runtime",
          },
          ...(entry.link ? [{ name: "cdx:npm:package:link", value: "true" }] : []),
        ],
      };
    });
  const rootName = lock.name || "application";
  const rootVersion = lock.version || "0.0.0";
  const serialSeed = crypto.createHash("sha256").update(JSON.stringify(lock)).digest("hex");
  return {
    $schema: "http://cyclonedx.org/schema/bom-1.5.schema.json",
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: `urn:uuid:${deterministicUuid(`${serialSeed}:${builtAt}`)}`,
    version: 1,
    metadata: {
      timestamp: builtAt,
      tools: {
        components: [{
          type: "application",
          name: "von-wobeser-lockfile-sbom",
          version: "1",
        }],
      },
      component: {
        type: "application",
        "bom-ref": `application:${rootName}@${rootVersion}`,
        name: rootName,
        version: rootVersion,
        purl: packagePurl(rootName, rootVersion),
      },
    },
    components,
  };
}

function calculateBuildSha(evidence: Omit<BuildProvenance, "buildSha256" | "builtAt" | "nodeVersion">): string {
  return crypto.createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

export async function generateBuildEvidence(root = process.cwd()): Promise<BuildProvenance> {
  const dist = path.join(root, "dist");
  const sbomPath = path.join(dist, "sbom.cdx.json");
  const builtAt = new Date().toISOString();
  const packageLockPath = path.join(root, "package-lock.json");
  const packageLockSource = await fs.readFile(packageLockPath, "utf8");
  const parsedSbom = generateCycloneDxSbom(JSON.parse(packageLockSource), builtAt);
  await fs.writeFile(sbomPath, `${JSON.stringify(parsedSbom, null, 2)}\n`, { mode: 0o600 });

  const immutable = {
    schemaVersion: 1 as const,
    commitSha: resolveCommitSha(),
    packageLockSha256: crypto.createHash("sha256").update(packageLockSource).digest("hex"),
    sbomSha256: await sha256File(sbomPath),
    serverBundleSha256: await sha256File(path.join(dist, "index.cjs")),
    publicAssetsSha256: await sha256Directory(path.join(dist, "public")),
    sourceTreeDirty: trackedSourceIsDirty(),
  };
  const evidence: BuildProvenance = {
    ...immutable,
    buildSha256: calculateBuildSha(immutable),
    builtAt,
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
  const sbom = JSON.parse(await fs.readFile(path.join(dist, "sbom.cdx.json"), "utf8"));
  if (sbom?.bomFormat !== "CycloneDX" || sbom?.specVersion !== "1.5" || !Array.isArray(sbom?.components)) {
    throw new Error("Invalid CycloneDX SBOM");
  }
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
