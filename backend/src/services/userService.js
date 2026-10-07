const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Role = require("../models/Role");
const AppError = require("../utils/AppError");
const { USER_ROLES, USER_STATUS } = require("../constants/userConstants");
const { hashPassword } = require("../utils/password");
const { toUserResponse, toUserListResponse } = require("../utils/userMapper");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const { log: audit } = require("./auditService");
const settingsService = require("./settingsService");

const ADMIN_LOCK_ID = "active-admin-mutation";
const ADMIN_LOCK_TTL_MS = 30_000;

const validateUserId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", 400);
  }
};

const withActiveAdminLock = async (operation) => {
  const locks = User.db.collection("system_locks");
  const owner = crypto.randomUUID();
  let acquired = false;

  for (let attempt = 0; attempt < 5 && !acquired; attempt += 1) {
    const attemptNow = new Date();
    const attemptLockedUntil = new Date(
      attemptNow.getTime() + ADMIN_LOCK_TTL_MS,
    );

    try {
      const result = await locks.findOneAndUpdate(
        {
          _id: ADMIN_LOCK_ID,
          $or: [
            { lockedUntil: { $lte: attemptNow } },
            { lockedUntil: { $exists: false } },
          ],
        },
        {
          $set: { owner, lockedUntil: attemptLockedUntil },
        },
        {
          upsert: true,
          returnDocument: "after",
          includeResultMetadata: false,
        },
      );

      // MongoDB driver versions differ in whether findOneAndUpdate
      // returns the document directly or wraps it in `value`.
      const lockedDocument = result?.value ?? result;
      acquired = Boolean(lockedDocument?.owner === owner);
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }

    if (!acquired) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  if (!acquired) {
    throw new AppError("Admin operation is busy. Please try again.", 409);
  }

  try {
    return await operation();
  } finally {
    await locks.deleteOne({ _id: ADMIN_LOCK_ID, owner });
  }
};

const ensureActiveAdminWillRemain = async (excludeUserId) => {
  const activeAdminCount = await User.countDocuments({
    roles: USER_ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
  });

  if (activeAdminCount === 0) {
    throw new AppError("At least one active admin is required", 400);
  }
};

const getUsers = async ({ page = 1, limit = 10, search = "" }) => {
  const pagination = getPagination(page, limit);
  const trimmedSearch = String(search || "").trim();
  const filter = {};

  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    User.countDocuments(filter),
  ]);

  return {
    users: toUserListResponse(users),
    pagination: getPaginationMeta(total, pagination.page, pagination.limit),
  };
};

const createUser = async ({
  name,
  email,
  password,
  role = USER_ROLES.USER,
  roles = undefined,
  status = USER_STATUS.ACTIVE,
}) => {
  const normalizedEmail = email.toLowerCase();

  const roleList = [
    ...new Set(
      (roles?.length ? roles : [role || USER_ROLES.USER]).map((r) =>
        String(r).toLowerCase(),
      ),
    ),
  ];
  const foundRoles = await Role.find({ name: { $in: roleList } })
    .select("name")
    .lean();
  if (foundRoles.length !== roleList.length)
    throw new AppError("One or more roles not found", 400);

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  try {
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await hashPassword(password),
      roles: roleList,
      status,
      emailVerifiedAt: new Date(),
    });

    return toUserResponse(user);
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("Email already registered", 409);
    }
    throw error;
  }
};

