import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type AuditVia = string | {
  url?: string;
  severity?: string;
};

type AuditVulnerability = {
  name: string;
  severity: string;
  via: AuditVia[];
  nodes: string[];
};

export type NpmAuditReport = {
  auditReportVersion: number;
  vulnerabilities: Record<string, AuditVulnerability>;
  metadata?: {
    vulnerabilities?: Record<string, number>;
  };
};

type PackageLock = {
  packages?: Record<string, {
    name?: string;
    version?: string;
    resolved?: string;
    link?: boolean;
    dependencies?: Record<string, string>;
  }>;
};

type RootPackage = {
  dependencies?: Record<string, string>;
  overrides?: Record<string, string | Record<string, string>>;
};

const IMAGE_GUARD_SPEC = "file:vendor/image-size-guard";
const IMAGE_GUARD_VERSION = "2.0.3-vwys.1";
const SAFE_UUID_VERSION = "11.1.1";
const SAFE_ESBUILD_VERSION = "0.25.12";

export function evaluateDependencyAudit(report: NpmAuditReport): string[] {
  return Object.entries(report.vulnerabilities)
    .map(([key, vulnerability]) => `${key} (${vulnerability.severity})`)
    .sort();
}

export function verifySecurityResolutions(rootPackage: RootPackage, lock: PackageLock): string[] {
  const issues: string[] = [];
  const imageGuardLink = lock.packages?.["node_modules/image-size"];
  const imageGuard = lock.packages?.["vendor/image-size-guard"];
  const pptx = lock.packages?.["node_modules/pptxgenjs"];
  const uuid = lock.packages?.["node_modules/uuid"];
  const legacyEsbuild = lock.packages?.["node_modules/@esbuild-kit/core-utils/node_modules/esbuild"];
  const pptxOverride = rootPackage.overrides?.pptxgenjs;
  const coreUtilsOverride = rootPackage.overrides?.["@esbuild-kit/core-utils"];

  if (rootPackage.dependencies?.["image-size"] !== IMAGE_GUARD_SPEC) {
    issues.push("root image-size dependency must use the local fail-closed guard");
  }
  if (typeof pptxOverride === "string" || pptxOverride?.["image-size"] !== "$image-size") {
    issues.push("pptxgenjs image-size must resolve through the root guard dependency");
  }
  if (rootPackage.overrides?.uuid !== SAFE_UUID_VERSION) {
    issues.push(`uuid override must remain ${SAFE_UUID_VERSION}`);
  }
  if (typeof coreUtilsOverride === "string" || coreUtilsOverride?.esbuild !== SAFE_ESBUILD_VERSION) {
    issues.push(`@esbuild-kit/core-utils esbuild override must remain ${SAFE_ESBUILD_VERSION}`);
  }
  if (pptx?.version !== "4.0.1") issues.push("pptxgenjs must remain locked at 4.0.1");
  if (pptx?.dependencies?.["image-size"] !== "^1.2.1") {
    issues.push("pptxgenjs image-size dependency changed and requires review");
  }
  if (!imageGuardLink?.link || imageGuardLink.resolved !== "vendor/image-size-guard") {
    issues.push("node_modules/image-size must link to vendor/image-size-guard");
  }
  if (imageGuard?.name !== "image-size" || imageGuard.version !== IMAGE_GUARD_VERSION) {
    issues.push(`image-size guard must remain locked at ${IMAGE_GUARD_VERSION}`);
  }
  if (uuid?.version !== SAFE_UUID_VERSION) {
    issues.push(`uuid must resolve to ${SAFE_UUID_VERSION}`);
  }
  if (legacyEsbuild?.version !== SAFE_ESBUILD_VERSION) {
    issues.push(`legacy esbuild path must resolve to ${SAFE_ESBUILD_VERSION}`);
  }
  return issues;
}

export function verifyPresentationExposureControls(repositoryRoot: string): string[] {
  const issues: string[] = [];
  const uploadMiddleware = fs.readFileSync(
    path.join(repositoryRoot, "server", "routes", "uploadMiddleware.ts"),
    "utf8",
  );
  const uploadSignatures = fs.readFileSync(
    path.join(repositoryRoot, "server", "security", "uploads.ts"),
    "utf8",
  );
  const pptxBundle = fs.readFileSync(
    path.join(repositoryRoot, "node_modules", "pptxgenjs", "dist", "pptxgen.cjs.js"),
    "utf8",
  );

  for (const mime of ["image/icns", "image/jxl", "image/heif", "image/heic"]) {
    if (uploadMiddleware.includes(`\"${mime}\"`) || uploadSignatures.includes(`case \"${mime}\"`)) {
      issues.push(`vulnerable presentation image MIME became accepted: ${mime}`);
    }
  }
  if (!uploadMiddleware.includes("/^\\/(?:uploads|generated-images)\\/")) {
    issues.push("presentation media paths are no longer restricted to managed image directories");
  }
  if (/(?:require\(\s*["']image-size["']\s*\)|from\s+["']image-size["'])/.test(pptxBundle)) {
    issues.push("pptxgenjs runtime started importing image-size");
  }
  return issues;
}

function parseAuditReport(stdout: string): NpmAuditReport {
  const parsed = JSON.parse(stdout) as NpmAuditReport;
  if (parsed.auditReportVersion !== 2 || !parsed.vulnerabilities) {
    throw new Error("Unsupported npm audit report format");
  }
  return parsed;
}

function run(): void {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const audit = spawnSync(npmCommand, ["audit", "--json"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (audit.error || !audit.stdout) {
    console.error("[audit:high] npm audit could not run", audit.error ?? audit.stderr);
    process.exitCode = 1;
    return;
  }

  let report: NpmAuditReport;
  try {
    report = parseAuditReport(audit.stdout);
  } catch (error) {
    console.error("[audit:high] npm audit returned an invalid report", error);
    process.exitCode = 1;
    return;
  }

  const findings = evaluateDependencyAudit(report);
  const rootPackage = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
  ) as RootPackage;
  const lock = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package-lock.json"), "utf8"),
  ) as PackageLock;
  const controlIssues = [
    ...verifySecurityResolutions(rootPackage, lock),
    ...verifyPresentationExposureControls(repositoryRoot),
  ];

  if (findings.length > 0 || controlIssues.length > 0) {
    console.error("[audit:high] Dependency security policy failed.");
    for (const finding of findings) console.error(`- unresolved: ${finding}`);
    for (const issue of controlIssues) console.error(`- resolution invalid: ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log("[audit:high] Zero known vulnerabilities; security resolutions verified.");
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
