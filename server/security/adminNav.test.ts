import assert from "node:assert/strict";
import test from "node:test";
import { canSeeNavItem, type AdminNavItem } from "../../client/src/lib/adminNav";

const configItem = { requires: "config" } as AdminNavItem;

test("Dueño y Administrador conservan los módulos configurables aunque falte un payload heredado", () => {
  const missingPermissions = () => false;
  assert.equal(
    canSeeNavItem(configItem, {
      has: missingPermissions,
      isAdmin: true,
      isSuperAdmin: true,
    }),
    true,
  );
});

test("los roles no administrativos siguen respetando sus permisos explícitos", () => {
  assert.equal(
    canSeeNavItem(configItem, {
      has: () => false,
      isAdmin: false,
      isSuperAdmin: false,
    }),
    false,
  );
  assert.equal(
    canSeeNavItem(configItem, {
      has: (permission) => permission === "config",
      isAdmin: false,
      isSuperAdmin: false,
    }),
    true,
  );
});
