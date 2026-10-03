const User = require("../models/User");
const authService = require("../services/authService");
const { successResponse } = require("../utils/response");
const { toUserResponse } = require("../utils/userMapper");
const { getEffectivePermissions } = require("../middleware/permissionMiddleware");
const { log: audit } = require("../services/auditService");
const passwordResetService = require("../services/passwordResetService");
const { hashPassword, comparePassword } = require("../utils/password");
const AppError = require("../utils/AppError");
const settingsService = require("../services/settingsService");
const { AUTH_COOKIE_NAME } = require("../config/security");
const { clearAuthCookieOptions, getAuthCookieOptions } = require("../config/cookie");
const { minutesToMilliseconds } = require("../utils/sessionPolicy");
const {
    createCsrfToken,
    csrfCookieOptions,
    CSRF_COOKIE_NAME
} = require("../utils/csrfToken");
const emailVerificationService = require("../services/emailVerificationService");

const register = async (req, res) => successResponse(res, await authService.registerUser(req.body), "Registration successful", 201);

const login = async (req, res) => {
    const { token, user, sessionTimeoutMinutes } = await authService.loginUser(req.body);
    res.cookie(
        AUTH_COOKIE_NAME,
        token,
        getAuthCookieOptions(minutesToMilliseconds(sessionTimeoutMinutes))
    );
    await audit({ user: { _id: user.id }, ip: req.ip, get: req.get.bind(req) }, "auth.login", "User", user.id, { email: user.email });
    return successResponse(res, user, "Login successful");
};

const csrf = async (req, res) => {
    const token = createCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
    return successResponse(res, { csrfToken: token }, "CSRF token issued");
};

const getMe = async (req, res) => successResponse(res, toUserResponse(req.user, await getEffectivePermissions(req.user)), "User fetched successfully");

const forgotPassword = async (req, res) => successResponse(res, await passwordResetService.requestReset(req.body.email), "If the account exists, reset instructions were generated");

const changePassword = async (req, res) => {
    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await comparePassword(req.body.currentPassword, user.password))) throw new AppError("Current password is incorrect", 400);
    user.password = await hashPassword(req.body.password);
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();
    await audit(req, "password.change", "User", req.user._id);
    res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
    return successResponse(res, null, "Password changed successfully. Please login again.");
};

const resetPassword = async (req, res) => {
    await passwordResetService.resetPassword(req.body.token, req.body.password);
    return successResponse(res, null, "Password reset successful");
};

const verifyEmail = async (req, res) => {
    await emailVerificationService.verify(req.body.token);
    return successResponse(res, null, "Email verified successfully");
};

const resendVerification = async (req, res) => {
    return successResponse(
        res,
        await emailVerificationService.requestVerification(req.body.email),
        "If verification is required, instructions were generated"
    );
};


const updateProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);
    const previousEmail = user.email;
    const nextEmail = req.body.email.toLowerCase();
    const emailChanged = nextEmail !== previousEmail;
    user.name = req.body.name;
    user.email = nextEmail;
    if (emailChanged) {
        const verificationRequired = await settingsService.getValue(
            "registration.email_verification",
            false
        );
        user.emailVerifiedAt = verificationRequired ? null : new Date();
    }
    try { await user.save(); } catch (error) { if (error?.code === 11000) throw new AppError("Email already registered", 409); throw error; }
    const verification = emailChanged
        ? await emailVerificationService.requestVerificationForUser(user)
        : null;
    await audit(req, "profile.update", "User", user._id, { changes: ["name", "email"] });
    return successResponse(
        res,
        {
            ...toUserResponse(user, await getEffectivePermissions(user)),
            ...(verification?.verificationToken ? { verificationToken: verification.verificationToken } : {})
        },
        "Profile updated successfully"
    );
};

const logout = async (req, res) => {
    req.user.authVersion = (req.user.authVersion || 0) + 1;
    await req.user.save();
    await audit(req, "auth.logout", "User", req.user._id);
    res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
    res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions);
    return successResponse(res, null, "Logout successful");
};

module.exports = {
    register,
    login,
    getMe,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    csrf,
    verifyEmail,
    resendVerification
};
