import assert from "node:assert/strict";
import test from "node:test";
import { escapeCsvCell } from "./csv";

test("CSV export neutralizes spreadsheet formulas and quotes", () => {
  assert.equal(escapeCsvCell("=HYPERLINK(\"https://evil\")"), "\"'=HYPERLINK(\"\"https://evil\"\")\"");
  assert.equal(escapeCsvCell("+1+1"), "\"'+1+1\"");
  assert.equal(escapeCsvCell("-2+3"), "\"'-2+3\"");
  assert.equal(escapeCsvCell("@SUM(A1:A2)"), "\"'@SUM(A1:A2)\"");
  assert.equal(escapeCsvCell("normal\nvalue"), "\"normal value\"");
});
