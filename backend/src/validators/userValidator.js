const { body } = require("express-validator");
const {
    USER_ROLE_VALUES,
    USER_STATUS_VALUES
} = require("../constants/userConstants");

const createUserValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ max: 100 })
        .withMessage("Name must not exceed 100 characters"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("role")
        .optional()
        .isIn(USER_ROLE_VALUES)
        .withMessage("Invalid role"),

    body("status")
        .optional()
        .isIn(USER_STATUS_VALUES)
        .withMessage("Invalid status")
];

const updateUserValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Name cannot be empty")
        .isLength({ max: 100 })
        .withMessage("Name must not exceed 100 characters"),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail(),

    body("password")
        .optional()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("role")
        .optional()
        .isIn(USER_ROLE_VALUES)
        .withMessage("Invalid role"),

    body("status")
        .optional()
        .isIn(USER_STATUS_VALUES)
        .withMessage("Invalid status")
];

const updateUserStatusValidation = [
    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(USER_STATUS_VALUES)
        .withMessage("Invalid user status")
];

module.exports = {
    createUserValidation,
    updateUserValidation,
    updateUserStatusValidation
};
