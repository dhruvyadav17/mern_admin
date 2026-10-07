const roleService = require("../services/roleService");
const { successResponse } = require("../utils/response");
const { log: audit } = require("../services/auditService");
const { ensureCanGrantPermissions } = require("../utils/accessPolicy");
const AppError = require("../utils/AppError");

const getGrantablePermissions = async (permissions = [], parentRole = null) => {
    const direct = Array.isArray(permissions) ? permissions : [];
    if (!parentRole) return direct;

    const inherited = await roleService.getEffectiveRolePermissions(parentRole);
    return [...new Set([...direct, ...inherited])];
};

const listRoles = async (req, res) =>
    successResponse(res, await roleService.listRoles(), "Roles fetched successfully");

const createRole = async (req, res) => {
    const permissions = await getGrantablePermissions(
        req.body.permissions,
        req.body.parentRole,
    );
    ensureCanGrantPermissions(req, permissions);

    const role = await roleService.createRole(req.body);
    await audit(req, "role.create", "Role", role._id, { name: role.name });
    return successResponse(res, role, "Role created successfully", 201);
};

const updateRole = async (req, res) => {
    const existingRole = await roleService.getRole(req.params.id);
    if (!existingRole) {
        throw new AppError("Role not found", 404);
    }

    if (req.body.permissions !== undefined || req.body.parentRole !== undefined) {
        const permissions =
            req.body.permissions !== undefined
                ? req.body.permissions
                : existingRole.permissions;
        const parentRole =
            req.body.parentRole !== undefined
                ? req.body.parentRole
                : existingRole.parentRole;

        const grantablePermissions = await getGrantablePermissions(
            permissions,
            parentRole,
        );
        ensureCanGrantPermissions(req, grantablePermissions);
    }

    const role = await roleService.updateRole(req.params.id, req.body);
    await audit(req, "role.update", "Role", role._id, {
        changes: Object.keys(req.body),
    });
    return successResponse(res, role, "Role updated successfully");
};

const deleteRole = async (req, res) => {
    await roleService.deleteRole(req.params.id);
    await audit(req, "role.delete", "Role", req.params.id);
    return successResponse(res, null, "Role deleted successfully");
};

module.exports = { listRoles, createRole, updateRole, deleteRole };
