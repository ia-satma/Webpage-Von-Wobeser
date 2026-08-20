import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  evaluateDependencyAudit,
  verifyPresentationExposureControls,
  verifySecurityResolutions,
  type NpmAuditReport,
} from "../../scripts/audit-high-severity";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

test("GitHub Actions de terceros quedan fijadas a commits inmutables", () => {
  const workflowDirectory = path.join(repositoryRoot, ".github", "workflows");
  const workflowFiles = fs
    .readdirSync(workflowDirectory)
    .filter((filename) => /\.ya?ml$/i.test(filename));

  const mutableReferences: string[] = [];

  for (const filename of workflowFiles) {
    const source = fs.readFileSync(path.join(workflowDirectory, filename), "utf8");
    for (const match of source.matchAll(/uses:\s+([^\s@]+)@([^\s#]+)/g)) {
      const [, action, reference] = match;
      if (action.startsWith("./")) continue;
      if (!/^[a-f0-9]{40}$/.test(reference)) {
        mutableReferences.push(`${filename}: ${action}@${reference}`);
      }
    }
  }

  assert.deepEqual(mutableReferences, []);
});

test("Dependabot agrupa actualizaciones compatibles y no mezcla versiones mayores", () => {
  const config = fs.readFileSync(
    path.join(repositoryRoot, ".github", "dependabot.yml"),
    "utf8",
  );

  assert.match(config, /production-security:[\s\S]*update-types:[\s\S]*- minor[\s\S]*- patch/);
  assert.match(
    config,
    /dependency-name:\s+["']\*["'][\s\S]*version-update:semver-major/,
  );
  assert.equal((config.match(/cooldown:/g) ?? []).length, 2);
  assert.match(config, /cooldown:[\s\S]*default-days:\s+7/);
});

test("CI conserva ffmpeg y las excepciones de escáner permanecen acotadas", () => {
  const ciWorkflow = fs.readFileSync(
    path.join(repositoryRoot, ".github", "workflows", "ci.yml"),
    "utf8",
  );
  assert.match(
    ciWorkflow,
    /Install video validation runtime[\s\S]*apt-get install --no-install-recommends --yes ffmpeg/,
  );
  assert.match(ciWorkflow, /run: npm run audit:high/);
  assert.doesNotMatch(ciWorkflow, /npm audit --audit-level=high/);

  const gitleaksConfig = fs.readFileSync(
    path.join(repositoryRoot, ".gitleaks.toml"),
    "utf8",
  );
  assert.match(
    gitleaksConfig,
    /\^client\/src\/features\/admin\/site-config\/registry\\\.ts\$/,
  );

  const semgrepRule = "nosemgrep: javascript.express.security.audit.express-res-sendfile.express-res-sendfile";
  const adminSubmissions = fs.readFileSync(
    path.join(repositoryRoot, "server", "routes", "adminSubmissionRoutes.ts"),
    "utf8",
  );
  const publicAssets = fs.readFileSync(
    path.join(repositoryRoot, "server", "routes", "publicAssetRoutes.ts"),
    "utf8",
  );
  assert.equal(adminSubmissions.split(semgrepRule).length - 1, 1);
  assert.equal(publicAssets.split(semgrepRule).length - 1, 2);
  assert.equal((publicAssets.match(/!resolved\.startsWith\(path\.resolve\([^\n]+\) \+ path\.sep\)/g) ?? []).length, 2);
});

function auditReportWithFindings(): NpmAuditReport {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      "high-risk": {
        name: "high-risk",
        severity: "high",
        nodes: ["node_modules/high-risk"],
        via: [],
      },
      "moderate-risk": {
        name: "moderate-risk",
        severity: "moderate",
        nodes: ["node_modules/moderate-risk"],
        via: [],
      },
    },
  };
}

test("la política de dependencias exige cero vulnerabilidades conocidas", () => {
  const cleanReport: NpmAuditReport = {
    auditReportVersion: 2,
    vulnerabilities: {},
  };
  assert.deepEqual(evaluateDependencyAudit(cleanReport), []);
  assert.deepEqual(
    evaluateDependencyAudit(auditReportWithFindings()),
    ["high-risk (high)", "moderate-risk (moderate)"],
  );
});

test("las resoluciones seguras quedan ligadas al manifiesto y al lockfile", () => {
  const rootPackage = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
  );
  const packageLock = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package-lock.json"), "utf8"),
  );
  assert.deepEqual(verifySecurityResolutions(rootPackage, packageLock), []);
  assert.deepEqual(verifyPresentationExposureControls(repositoryRoot), []);

  const changedLock = structuredClone(packageLock);
  changedLock.packages["node_modules/uuid"].version = "9.0.1";
  assert.deepEqual(
    verifySecurityResolutions(rootPackage, changedLock),
    ["uuid must resolve to 11.1.1"],
  );
});

test("el reemplazo local de image-size falla cerrado si llega a invocarse", () => {
  const require = createRequire(import.meta.url);
  const guardedImageSize = require("../../vendor/image-size-guard/index.cjs") as {
    (input: Uint8Array): never;
    ERROR_CODE: string;
    types: readonly string[];
  };

  assert.equal(guardedImageSize.ERROR_CODE, "ERR_VWYS_IMAGE_SIZE_DISABLED");
  assert.deepEqual(guardedImageSize.types, []);
  assert.throws(
    () => guardedImageSize(new Uint8Array()),
    (error: unknown) => error instanceof Error
      && (error as Error & { code?: string }).code === "ERR_VWYS_IMAGE_SIZE_DISABLED",
  );
});
