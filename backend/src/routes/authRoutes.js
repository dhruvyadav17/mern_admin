const express = require("express");
const {
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
  resendVerification,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validateMiddleware");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
} = require("../validators/authValidator");
const {
  loginRateLimit,
  registerRateLimit,
  forgotPasswordRateLimit,
} = require("../middleware/rateLimit");

const router = express.Router();
const { body } = require("express-validator");

router.get("/csrf", asyncHandler(csrf));

router.post(
  "/register",
  registerRateLimit,
  registerValidation,
  validate,
  asyncHandler(register),
);

router.post(
  "/login",
  loginRateLimit,
  loginValidation,
  validate,
  asyncHandler(login),
);

router.post(
  "/forgot-password",
  forgotPasswordRateLimit,
  forgotPasswordValidation,
  validate,
  asyncHandler(forgotPassword),
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  asyncHandler(resetPassword),
);
router.post(
  "/verify-email",
  verifyEmailValidation,
  validate,
  asyncHandler(verifyEmail),
);
router.post(
  "/resend-verification",
  forgotPasswordRateLimit,
  resendVerificationValidation,
  validate,
  asyncHandler(resendVerification),
);

router.get("/me", protect, asyncHandler(getMe));

router.put(
  "/change-password",
  protect,
  requirePermission("password.change"),
  changePasswordValidation,
  validate,
  asyncHandler(changePassword),
);
router.put(
  "/profile",
  protect,
  requirePermission("profile.update"),
  [
    body("name").trim().notEmpty().isLength({ max: 100 }),
    body("email").trim().isEmail().normalizeEmail(),
  ],
  validate,
  asyncHandler(updateProfile),
);

router.post("/logout", protect, asyncHandler(logout));

module.exports = router;