const getUserById = async (id) => {
  validateUserId(id);

  const user = await User.findById(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toUserResponse(user);
};

const normalizeUserUpdateData = (data = {}) => {
  const allowed = new Set([
    "name",
    "email",
    "password",
    "role",
    "roles",
    "status",
  ]);
  const normalized = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      normalized[key] = data[key];
    }
  }

  if (typeof normalized.name === "string")
    normalized.name = normalized.name.trim();
  if (typeof normalized.email === "string")
    normalized.email = normalized.email.trim().toLowerCase();
  if (typeof normalized.password === "string") {
    normalized.password = normalized.password.trim();
    if (!normalized.password) delete normalized.password;
  }
  if (typeof normalized.role === "string")
    normalized.role = normalized.role.trim().toLowerCase();
  if (typeof normalized.status === "string")
    normalized.status = normalized.status.trim().toLowerCase();

  if (Array.isArray(normalized.roles)) {
    normalized.roles = [
      ...new Set(
        normalized.roles
          .map((role) => String(role).trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }

  // `roles` is the canonical multi-role field. If it is supplied, ignore
  // the legacy single `role` value so the two fields cannot disagree.
  if (normalized.roles !== undefined) delete normalized.role;

  return normalized;
};

const updateUser = async (id, data, currentUserId) => {
  validateUserId(id);

  const normalizedData = normalizeUserUpdateData(data);

  const mutation = async () => {
    const user = await User.findById(id);

    if (!user) throw new AppError("User not found", 404);

    const actorId = currentUserId?.toString?.();
    const isSelf = Boolean(actorId && user._id.toString() === actorId);
    const currentRoles = Array.isArray(user.roles) ? user.roles : [];

    const nextRoles =
      normalizedData.roles !== undefined
        ? normalizedData.roles
        : normalizedData.role !== undefined
          ? [normalizedData.role]
          : currentRoles;
    const isActiveAdmin =
      currentRoles.includes(USER_ROLES.ADMIN) &&
      user.status === USER_STATUS.ACTIVE;

    if (
      isSelf &&
      (normalizedData.role !== undefined ||
        normalizedData.roles !== undefined ||
        normalizedData.status !== undefined)
    ) {
      throw new AppError("You cannot change your own role or status", 400);
    }

    if (normalizedData.roles !== undefined) {
      if (!normalizedData.roles.length) {
        throw new AppError("At least one role is required", 400);
      }
      const foundRoles = await Role.find({
        name: { $in: normalizedData.roles },
      })
        .select("name")
        .lean();
      if (foundRoles.length !== normalizedData.roles.length) {
        throw new AppError("One or more roles not found", 400);
      }
    } else if (normalizedData.role !== undefined) {
      if (!(await Role.exists({ name: normalizedData.role }))) {
        throw new AppError("Role not found", 400);
      }
    }

    const emailChanged =
      normalizedData.email !== undefined && normalizedData.email !== user.email;
    if (emailChanged) {
      const existingUser = await User.findOne({
        email: normalizedData.email,
        _id: { $ne: user._id },
      })
        .select("_id")
        .lean();

      if (existingUser) throw new AppError("Email already registered", 409);
      user.email = normalizedData.email;
      const verificationRequired = await settingsService.getValue(
        "registration.email_verification",
        false,
      );
      user.emailVerifiedAt = verificationRequired ? null : new Date();
    }

    if (normalizedData.name !== undefined) user.name = normalizedData.name;

    if (
      isActiveAdmin &&
      normalizedData.roles !== undefined &&
      !normalizedData.roles.includes(USER_ROLES.ADMIN)
    ) {
      await ensureActiveAdminWillRemain(user._id);
    }

    if (isActiveAdmin && normalizedData.status === USER_STATUS.INACTIVE) {
      await ensureActiveAdminWillRemain(user._id);
    }

    const previousRoles = Array.isArray(user.roles) ? user.roles : [];
    const rolesChanged =
      JSON.stringify(previousRoles) !== JSON.stringify(nextRoles);
    const roleChanged =
      normalizedData.role !== undefined && normalizedData.roles === undefined;
    const statusChanged =
      normalizedData.status !== undefined &&
      normalizedData.status !== user.status;
    const passwordChanged = Boolean(normalizedData.password);
    const securityChange =
      passwordChanged ||
      rolesChanged ||
      roleChanged ||
      statusChanged ||
      emailChanged;

    if (normalizedData.roles !== undefined) {
      user.roles = normalizedData.roles;
    } else if (normalizedData.role !== undefined) {
      user.roles = [normalizedData.role];
    }

    if (normalizedData.status !== undefined)
      user.status = normalizedData.status;

    if (passwordChanged)
      user.password = await hashPassword(normalizedData.password);
    if (securityChange) user.authVersion = (user.authVersion || 0) + 1;

    try {
      await user.save();
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError("Email already registered", 409);
      throw error;
    }

    const response = toUserResponse(user);
    return response;
  };

  return withActiveAdminLock(mutation);
};

const deleteUser = async (id, currentUserId) => {
  validateUserId(id);

  const mutation = async () => {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user._id.toString() === currentUserId.toString()) {
      throw new AppError("You cannot delete your own account", 400);
    }

    if (
      user.roles?.includes(USER_ROLES.ADMIN) &&
      user.status === USER_STATUS.ACTIVE
    ) {
      await ensureActiveAdminWillRemain(user._id);
    }

    await user.deleteOne();
  };

  return withActiveAdminLock(mutation);
};

const updateUserStatus = async (id, status, currentUserId) => {
  validateUserId(id);

  const mutation = async () => {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user._id.toString() === currentUserId.toString()) {
      throw new AppError("You cannot change your own status", 400);
    }

    if (
      user.roles?.includes(USER_ROLES.ADMIN) &&
      user.status === USER_STATUS.ACTIVE &&
      status === USER_STATUS.INACTIVE
    ) {
      await ensureActiveAdminWillRemain(user._id);
    }

    user.status = status;
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();

    return toUserResponse(user);
  };

  return withActiveAdminLock(mutation);
};

