import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://unused:unused@127.0.0.1:1/unused?sslmode=disable";

const {
  apiRouteBucket,
  apiRoutePolicy,
  isPublicVcardDownloadRoute,
  nextApiRateLimitState,
} = await import("./apiRateLimit");
const {
  isAllowedPipelineOrigin,
  parsePipelineClientMessage,
} = await import("./pipelineWebSocket");
const { isClamAvRequired } = await import("./uploads");

test("API quotas use bounded route families and stricter expensive-operation limits", () => {
  const first = apiRouteBucket("GET", "/api/news/4ce12bea-d17b-4ce3-bccc-26b71b57a221");
  const second = apiRouteBucket("GET", "/api/news/30bb6457-9e85-44ac-a6af-3fc119f873ed");
  assert.equal(first, "public-news");
  assert.equal(second, first);
  assert.equal(apiRouteBucket("GET", "/api/unknown-one/attacker-value"), "public-other-read");
  assert.equal(apiRouteBucket("GET", "/api/unknown-two/a-different-value"), "public-other-read");
  assert.equal(apiRouteBucket("POST", "/api/agents/pipeline/process-all"), "agents");
  assert.equal(apiRouteBucket("POST", "/api/admin/media/upload/part"), "admin-media-upload");

  assert.equal(isPublicVcardDownloadRoute("GET", "/api/team/ana-perez/vcard"), true);
  assert.equal(isPublicVcardDownloadRoute("HEAD", "/api/team/ana-perez/vcard?lang=en"), true);
  assert.equal(isPublicVcardDownloadRoute("POST", "/api/team/ana-perez/vcard"), false);
  assert.equal(isPublicVcardDownloadRoute("GET", "/api/team/ana-perez"), false);

  const expensive = apiRoutePolicy("POST", "agents", true);
  const ordinaryWrite = apiRoutePolicy("POST", "admin-news", true);
  const upload = apiRoutePolicy("POST", "admin-media-upload", true);
  assert.ok(expensive.maxAttempts < ordinaryWrite.maxAttempts);
  assert.ok(upload.maxAttempts > ordinaryWrite.maxAttempts);
});

test("API quota decisions allow the configured count, then block and reset by window", () => {
  const policy = { maxAttempts: 2, windowMs: 1_000, blockDurationMs: 5_000 };
  const startedAt = new Date(10_000);
  const second = nextApiRateLimitState({ attempts: 1, windowStartedAt: startedAt, blockedUntil: null }, policy, 10_100);
  assert.equal(second.allowed, true);
  assert.equal(second.attempts, 2);

  const blocked = nextApiRateLimitState({ attempts: 2, windowStartedAt: startedAt, blockedUntil: null }, policy, 10_200);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfter, 5);

  const stillBlockedAfterWindow = nextApiRateLimitState({
    attempts: 2,
    windowStartedAt: startedAt,
    blockedUntil: new Date(20_000),
  }, policy, 11_001);
  assert.equal(stillBlockedAfterWindow.allowed, false);
  assert.equal(stillBlockedAfterWindow.retryAfter, 9);

  const reset = nextApiRateLimitState({ attempts: 99, windowStartedAt: startedAt, blockedUntil: null }, policy, 11_001);
  assert.equal(reset.allowed, true);
  assert.equal(reset.attempts, 1);
  assert.equal(reset.blockedUntil, null);
});

test("pipeline WebSocket accepts only exact same-origin handshakes", () => {
  assert.equal(isAllowedPipelineOrigin("https://example.test", "example.test"), true);
  assert.equal(isAllowedPipelineOrigin("https://example.test:8443", "example.test:8443"), true);
  assert.equal(isAllowedPipelineOrigin("https://evil.test", "example.test"), false);
  assert.equal(isAllowedPipelineOrigin("javascript:alert(1)", "example.test"), false);
  assert.equal(isAllowedPipelineOrigin(undefined, "example.test"), false);
});

test("pipeline WebSocket protocol permits only UUID-scoped subscriptions", () => {
  const articleId = "4ce12bea-d17b-4ce3-bccc-26b71b57a221";
  assert.deepEqual(
    parsePipelineClientMessage(JSON.stringify({ type: "subscribe", articleId })),
    { type: "subscribe", articleId },
  );
  assert.deepEqual(
    parsePipelineClientMessage(JSON.stringify({ type: "unsubscribe", articleId })),
    { type: "unsubscribe", articleId },
  );
  assert.equal(parsePipelineClientMessage(JSON.stringify({ type: "subscribe", articleId: "__proto__" })), null);
  assert.equal(parsePipelineClientMessage(JSON.stringify({ type: "subscribe", articleId, extra: true })), null);
  assert.equal(parsePipelineClientMessage("{"), null);
  assert.equal(parsePipelineClientMessage("x".repeat(2_049)), null);
});

test("WebSocket server revalidates session, MFA and agents permission before scoped delivery", () => {
  const source = fs.readFileSync(new URL("./pipelineWebSocket.ts", import.meta.url), "utf8");
  assert.match(source, /resolveAdminSession/);
  assert.match(source, /hasPipelineAccess\(resolved\.user\)/);
  assert.match(source, /isMfaRequiredForRole\(resolved\.user\.role\)/);
  assert.match(source, /await revalidateClient\(client\)/);
  assert.match(source, /client\.subscriptions\.has\(parsedArticleId\.data\)/);
  assert.doesNotMatch(source, /Broadcast to all connected clients/);

  const client = fs.readFileSync(
    new URL("../../client/src/hooks/usePipelineProgress.ts", import.meta.url),
    "utf8",
  );
  assert.match(client, /sendControl\('subscribe', articleId\)/);
  assert.match(client, /subscribedArticleId !== data\.articleId/);
  assert.match(client, /UUID_PATTERN\.test\(event\.articleId\)/);
});

test("ClamAV readiness follows the production fail-closed configuration", () => {
  assert.equal(isClamAvRequired({ NODE_ENV: "production", CLAMAV_REQUIRED: undefined }), true);
  assert.equal(isClamAvRequired({ NODE_ENV: "production", CLAMAV_REQUIRED: "false" }), false);
  assert.equal(isClamAvRequired({ NODE_ENV: "development", CLAMAV_REQUIRED: "true" }), true);
  assert.equal(isClamAvRequired({ NODE_ENV: "development", CLAMAV_REQUIRED: undefined }), false);
  const replit = fs.readFileSync(new URL("../../.replit", import.meta.url), "utf8");
  assert.match(replit, /CLAMAV_REQUIRED\s*=\s*"false"/);
});

test("production CSP adds explicit worker and manifest boundaries", () => {
  const source = fs.readFileSync(new URL("../index.ts", import.meta.url), "utf8");
  assert.match(source, /manifestSrc:\s*\["'self'"\]/);
  assert.match(source, /workerSrc:\s*\["'self'",\s*"blob:"\]/);
});
