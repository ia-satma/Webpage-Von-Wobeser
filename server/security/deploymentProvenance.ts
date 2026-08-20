import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { deploymentArtifacts } from "@shared/schema";
import { db } from "../db";

const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const buildProvenanceSchema = z.object({
  schemaVersion: z.literal(1),
  commitSha: z.string().regex(/^[a-f0-9]{40}$/),
  packageLockSha256: sha256,
  sbomSha256: sha256,
  serverBundleSha256: sha256,
  publicAssetsSha256: sha256,
  buildSha256: sha256,
  sourceTreeDirty: z.boolean(),
  builtAt: z.string().datetime(),
  nodeVersion: z.string().max(40),
}).strict();

export type RuntimeBuildProvenance = z.infer<typeof buildProvenanceSchema>;

export async function loadBuildProvenance(root = process.cwd()): Promise<RuntimeBuildProvenance | null> {
  try {
    const source = await fs.readFile(path.join(root, "dist", "build-provenance.json"), "utf8");
    const parsed = buildProvenanceSchema.safeParse(JSON.parse(source));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function recordDeploymentProvenance(root = process.cwd()): Promise<boolean> {
  const evidence = await loadBuildProvenance(root);
  if (!evidence) return false;
  const now = new Date();
  await db.insert(deploymentArtifacts).values({
    buildSha256: evidence.buildSha256,
    commitSha: evidence.commitSha,
    packageLockSha256: evidence.packageLockSha256,
    sbomSha256: evidence.sbomSha256,
    serverBundleSha256: evidence.serverBundleSha256,
    publicAssetsSha256: evidence.publicAssetsSha256,
    sourceTreeDirty: evidence.sourceTreeDirty,
    builtAt: new Date(evidence.builtAt),
    firstDeployedAt: now,
    lastSeenAt: now,
  }).onConflictDoUpdate({
    target: deploymentArtifacts.buildSha256,
    set: { lastSeenAt: now },
  });
  return true;
}
