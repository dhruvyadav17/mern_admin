const Role = require("../models/Role");
const AppError = require("./AppError");
const { getEffectiveRolePermissions } = require("../services/roleService");

const actorHasAllPermissions = (req) => (req.permissions || []).includes("*");

const assertPermission = (req, permission, message = "You do not have permission to perform this action") => {
    if (!req.permissions?.includes(permission) && !actorHasAllPermissions(req)) {
        throw new AppError(message, 403);
    }
};

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

const normalizeRoles = (body = {}) => {
    if (Array.isArray(body.roles) && body.roles.length) {
        return [
            ...new Set(
                body.roles
                    .map((role) => String(role).trim().toLowerCase())
                    .filter(Boolean)
            )
        ];
    }

    if (typeof body.role === "string" && body.role.trim()) {
        return [body.role.trim().toLowerCase()];
    }

    return undefined;
};

const guardAssignableRoles = async (req, roles) => {
    if (!roles) return;

    assertPermission(
        req,
        "users.role.assign",
        "You do not have permission to assign roles"
    );

    const targetRoles = await Role.find({ name: { $in: roles } })
        .select("name isSystem")
        .lean();

    if (targetRoles.length !== roles.length) {
        throw new AppError("One or more roles not found", 400);
    }

    if (targetRoles.some((role) => role.isSystem && role.name !== "user")) {
        assertPermission(
            req,
            "users.role.assign.system",
            "You do not have permission to assign protected system roles"
        );
    }

    // The protected baseline `user` role is intentionally assignable without
    // requiring every baseline user permission. Custom roles must not be used
    // to give a target permissions the actor does not possess.
    const grantablePermissions = new Set();
    for (const role of targetRoles) {
        if (role.isSystem && role.name === "user") continue;
        const effective = await getEffectiveRolePermissions(role.name);
        effective.forEach((permission) => grantablePermissions.add(permission));
    }

    ensureCanGrantPermissions(req, [...grantablePermissions]);
};

module.exports = {
    actorHasAllPermissions,
    assertPermission,
    ensureCanGrantPermissions,
    guardAssignableRoles,
    normalizeRoles
};
