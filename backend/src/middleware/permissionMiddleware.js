const Role = require("../models/Role");
const Permission = require("../models/Permission");
const AppError = require("../utils/AppError");
const { hasPermission } = require("../utils/permissionLogic");

const collectRolePermissions = async (roleName, visited = new Set()) => {
    if (!roleName || visited.has(roleName)) return new Set();

    visited.add(roleName);
    const role = await Role.findOne({ name: roleName }).lean();
    if (!role) return new Set();

    const result = new Set(role.permissions || []);

    if (role.parentRole) {
        const inherited = await collectRolePermissions(role.parentRole, visited);
        inherited.forEach((permission) => result.add(permission));
    }

    return result;
};

const getEffectivePermissions = async (user) => {
    const roleNames = Array.isArray(user.roles) ? user.roles : [];
    const permissions = new Set();

    for (const roleName of roleNames) {
        const rolePermissions = await collectRolePermissions(roleName);
        rolePermissions.forEach((permission) => permissions.add(permission));
    }

    const allow = user.permissionOverrides?.allow || [];
    const deny = user.permissionOverrides?.deny || [];

    if (permissions.has("*")) {
        const allPermissions = await Permission.find().select("key").lean();
        allPermissions.forEach(({ key }) => permissions.add(key));
        // Keep the wildcard. It is useful for backend policy checks and
        // avoids making admin access depend on the current permission catalog.
    }

    allow.forEach((permission) => permissions.add(permission));
    deny.forEach((permission) => permissions.delete(permission));

    return [...permissions];
};

const requirePermission = (...requiredPermissions) => async (req, res, next) => {
    try {
        if (!req.user) throw new AppError("Authentication required", 401);

        const permissions = await getEffectivePermissions(req.user);
        const allowed = requiredPermissions.some((permission) =>
            hasPermission(permissions, permission),
        );

        if (!allowed) {
            throw new AppError(
                "You do not have permission to perform this action",
                403,
            );
        }

        req.permissions = permissions;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEffectivePermissions,
    requirePermission,
    hasPermission,
    collectRolePermissions,
};
