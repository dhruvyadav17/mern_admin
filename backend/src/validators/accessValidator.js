const { body } = require("express-validator");
const key = body("key").trim().matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i).withMessage("Invalid key");
const roleName = body("name").trim().matches(/^[a-z0-9_-]{2,50}$/i).withMessage("Invalid role name");
const permissions = body("permissions").optional().isArray().withMessage("Permissions must be an array");
const createRoleValidation = [roleName, body("label").trim().notEmpty().isLength({max:80}), body("description").optional().trim().isLength({max:300}), body("parentRole").optional({nullable:true}).trim().matches(/^[a-z0-9_-]{2,50}$/i), permissions];
const updateRoleValidation = [body("name").optional().trim().matches(/^[a-z0-9_-]{2,50}$/i), body("label").optional().trim().notEmpty().isLength({max:80}), body("description").optional().trim().isLength({max:300}), body("parentRole").optional({nullable:true}).trim().matches(/^[a-z0-9_-]{2,50}$/i), permissions];
const createPermissionValidation = [key, body("label").trim().notEmpty().isLength({max:120}), body("group").trim().notEmpty().isLength({max:80}), body("description").optional().trim().isLength({max:300})];
const updatePermissionValidation = [body("key").optional().trim().matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i), body("label").optional().trim().notEmpty().isLength({max:120}), body("group").optional().trim().notEmpty().isLength({max:80}), body("description").optional().trim().isLength({max:300})];

const updateUserPermissionValidation = [
    body("permission")
        .trim()
        .matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i)
        .withMessage("Invalid permission key"),
    body("enabled")
        .isBoolean()
        .withMessage("enabled must be a boolean")
        .toBoolean()
];

module.exports = { createRoleValidation, updateRoleValidation, createPermissionValidation, updatePermissionValidation, updateUserPermissionValidation };
