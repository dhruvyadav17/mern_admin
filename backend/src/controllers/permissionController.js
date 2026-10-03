const service = require("../services/permissionService");
const { successResponse } = require("../utils/response");
const { getEffectivePermissions } = require("../middleware/permissionMiddleware");
const { log: audit } = require("../services/auditService");
const AppError = require("../utils/AppError");

const actorHasAllPermissions = (req) => (req.permissions || []).includes("*");
const ensureCanGrantPermissions = (req, permissions = []) => {
    if (actorHasAllPermissions(req)) return;

    const actorPermissions = new Set(req.permissions || []);
    const forbidden = [...new Set(permissions)]
        .map((permission) => String(permission || "").trim().toLowerCase())
        .filter(Boolean)
        .filter((permission) => !actorPermissions.has(permission));

    if (forbidden.length) {
        throw new AppError("You cannot grant permissions you do not possess", 403);
    }
};

const list = async (req, res) => successResponse(res, await service.listPermissions(), "Permissions fetched successfully");
const create = async (req, res) => { const permission = await service.createPermission(req.body); await audit(req, "permission.create", "Permission", permission._id, { key: permission.key }); return successResponse(res, permission, "Permission created successfully", 201); };
const update = async (req, res) => { const permission = await service.updatePermission(req.params.id, req.body); await audit(req, "permission.update", "Permission", permission._id, { changes: Object.keys(req.body) }); return successResponse(res, permission, "Permission updated successfully"); };
const remove = async (req, res) => { await service.deletePermission(req.params.id); await audit(req, "permission.delete", "Permission", req.params.id); return successResponse(res, null, "Permission deleted successfully"); };
const updateRolePermissions = async (req, res) => {
    const permissions = req.body.permissions || [];
    ensureCanGrantPermissions(req, permissions);
    const role = await service.updateRolePermissions(req.params.roleId, permissions);
    try {
        await audit(req, "role.permissions.update", "Role", role._id, { permissions: role.permissions });
    } catch (auditError) {
        console.error("Audit log failed after role permission update", auditError);
    }
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
    // The permission mutation itself is the source of truth. Audit logging must
    // not turn a successful checkbox update into a misleading 500 response.
    try {
        await audit(req, "user.permission.update", "User", user._id, { permission, enabled });
    } catch (auditError) {
        console.error("Audit log failed after user permission update", auditError);
    }
    return successResponse(res, user, enabled ? "Permission enabled for user" : "Permission disabled for user");
};

const updateUserOverrides = async (req, res) => {
    if (String(req.params.userId) === String(req.user._id)) throw new AppError("You cannot change your own permission overrides", 403);
    const allow = req.body.allow || [];
    ensureCanGrantPermissions(req, allow);
    const user = await service.updateUserOverrides(req.params.userId, allow, req.body.deny || []);
    try {
        await audit(req, "user.permissions.update", "User", user._id, { allow: user.permissionOverrides.allow, deny: user.permissionOverrides.deny });
    } catch (auditError) {
        console.error("Audit log failed after user permission override update", auditError);
    }
    return successResponse(res, user, "User permission overrides updated successfully");
};

const me = async (req, res) => successResponse(res, await getEffectivePermissions(req.user), "Effective permissions fetched successfully");
module.exports = { list, create, update, remove, updateRolePermissions, getUserOverrides, updateUserPermission, updateUserOverrides, me };
