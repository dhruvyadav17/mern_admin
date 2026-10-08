const CSV_FORMULA_PREFIX = /^[=+\-@]/;

const sanitizeCsvCell = (value) => {
  const text = String(value ?? "");
  return CSV_FORMULA_PREFIX.test(text) ? `'${text}` : text;
};

const escapeCsvCell = (value) =>
  `"${sanitizeCsvCell(value).replace(/"/g, '""')}"`;

const csvRow = (values) => values.map(escapeCsvCell).join(",");

module.exports = {
  escapeCsvCell,
  csvRow,
};
