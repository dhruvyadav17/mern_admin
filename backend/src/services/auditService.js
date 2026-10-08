const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");
const AppError = require("../utils/AppError");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
  );

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid date: ${value}`, 400);
  }

  return date;
};

const log = async (req, action, targetType, targetId = null, details = {}) => {
  return AuditLog.create({
    actorId: req?.user?._id || req?.user?.id || null,
    action,
    targetType,
    targetId: targetId ? String(targetId) : undefined,
    details,
    ip: req?.ip,
    userAgent: req?.get?.("user-agent"),
  });
};

const safeLog = async (...args) => {
  try {
    return await log(...args);
  } catch (error) {
    console.error("Audit log failed:", error);
    return null;
  }
};

const list = async ({
  page = 1,
  limit = 25,
  search = "",
  action = "",
  actorId = "",
  targetType = "",
  targetId = "",
  from = "",
  to = "",
  exportMode = false,
}) => {
  page = Math.max(1, Number(page) || 1);
  const maxLimit = exportMode ? 10000 : 100;
  limit = Math.min(maxLimit, Math.max(1, Number(limit) || 25));

  search = String(search || "").trim();
  action = String(action || "").trim();
  actorId = String(actorId || "").trim();
  targetType = String(targetType || "").trim();
  targetId = String(targetId || "").trim();

  const filter = {};

  if (action) {
    filter.action = action;
  }

  if (actorId) {
    if (!mongoose.Types.ObjectId.isValid(actorId)) {
      throw new AppError("Invalid actor ID", 400);
    }

    filter.actorId = actorId;
  }

  if (targetType) {
    filter.targetType = targetType;
  }

  if (targetId) {
    filter.targetId = {
      $regex: escapeRegex(targetId),
      $options: "i",
    };
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to, true);

  if (fromDate || toDate) {
    filter.createdAt = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  if (search) {
    const regex = {
      $regex: escapeRegex(search),
      $options: "i",
    };

    filter.$or = [
      { action: regex },
      { targetType: regex },
      { targetId: regex },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("actorId", "name email")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    AuditLog.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

module.exports = {
  list,
  log,
  safeLog,
};
