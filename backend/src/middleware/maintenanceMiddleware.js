const settingsService = require("../services/settingsService");
const { USER_ROLES } = require("../constants/userConstants");
const { AUTH_COOKIE_NAME } = require("../config/security");
const { resolveAuthenticatedUser, userHasRole } = require("../utils/authSession");

const ALWAYS_ALLOWED = new Set([
    "GET /api/health",
    "GET /api/settings/public",
    "GET /api/auth/csrf",
    "POST /api/auth/login",
    "POST /api/auth/logout"
]);

const getRequestKey = (req) => `${req.method} ${req.path}`;

const maintenanceMiddleware = async (req, res, next) => {
    if (!await settingsService.getValue("maintenance.enabled", false)) {
        return next();
    }

    if (ALWAYS_ALLOWED.has(getRequestKey(req))) {
        return next();
    }

    const { user } = await resolveAuthenticatedUser(req.cookies?.[AUTH_COOKIE_NAME]);
    if (userHasRole(user, USER_ROLES.ADMIN)) {
        req.user = req.user || user;
        return next();
    }

    return res.status(503).json({
        success: false,
        code: "MAINTENANCE_MODE",
        message: "The application is currently in maintenance mode"
    });
};

module.exports = maintenanceMiddleware;

