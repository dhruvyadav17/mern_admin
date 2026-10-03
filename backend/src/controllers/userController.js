const userService = require("../services/userService");
const { successResponse } = require("../utils/response");
const { log: audit } = require("../services/auditService");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const Role = require("../models/Role");
const assertPermission = (req, p, message) => {
  if (!req.permissions?.includes(p) && !req.permissions?.includes("*"))
    throw new AppError(message, 403);
};
const normalizeRoles = (body) => {
  if (Array.isArray(body.roles) && body.roles.length)
    return [
      ...new Set(
        body.roles.map((x) => String(x).trim().toLowerCase()).filter(Boolean),
      ),
    ];
  if (typeof body.role === "string" && body.role.trim())
    return [body.role.trim().toLowerCase()];
  return undefined;
};
const guardRoles = async (req, roles) => {
  if (!roles) return;
  assertPermission(
    req,
    "users.role.assign",
    "You do not have permission to assign roles",
  );
  const target = await Role.find({ name: { $in: roles } })
    .select("name isSystem")
    .lean();
  if (target.length !== roles.length)
    throw new AppError("One or more roles not found", 400);
  if (target.some((r) => r.isSystem && r.name !== "user"))
    assertPermission(
      req,
      "users.role.assign.system",
      "You do not have permission to assign protected system roles",
    );
};
const getUsers = async (req, res) => {
  const result = await userService.getUsers(req.query);
  return successResponse(res, result.users, "Users fetched successfully", 200, {
    pagination: result.pagination,
  });
};
const createUser = async (req, res) => {
  const roles = normalizeRoles(req.body);
  await guardRoles(req, roles);
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
//   console.log("req.body", req.body);
//   return successResponse(req.body, user, "User updated successfully");
  const roles = normalizeRoles(req.body);
  await guardRoles(req, roles);
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
  try {
    await audit(req, "user.update", "User", user.id, {
      changes: Object.keys(payload),
    });
  } catch (auditError) {
    console.error("Audit log failed after user update", auditError);
  }
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
const exportUsers = async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  const rows = [
    ["name", "email", "roles", "status", "createdAt"],
    ...users.map((u) => [
      u.name,
      u.email,
      (u.roles?.length ? u.roles : [u.role]).join("|"),
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
};
