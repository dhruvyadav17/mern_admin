const { USER_ROLES } = require("../constants/userConstants");
const { AUTH_COOKIE_NAME } = require("../config/security");
const {
  resolveAuthenticatedUser,
  userHasRole,
} = require("../utils/authSession");

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { user, reason } = await resolveAuthenticatedUser(token);

    if (!user) {
      const message =
        reason === "not_found"
          ? "User not found"
          : reason === "stale"
            ? "Session expired. Please log in again."
            : reason === "inactive"
              ? "User account is inactive"
              : "Invalid or expired token";
      const status = reason === "inactive" ? 403 : 401;
      return res.status(status).json({ success: false, message });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = {
  protect,
};
