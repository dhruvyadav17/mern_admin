const service = require("../services/permissionService");
const { successResponse } = require("../utils/response");
const { getEffectivePermissions } = require("../middleware/permissionMiddleware");
const { log: audit, safeLog: safeAudit } = require("../services/auditService");
const { ensureCanGrantPermissions } = require("../utils/accessPolicy");
const AppError = require("../utils/AppError");

const list = async (req, res) => successResponse(res, await service.listPermissions(), "Permissions fetched successfully");
const create = async (req, res) => { const permission = await service.createPermission(req.body); await audit(req, "permission.create", "Permission", permission._id, { key: permission.key }); return successResponse(res, permission, "Permission created successfully", 201); };
const update = async (req, res) => { const permission = await service.updatePermission(req.params.id, req.body); await audit(req, "permission.update", "Permission", permission._id, { changes: Object.keys(req.body) }); return successResponse(res, permission, "Permission updated successfully"); };
const remove = async (req, res) => { await service.deletePermission(req.params.id); await audit(req, "permission.delete", "Permission", req.params.id); return successResponse(res, null, "Permission deleted successfully"); };
const updateRolePermissions = async (req, res) => {
    const permissions = req.body.permissions || [];
    ensureCanGrantPermissions(req, permissions);
    const role = await service.updateRolePermissions(req.params.roleId, permissions);
    await safeAudit(req, "role.permissions.update", "Role", role._id, { permissions: role.permissions });
    return successResponse(res, role, "Role permissions updated successfully");
};
const getUserOverrides = async (req, res) => successResponse(res, await service.getUserOverrides(req.params.userId), "User permission overrides fetched successfully");

const updateUserPermission = async (req, res) => {
    if (String(req.params.userId) === String(req.user._id)) {
        throw new AppError("You cannot change your own permission overrides", 403);
    }

    const permission = String(req.body.permission).trim().toLowerCase();
    const enabled = req.body.enabled === true;
    if (enabled) {
        ensureCanGrantPermissions(req, [permission]);
    }

    const user = await service.setUserPermission(req.params.userId, permission, enabled);
    await safeAudit(req, "user.permission.update", "User", user._id, { permission, enabled });
    return successResponse(res, user, enabled ? "Permission enabled for user" : "Permission disabled for user");
};

const updateUserOverrides = async (req, res) => {
    if (String(req.params.userId) === String(req.user._id)) throw new AppError("You cannot change your own permission overrides", 403);
    const allow = req.body.allow || [];
    ensureCanGrantPermissions(req, allow);
    const user = await service.updateUserOverrides(req.params.userId, allow, req.body.deny || []);
    await safeAudit(req, "user.permissions.update", "User", user._id, { allow: user.permissionOverrides.allow, deny: user.permissionOverrides.deny });
    return successResponse(res, user, "User permission overrides updated successfully");
};

const me = async (req, res) => successResponse(res, await getEffectivePermissions(req.user), "Effective permissions fetched successfully");
module.exports = { list, create, update, remove, updateRolePermissions, getUserOverrides, updateUserPermission, updateUserOverrides, me };

