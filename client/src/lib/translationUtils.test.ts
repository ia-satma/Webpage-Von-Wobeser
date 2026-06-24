import { describe, it, expect } from "vitest";
import { getDisplayValue } from "./translationUtils";

// getDisplayValue es el núcleo del bilingüe data-driven (lo usan 19 componentes).
// Estos tests fijan su contrato: es→prefiere `${field}Es`, en→prefiere `field`,
// ambos con fallback al otro, ignorando cadenas vacías. Regresión aquí = el bug
// histórico de "mostrar inglés donde debe ir español".
describe("getDisplayValue", () => {
  const obj = { name: "Real Estate", nameEs: "Inmobiliario" };

  it("es prefiere el campo en español", () => {
    expect(getDisplayValue(obj, "name", "es")).toBe("Inmobiliario");
  });

  it("en prefiere el campo base (inglés)", () => {
    expect(getDisplayValue(obj, "name", "en")).toBe("Real Estate");
  });

  it("es cae al base cuando falta la variante Es", () => {
    expect(getDisplayValue({ name: "Tax" }, "name", "es")).toBe("Tax");
  });

  it("en cae a Es cuando falta el base", () => {
    expect(getDisplayValue({ nameEs: "Fiscal" }, "name", "en")).toBe("Fiscal");
  });

  it("ignora cadenas en blanco y usa la siguiente no vacía", () => {
    expect(getDisplayValue({ name: "   ", nameEs: "Fiscal" }, "name", "en")).toBe(
      "Fiscal",
    );
  });

  it("devuelve undefined si ambos campos están vacíos", () => {
    expect(getDisplayValue({ name: "", nameEs: "" }, "name", "es")).toBeUndefined();
  });

  it("devuelve undefined si el objeto es null/undefined", () => {
    expect(getDisplayValue(null, "name", "es")).toBeUndefined();
    expect(getDisplayValue(undefined, "name", "en")).toBeUndefined();
  });
});
