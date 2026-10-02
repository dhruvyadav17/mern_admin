const express = require("express");

const {
    getDashboardStats
} = require("../controllers/dashboardController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get(
    "/stats",
    protect,
    adminOnly,
    asyncHandler(getDashboardStats)
);

module.exports = router;
