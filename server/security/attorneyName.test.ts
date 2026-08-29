import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveAttorneyNameParts,
  getAttorneyFirstSurnameSortKey,
  getAttorneyFullName,
  getAttorneyPublicName,
  getAttorneySearchName,
} from "@shared/attorneyName";
import { comparePublicAttorneyDirectoryOrder, CURRENT_ASSOCIATE_ORDER } from "@shared/attorneyOrder";

test("el nombre público conserva nombres y primer apellido, sin perder el nombre legal", () => {
  const margarita = deriveAttorneyNameParts({ name: "Margarita Beatriz Luna Ramos" });
  assert.deepEqual(margarita, {
    givenNames: "Margarita Beatriz",
    firstSurname: "Luna",
    secondSurname: "Ramos",
  });
  assert.equal(getAttorneyPublicName(margarita), "Margarita Beatriz Luna");
  assert.equal(getAttorneyFullName(margarita), "Margarita Beatriz Luna Ramos");
  assert.match(getAttorneySearchName({ ...margarita, name: "Margarita Beatriz Luna Ramos" }), /Ramos/);

  const familyParticle = deriveAttorneyNameParts({ name: "Claus von Wobeser" });
  assert.deepEqual(familyParticle, {
    givenNames: "Claus",
    firstSurname: "von Wobeser",
    secondSurname: "",
  });
  assert.equal(getAttorneyPublicName(familyParticle), "Claus von Wobeser");
});

test("Edmond Grieger no muestra su segundo nombre en el directorio público", () => {
  const edmond = {
    name: "Edmond Frederic Grieger",
    givenNames: "Edmond",
    firstSurname: "Grieger",
    secondSurname: null,
  };
  assert.equal(getAttorneyPublicName(edmond), "Edmond Grieger");
  assert.match(getAttorneySearchName(edmond), /Edmond Frederic Grieger/);
});

test("Alejandro Ávila conserva la tilde en nombre público, Administración y orden canónico", () => {
  const alejandro = deriveAttorneyNameParts({ name: "Alejandro Avila" });
  assert.deepEqual(alejandro, {
    givenNames: "Alejandro",
    firstSurname: "Ávila",
    secondSurname: "",
  });
  assert.equal(getAttorneyPublicName(alejandro), "Alejandro Ávila");
  assert.ok(CURRENT_ASSOCIATE_ORDER.includes("Alejandro Ávila"));
});

test("Rubén Villegas conserva su tilde en el perfil, Administración y orden canónico", () => {
  const ruben = deriveAttorneyNameParts({ name: "Ruben Villegas" });
  assert.deepEqual(ruben, {
    givenNames: "Rubén",
    firstSurname: "Villegas",
    secondSurname: "",
  });
  assert.equal(getAttorneyPublicName(ruben), "Rubén Villegas");
  assert.ok(CURRENT_ASSOCIATE_ORDER.includes("Rubén Villegas"));
});

test("la corrección de Alejandro Ávila conserva identidad, slug y relaciones al reintentarse", async () => {
  const migration = (await import(new URL("../../migrations/20260829_0007_correct_alejandro_avila_accent.mjs", import.meta.url).href)).default;
  let member = {
    id: "alejandro-id",
    name: "Alejandro Avila",
    slug: "alejandro-avila",
    title: "Associate",
    given_names: null,
    first_surname: null,
    second_surname: null,
  };
  let updates = 0;
  const client = {
    query: async (sql: string, params: unknown[] = []) => {
      if (sql.includes("SELECT id, name, slug, title")) {
        assert.deepEqual(params, ["Associate", "Alejandro Avila", "Alejandro Ávila"]);
        return { rowCount: 1, rows: [{ ...member }] };
      }
      if (sql.includes("UPDATE team_members")) {
        updates += 1;
        assert.deepEqual(params, ["Alejandro Ávila", "Alejandro", "Ávila", "alejandro-id"]);
        member = {
          ...member,
          name: "Alejandro Ávila",
          given_names: "Alejandro",
          first_surname: "Ávila",
          second_surname: null,
        };
        return { rowCount: 1, rows: [{ ...member }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  await migration(client);
  await migration(client);

  assert.equal(updates, 1);
  assert.deepEqual(member, {
    id: "alejandro-id",
    name: "Alejandro Ávila",
    slug: "alejandro-avila",
    title: "Associate",
    given_names: "Alejandro",
    first_surname: "Ávila",
    second_surname: null,
  });
});

test("los Asociados conservan su secuencia aprobada por primer apellido", () => {
  const collator = new Intl.Collator("es", { sensitivity: "base", ignorePunctuation: true });
  const sortKeys = CURRENT_ASSOCIATE_ORDER.map((name) => getAttorneyFirstSurnameSortKey({ name }));
  assert.equal(sortKeys.every(Boolean), true);
  for (let index = 1; index < sortKeys.length; index += 1) {
    assert.ok(
      collator.compare(sortKeys[index - 1], sortKeys[index]) <= 0,
      `${CURRENT_ASSOCIATE_ORDER[index - 1]} must precede ${CURRENT_ASSOCIATE_ORDER[index]} by first surname`,
    );
  }
  assert.equal(getAttorneyFirstSurnameSortKey({ name: "Mercedes Jiménez Roel" }), "jimenez");
  assert.equal(getAttorneyFirstSurnameSortKey({ name: "Patricio Reyes Retana" }), "reyes");
  assert.equal(getAttorneyFirstSurnameSortKey({ name: "María Elisa Vera Madrigal" }), "vera");
});

test("los Consejeros públicos se ordenan alfabéticamente por primer apellido", () => {
  const counsel = [
    { id: "3", name: "María Elisa Vera Madrigal", title: "Counsel", order: 1 },
    { id: "2", name: "Pablo Saez Williams", title: "Counsel", order: 2 },
    { id: "1", name: "Ana Alpízar", title: "Counsel", order: 99 },
    { id: "4", name: "Andrea Ávila", title: "Counsel", order: 3 },
  ].sort(comparePublicAttorneyDirectoryOrder);

  assert.deepEqual(counsel.map((member) => member.name), [
    "Ana Alpízar",
    "Andrea Ávila",
    "Pablo Saez Williams",
    "María Elisa Vera Madrigal",
  ]);
  assert.ok(comparePublicAttorneyDirectoryOrder(
    { id: "partner-2", name: "Segundo Socio", title: "Partner", order: 2 },
    { id: "partner-1", name: "Primer Socio", title: "Partner", order: 1 },
  ) > 0);
});
