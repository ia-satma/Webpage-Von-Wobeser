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

const EXPECTED_SOURCE_EXPORT_HASH = "655057b215e7be2fd34e3fe3685651ffe37fb5fd92ce80dc2b4b98ff9c55c1ec";
const EXPECTED_TYPE_DECLARATION_HASH = "7784a4ff4c5dfdffc461c4d466508e1eff041c85edabbbe253d3402faaf7ca0f";
const EXPECTED_RUNTIME_EXPORT_HASH = "a56116019fd7daa2a0e69e90f3e782fe36c48222e1728fca204eb3c8e31402c1";
const EXPECTED_ZOD_HASH = "f34d93fba568e789cdc22c4a4920e7ae3fdacd18d5ce0877296711c1a046eb04";
// Actualizado junto con la etiqueta editorial de la categoría técnica
// `rankings`: el panel ahora muestra Reconocimientos / Recognitions.
const EXPECTED_CATALOG_HASH = "6f4013314edcd478e9df0634763988e86da489cf4501e6bc7bb006973e626793";
const EXPECTED_SQL_HASH = "48b183e0d563c5787637ecebe2daec280cb886791b191cc33d7a8acae2f3b5d2";

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
  assert.equal(sourceExports.length, 251);
  assert.equal(sourceExports.filter(([kind]) => kind === "value").length, 126);
  assert.equal(sourceExports.filter(([kind]) => kind === "type").length, 111);
  assert.equal(sourceExports.filter(([kind]) => kind === "interface").length, 14);
  assert.equal(sha256(sourceExports), EXPECTED_SOURCE_EXPORT_HASH);

  const typeDeclarations = collectTypeDeclarations();
  assert.equal(typeDeclarations.length, 125);
  assert.equal(sha256(typeDeclarations), EXPECTED_TYPE_DECLARATION_HASH);

  const runtimeExports = Object.keys(schema).sort();
  assert.equal(runtimeExports.length, 126);
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
  assert.equal(tables.reduce((total, table) => total + table.columns.length, 0), 707);
  assert.equal(tables.reduce((total, table) => total + table.indexes.length, 0), 37);
  assert.equal(tables.reduce((total, table) => total + table.foreignKeys.length, 0), 11);

  const zodSchemas = normalizeExportedZod();
  assert.equal(Object.keys(zodSchemas).length, 51);
  assert.equal(sha256(zodSchemas), EXPECTED_ZOD_HASH);

  const catalogs = normalizeCatalogs();
  assert.equal(Object.keys(catalogs).length, 13);
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
