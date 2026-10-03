const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Role = require("../models/Role");
const AppError = require("../utils/AppError");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");
const { hashPassword } = require("../utils/password");
const { toUserResponse, toUserListResponse } = require("../utils/userMapper");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const { log: audit } = require("./auditService");

const ADMIN_LOCK_ID = "active-admin-mutation";
const ADMIN_LOCK_TTL_MS = 30_000;

const validateUserId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid user ID", 400);
    }
};

const withActiveAdminLock = async (operation) => {
    console.log("[LOCK 1] withActiveAdminLock START");
    const locks = User.db.collection("system_locks");
    console.log("[LOCK 2] system_locks collection acquired");
    const owner = crypto.randomUUID();
    let acquired = false;

    for (let attempt = 0; attempt < 5 && !acquired; attempt += 1) {
        const attemptNow = new Date();
        const attemptLockedUntil = new Date(
            attemptNow.getTime() + ADMIN_LOCK_TTL_MS
        );

        try {
            console.log("[LOCK 3] findOneAndUpdate attempt:", attempt + 1);
            const result = await locks.findOneAndUpdate(
                {
                    _id: ADMIN_LOCK_ID,
                    $or: [
                        { lockedUntil: { $lte: attemptNow } },
                        { lockedUntil: { $exists: false } }
                    ]
                },
                {
                    $set: { owner, lockedUntil: attemptLockedUntil }
                },
                {
                    upsert: true,
                    returnDocument: "after",
                    includeResultMetadata: false
                }
            );

            // MongoDB driver versions differ in whether findOneAndUpdate
            // returns the document directly or wraps it in `value`.
            const lockedDocument = result?.value ?? result;
            acquired = Boolean(lockedDocument?.owner === owner);
            console.log("[LOCK 4] lock result:", {
                acquired,
                owner,
                returnedOwner: lockedDocument?.owner
            });
        } catch (error) {
            console.error("[LOCK ERROR]", error?.name, error?.message, error?.code);
            console.error(error?.stack);
            if (error?.code !== 11000) {
                throw error;
            }
        }

        if (!acquired) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    }

    if (!acquired) {
        console.error("[LOCK 5] FAILED TO ACQUIRE LOCK");
        throw new AppError("Admin operation is busy. Please try again.", 409);
    }

    console.log("[LOCK 6] LOCK ACQUIRED");

    try {
        return await operation();
    } finally {
        console.log("[LOCK 7] releasing lock");
        await locks.deleteOne({ _id: ADMIN_LOCK_ID, owner });
        console.log("[LOCK 8] lock released");
    }
};

const ensureActiveAdminWillRemain = async (excludeUserId) => {
    const activeAdminCount = await User.countDocuments({
        $or: [{ role: USER_ROLES.ADMIN }, { roles: USER_ROLES.ADMIN }],
        status: USER_STATUS.ACTIVE,
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {})
    });

    if (activeAdminCount === 0) {
        throw new AppError(
            "At least one active admin is required",
            400
        );
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
            { email: { $regex: safeSearch, $options: "i" } }
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        User.countDocuments(filter)
    ]);

    return {
        users: toUserListResponse(users),
        pagination: getPaginationMeta(
            total,
            pagination.page,
            pagination.limit
        )
    };
};

const createUser = async ({
    name,
    email,
    password,
    role = USER_ROLES.USER,
    roles = undefined,
    status = USER_STATUS.ACTIVE
}) => {
    const normalizedEmail = email.toLowerCase();

    const roleList = [...new Set((roles?.length ? roles : [role]).map(r => String(r).toLowerCase()))];
    const foundRoles = await Role.find({ name: { $in: roleList } }).select("name").lean();
    if (foundRoles.length !== roleList.length) throw new AppError("One or more roles not found", 400);

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    try {
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: await hashPassword(password),
            role: roleList[0],
            roles: roleList,
            status
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
    const allowed = new Set(["name", "email", "password", "role", "roles", "status"]);
    const normalized = {};

    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            normalized[key] = data[key];
        }
    }

    if (typeof normalized.name === "string") normalized.name = normalized.name.trim();
    if (typeof normalized.email === "string") normalized.email = normalized.email.trim().toLowerCase();
    if (typeof normalized.password === "string") {
        normalized.password = normalized.password.trim();
        if (!normalized.password) delete normalized.password;
    }
    if (typeof normalized.role === "string") normalized.role = normalized.role.trim().toLowerCase();
    if (typeof normalized.status === "string") normalized.status = normalized.status.trim().toLowerCase();

    if (Array.isArray(normalized.roles)) {
        normalized.roles = [...new Set(
            normalized.roles
                .map((role) => String(role).trim().toLowerCase())
                .filter(Boolean)
        )];
    }

    // `roles` is the canonical multi-role field. If it is supplied, ignore
    // the legacy single `role` value so the two fields cannot disagree.
    if (normalized.roles !== undefined) delete normalized.role;

    return normalized;
};

