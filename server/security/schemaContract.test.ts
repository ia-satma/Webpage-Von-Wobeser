import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { getTableConfig } from "drizzle-orm/pg-core";
import ts from "typescript";
import * as schema from "../../shared/schema";

const root = process.cwd();
const facadePath = path.join(root, "shared", "schema.ts");
const modulesDirectory = path.join(root, "shared", "schema");
const moduleFiles = fs.readdirSync(modulesDirectory)
  .filter((name) => name.endsWith(".ts") && !name.startsWith("._"))
  .sort();

const EXPECTED_SOURCE_EXPORT_HASH = "d65a66aae520d6712d8fef48dc2ff9c62070ee316ec98af812442fbf3bd8ef7a";
const EXPECTED_TYPE_DECLARATION_HASH = "70b5548506c7639fc41e5867ba83e1390fa86bb37440a48c33cb28a6921043d0";
const EXPECTED_RUNTIME_EXPORT_HASH = "a67c51665518b037e23e0a8a6d1fdf76042c8b60ff8a2bfa4186a09a943c8a35";
const EXPECTED_ZOD_HASH = "52b380e3eed9f7b470d1f5fc19552d1b50de1acb49a26bd68f738a2b6b75ca41";
const EXPECTED_CATALOG_HASH = "f0687784ec1fa33dc9df739b8effab895db987a5919a90b754837aa33c932b7b";
const EXPECTED_SQL_HASH = "d6f7a7c015a708e041ed988a4962335d0bea8b23d9a4eeade767122352444d89";

function sha256(value: unknown): string {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

function collectSourceExports(): Array<["interface" | "type" | "value", string]> {
  const exports: Array<["interface" | "type" | "value", string]> = [];
  for (const name of moduleFiles) {
    const filePath = path.join(modulesDirectory, name);
    const source = ts.createSourceFile(
      filePath,
      fs.readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    for (const statement of source.statements) {
      const exported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!exported) continue;
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) exports.push(["value", declaration.name.text]);
        }
      } else if (ts.isTypeAliasDeclaration(statement)) {
        exports.push(["type", statement.name.text]);
      } else if (ts.isInterfaceDeclaration(statement)) {
        exports.push(["interface", statement.name.text]);
      }
    }
  }
  return exports.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
}

function collectTypeDeclarations(): Array<["interface" | "type", string, string]> {
  const declarations: Array<["interface" | "type", string, string]> = [];
  for (const name of moduleFiles) {
    const filePath = path.join(modulesDirectory, name);
    const source = ts.createSourceFile(
      filePath,
      fs.readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    for (const statement of source.statements) {
      const exported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!exported || (!ts.isTypeAliasDeclaration(statement) && !ts.isInterfaceDeclaration(statement))) {
        continue;
      }
      declarations.push([
        ts.isTypeAliasDeclaration(statement) ? "type" : "interface",
        statement.name.text,
        statement.getText(source).replace(/\s+/g, " ").trim(),
      ]);
    }
  }
  return declarations.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
}

function isTable(value: unknown): boolean {
  try {
    return Boolean(getTableConfig(value as never)?.name);
  } catch {
    return false;
  }
}

function isZodSchema(value: any): boolean {
  return Boolean(value?._def?.typeName && typeof value.safeParse === "function");
}

function normalizeFunction(value: Function): string {
  return Function.prototype.toString.call(value).replace(/\s+/g, " ").trim();
}

function normalizeZod(value: any, seen = new WeakSet<object>(), key = ""): unknown {
  if (value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value)) {
    return value;
  }
  if (typeof value === "bigint") return String(value);
  if (typeof value === "function") {
    if (key === "shape" || key === "defaultValue") {
      try {
        return normalizeZod(value(), seen, `${key}Result`);
      } catch {
        return normalizeFunction(value);
      }
    }
    return normalizeFunction(value);
  }
  if (Array.isArray(value)) return value.map((item) => normalizeZod(item, seen));
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (isZodSchema(value)) return normalizeZod(value._def, seen, "_def");
  if (value instanceof Date) return value.toISOString();

  const ignoredRuntimeMethods = new Set([
    "spa", "parse", "safeParse", "parseAsync", "safeParseAsync", "refine", "refinement",
    "superRefine", "optional", "nullable", "nullish", "array", "promise", "or", "and",
    "transform", "brand", "default", "catch", "describe", "pipe", "readonly",
    "isNullable", "isOptional", "~standard",
  ]);
  return Object.fromEntries(
    Object.keys(value)
      .filter((property) => !ignoredRuntimeMethods.has(property))
      .sort()
      .map((property) => [property, normalizeZod(value[property], seen, property)]),
  );
}

