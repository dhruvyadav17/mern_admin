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
        .custom((value) => typeof value === "string" && value.trim().length >= 8 && value.length <= 128)
        .withMessage("Password must be 8 to 128 characters"),

    body("role").optional().trim().matches(/^[a-z0-9_-]{2,50}$/i).withMessage("Invalid role"),
    body("roles").optional().isArray({ min: 1, max: 20 }).withMessage("At least one role is required"),
    body("roles.*").optional().trim().matches(/^[a-z0-9_-]{2,50}$/i).withMessage("Invalid role"),

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
        .optional({ nullable: true })
        .custom((value) => value === "" || (typeof value === "string" && value.trim().length >= 8 && value.length <= 128))
        .withMessage("Password must be empty or 8 to 128 characters"),

    body("role").optional().trim().matches(/^[a-z0-9_-]{2,50}$/i).withMessage("Invalid role"),
    body("roles").optional().isArray({ min: 1, max: 20 }).withMessage("At least one role is required"),
    body("roles.*").optional().trim().matches(/^[a-z0-9_-]{2,50}$/i).withMessage("Invalid role"),

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