const updateUser = async (id, data, currentUserId) => {
    console.log("\n========== USER UPDATE SERVICE ==========");
    console.log("[UPDATE 1] id:", id);
    console.log("[UPDATE 1] data:", JSON.stringify(data, null, 2));
    console.log("[UPDATE 1] currentUserId:", currentUserId);

    validateUserId(id);
    console.log("[UPDATE 2] validateUserId: OK");

    const normalizedData = normalizeUserUpdateData(data);
    console.log("[UPDATE 3] normalizedData:", JSON.stringify(normalizedData, null, 2));
    console.log("[UPDATE 3] roles is array:", Array.isArray(normalizedData.roles));

    const mutation = async () => {
        console.log("[UPDATE 4] mutation START");

        const user = await User.findById(id);
        console.log("[UPDATE 5] findById:", user ? {
            id: user._id,
            email: user.email,
            role: user.role,
            roles: user.roles,
            status: user.status
        } : null);

        if (!user) throw new AppError("User not found", 404);

        const actorId = currentUserId?.toString?.();
        const isSelf = Boolean(actorId && user._id.toString() === actorId);
        console.log("[UPDATE 6] isSelf:", isSelf, "actorId:", actorId);
        const currentRoles = user.roles?.length ? user.roles : [user.role];
        console.log("[UPDATE 7] currentRoles:", currentRoles);

        const nextRoles = normalizedData.roles !== undefined
            ? normalizedData.roles
            : normalizedData.role !== undefined
                ? [normalizedData.role]
                : currentRoles;
        const isActiveAdmin = currentRoles.includes(USER_ROLES.ADMIN) && user.status === USER_STATUS.ACTIVE;
        console.log("[UPDATE 8] nextRoles:", nextRoles);
        console.log("[UPDATE 8] isActiveAdmin:", isActiveAdmin);

        if (isSelf && (normalizedData.role !== undefined || normalizedData.roles !== undefined || normalizedData.status !== undefined)) {
            throw new AppError("You cannot change your own role or status", 400);
        }

        if (normalizedData.roles !== undefined) {
            console.log("[UPDATE 9] validating roles:", normalizedData.roles);
            if (!normalizedData.roles.length) {
                throw new AppError("At least one role is required", 400);
            }
            const foundRoles = await Role.find({ name: { $in: normalizedData.roles } }).select("name").lean();
            console.log("[UPDATE 10] foundRoles:", foundRoles);
            if (foundRoles.length !== normalizedData.roles.length) {
                throw new AppError("One or more roles not found", 400);
            }
        } else if (normalizedData.role !== undefined) {
            if (!(await Role.exists({ name: normalizedData.role }))) {
                throw new AppError("Role not found", 400);
            }
        }

        if (normalizedData.email !== undefined && normalizedData.email !== user.email) {
            console.log("[UPDATE 11] checking email:", normalizedData.email);
            const existingUser = await User.findOne({
                email: normalizedData.email,
                _id: { $ne: user._id }
            }).select("_id").lean();

            console.log("[UPDATE 11] existingUser:", existingUser);
            if (existingUser) throw new AppError("Email already registered", 409);
            user.email = normalizedData.email;
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

        const previousRoles = user.roles?.length ? user.roles : [user.role];
        const rolesChanged = JSON.stringify(previousRoles) !== JSON.stringify(nextRoles);
        const roleChanged = normalizedData.role !== undefined && normalizedData.role !== user.role;
        const statusChanged = normalizedData.status !== undefined && normalizedData.status !== user.status;
        const passwordChanged = Boolean(normalizedData.password);
        const securityChange = passwordChanged || rolesChanged || roleChanged || statusChanged;

        if (normalizedData.roles !== undefined) {
            user.roles = normalizedData.roles;
            user.role = normalizedData.roles[0];
        } else if (normalizedData.role !== undefined) {
            user.role = normalizedData.role;
            user.roles = [normalizedData.role];
        }

        if (normalizedData.status !== undefined) user.status = normalizedData.status;

        if (passwordChanged) user.password = await hashPassword(normalizedData.password);
        if (securityChange) user.authVersion = (user.authVersion || 0) + 1;

        console.log("[UPDATE 12] BEFORE SAVE:", {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            roles: user.roles,
            rolesIsArray: Array.isArray(user.roles),
            status: user.status,
            authVersion: user.authVersion
        });

        try {
            await user.save();
            console.log("[UPDATE 13] user.save(): SUCCESS");
        } catch (error) {
            console.error("[UPDATE 13] user.save(): FAILED");
            console.error("SAVE ERROR NAME:", error?.name);
            console.error("SAVE ERROR MESSAGE:", error?.message);
            console.error("SAVE ERROR CODE:", error?.code);
            console.error("SAVE ERROR DETAILS:", error?.errors);
            console.error("SAVE ERROR STACK:", error?.stack);
            if (error?.code === 11000) throw new AppError("Email already registered", 409);
            throw error;
        }

        console.log("[UPDATE 14] toUserResponse START");
        const response = toUserResponse(user);
        console.log("[UPDATE 15] toUserResponse SUCCESS");
        return response;
    };

    console.log("[UPDATE 16] withActiveAdminLock START");
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
            (user.roles?.includes(USER_ROLES.ADMIN) || user.role === USER_ROLES.ADMIN) &&
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
            (user.roles?.includes(USER_ROLES.ADMIN) || user.role === USER_ROLES.ADMIN) &&
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


const getUserActivity = async (id, { page = 1, limit = 25 } = {}) => {
    validateUserId(id);
    const AuditLog = require("../models/AuditLog");
    page = Math.max(1, Number(page) || 1); limit = Math.min(100, Math.max(1, Number(limit) || 25));
    const filter = { $or: [{ targetId: String(id) }, { actorId: id }] };
    const [items, total] = await Promise.all([
        AuditLog.find(filter).populate("actorId", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        AuditLog.countDocuments(filter)
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateUserStatus,
    getUserActivity
};
