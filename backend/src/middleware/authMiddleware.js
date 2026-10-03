const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");

const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: "mern-admin-api",
            audience: "mern-admin-web"
        });

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if ((decoded.authVersion ?? 0) !== (user.authVersion || 0)) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }

        if (user.status !== USER_STATUS.ACTIVE) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

module.exports = {
    protect,
    adminOnly
};
