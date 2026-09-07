import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as cheerio from "cheerio";
import partnerSince2026 from "../content/partnerSince2026.json";
import { getPartnerSinceLabel } from "@shared/partnerSince";
import { teamMemberFormSchema } from "../../client/src/features/admin/team-form/contracts";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderAttorneyList } = await import("../mirror/renderAttorneyList");
const migrationModule = await import("../../migrations/20260907_0003_backfill_partner_since_years.mjs");
const { default: backfillPartnerSinceYears } = migrationModule;

const template = `<!doctype html><html><head></head><body><main>
  <div class="attorneys__meta"></div><div class="attorneys__list"></div>
</main></body></html>`;

function createMigrationClient(years: Record<string, number | null> = {}) {
  const records = partnerSince2026.entries.map((entry, index) => ({
    id: `partner-${index + 1}`,
    slug: entry.slug,
    name: entry.expectedName,
    title: entry.expectedTitle,
    is_partner: true,
    partner_since_year: years[entry.slug] ?? null,
  }));
  let updates = 0;

  return {
    records,
    updateCount: () => updates,
    client: {
      query: async (statement: string, values: unknown[] = []) => {
        if (statement.includes("SELECT id, slug, name, title, is_partner, partner_since_year") && statement.includes("FOR UPDATE")) {
          return { rowCount: records.length, rows: records };
        }
        if (statement.includes("UPDATE team_members")) {
          const [year, id, slug, expectedName] = values as [number, string, string, string];
          const record = records.find((entry) => entry.id === id);
          assert.ok(record);
          assert.equal(record.slug, slug);
          assert.equal(record.name, expectedName);
          assert.equal(record.title, "Partner");
          assert.equal(record.is_partner, true);
          assert.equal(record.partner_since_year, null);
          record.partner_since_year = year;
          updates += 1;
          return { rowCount: 1, rows: [{ ...record }] };
        }
        throw new Error(`Unexpected query: ${statement}`);
      },
    },
  };
}

test("el inventario aprobado contiene exactamente los 26 Socios y sus años de sociedad", async () => {
  assert.equal(partnerSince2026.entries.length, 26);
  assert.equal(new Set(partnerSince2026.entries.map((entry) => entry.slug)).size, 26);
  assert.ok(partnerSince2026.entries.every((entry) => entry.expectedTitle === "Partner" && Number.isInteger(entry.year)));

  const { canonicalTeamMembersData } = await import("../seed");
  for (const entry of partnerSince2026.entries) {
    const member = canonicalTeamMembersData.find((candidate) => candidate.slug === entry.slug);
    assert.ok(member, `missing canonical Partner ${entry.slug}`);
    assert.equal(member.name, entry.expectedName);
    assert.equal(member.title, "Partner");
    assert.equal(member.partnerSinceYear, entry.year);
    assert.equal(member.showPartnerSince, true);
  }
});

test("la migración inicializa sólo los años pendientes, es idempotente y no cambia visibilidad", async () => {
  const { client, records, updateCount } = createMigrationClient();
  await backfillPartnerSinceYears(client);
  assert.equal(updateCount(), 26);
  assert.deepEqual(
    records.map((record) => [record.slug, record.partner_since_year]),
    partnerSince2026.entries.map((entry) => [entry.slug, entry.year]),
  );

  await backfillPartnerSinceYears(client);
  assert.equal(updateCount(), 26);
});

test("la migración se detiene ante un año editado desde Administración", async () => {
  const protectedEntry = partnerSince2026.entries[0];
  const { client, updateCount } = createMigrationClient({ [protectedEntry.slug]: 1999 });
  await assert.rejects(
    () => backfillPartnerSinceYears(client),
    /was changed in Administration; refusing to overwrite/i,
  );
  assert.equal(updateCount(), 0);
});

