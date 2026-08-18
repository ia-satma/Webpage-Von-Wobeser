import { readMirrorSources } from "./mirrorTestSources";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const {
  applyCspNonce,
  applyLocalSri,
  createCspNonce,
  migrateLegacyInlineHandlers,
  prepareTrustedHtmlForCsp,
} = await import("./csp");
const { LOCAL_SRI_MANIFEST } = await import("./sriManifest");

test("nonces CSP are cryptographically sized and unique per response", () => {
  const first = createCspNonce();
  const second = createCspNonce();
  assert.notEqual(first, second);
  assert.equal(Buffer.from(first, "base64").length, 32);
  assert.equal(Buffer.from(second, "base64").length, 32);
});

test("legacy inline handlers become safe declarative actions", () => {
  const source = '<a data-url="/lawyer/test" onclick="ref(this);">Profile</a>'
    + '<button onclick="window.print();">Print</button>'
    + '<a onclick="tabshow(\'module_262\');return false">Tab</a>'
    + '<a onclick="auf(\'right\')">Close</a>'
    + '<a onclick="window.location.href=\'/new-offices/index.html\'">Offices</a>'
    + '<a href="/index.php/component/mailto/test.html" onclick="window.open(this.href,\'win2\',\'width=400,height=350,menubar=yes,resizable=yes\'); return false;">Email</a>'
    + '<a href="/index.php/print/test.html" onclick="window.open(this.href,\'win2\',\'status=no,toolbar=no,scrollbars=yes,titlebar=no,menubar=no,resizable=yes,width=640,height=480,directories=no,location=no\'); return false;">Print</a>'
    + '<select onchange="this.form.submit()"></select>'
    + '<input id="uploaded_file" onchange="Handlechange(); required">';
  const html = migrateLegacyInlineHandlers(source);

  assert.doesNotMatch(html, /\son(?:click|change)\s*=/i);
  assert.match(html, /data-vw-action="legacy-ref"/);
  assert.match(html, /data-vw-action="print"/);
  assert.match(html, /data-vw-legacy-tab="module_262"/);
  assert.match(html, /data-vw-legacy-auf="right"/);
  assert.match(html, /data-vw-navigate="\/new-offices\/index\.html"/);
  assert.match(html, /data-vw-action="popup-email"/);
  assert.match(html, /data-vw-action="popup-print"/);
  assert.match(html, /data-vw-action="submit-on-change"/);
  assert.match(html, /required data-vw-action="career-file-name"/);
});

test("trusted HTML receives nonce and SRI while unknown remote scripts do not", () => {
  const nonce = createCspNonce();
  const source = '<style>.a{color:red}</style>'
    + '<script>window.safe=true</script>'
    + '<script src="/_vendor/jquery/jquery-3.7.1.min.js"></script>'
    + '<link rel="stylesheet" href="/templates/beez3/css/von.css?v=1">'
    + '<script src="https://untrusted.example/script.js"></script>';
  const html = prepareTrustedHtmlForCsp(source, nonce);

  assert.equal(html.split('nonce="' + nonce + '"').length - 1, 4);
  assert.ok(html.includes('src="/_vendor/jquery/jquery-3.7.1.min.js" nonce="' + nonce + '" integrity="' + LOCAL_SRI_MANIFEST["/_vendor/jquery/jquery-3.7.1.min.js"] + '" crossorigin="anonymous"'));
  assert.ok(html.includes('href="/templates/beez3/css/von.css?v=1" integrity="' + LOCAL_SRI_MANIFEST["/templates/beez3/css/von.css"] + '" crossorigin="anonymous"'));
  assert.doesNotMatch(html, /untrusted\.example\/script\.js[^>]*integrity=/);
  assert.ok(applyCspNonce('<script src="/x.js"></script>', nonce).includes('nonce="' + nonce + '"'));
  assert.match(applyLocalSri('<link rel="stylesheet" href="/templates/beez3/css/style.css">'), /integrity="sha384-/);
});

test("SRI manifest exactly matches every local immutable asset", () => {
  const aliases: Record<string, string> = {
    "/vwb-privacy-preferences.css": "/vwb-cookie-consent.css",
    "/vwb-privacy-preferences.js": "/vwb-cookie-consent.js",
  };
  for (const [url, integrity] of Object.entries(LOCAL_SRI_MANIFEST)) {
    const relative = (aliases[url] || url).replace(/^\//, "");
    const file = (relative.startsWith("vwb-") || relative === "attorney-directory.js")
      ? path.resolve(process.cwd(), "public", relative)
      : path.resolve(process.cwd(), "frontend-mirror", relative);
    assert.equal(existsSync(file), true, url + " must exist");
    const actual = "sha384-" + createHash("sha384").update(readFileSync(file)).digest("base64");
    assert.equal(actual, integrity, url + " hash must be refreshed intentionally");
  }

  const adminShell = readFileSync(path.resolve(process.cwd(), "client", "index.html"), "utf8");
  assert.ok(adminShell.includes('integrity="' + LOCAL_SRI_MANIFEST["/templates/beez3/css/typography.css"] + '"'));
});

test("production CSP is enforced and does not permit inline script attributes", () => {
  const source = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
  assert.match(source, /reportOnly:\s*!isProduction/);
  assert.match(source, /scriptSrcAttr:\s*isProduction\s*\?\s*\["'none'"\]/);
  assert.match(source, /scriptSrc:\s*isProduction[\s\S]*cspNonceSource/);
  assert.match(source, /styleSrcElem:\s*isProduction[\s\S]*cspNonceSource/);
  assert.match(source, /connectSrc:\s*isProduction[\s\S]*www\.google-analytics\.com/);
  assert.match(source, /upgradeInsecureRequests/);
  assert.doesNotMatch(source, /unsafe-eval/);
});

test("public HTML is not shared between visitors when it contains a nonce", () => {
  const mirror = readMirrorSources();
  const staticServer = readFileSync(new URL("../static.ts", import.meta.url), "utf8");
  assert.match(mirror, /prepareTrustedHtmlForCsp\(out, nonce\)/);
  assert.match(mirror, /res\.set\("Cache-Control", "private, no-store"\)/);
  assert.match(staticServer, /filePath\.endsWith\("\.html"\).*private, no-store/);
  assert.match(staticServer, /res\.setHeader\("Cache-Control", "private, no-store"\);/);
});
