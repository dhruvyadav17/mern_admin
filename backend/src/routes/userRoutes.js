const express = require("express");
const controller = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validateMiddleware");
const {
  createUserValidation,
  updateUserValidation,
  updateUserStatusValidation,
} = require("../validators/userValidator");
const router = express.Router();
router.get(
  "/export",
  protect,
  requirePermission("users.export"),
  asyncHandler(controller.exportUsers),
);
router.get(
  "/",
  protect,
  requirePermission("users.view"),
  asyncHandler(controller.getUsers),
);
router.post(
  "/",
  protect,
  requirePermission("users.create"),
  createUserValidation,
  validate,
  asyncHandler(controller.createUser),
);
router.patch(
  "/bulk",
  protect,
  requirePermission("users.status"),
  asyncHandler(controller.bulkAction),
);
router.get(
  "/:id",
  protect,
  requirePermission("users.view"),
  asyncHandler(controller.getUserById),
);
router.get(
  "/:id/activity",
  protect,
  requirePermission("users.view"),
  asyncHandler(controller.getUserActivity),
);
router.put(
  "/:id",
  protect,
  requirePermission("users.edit"),
  updateUserValidation,
  validate,
  asyncHandler(controller.updateUser),
);
router.patch(
  "/:id",
  protect,
  requirePermission("users.edit"),
  updateUserValidation,
  validate,
  asyncHandler(controller.updateUser),
);
router.delete(
  "/:id",
  protect,
  requirePermission("users.delete"),
  asyncHandler(controller.deleteUser),
);
router.patch(
  "/:id/status",
  protect,
  requirePermission("users.status"),
  updateUserStatusValidation,
  validate,
  asyncHandler(controller.updateUserStatus),
);
module.exports = router;
