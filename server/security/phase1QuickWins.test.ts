import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { escapeHtmlAttribute, escapeHtmlText } from "../mirror/htmlEscape";

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("contextual HTML escaping keeps text readable and attributes quoted safely", () => {
  const payload = `Firm & <tag> "double" 'single'`;
  assert.equal(
    escapeHtmlText(payload),
    `Firm &amp; &lt;tag&gt; "double" 'single'`,
  );
  assert.equal(
    escapeHtmlAttribute(payload),
    "Firm &amp; &lt;tag&gt; &quot;double&quot; &#39;single&#39;",
  );
});

test("dynamic mirror attributes use attribute-specific escaping", () => {
  const pipeline = read("server/mirror/htmlPipeline.ts");
  const home = read("server/mirror/renderHome.ts");
  const desk = read("server/mirror/renderDesk.ts");
  const single = read("server/mirror/renderSingle.ts");

  assert.match(pipeline, /const escaped = escapeHtmlAttribute\(value\)/);
  assert.doesNotMatch(home, /href="\/news\/\$\{esc\(item\.slug\)\}/);
  assert.doesNotMatch(home, /src="\$\{esc\(r\.logoUrl\)\}/);
  assert.doesNotMatch(home, /href="\$\{esc\(r\.externalUrl\)\}/);
  assert.match(desk, /href="\/lawyer\/\$\{escapeHtmlAttribute\(m\.slug\)\}/);
  assert.match(single, /href="\/lawyer\/\$\{escapeHtmlAttribute\(a\.slug\)\}/);
});

test("the retired pCloud connector has no runtime route, client action, or credential transport", () => {
  const routeSource = read("server/agents/api/agentRoutes.ts");
  const agentPage = read("client/src/pages/AdminAgents.tsx");
  const legacyConnector = path.join(repoRoot, "server/agents/storage/PCloudStorage.ts");

  assert.equal(fs.existsSync(legacyConnector), false);
  assert.doesNotMatch(routeSource, /pcloud|PCLOUD_/i);
  assert.doesNotMatch(agentPage, /pcloud|syncPCloudMutation|button-cloud-sync/i);
});

test("client-facing language identifies legal review as automated decision support", () => {
  const manifest = read("client/src/lib/systemManifest.ts");
  const translations = read("client/src/lib/adminTranslations.ts");
  const chronicler = read("server/agents/SystemChronicler.ts");
  assert.doesNotMatch(manifest, /Legal Council/);
  assert.match(manifest, /no constituye dictamen jurídico/i);
  assert.match(manifest, /decisión humana/i);
  assert.doesNotMatch(translations, /Digital Governance Council|Digitale Governance-Rat|数字治理委员会|디지털 거버넌스 협의회|デジタルガバナンス評議会|مجلس الحوكمة الرقمية|Цифровой Совет по Управлению|Conseil de Gouvernance Numérique|Consiglio di Governance Digitale/);
  assert.match(chronicler, /not legal advice or an independent legal opinion/i);
});
