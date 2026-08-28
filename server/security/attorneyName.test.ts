import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveAttorneyNameParts,
  getAttorneyFirstSurnameSortKey,
  getAttorneyFullName,
  getAttorneyPublicName,
  getAttorneySearchName,
} from "@shared/attorneyName";
import { CURRENT_ASSOCIATE_ORDER } from "@shared/attorneyOrder";

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
