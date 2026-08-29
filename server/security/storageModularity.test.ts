import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const EXPECTED_STORAGE_METHOD_COUNT = 211;
const EXPECTED_STORAGE_CONTRACT_HASH =
  "10b0356f108edbc9fc425c0eb8a16624da6e5ec9fee6cc887f84f022e04b2cfa";
const EXPECTED_STORAGE_IMPLEMENTATION_HASH =
  "46118b87b135690ab59823c3ecd968a1d758836d72849b97ed76a74d8b65d671";
const REPOSITORY_FILES = [
  "auditRepository.ts",
  "catalogRepository.ts",
  "mediaRepository.ts",
  "newsRepository.ts",
  "peopleRepository.ts",
  "publicContentRepository.ts",
  "securityRepository.ts",
  "submissionRepository.ts",
  "translationRepository.ts",
] as const;

function parseSource(filePath: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function storageContract() {
  const filePath = path.join(process.cwd(), "server", "storage", "contracts.ts");
  const source = parseSource(filePath);
  const declaration = source.statements.find(
    (node): node is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(node) && node.name.text === "IStorage",
  );
  assert.ok(declaration, "IStorage must remain the canonical public contract");

  const methods = declaration.members.filter(ts.isMethodSignature);
  const normalized = methods
    .map((method) => method.getText(source).replace(/\s+/g, " "))
    .join("\n");

  return {
    names: methods.map((method) => method.name.getText(source)),
    hash: crypto.createHash("sha256").update(normalized).digest("hex"),
  };
}

function repositoryMethodBodies(): Map<string, string> {
  const directory = path.join(process.cwd(), "server", "storage", "repositories");
  const methods = new Map<string, string>();

  const visit = (node: ts.Node) => {
    if (ts.isMethodDeclaration(node)) {
      const source = node.getSourceFile();
      const name = node.name.getText(source);
      assert.equal(methods.has(name), false, `Duplicate repository method: ${name}`);
      methods.set(name, node.getText(source).replace(/\s+/g, " "));
    }
    ts.forEachChild(node, visit);
  };

  for (const fileName of REPOSITORY_FILES) {
    visit(parseSource(path.join(directory, fileName)));
  }

  return methods;
}

test("IStorage conserva sus 211 firmas y el mismo orden contractual", () => {
  const contract = storageContract();
  assert.equal(contract.names.length, EXPECTED_STORAGE_METHOD_COUNT);
  assert.equal(contract.hash, EXPECTED_STORAGE_CONTRACT_HASH);
  assert.equal(new Set(contract.names).size, EXPECTED_STORAGE_METHOD_COUNT);
});

test("los repositorios cubren una sola vez todos los métodos trasladados", () => {
  const contract = storageContract();
  const methodBodies = repositoryMethodBodies();
  const repositoryMethods = [...methodBodies.keys()];
  const duplicates = repositoryMethods.filter(
    (name, index) => repositoryMethods.indexOf(name) !== index,
  );
  const publicMethods = repositoryMethods.filter((name) => name !== "publishedNewsConditions");

  assert.deepEqual(duplicates, []);
  assert.equal(repositoryMethods.length, 213);
  assert.ok(repositoryMethods.includes("publishedNewsConditions"));
  assert.ok(repositoryMethods.includes("getNewsStatusCounts"));
  const normalizedImplementation = [...methodBodies.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([name, body]) => `${name}\n${body}`)
    .join("\n");
  assert.equal(
    crypto.createHash("sha256").update(normalizedImplementation).digest("hex"),
    EXPECTED_STORAGE_IMPLEMENTATION_HASH,
  );

  for (const methodName of contract.names) {
    assert.ok(
      publicMethods.includes(methodName),
      `Repository implementation missing for ${methodName}`,
    );
  }
});

test("DatabaseStorage y el singleton conservan la superficie pública en ejecución", async () => {
  const { DatabaseStorage, storage } = await import("../storage");
  const instance = new DatabaseStorage({} as never);
  const contract = storageContract();

  assert.ok(storage instanceof DatabaseStorage);
  assert.ok(instance instanceof DatabaseStorage);

  for (const methodName of contract.names) {
    assert.equal(typeof (instance as Record<string, unknown>)[methodName], "function");
    assert.equal(typeof (storage as unknown as Record<string, unknown>)[methodName], "function");
  }

  const installed = Object.getOwnPropertyNames(instance);
  assert.equal(installed.length, 213);
  assert.ok(installed.includes("publishedNewsConditions"));
  assert.ok(installed.includes("getNewsStatusCounts"));
});

test("la fachada permanece pequeña y no vuelve a contener consultas SQL", () => {
  const facadePath = path.join(process.cwd(), "server", "storage.ts");
  const facade = fs.readFileSync(facadePath, "utf8");

  assert.ok(facade.split("\n").length <= 120);
  assert.doesNotMatch(
    facade,
    /\b(?:defaultDatabase|database|db)\.(?:select|insert|update|delete|transaction|execute)\b/,
  );
  assert.match(facade, /export class DatabaseStorage/);
  assert.match(facade, /export const storage = new DatabaseStorage\(\)/);
  assert.match(facade, /Duplicate storage repository method/);
});

test("las transacciones sensibles permanecen completas dentro de sus repositorios", () => {
  const directory = path.join(process.cwd(), "server", "storage", "repositories");
  const news = fs.readFileSync(path.join(directory, "newsRepository.ts"), "utf8");
  const media = fs.readFileSync(path.join(directory, "mediaRepository.ts"), "utf8");
  const security = fs.readFileSync(path.join(directory, "securityRepository.ts"), "utf8");
  const catalog = fs.readFileSync(path.join(directory, "catalogRepository.ts"), "utf8");

  assert.match(news, /createNewsWithTeamMembers[\s\S]*?db\.transaction\(async \(tx\)/);
  assert.match(news, /createNewsProcessingDraft[\s\S]*?newsTranslations[\s\S]*?newsTeamMembers/);
  assert.match(news, /updateNewsWithTeamMembers[\s\S]*?db\.transaction\(async \(tx\)/);
  assert.match(media, /reorderOfficeImages[\s\S]*?db\.transaction\(async \(tx\)/);
  assert.match(security, /cleanExpiredSecurityRecords[\s\S]*?db\.transaction\(async \(tx\)/);
  assert.match(catalog, /reorderRankings[\s\S]*?LOCK TABLE[\s\S]*?db\.transaction|reorderRankings[\s\S]*?db\.transaction[\s\S]*?LOCK TABLE/);
});
