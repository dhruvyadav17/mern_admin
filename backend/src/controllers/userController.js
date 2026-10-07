const userService = require("../services/userService");
const { successResponse } = require("../utils/response");
const { log: audit, safeLog: safeAudit } = require("../services/auditService");
const User = require("../models/User");

const {
  assertPermission,
  guardAssignableRoles,
  normalizeRoles,
} = require("../utils/accessPolicy");

const notificationService = require("../services/notificationService");
const { NOTIFICATION_TYPES } = require("../constants/notificationTypes");

const getUsers = async (req, res) => {
  const result = await userService.getUsers(req.query);
  return successResponse(res, result.users, "Users fetched successfully", 200, {
    pagination: result.pagination,
  });
};
const createUser = async (req, res) => {
  const roles = normalizeRoles(req.body);
  await guardAssignableRoles(req, roles);
  if (req.body.status && req.body.status !== "active")
    assertPermission(
      req,
      "users.status",
      "You do not have permission to set user status",
    );
  const user = await userService.createUser({ ...req.body, roles });
  await audit(req, "user.create", "User", user.id, {
    email: user.email,
    roles: user.roles,
  });

  try {
    await notificationService.createNotification({
      recipient: user.id,
      type: NOTIFICATION_TYPES.USER_CREATED,
      title: "Welcome",
      message: "Your account has been created successfully.",
      link: "/profile",
    });
  } catch (notificationError) {
    console.error("Failed to create user notification:", notificationError);
  }

  return successResponse(res, user, "User created successfully", 201);
};
const getUserById = async (req, res) =>
  successResponse(
    res,
    await userService.getUserById(req.params.id),
    "User fetched successfully",
  );
const getUserActivity = async (req, res) =>
  successResponse(
    res,
    await userService.getUserActivity(req.params.id, req.query),
    "User activity fetched successfully",
  );
const updateUser = async (req, res) => {
  const roles = normalizeRoles(req.body);
  await guardAssignableRoles(req, roles);
  if (req.body.status !== undefined)
    assertPermission(
      req,
      "users.status",
      "You do not have permission to change user status",
    );
  const payload = {};
  for (const key of ["name", "email", "password", "status"]) {
    if (!Object.prototype.hasOwnProperty.call(req.body, key)) continue;
    if (
      key === "password" &&
      typeof req.body.password === "string" &&
      !req.body.password.trim()
    )
      continue;
    payload[key] = req.body[key];
  }
  if (roles !== undefined) payload.roles = roles;
  const user = await userService.updateUser(
    req.params.id,
    payload,
    req.user._id,
  );
  await safeAudit(req, "user.update", "User", user.id, {
    changes: Object.keys(payload),
  });
  return successResponse(res, user, "User updated successfully");
};
const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id, req.user._id);
  await audit(req, "user.delete", "User", req.params.id);
  return successResponse(res, null, "User deleted successfully");
};
const updateUserStatus = async (req, res) => {
  const user = await userService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user._id,
  );
  await audit(req, "user.status", "User", user.id, { status: req.body.status });
  return successResponse(res, user, `User ${req.body.status} successfully`);
};

const bulkStatusAction = async (req, res) => {
  const { userIds, action } = req.body;

  assertPermission(
    req,
    "users.status",
    "You do not have permission to change user status",
  );

  const result = await userService.bulkStatusAction(
    userIds,
    action,
    req.user.id,
  );

  await safeAudit(req, "user.bulk_status_action", "User", null, {
    action,
    userIds,
    affectedCount: result.affectedCount,
  });

  return successResponse(
    res,
    result,
    "Bulk status action completed successfully",
  );
};

const bulkDelete = async (req, res) => {
  const { userIds } = req.body;

  assertPermission(
    req,
    "users.delete",
    "You do not have permission to delete users",
  );

  const result = await userService.bulkDelete(userIds, req.user.id);

  await safeAudit(req, "user.bulk_delete", "User", null, {
    action: "delete",
    userIds,
    affectedCount: result.affectedCount,
  });

  return successResponse(res, result, "Bulk delete completed successfully");
};
const exportUsers = async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  const rows = [
    ["name", "email", "roles", "status", "createdAt"],
    ...users.map((u) => [
      u.name,
      u.email,
      (u.roles || []).join("|"),
      u.status,
      u.createdAt,
    ]),
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");
  return res.send(rows.map((r) => r.map(esc).join(",")).join("\n"));
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  getUserActivity,
  updateUser,
  deleteUser,
  updateUserStatus,
  exportUsers,
  bulkStatusAction,
  bulkDelete,
};
