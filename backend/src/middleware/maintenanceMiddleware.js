const jwt = require("jsonwebtoken");
const User = require("../models/User");
const settingsService = require("../services/settingsService");
const { USER_ROLES, USER_STATUS } = require("../constants/userConstants");

const ALWAYS_ALLOWED = new Set([
    "GET /api/health",
    "GET /api/settings/public",
    "GET /api/auth/csrf",
    "POST /api/auth/login",
    "POST /api/auth/logout"
]);

const getRequestKey = (req) => `${req.method} ${req.path}`;

const getAuthenticatedUser = async (req) => {
    const token = req.cookies?.token;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: "mern-admin-api",
            audience: "mern-admin-web"
        });

        const user = await User.findById(decoded.userId);
        if (!user || user.status !== USER_STATUS.ACTIVE) return null;
        if ((decoded.authVersion ?? 0) !== (user.authVersion || 0)) return null;

        return user;
    } catch {
        return null;
    }
};

const isAdmin = (user) => {
    const roles = user?.roles?.length ? user.roles : [user?.role];
    return roles.includes(USER_ROLES.ADMIN);
};

const maintenanceMiddleware = async (req, res, next) => {
    if (!await settingsService.getValue("maintenance.enabled", false)) {
        return next();
    }

    if (ALWAYS_ALLOWED.has(getRequestKey(req))) {
        return next();
    }

    const user = await getAuthenticatedUser(req);
    if (isAdmin(user)) {
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
