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

const passwordValidation = body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters");

const registerValidation = [
    nameValidation,
    emailValidation,
    passwordValidation
];

const loginValidation = [
    emailValidation,
    body("password")
        .notEmpty()
        .withMessage("Password is required")
];

module.exports = {
    registerValidation,
    loginValidation
};
