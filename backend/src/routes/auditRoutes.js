const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const controller = require("../controllers/auditController");
const router = express.Router();
router.get("/export", protect, requirePermission("audit.export"), asyncHandler(controller.exportLogs));
router.get("/", protect, requirePermission("audit.view"), asyncHandler(controller.list));
module.exports = router;
