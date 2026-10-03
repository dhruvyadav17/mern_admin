const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/searchController");
const router = express.Router();
router.get("/", protect, asyncHandler(controller.search));
module.exports = router;
