const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/permissionController");
const validate = require("../middleware/validateMiddleware");
const { createPermissionValidation, updatePermissionValidation, updateUserPermissionValidation } = require("../validators/accessValidator");
const router = express.Router();

router.get("/me", protect, asyncHandler(controller.me));
router.get("/", protect, requirePermission("permissions.view", "role-permissions.view", "user-permissions.view"), asyncHandler(controller.list));
router.post("/", protect, requirePermission("permissions.manage"), createPermissionValidation, validate, asyncHandler(controller.create));
router.put("/roles/:roleId", protect, requirePermission("role-permissions.manage"), asyncHandler(controller.updateRolePermissions));
router.get("/users/:userId", protect, requirePermission("user-permissions.view"), asyncHandler(controller.getUserOverrides));
router.patch("/users/:userId/permission", protect, requirePermission("user-permissions.manage"), updateUserPermissionValidation, validate, asyncHandler(controller.updateUserPermission));
// Backward-compatible bulk endpoint.
router.put("/users/:userId", protect, requirePermission("user-permissions.manage"), asyncHandler(controller.updateUserOverrides));
router.put("/:id", protect, requirePermission("permissions.manage"), updatePermissionValidation, validate, asyncHandler(controller.update));
router.delete("/:id", protect, requirePermission("permissions.manage"), asyncHandler(controller.remove));
module.exports = router;