test("la ficha y las tarjetas móviles de Socios localizan la antigüedad sin extenderla a otros cargos", () => {
  const attorneys = [
    { slug: "maria-socia", name: "María Socia", title: "Partner", titleEs: "Socia", isPartner: true, partnerSinceYear: 2022, showPartnerSince: true, imageUrl: "/maria.png" },
    { slug: "luis-socio", name: "Luis Socio", title: "Partner", titleEs: "Socio", isPartner: true, partnerSinceYear: 2020, showPartnerSince: true, imageUrl: "/luis.png" },
    { slug: "oculto", name: "Socio Oculto", title: "Partner", titleEs: "Socio", isPartner: true, partnerSinceYear: 2019, showPartnerSince: false, imageUrl: "/oculto.png" },
    { slug: "asociado", name: "Asociado", title: "Associate", titleEs: "Asociado", isPartner: false, partnerSinceYear: 2018, showPartnerSince: true, imageUrl: "/asociado.png" },
  ];

  const spanish = cheerio.load(renderAttorneyList(template, attorneys, "partners", "es"));
  const english = cheerio.load(renderAttorneyList(template, attorneys, "partners", "en"));

  assert.equal(spanish(".attorneys__meta--item").eq(0).find(".attorneys__partner-since").text(), "Socia desde 2022");
  assert.equal(spanish(".attorneys__meta--item").eq(1).find(".attorneys__partner-since").text(), "Socio desde 2020");
  assert.equal(spanish(".attorneys__meta--item").eq(2).find(".attorneys__partner-since").length, 0);
  assert.equal(spanish(".attorneys__meta--item").eq(3).find(".attorneys__partner-since").length, 0);
  assert.equal(english(".attorneys__meta--item").eq(0).find(".attorneys__partner-since").text(), "Partner since 2022");
  assert.equal(spanish(".attorneys__list--item").eq(0).find(".attorneys__partner-since").text(), "Socia desde 2022");
  assert.equal(spanish(".attorneys__list--item").eq(1).find(".attorneys__partner-since").text(), "Socio desde 2020");
  assert.equal(english(".attorneys__list--item").eq(0).find(".attorneys__partner-since").text(), "Partner since 2022");
  assert.equal(spanish(".attorneys__list--item").eq(2).find(".attorneys__partner-since").length, 0);
  assert.equal(spanish(".attorneys__list--item").eq(3).find(".attorneys__partner-since").length, 0);
});

test("la validación administrativa acepta un año entero, lo puede ocultar y rechaza valores inválidos", () => {
  const base = {
    name: "María Socia",
    givenNames: "María",
    firstSurname: "Socia",
    slug: "maria-socia",
    title: "Partner",
    titleEs: "Socia",
    role: "Partner",
    roleEs: "Socia",
  };
  const accepted = teamMemberFormSchema.parse({ ...base, partnerSinceYear: "2022", showPartnerSince: false });
  assert.equal(accepted.partnerSinceYear, 2022);
  assert.equal(accepted.showPartnerSince, false);
  assert.equal(teamMemberFormSchema.parse({ ...base, partnerSinceYear: "" }).partnerSinceYear, null);
  assert.equal(teamMemberFormSchema.safeParse({ ...base, partnerSinceYear: "1889" }).success, false);
  assert.equal(teamMemberFormSchema.safeParse({ ...base, partnerSinceYear: "2022.5" }).success, false);
});

test("el panel y la hoja de estilos exponen controles y estilo propios para la antigüedad", async () => {
  const [settings, styles, runner] = await Promise.all([
    readFile(new URL("../../client/src/features/admin/team-form/SettingsTab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../frontend-mirror/templates/beez3/css/vwb-stability.css", import.meta.url), "utf8"),
    readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(settings, /input-partner-since-year/);
  assert.match(settings, /switch-show-partner-since/);
  assert.match(styles, /\.attorneys__meta--item \.attorneys__partner-since/);
  assert.match(styles, /\.attorneys__list--item \.attorneys__partner-since/);
  assert.match(runner, /20260907_0003_backfill_partner_since_years\.mjs/);
  assert.equal(getPartnerSinceLabel({ title: "Partner", titleEs: "Socia", partnerSinceYear: 2022, showPartnerSince: true }, "es"), "Socia desde 2022");
});
