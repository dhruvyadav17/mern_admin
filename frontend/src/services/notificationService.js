import api from "../api/axios";
const getNotifications = async (params = {}) => {
  const response = await api.get("/notifications", {
    params,
  });

  return response.data;
};

const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread-count");

  return response.data;
};

const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);

  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.patch("/notifications/read-all");

  return response.data;
};

const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);

  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};