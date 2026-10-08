const test = require("node:test");
const assert = require("node:assert/strict");
const { csvRow, escapeCsvCell } = require("../src/utils/csv");

test("CSV cells escape quotes and neutralize spreadsheet formulas", () => {
  assert.equal(escapeCsvCell('O"Reilly'), '"O""Reilly"');
  assert.equal(escapeCsvCell("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
  assert.equal(escapeCsvCell("+123"), '"\'+123"');
  assert.equal(escapeCsvCell("-123"), '"\'-123"');
  assert.equal(escapeCsvCell("@cmd"), '"\'@cmd"');
});

test("csvRow keeps every value quoted", () => {
  assert.equal(csvRow(["name", "a,b", "normal"]), '"name","a,b","normal"');
});
