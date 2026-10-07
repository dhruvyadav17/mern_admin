const Notification = require("../models/Notification");
const {
  NOTIFICATION_TYPES,
} = require("../constants/notificationTypes");

const VALID_NOTIFICATION_TYPES = new Set(
  Object.values(NOTIFICATION_TYPES),
);

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  link = null,
  metadata = {},
  expiresAt = null,
}) => {
  if (!recipient) {
    throw new Error("Notification recipient is required");
  }

  if (!type) {
    throw new Error("Notification type is required");
  }

  if (!VALID_NOTIFICATION_TYPES.has(type)) {
    throw new Error(`Invalid notification type: ${type}`);
  }

  if (!title) {
    throw new Error("Notification title is required");
  }

  if (!message) {
    throw new Error("Notification message is required");
  }

  return Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    metadata,
    expiresAt,
  });
};

module.exports = {
  createNotification,
};
