import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalizedAttorneyRole,
  getLocalizedAttorneyTitle,
  normalizeSpanishPartnerFields,
} from "@shared/attorneyTitles";

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
