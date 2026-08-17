import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repositorySource = fs.readFileSync(
  path.resolve(process.cwd(), "server/storage/repositories/newsRepository.ts"),
  "utf8",
);

test("publications keep undated legacy records visible after dated content", () => {
  const order = repositorySource.match(/const newsDateDescNullsLast\s*=\s*sql`([^`]+)`/)?.[1] || "";

  assert.match(order, /news\.date\}\s+desc\s+nulls\s+last/i);
  assert.match(order, /case\s+when[\s\S]+\^\[0-9\]\+\$[\s\S]+cast\([\s\S]+news\.legacyId\}[\s\S]+as\s+bigint\)/i);
  assert.match(order, /news\.legacyId\}\s+desc\s+nulls\s+last/i);
  assert.match(order, /news\.id\}\s+desc/i);
  assert.doesNotMatch(repositorySource, /isNotNull\(news\.date\)/);
});
