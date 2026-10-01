const authService = require("../services/authService");

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

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: user
    });
};

const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user
    });
};

const logout = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    return res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

module.exports = {
    register,
    login,
    getMe,
    logout
};