import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import { OFFICIAL_PARTNER_ORDER } from "@shared/attorneyOrder";
import { loadCanonicalAttorneyContent } from "../content/canonicalAttorneys";
import { renderSingle } from "../mirror/renderSingle";

const root = process.cwd();
const template = fs.readFileSync(
  path.join(root, "frontend-mirror", "index.php", "industry", "p-16.html"),
  "utf8",
);
const runtime = fs.readFileSync(path.join(root, "server", "mirror", "runtime.ts"), "utf8");
const teamRoutes = fs.readFileSync(path.join(root, "server", "routes", "adminTeamRoutes.ts"), "utf8");
const capabilities = fs.readFileSync(
  path.join(root, "client", "src", "features", "admin", "team-form", "CapabilitiesTab.tsx"),
  "utf8",
);

const group = {
  slug: "automotive-mobility-manufacturing",
  name: "Automotive, Mobility & Manufacturing",
  nameEs: "Automotriz, Movilidad y Manufactura",
  description: "<p>Introduction</p>",
  descriptionEs: "<p>Introducción</p>",
  fullDescription: "<p>Body</p>",
  fullDescriptionEs: "<p>Cuerpo</p>",
};

const mixedRoster = [
  { id: "associate", name: "Associate Example", slug: "associate-example", title: "Associate", order: 1 },
  { id: "of-counsel", name: "Of Counsel Example", slug: "of-counsel-example", title: "Of Counsel", order: 1 },
  { id: "partner-later", name: "Partner Later", slug: "partner-later", title: "Partner", order: 20 },
  { id: "counsel", name: "Counsel Example", slug: "counsel-example", title: "Counsel", order: 1 },
  { id: "partner-first", name: "Partner First", slug: "partner-first", title: "Partner", order: 2 },
];

test("la ficha pública de Industria muestra sólo Socios en su orden editorial", () => {
  const $ = cheerio.load(renderSingle(template, group, mixedRoster, "industry", "es"));
  const roster = $(".single__meta--list");

  assert.deepEqual(
    roster.find('a[href^="/lawyer/"]').map((_, link) => $(link).text().trim()).get(),
    ["Partner First", "Partner Later"],
  );
  assert.equal(roster.find(".accordion").length, 1);
  assert.match(roster.text(), /Socios en el grupo/);
  assert.doesNotMatch(roster.text(), /Associate Example|Of Counsel Example|Counsel Example/);
});

test("una Industria sin Socios publicados no muestra un acordeón vacío", () => {
  const $ = cheerio.load(renderSingle(template, group, mixedRoster.filter((member) => member.title !== "Partner"), "industry", "en"));
  assert.equal($(".single__meta--list").children().length, 0);
});

test("las siete Industrias canónicas excluyen cualquier perfil que no sea Socio", () => {
  const partnerOrder = new Map(OFFICIAL_PARTNER_ORDER.map((name, index) => [name, index + 1]));
  const attorneys = loadCanonicalAttorneyContent().map((attorney) => ({
    ...attorney,
    id: attorney.slug,
    order: partnerOrder.get(attorney.name) ?? 9999,
  }));
  const industries = [...new Set(attorneys.flatMap((attorney) => attorney.industryNames))];

  assert.equal(industries.length, 7);
  for (const industry of industries) {
    const related = attorneys.filter((attorney) => attorney.industryNames.includes(industry));
    const expectedPartners = related
      .filter((attorney) => attorney.title === "Partner")
      .sort((left, right) => left.order - right.order)
      .map((attorney) => `/lawyer/${attorney.slug}?lang=en`);
    const $ = cheerio.load(renderSingle(template, group, related, "industry", "en"));
    const actual = $(".single__meta--list a").map((_, link) => $(link).attr("href")).get();

    assert.deepEqual(actual, expectedPartners, industry);
    assert.equal($(".single__meta--list .accordion").length, expectedPartners.length ? 1 : 0, industry);
  }
});

test("la consulta pública de Industria filtra Socios y mantiene un orden determinista", () => {
  const industryQuery = runtime.match(/async function getAttorneysByIndustry[\s\S]*?\n}\n/)?.[0] || "";
  assert.match(industryQuery, /eq\(teamMembers\.title, "Partner"\)/);
  assert.match(industryQuery, /eq\(teamMembers\.published, true\)/);
  assert.match(industryQuery, /orderBy\(asc\(teamMembers\.order\), asc\(teamMembers\.id\)\)/);
});

test("Administración conserva las relaciones internas de Industria para cualquier perfil", () => {
  assert.match(teamRoutes, /if \(Array\.isArray\(req\.body\.industryGroupIds\)\)[\s\S]*?storage\.setTeamMemberIndustryGroups\(member\.id, industryGroupIds!\)/);
  assert.match(capabilities, /data-testid="industry-public-roster-note"/);
  assert.match(capabilities, /páginas públicas de Industria muestran únicamente Socios/);
});
