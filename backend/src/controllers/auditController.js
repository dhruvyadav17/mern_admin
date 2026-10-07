const { successResponse } = require("../utils/response");
const auditService = require("../services/auditService");
const AuditLog = require("../models/AuditLog");
const csv = (rows) => {
    const header = ["date", "actor", "action", "targetType", "targetId", "ip", "details"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [header, ...rows.map(x => [x.createdAt, x.actorId?.email || x.actorId?.name || "", x.action, x.targetType, x.targetId, x.ip, JSON.stringify(x.details || {})])].map(r => r.map(esc).join(",")).join("\n");
};
const list = async (req, res) => { const result = await auditService.list(req.query); return successResponse(res, result.items, "Audit logs fetched successfully", 200, { pagination: result.pagination }); };
const exportLogs = async (req, res) => { const result = await auditService.list({ ...req.query, page: 1, limit: 10000 }); const format = req.query.format || "csv"; if (format === "json") return res.json({ success: true, data: result.items }); res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv"); return res.send(csv(result.items)); };
module.exports = { list, exportLogs };
