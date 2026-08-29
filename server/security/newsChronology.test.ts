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
  const publicArchive = repositorySource.match(/async getPublishedNewsPage[\s\S]*?\n    }\n\n    async getPublishedNewsCount/)?.[0] || "";
  const authorArchive = repositorySource.match(/async getPublishedNewsByTeamMemberIdPage[\s\S]*?\n    }\n\n    \/\*\*/)?.[0] || "";

  assert.match(order, /news\.date\}\s+desc\s+nulls\s+last/i);
  assert.match(order, /case\s+when[\s\S]+\^\[0-9\]\+\$[\s\S]+cast\([\s\S]+news\.legacyId\}[\s\S]+as\s+bigint\)/i);
  assert.match(order, /news\.legacyId\}\s+desc\s+nulls\s+last/i);
  assert.match(order, /news\.id\}\s+desc/i);
  // El archivo general conserva los legados sin fecha. El archivo por autor e
  // Insights sí los excluyen, para no publicar tarjetas incompletas.
  assert.doesNotMatch(publicArchive, /isNotNull\(news\.date\)/);
  assert.match(authorArchive, /isNotNull\(news\.date\)/);
});
