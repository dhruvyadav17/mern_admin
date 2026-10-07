const mongoose = require("mongoose");
const Permission = require("../models/Permission");
const Role = require("../models/Role");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { collectRolePermissions } = require("../middleware/permissionMiddleware");

const normalizeKey = (key) => String(key || "").trim().toLowerCase();
const parseKey = (key) => {
    const [resource, ...rest] = normalizeKey(key).split(".");
    return { resource: resource || "general", action: rest.join(".") || "manage" };
};
const sanitize = async (permissions = []) => {
    const keys = [...new Set(permissions.map(normalizeKey).filter(Boolean))];
    if (!keys.length) return [];
    const valid = await Permission.find({ key: { $in: keys } }).select("key").lean();
    return valid.map((item) => item.key);
};
const listPermissions = () => Permission.find().sort({ group: 1, resource: 1, action: 1, key: 1 }).lean();

const createPermission = async ({ key, label, group, description = "" }) => {
    const normalized = normalizeKey(key);
    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(normalized)) throw new AppError("Invalid permission key. Use values such as users.view or reports.export", 400);
    if (await Permission.exists({ key: normalized })) throw new AppError("Permission already exists", 409);
    const parsed = parseKey(normalized);
    return Permission.create({ key: normalized, label, group, description, resource: parsed.resource, action: parsed.action, isSystem: false });
};

const updatePermission = async (id, payload) => {
    const permission = await Permission.findById(id);
    if (!permission) throw new AppError("Permission not found", 404);
    if (permission.isSystem && payload.key && normalizeKey(payload.key) !== permission.key) throw new AppError("System permission key cannot be changed", 400);
    const previousKey = permission.key;
    const nextKey = payload.key !== undefined ? normalizeKey(payload.key) : permission.key;
    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(nextKey)) throw new AppError("Invalid permission key", 400);
    if (nextKey !== previousKey && await Permission.exists({ key: nextKey, _id: { $ne: permission._id } })) throw new AppError("Permission already exists", 409);
    if (payload.key !== undefined) permission.key = nextKey;
    if (payload.label !== undefined) permission.label = payload.label;
    if (payload.group !== undefined) permission.group = payload.group;
    if (payload.description !== undefined) permission.description = payload.description;
    const parsed = parseKey(nextKey);
    permission.resource = parsed.resource;
    permission.action = parsed.action;
    await permission.save();
    if (nextKey !== previousKey) {
        await Role.updateMany({ permissions: previousKey }, { $set: { "permissions.$": nextKey } });
        await User.updateMany({ "permissionOverrides.allow": previousKey }, { $set: { "permissionOverrides.allow.$": nextKey } });
        await User.updateMany({ "permissionOverrides.deny": previousKey }, { $set: { "permissionOverrides.deny.$": nextKey } });
    }
    return permission;
};

const deletePermission = async (id) => {
    const permission = await Permission.findById(id);
    if (!permission) throw new AppError("Permission not found", 404);
    if (permission.isSystem) throw new AppError("System permission cannot be deleted", 400);
    const usedByRole = await Role.exists({ permissions: permission.key });
    const usedByUser = await User.exists({ $or: [{ "permissionOverrides.allow": permission.key }, { "permissionOverrides.deny": permission.key }] });
    if (usedByRole || usedByUser) throw new AppError("Permission is assigned and cannot be deleted", 409);
    await permission.deleteOne();
};

const updateRolePermissions = async (roleId, permissions) => {
    const role = await Role.findById(roleId);
    if (!role) throw new AppError("Role not found", 404);
    if (role.isSystem) {
        throw new AppError("System role permissions cannot be changed", 400);
    }
    role.permissions = await sanitize(permissions);
    await role.save();
    return role;
};

const getUserOverrides = async (userId) => {
    const user = await User.findById(userId).select("name email roles permissionOverrides status").lean();
    if (!user) throw new AppError("User not found", 404);
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const roleDocs = await Role.find({ name: { $in: roles } }).select("name label permissions parentRole").lean();
    const inheritedSet = new Set();
    for (const roleName of roles) {
        const permissions = await collectRolePermissions(roleName);
        permissions.forEach((p) => inheritedSet.add(p));
    }
    return {
        user: { id: user._id, name: user.name, email: user.email, role: roles[0], roles, status: user.status },
        permissionOverrides: { allow: user.permissionOverrides?.allow || [], deny: user.permissionOverrides?.deny || [] },
        rolePermissions: roleDocs.flatMap((r) => r.permissions || []),
        inheritedPermissions: [...inheritedSet]
    };
};

const updateUserOverrides = async (userId, allow = [], deny = []) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    const safeAllow = await sanitize(allow);
    const safeDeny = (await sanitize(deny)).filter((p) => !safeAllow.includes(p));
    user.permissionOverrides = { allow: safeAllow, deny: safeDeny };
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();
    return user;
};

// UI-friendly atomic operation: one checkbox represents the user's final access.
// checked=true  => effective access should be allowed
// checked=false => effective access should be denied
const setUserPermission = async (userId, permissionKey, enabled) => {
    if (!mongoose.isValidObjectId(userId)) throw new AppError("Invalid user ID", 400);
    if (typeof enabled !== "boolean") throw new AppError("enabled must be a boolean", 400);

    const key = normalizeKey(permissionKey);
    if (!key) throw new AppError("Permission key is required", 400);
    if (!(await Permission.exists({ key }))) throw new AppError("Permission not found", 404);

    const target = await User.findById(userId).select("roles permissionOverrides authVersion name email status");
    if (!target) throw new AppError("User not found", 404);

    const roleNames = Array.isArray(target.roles) ? target.roles : [];
    const inherited = new Set();
    for (const roleName of roleNames) {
        const rolePermissions = await collectRolePermissions(roleName);
        rolePermissions.forEach((item) => inherited.add(item));
    }

    // A user-level checkbox represents the user's final access. Keep the
    // mutation atomic so two quick clicks on different permissions cannot
    // overwrite each other's changes.
    let update;
    if (enabled) {
        // Role access is already enough; remove any explicit override for this key.
        if (inherited.has("*") || inherited.has(key)) {
            update = {
                $pull: {
                    "permissionOverrides.allow": key,
                    "permissionOverrides.deny": key
                },
                $inc: { authVersion: 1 }
            };
        } else {
            update = {
                $pull: { "permissionOverrides.deny": key },
                $addToSet: { "permissionOverrides.allow": key },
                $inc: { authVersion: 1 }
            };
        }
    } else {
        update = {
            $pull: { "permissionOverrides.allow": key },
            $addToSet: { "permissionOverrides.deny": key },
            $inc: { authVersion: 1 }
        };
    }

    const updated = await User.findOneAndUpdate(
        { _id: userId },
        update,
        { new: true, runValidators: true }
    );

    if (!updated) throw new AppError("User not found", 404);

    return updated;
};

module.exports = {
    listPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    updateRolePermissions,
    getUserOverrides,
    updateUserOverrides,
    setUserPermission,
    sanitize
};
