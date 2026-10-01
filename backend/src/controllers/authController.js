
const { successResponse } = require("../utils/response");
const authService = require("../services/authService");
const cookieOptions = require("../config/cookie");

const register = async (req, res) => {
    const user = await authService.registerUser(
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "Registration successful",
        data: user
    });
};

const login = async (req, res) => {
    const { token, user } =
        await authService.loginUser(req.body);

    res.cookie("token", token, cookieOptions.authCookieOptions);

    return successResponse(res, user, "Login successful");
};

const getMe = async (req, res) => {

    return successResponse(res, req.user, "User fetched successfully");
};

const logout = async (req, res) => {
    res.clearCookie("token", cookieOptions.authCookieOptions);

    return successResponse(res, null, "Logout successful");
};

module.exports = {
    register,
    login,
    getMe,
    logout
};