const bulkAction = async (userIds, action, currentUserId) => {
  if (!Array.isArray(userIds) || !userIds.length) {
    throw new AppError("At least one user must be selected", 400);
  }

  const allowedActions = ["activate", "deactivate", "suspend", "delete"];

  if (!allowedActions.includes(action)) {
    throw new AppError("Invalid bulk action", 400);
  }

  const uniqueIds = [...new Set(userIds.map(String))];

  uniqueIds.forEach(validateUserId);

  const currentId = currentUserId.toString();

  if (uniqueIds.includes(currentId)) {
    throw new AppError(
      "You cannot perform a bulk action on your own account",
      400,
    );
  }

  const mutation = async () => {
    const users = await User.find({
      _id: { $in: uniqueIds },
    });

    if (users.length !== uniqueIds.length) {
      throw new AppError("One or more selected users were not found", 404);
    }

    const selectedActiveAdmins = users.filter(
      (user) =>
        user.roles?.includes(USER_ROLES.ADMIN) &&
        user.status === USER_STATUS.ACTIVE,
    );

    if (
      selectedActiveAdmins.length > 0 &&
      ["deactivate", "delete"].includes(action)
    ) {
      const remainingActiveAdmins = await User.countDocuments({
        roles: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        _id: { $nin: uniqueIds },
      });

      if (remainingActiveAdmins === 0) {
        throw new AppError("At least one active admin is required", 400);
      }
    }

    if (action === "delete") {
      await User.deleteMany({
        _id: { $in: uniqueIds },
      });

      return {
        affectedCount: users.length,
        action,
      };
    }

    const statusMap = {
      activate: USER_STATUS.ACTIVE,
      deactivate: USER_STATUS.INACTIVE,
      suspend: USER_STATUS.SUSPENDED,
    };

    const status = statusMap[action];

    const result = await User.updateMany(
      {
        _id: { $in: uniqueIds },
      },
      {
        $set: { status },
        $inc: { authVersion: 1 },
      },
    );

    return {
      affectedCount: result.modifiedCount,
      action,
    };
  };

  return withActiveAdminLock(mutation);
};

const getUserActivity = async (id, { page = 1, limit = 25 } = {}) => {
  validateUserId(id);
  const AuditLog = require("../models/AuditLog");
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 25));
  const filter = { $or: [{ targetId: String(id) }, { actorId: id }] };
  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("actorId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
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
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserActivity,
  bulkAction,   
};
