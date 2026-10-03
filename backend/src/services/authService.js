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
const emailVerificationService = require("./emailVerificationService");
const {
    normalizeSessionTimeoutMinutes,
    minutesToSeconds
} = require("../utils/sessionPolicy");

const registerUser = async ({ name, email, password }) => {
    const registrationEnabled = await settingsService.getValue("registration.enabled", false);
    if (registrationEnabled !== true) throw new AppError("Public registration is disabled", 403);
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    const verificationRequired = await settingsService.getValue(
        "registration.email_verification",
        false
    );

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: await hashPassword(password),
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE,
        emailVerifiedAt: verificationRequired ? null : new Date()
    });

    await emailVerificationService.requestVerificationForUser(user);

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

    if (
        await settingsService.getValue(
            "registration.email_verification",
            false
        )
    ) {
        if (!user.emailVerifiedAt) {
            throw new AppError("Please verify your email before logging in", 403);
        }
    }

    const sessionTimeoutMinutes = normalizeSessionTimeoutMinutes(
        await settingsService.getValue("security.session_timeout_minutes")
    );

    const token = jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role,
            authVersion: user.authVersion || 0
        },
        process.env.JWT_SECRET,
        {
            expiresIn: minutesToSeconds(sessionTimeoutMinutes),
            issuer: "mern-admin-api",
            audience: "mern-admin-web"
        }
    );

    return {
        token,
        sessionTimeoutMinutes,
        user: toUserResponse(user, await getEffectivePermissions(user))
    };
};

module.exports = {
    registerUser,
    loginUser
};
