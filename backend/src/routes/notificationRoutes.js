const express = require("express");

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// Yahan apne existing authentication middleware ka exact path/name use karo.
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);

router.get("/unread-count", protect, getUnreadCount);

router.patch("/read-all", protect, markAllAsRead);

router.patch("/:id/read", protect, markAsRead);

router.delete("/:id", protect, deleteNotification);

module.exports = router;