function normalizeExportedZod(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([, value]) => isZodSchema(value))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => [name, normalizeZod(value)]),
  );
}

function normalizeCatalogs(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([, value]) => !isTable(value) && !isZodSchema(value))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function normalizedExportSql(): string {
  const binary = path.join(root, "node_modules", ".bin", "drizzle-kit");
  const sql = execFileSync(binary, ["export", "--config=drizzle.config.ts"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      // `export` only reads declarations. A deliberately unusable URL proves
      // this test never needs or contacts a real database.
      DATABASE_URL: "postgresql://schema_verify:unused@127.0.0.1:1/never_connect",
    },
  });
  return sql.trim()
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`)
    .sort()
    .join("\n");
}

test("el esquema conserva exactamente su superficie pública original", () => {
  const sourceExports = collectSourceExports();
  assert.equal(sourceExports.length, 249);
  assert.equal(sourceExports.filter(([kind]) => kind === "value").length, 125);
  assert.equal(sourceExports.filter(([kind]) => kind === "type").length, 110);
  assert.equal(sourceExports.filter(([kind]) => kind === "interface").length, 14);
  assert.equal(sha256(sourceExports), EXPECTED_SOURCE_EXPORT_HASH);

  const typeDeclarations = collectTypeDeclarations();
  assert.equal(typeDeclarations.length, 124);
  assert.equal(sha256(typeDeclarations), EXPECTED_TYPE_DECLARATION_HASH);

  const runtimeExports = Object.keys(schema).sort();
  assert.equal(runtimeExports.length, 125);
  assert.equal(sha256(runtimeExports), EXPECTED_RUNTIME_EXPORT_HASH);
});

test("las tablas, Zod, catálogos y DDL permanecen semánticamente idénticos", () => {
  const tables = Object.values(schema).flatMap((value) => {
    try {
      const config = getTableConfig(value as never);
      return config?.name ? [config] : [];
    } catch {
      return [];
    }
  });
  assert.equal(tables.length, 62);
  assert.equal(tables.reduce((total, table) => total + table.columns.length, 0), 706);
  assert.equal(tables.reduce((total, table) => total + table.indexes.length, 0), 36);
  assert.equal(tables.reduce((total, table) => total + table.foreignKeys.length, 0), 11);

  const zodSchemas = normalizeExportedZod();
  assert.equal(Object.keys(zodSchemas).length, 51);
  assert.equal(sha256(zodSchemas), EXPECTED_ZOD_HASH);

  const catalogs = normalizeCatalogs();
  assert.equal(Object.keys(catalogs).length, 12);
  assert.equal(sha256(catalogs), EXPECTED_CATALOG_HASH);
  assert.equal(sha256(normalizedExportSql()), EXPECTED_SQL_HASH);
});

test("la fachada, módulos y configuración impiden volver al monolito", () => {
  const facade = fs.readFileSync(facadePath, "utf8");
  assert.ok(facade.split("\n").length <= 80);
  assert.equal(moduleFiles.length, 12);
  for (const name of moduleFiles) {
    const source = fs.readFileSync(path.join(modulesDirectory, name), "utf8");
    assert.ok(source.split("\n").length <= 350, `${name} supera 350 líneas`);
    assert.doesNotMatch(source, /from\s+["'](?:@shared\/schema|\.\.\/schema)["']/);
  }

  const drizzleConfig = fs.readFileSync(path.join(root, "drizzle.config.ts"), "utf8");
  assert.match(drizzleConfig, /schema:\s*["']\.\/shared\/schema\/\*\*\/\*\.ts["']/);
  const serverDb = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
  assert.match(serverDb, /import \* as schema from ["']@shared\/schema["']/);
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(packageJson.devDependencies["drizzle-kit"], "0.31.10");
});
