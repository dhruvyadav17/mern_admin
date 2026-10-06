const AuditLog = require("../models/AuditLog");
const log = async (req, action, targetType, targetId, details = {}) => AuditLog.create({ actorId: req.user?._id || req.user?.id, action, targetType, targetId: targetId?.toString(), details, ip: req.ip, userAgent: typeof req.get === "function" ? req.get("user-agent") : undefined });
const safeLog = async (req, action, targetType, targetId, details = {}) => {
    try {
        return await log(req, action, targetType, targetId, details);
    } catch (error) {
        console.error("Audit log failed", {
            action,
            targetType,
            targetId: targetId?.toString?.(),
            error: error?.message
        });
        return null;
    }
};
const list = async ({ page = 1, limit = 25, search = "", action = "", actorId = "", from = "", to = "" }) => {
    page = Math.max(1, Number(page) || 1); limit = Math.min(100, Math.max(1, Number(limit) || 25));
    const filter = {};
    if (action) filter.action = action;
    if (actorId) filter.actorId = actorId;
    if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(`${to}T23:59:59.999Z`) } : {}) };
    if (search) filter.$or = [{ action: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }, { targetId: search }];
    const [items, total] = await Promise.all([
        AuditLog.find(filter).populate("actorId", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        AuditLog.countDocuments(filter)
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};
module.exports = { log, safeLog, list };

