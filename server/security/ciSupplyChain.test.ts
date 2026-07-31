import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

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
});
