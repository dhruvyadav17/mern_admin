const { successResponse } = require("../utils/response");
const auditService = require("../services/auditService");
const { csvRow } = require("../utils/csv");

const csv = (rows) => {
  const header = [
    "date",
    "actor",
    "action",
    "targetType",
    "targetId",
    "ip",
    "details",
  ];

  const data = rows.map((row) => [
    row.createdAt,
    row.actorId?.email || row.actorId?.name || "",
    row.action,
    row.targetType,
    row.targetId,
    row.ip,
    JSON.stringify(row.details || {}),
  ]);

  return [header, ...data].map(csvRow).join("\n");
};

const list = async (req, res) => {
  const result = await auditService.list(req.query);

  return successResponse(
    res,
    result.items,
    "Audit logs fetched successfully",
    200,
    {
      pagination: result.pagination,
    },
  );
};

const exportLogs = async (req, res) => {
  const result = await auditService.list({
    ...req.query,
    page: 1,
    limit: 10000,
    exportMode: true,
  });

  const format = String(req.query.format || "csv").toLowerCase();

  if (format === "json") {
    return res.json({
      success: true,
      data: result.items,
    });
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");

  res.setHeader("Content-Disposition", 'attachment; filename="audit-logs.csv"');

  return res.send(csv(result.items));
};

module.exports = {
  list,
  exportLogs,
};
