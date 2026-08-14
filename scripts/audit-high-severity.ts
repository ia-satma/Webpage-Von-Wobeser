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
    version?: string;
    dependencies?: Record<string, string>;
  }>;
};

const HIGH_SEVERITIES = new Set(["high", "critical"]);
const UNPATCHED_IMAGE_SIZE_ADVISORIES = new Set([
  "https://github.com/advisories/GHSA-w3rx-r6r6-pgpr",
  "https://github.com/advisories/GHSA-5p2g-fcmc-qvqq",
]);

function hasExactNodes(vulnerability: AuditVulnerability, expected: string[]): boolean {
  return vulnerability.nodes.length === expected.length
    && expected.every((node) => vulnerability.nodes.includes(node));
}

function isExpectedImageSizeFinding(vulnerability: AuditVulnerability | undefined): boolean {
  if (!vulnerability
    || vulnerability.name !== "image-size"
    || vulnerability.severity !== "high"
    || !hasExactNodes(vulnerability, ["node_modules/image-size"])
    || vulnerability.via.length !== UNPATCHED_IMAGE_SIZE_ADVISORIES.size) {
    return false;
  }

  const urls = vulnerability.via.map((via) => typeof via === "string" ? null : via.url);
  return urls.every((url) => typeof url === "string" && UNPATCHED_IMAGE_SIZE_ADVISORIES.has(url))
    && UNPATCHED_IMAGE_SIZE_ADVISORIES.size === new Set(urls).size;
}

function isExpectedPptxPropagation(
  vulnerability: AuditVulnerability | undefined,
  imageSizeIsExpected: boolean,
): boolean {
  return imageSizeIsExpected
    && vulnerability?.name === "pptxgenjs"
    && vulnerability.severity === "high"
    && hasExactNodes(vulnerability, ["node_modules/pptxgenjs"])
    && vulnerability.via.length === 1
    && vulnerability.via[0] === "image-size";
}

export function evaluateHighSeverityAudit(report: NpmAuditReport): {
  accepted: string[];
  unexpected: string[];
} {
  const imageSizeIsExpected = isExpectedImageSizeFinding(report.vulnerabilities["image-size"]);
  const pptxIsExpected = isExpectedPptxPropagation(
    report.vulnerabilities.pptxgenjs,
    imageSizeIsExpected,
  );
  const accepted: string[] = [];
  const unexpected: string[] = [];

  for (const [key, vulnerability] of Object.entries(report.vulnerabilities)) {
    if (!HIGH_SEVERITIES.has(vulnerability.severity)) continue;
    if (key === "image-size" && imageSizeIsExpected) {
      accepted.push(key);
    } else if (key === "pptxgenjs" && pptxIsExpected) {
      accepted.push(key);
    } else {
      unexpected.push(`${key} (${vulnerability.severity})`);
    }
  }

  return { accepted, unexpected };
}

export function verifyTemporaryExceptionLock(lock: PackageLock): string[] {
  const issues: string[] = [];
  const pptx = lock.packages?.["node_modules/pptxgenjs"];
  const imageSize = lock.packages?.["node_modules/image-size"];

  if (pptx?.version !== "4.0.1") issues.push("pptxgenjs must remain locked at 4.0.1");
  if (pptx?.dependencies?.["image-size"] !== "^1.2.1") {
    issues.push("pptxgenjs image-size dependency changed and requires review");
  }
  if (imageSize?.version !== "1.2.1") issues.push("image-size version changed and requires review");
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

  const result = evaluateHighSeverityAudit(report);
  const lock = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package-lock.json"), "utf8"),
  ) as PackageLock;
  const controlIssues = result.accepted.length > 0
    ? [
        ...verifyTemporaryExceptionLock(lock),
        ...verifyPresentationExposureControls(repositoryRoot),
      ]
    : [];

  if (result.unexpected.length > 0 || controlIssues.length > 0) {
    console.error("[audit:high] High/critical dependency policy failed.");
    for (const finding of result.unexpected) console.error(`- unexpected: ${finding}`);
    for (const issue of controlIssues) console.error(`- exception invalid: ${issue}`);
    process.exitCode = 1;
    return;
  }

  if (result.accepted.length > 0) {
    console.warn(
      "[audit:high] Temporary exception: two unpatched image-size DoS advisories "
      + "propagated through pptxgenjs; exact versions and exposure controls verified.",
    );
  }
  console.log("[audit:high] No unexpected high or critical vulnerabilities.");
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
