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
}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 25));

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
};
