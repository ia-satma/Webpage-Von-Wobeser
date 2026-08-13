import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  evaluateHighSeverityAudit,
  verifyPresentationExposureControls,
  verifyTemporaryExceptionLock,
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
  assert.equal(publicAssets.split(semgrepRule).length - 1, 3);
  assert.equal((publicAssets.match(/!resolved\.startsWith\(path\.resolve\([^\n]+\) \+ path\.sep\)/g) ?? []).length, 3);
});

function expectedAuditReport(): NpmAuditReport {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      "image-size": {
        name: "image-size",
        severity: "high",
        nodes: ["node_modules/image-size"],
        via: [
          {
            url: "https://github.com/advisories/GHSA-w3rx-r6r6-pgpr",
            severity: "high",
          },
          {
            url: "https://github.com/advisories/GHSA-5p2g-fcmc-qvqq",
            severity: "high",
          },
        ],
      },
      pptxgenjs: {
        name: "pptxgenjs",
        severity: "high",
        nodes: ["node_modules/pptxgenjs"],
        via: ["image-size"],
      },
      informational: {
        name: "informational",
        severity: "moderate",
        nodes: ["node_modules/informational"],
        via: [],
      },
    },
  };
}

test("la excepción temporal de npm audit acepta solo los dos avisos sin parche", () => {
  const expected = evaluateHighSeverityAudit(expectedAuditReport());
  assert.deepEqual(expected.unexpected, []);
  assert.deepEqual(expected.accepted.sort(), ["image-size", "pptxgenjs"]);

  const reportWithNewHigh = expectedAuditReport();
  reportWithNewHigh.vulnerabilities["new-risk"] = {
    name: "new-risk",
    severity: "critical",
    nodes: ["node_modules/new-risk"],
    via: [],
  };
  assert.deepEqual(
    evaluateHighSeverityAudit(reportWithNewHigh).unexpected,
    ["new-risk (critical)"],
  );

  const reportWithChangedAdvisory = expectedAuditReport();
  reportWithChangedAdvisory.vulnerabilities["image-size"].via.push({
    url: "https://github.com/advisories/GHSA-new-advisory",
    severity: "high",
  });
  assert.deepEqual(
    evaluateHighSeverityAudit(reportWithChangedAdvisory).unexpected.sort(),
    ["image-size (high)", "pptxgenjs (high)"],
  );
});

test("la excepción npm queda ligada al lock y a los controles de imágenes", () => {
  const packageLock = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package-lock.json"), "utf8"),
  );
  assert.deepEqual(verifyTemporaryExceptionLock(packageLock), []);
  assert.deepEqual(verifyPresentationExposureControls(repositoryRoot), []);

  const changedLock = structuredClone(packageLock);
  changedLock.packages["node_modules/image-size"].version = "2.0.2";
  assert.deepEqual(
    verifyTemporaryExceptionLock(changedLock),
    ["image-size version changed and requires review"],
  );
});
