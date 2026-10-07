const { body } = require("express-validator");

const nameValidation = body("name")
  .trim()
  .notEmpty()
  .withMessage("Name is required")
  .isLength({ max: 100 })
  .withMessage("Name must not exceed 100 characters");
const emailValidation = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .isEmail()
  .withMessage("Please enter a valid email")
  .normalizeEmail();
const profileAvatarValidation = body("avatar")
  .optional({ nullable: true })
  .custom((value) => {
    if (value === null) return true;

    if (typeof value !== "string") {
      throw new Error("Avatar must be a data URL");
    }

    const match = value.match(
      /^data:(image\/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/=]+)$/,
    );

    if (!match) {
      throw new Error("Avatar must be a valid JPEG, PNG, GIF or WebP image");
    }

    const bytes = Buffer.from(match[2], "base64").length;

    if (bytes > 512 * 1024) {
      throw new Error("Avatar must be 512 KB or smaller");
    }

    return true;
  });

const profileValidation = [
  nameValidation,
  emailValidation,
  profileAvatarValidation,
];

const passwordValidation = body("password")
  .notEmpty()
  .withMessage("Password is required")
  .isLength({ min: 8, max: 128 })
  .withMessage("Password must be 8 to 128 characters");

const registerValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
];
const loginValidation = [
  emailValidation,
  body("password").notEmpty().withMessage("Password is required"),
];
const forgotPasswordValidation = [emailValidation];
const resetPasswordValidation = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  passwordValidation,
];
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  passwordValidation,
];
const verifyEmailValidation = [
  body("token").trim().notEmpty().withMessage("Verification token is required"),
];
const resendVerificationValidation = [emailValidation];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  profileValidation,
};
