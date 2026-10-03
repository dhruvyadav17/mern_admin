const User = require("../models/User");
const authService = require("../services/authService");
const { successResponse } = require("../utils/response");
const { toUserResponse } = require("../utils/userMapper");
const { getEffectivePermissions } = require("../middleware/permissionMiddleware");
const { log: audit } = require("../services/auditService");
const passwordResetService = require("../services/passwordResetService");
const { hashPassword, comparePassword } = require("../utils/password");
const AppError = require("../utils/AppError");
const { authCookieOptions, clearAuthCookieOptions } = require("../config/cookie");

const register = async (req, res) => successResponse(res, await authService.registerUser(req.body), "Registration successful", 201);

const login = async (req, res) => {
    const { token, user } = await authService.loginUser(req.body);
    res.cookie("token", token, authCookieOptions);
    await audit({ user: { _id: user.id }, ip: req.ip, get: req.get.bind(req) }, "auth.login", "User", user.id, { email: user.email });
    return successResponse(res, user, "Login successful");
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
    res.clearCookie("token", clearAuthCookieOptions);
    return successResponse(res, null, "Password changed successfully. Please login again.");
};

const resetPassword = async (req, res) => {
    await passwordResetService.resetPassword(req.body.token, req.body.password);
    return successResponse(res, null, "Password reset successful");
};


const updateProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);
    user.name = req.body.name;
    user.email = req.body.email.toLowerCase();
    try { await user.save(); } catch (error) { if (error?.code === 11000) throw new AppError("Email already registered", 409); throw error; }
    await audit(req, "profile.update", "User", user._id, { changes: ["name", "email"] });
    return successResponse(res, toUserResponse(user, await getEffectivePermissions(user)), "Profile updated successfully");
};

const logout = async (req, res) => {
    req.user.authVersion = (req.user.authVersion || 0) + 1;
    await req.user.save();
    await audit(req, "auth.logout", "User", req.user._id);
    res.clearCookie("token", clearAuthCookieOptions);
    return successResponse(res, null, "Logout successful");
};

module.exports = { register, login, getMe, logout, forgotPassword, resetPassword, changePassword, updateProfile };
