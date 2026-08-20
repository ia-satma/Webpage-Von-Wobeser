import { verifyBuildEvidence } from "../script/buildEvidence";

try {
  const evidence = await verifyBuildEvidence();
  console.log(JSON.stringify({
    verified: true,
    commitSha: evidence.commitSha,
    buildSha256: evidence.buildSha256,
    sourceTreeDirty: evidence.sourceTreeDirty,
  }));
} catch {
  console.error("Build evidence verification failed");
  process.exitCode = 1;
}
