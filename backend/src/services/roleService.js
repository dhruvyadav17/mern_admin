const Role = require("../models/Role");
const User = require("../models/User");
const Permission = require("../models/Permission");
const AppError = require("../utils/AppError");

const listRoles = () => Role.find().sort({ isSystem: -1, name: 1 }).lean();
const sanitizePermissions = async (permissions = []) => {
    const keys = [...new Set(permissions.map((p) => String(p).trim().toLowerCase()).filter(Boolean))];
    if (!keys.length) return [];
    const found = await Permission.find({ key: { $in: keys } }).select("key").lean();
    if (found.length !== keys.length) throw new AppError("One or more permissions do not exist", 400);
    return found.map((p) => p.key);
};
const validateParent = async (roleName, parentRole) => {
    if (!parentRole) return null;
    const normalized = String(parentRole).trim().toLowerCase();
    if (normalized === roleName) throw new AppError("A role cannot inherit from itself", 400);
    const parent = await Role.findOne({ name: normalized });
    if (!parent) throw new AppError("Parent role not found", 400);
    let cursor = normalized;
    const visited = new Set([roleName]);
    while (cursor) {
        if (visited.has(cursor)) throw new AppError("Role inheritance cycle detected", 400);
        visited.add(cursor);
        const r = await Role.findOne({ name: cursor }).select("parentRole").lean();
        cursor = r?.parentRole || null;
    }
    return normalized;
};
const createRole = async ({ name, label, description, permissions = [], parentRole = null }) => {
    const normalized = name.trim().toLowerCase();
    if (await Role.findOne({ name: normalized })) throw new AppError("Role already exists", 409);
    return Role.create({ name: normalized, label, description, permissions: await sanitizePermissions(permissions), parentRole: await validateParent(normalized, parentRole) });
};
const updateRole = async (id, payload) => {
    const role = await Role.findById(id);
    if (!role) throw new AppError("Role not found", 404);
    if (role.isSystem && payload.name && payload.name.toLowerCase() !== role.name) throw new AppError("System role name cannot be changed", 400);
    if (role.name === "admin" && payload.permissions !== undefined) throw new AppError("Admin role permissions cannot be changed", 400);
    if (role.name === "admin" && payload.parentRole !== undefined && payload.parentRole) throw new AppError("Admin role inheritance cannot be changed", 400);
    const previousName = role.name;
    if (payload.name) {
        const nextName = payload.name.trim().toLowerCase();
        if (nextName !== role.name && await Role.exists({ name: nextName, _id: { $ne: role._id } })) throw new AppError("Role already exists", 409);
        role.name = nextName;
    }
    if (payload.label !== undefined) role.label = payload.label;
    if (payload.description !== undefined) role.description = payload.description;
    if (payload.permissions !== undefined) role.permissions = await sanitizePermissions(payload.permissions);
    if (payload.parentRole !== undefined) role.parentRole = await validateParent(role.name, payload.parentRole);
    await role.save();
    if (previousName !== role.name) { await User.updateMany({ role: previousName }, { $set: { role: role.name }, $inc: { authVersion: 1 } }); await User.updateMany({ roles: previousName }, { $set: { "roles.$": role.name }, $inc: { authVersion: 1 } }); }
    return role;
};
const deleteRole = async (id) => {
    const role = await Role.findById(id);
    if (!role) throw new AppError("Role not found", 404);
    if (role.isSystem) throw new AppError("System role cannot be deleted", 400);
    if (await User.exists({ $or: [{ role: role.name }, { roles: role.name }] })) throw new AppError("Role is assigned to users", 409);
    if (await Role.exists({ parentRole: role.name })) throw new AppError("Role is a parent of another role", 409);
    await role.deleteOne();
};
const getRolePermissions = async (roleName) => { const role = await Role.findOne({ name: roleName }).lean(); return role?.permissions || []; };
module.exports = { listRoles, createRole, updateRole, deleteRole, getRolePermissions, sanitizePermissions };
