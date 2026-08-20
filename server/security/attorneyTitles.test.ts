import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalizedAttorneyRole,
  getLocalizedAttorneyTitle,
  normalizeSpanishPartnerFields,
} from "@shared/attorneyTitles";
import { loadCanonicalAttorneyContent } from "../content/canonicalAttorneys";

test("un Socio histórico muestra Partner solo en inglés", () => {
  const attorney = {
    title: "Partner",
    titleEs: "Partner",
    role: "Partner",
    roleEs: "Partner",
    isPartner: true,
  };

  assert.equal(getLocalizedAttorneyTitle(attorney, "es"), "Socio");
  assert.equal(getLocalizedAttorneyRole(attorney, "es"), "Socio");
  assert.equal(getLocalizedAttorneyTitle(attorney, "en"), "Partner");
});

test("la normalización conserva Socia y no altera Of Counsel", () => {
  const socia = normalizeSpanishPartnerFields({
    title: "Partner",
    titleEs: "Socia",
    role: "Partner",
    roleEs: "Socia",
    isPartner: true,
  });
  assert.equal(socia.titleEs, "Socia");
  assert.equal(socia.roleEs, "Socia");

  const counsel = normalizeSpanishPartnerFields({
    title: "Of Counsel",
    titleEs: "Of Counsel",
    role: "Of Counsel",
    roleEs: "Of Counsel",
    isPartner: false,
  });
  assert.equal(getLocalizedAttorneyTitle(counsel, "es"), "Of Counsel");
});

test("el directorio canónico conserva títulos femeninos revisados sin alterar los masculinos", () => {
  const byName = new Map(loadCanonicalAttorneyContent().map((attorney) => [attorney.name, attorney]));

  for (const [name, title] of [
    ["Patricia Kaim", "Socia"],
    ["Montserrat Manzano", "Socia"],
    ["Alejandra Arizpe", "Asociada"],
    ["Sofía Alcántara", "Asociada"],
  ] as const) {
    const attorney = byName.get(name);
    assert.equal(attorney?.titleEs, title, `${name} must use the approved Spanish title`);
    assert.equal(getLocalizedAttorneyTitle(attorney || {}, "es"), title);
  }

  assert.equal(byName.get("Luis Burgueño")?.titleEs, "Socio");
  assert.equal(
    loadCanonicalAttorneyContent().find((attorney) => attorney.slug === "alejandro-torres-333")?.titleEs,
    "Asociado",
  );
});
