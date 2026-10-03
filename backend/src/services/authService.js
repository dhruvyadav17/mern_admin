const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");
const { hashPassword, comparePassword } = require("../utils/password");
const { toUserResponse } = require("../utils/userMapper");
const { getEffectivePermissions } = require("../middleware/permissionMiddleware");
const settingsService = require("./settingsService");
const AuditLog = require("../models/AuditLog");

const registerUser = async ({ name, email, password }) => {
    const registrationEnabled = await settingsService.getValue("registration.enabled", false);
    if (registrationEnabled !== true) throw new AppError("Public registration is disabled", 403);
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: await hashPassword(password),
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE
    });

    return toUserResponse(user, await getEffectivePermissions(user));
};

const loginUser = async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail
    }).select("+password");

    if (!user || !(await comparePassword(password, user.password))) {
        await AuditLog.create({ action: "auth.login.failed", targetType: "Auth", details: { email: normalizedEmail }, ip: null });
        throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== USER_STATUS.ACTIVE) {
        throw new AppError("Your account is inactive", 403);
    }

    const token = jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role,
            authVersion: user.authVersion || 0
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            issuer: "mern-admin-api",
            audience: "mern-admin-web"
        }
    );

    return { token, user: toUserResponse(user, await getEffectivePermissions(user)) };
};

module.exports = {
    registerUser,
    loginUser
};
