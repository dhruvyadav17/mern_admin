const authService = require("../services/authService");
const { successResponse } = require("../utils/response");
const { toUserResponse } = require("../utils/userMapper");
const {
    authCookieOptions,
    clearAuthCookieOptions
} = require("../config/cookie");

const register = async (req, res) => {
    const user = await authService.registerUser(req.body);

    return successResponse(
        res,
        user,
        "Registration successful",
        201
    );
};

const login = async (req, res) => {
    const { token, user } = await authService.loginUser(req.body);

    res.cookie("token", token, authCookieOptions);

    return successResponse(res, user, "Login successful");
};

const getMe = async (req, res) => {
    return successResponse(
        res,
        toUserResponse(req.user),
        "User fetched successfully"
    );
};

const logout = async (req, res) => {
    res.clearCookie("token", clearAuthCookieOptions);

    return successResponse(res, null, "Logout successful");
};

module.exports = {
    register,
    login,
    getMe,
    logout
};
