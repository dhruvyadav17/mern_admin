const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { USER_STATUS } = require("../constants/userConstants");
const { JWT_OPTIONS } = require("../config/security");

const verifyAuthToken = (token) => jwt.verify(token, process.env.JWT_SECRET, JWT_OPTIONS);

const getUserRoles = (user) => user?.roles?.length ? user.roles : [user?.role].filter(Boolean);

const userHasRole = (user, role) => getUserRoles(user).includes(role);

const resolveAuthenticatedUser = async (token) => {
    if (!token) return { user: null, reason: "missing" };

    try {
        const decoded = verifyAuthToken(token);
        const user = await User.findById(decoded.userId);

        if (!user) return { user: null, reason: "not_found" };
        if ((decoded.authVersion ?? 0) !== (user.authVersion || 0)) {
            return { user: null, reason: "stale" };
        }
        if (user.status !== USER_STATUS.ACTIVE) {
            return { user: null, reason: "inactive" };
        }

        return { user, decoded, reason: null };
    } catch {
        return { user: null, reason: "invalid" };
    }
};

module.exports = {
    getUserRoles,
    resolveAuthenticatedUser,
    userHasRole,
    verifyAuthToken
};
