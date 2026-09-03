import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_NAV_GROUPS, canSeeNavItem, type AdminNavItem } from "../../client/src/lib/adminNav";

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

test("la navegación administra el panel por tipo de trabajo y no sólo por rutas", () => {
  const expectedGroups = [
    ["contenido", "editorial"],
    ["complementario", "editorial"],
    ["registros", "inbox"],
    ["configuracion", "settings"],
    ["avanzado", "technical"],
  ] as const;

  for (const [id, tone] of expectedGroups) {
    const group = ADMIN_NAV_GROUPS.find((candidate) => candidate.id === id);
    assert.ok(group, `debe existir el grupo ${id}`);
    assert.equal(group.tone, tone);
    assert.ok(group.description?.trim(), `${id} debe explicar su propósito`);
  }

  assert.equal(ADMIN_NAV_GROUPS.find((group) => group.id === "avanzado")?.technical, true);
});
